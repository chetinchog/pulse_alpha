# BUY/SELL Operations Architecture Design

**Version:** 1.0
**Date:** 2026-02-11
**Status:** Design Document

---

## Executive Summary

This document defines the architecture for adding BUY/SELL operations with realized P&L tracking to the Pulse Alpha portfolio application. The design prioritizes simplicity, correct accounting, and extensibility while maintaining the current system's clean architecture.

**Key Decision:** We will transform from a "position-centric" model to a "transaction-centric" model with derived positions.

---

## 1. Data Model Design

### 1.1 Core Decision: Transaction-Based Model

**DECISION:** Store individual transactions (BUY/SELL operations) and derive positions from transaction history.

**Rationale:**
- **Correctness**: Preserves complete audit trail of all operations
- **Realized P&L**: Natural calculation from matching sells against cost basis
- **Tax Compliance**: Enables FIFO/LIFO tracking without data migration
- **Debugging**: Can reconstruct any portfolio state from transaction history
- **Reversibility**: Operations can be deleted/corrected without cascading issues

**Rejected Alternative:** Add `operation_type` to existing Position model
- **Why rejected**: Mixing operations with positions creates semantic confusion. A "sell position" with negative quantity is an accounting hack, not a domain model.

### 1.2 New Domain Models

#### Transaction (Core Entity)
```go
type OperationType string

const (
    OperationBuy  OperationType = "buy"
    OperationSell OperationType = "sell"
)

type Transaction struct {
    ID            string        `json:"id"`
    Ticker        string        `json:"ticker"`
    OperationType OperationType `json:"operation_type"`
    Quantity      float64       `json:"quantity"`        // Always positive
    Price         float64       `json:"price"`           // Price per share
    TotalAmount   float64       `json:"total_amount"`    // quantity * price (denormalized for convenience)
    ExecutedAt    time.Time     `json:"executed_at"`     // When the transaction occurred
    CreatedAt     time.Time     `json:"created_at"`      // When record was created
}
```

#### RealizedPL (Calculated on Sell)
```go
type RealizedPL struct {
    ID              string    `json:"id"`
    Ticker          string    `json:"ticker"`
    SellTransactionID string  `json:"sell_transaction_id"`
    Quantity        float64   `json:"quantity"`        // Shares sold
    SellPrice       float64   `json:"sell_price"`      // Price per share at sale
    CostBasis       float64   `json:"cost_basis"`      // Weighted avg cost per share
    RealizedPL      float64   `json:"realized_pl"`     // (sell_price - cost_basis) * quantity
    PLPercent       float64   `json:"pl_percent"`      // Percentage gain/loss
    ExecutedAt      time.Time `json:"executed_at"`     // When the sell occurred
}
```

#### Position (Derived View - Updated)
```go
type Position struct {
    Ticker              string    `json:"ticker"`
    Quantity            float64   `json:"quantity"`           // Current open quantity
    WeightedCostBasis   float64   `json:"weighted_cost_basis"` // Average cost per share
    TotalCost           float64   `json:"total_cost"`         // Total invested in open shares
    FirstBuyDate        time.Time `json:"first_buy_date"`     // Date of first purchase
    LastTransactionDate time.Time `json:"last_transaction_date"`
}
```

#### EnrichedPosition (Derived + Market Data)
```go
type EnrichedPosition struct {
    Position
    CurrentPrice    float64 `json:"current_price"`
    MarketValue     float64 `json:"market_value"`
    UnrealizedPL    float64 `json:"unrealized_pl"`   // Current P&L on open position
    UnrealizedPLPct float64 `json:"unrealized_pl_percent"`
    RealizedPL      float64 `json:"realized_pl"`     // Lifetime realized P&L for this ticker
    TotalPL         float64 `json:"total_pl"`        // Unrealized + Realized
    TotalPLPct      float64 `json:"total_pl_percent"`
}
```

#### PortfolioSummary (Updated)
```go
type PortfolioSummary struct {
    TotalValue          float64 `json:"total_value"`          // Current market value of all positions
    TotalCost           float64 `json:"total_cost"`           // Total invested in open positions
    UnrealizedPL        float64 `json:"unrealized_pl"`        // P&L on open positions
    UnrealizedPLPercent float64 `json:"unrealized_pl_percent"`
    RealizedPL          float64 `json:"realized_pl"`          // Lifetime realized P&L
    TotalPL             float64 `json:"total_pl"`             // Unrealized + Realized
    TotalPLPercent      float64 `json:"total_pl_percent"`     // Based on (total_cost + realized_pl) invested
    PositionCount       int     `json:"position_count"`
}
```

### 1.3 Database Schema (In-Memory Initially)

**New Repositories:**
- `TransactionRepository`: CRUD for transactions
- `RealizedPLRepository`: Store/query realized P&L records

**Modified:**
- Remove old `PositionRepository` or repurpose for caching derived positions
- Keep `SnapshotRepository` for historical tracking

---

## 2. Cost Basis Method

### 2.1 Decision: Average Cost (MVP)

**DECISION:** Use **Average Cost** method for MVP.

**Rationale:**
- **Simplicity**: Single weighted average, no lot tracking required
- **User Familiarity**: Matches current behavior (existing grouped positions use weighted average)
- **Correctness**: Mathematically sound and widely accepted
- **Performance**: O(1) cost basis lookup vs O(n) FIFO matching

**Algorithm:**
```
Current holdings: 100 shares @ $150 avg cost
User buys 50 more @ $180
New avg cost = (100 * 150 + 50 * 180) / 150 = $160

User sells 30 @ $200
Cost basis for sale = $160 (current average)
Realized P&L = (200 - 160) * 30 = $1,200
New holdings: 120 shares @ $160 avg cost (unchanged)
```

**Future Extension Path:**
- Add `cost_method` field to Transaction or User settings
- Implement FIFO/LIFO in service layer without breaking existing data
- UI toggle for tax reporting preference

---

## 3. Sell Operation Logic

### 3.1 Sell Transaction Flow

**Preconditions:**
1. User must have sufficient quantity of ticker in portfolio
2. Quantity > 0
3. Price > 0

**Process:**
```
1. Query current position for ticker
   → Get: quantity, weighted_cost_basis

2. Validate: sell_quantity <= current_quantity
   → If insufficient: Return error "Cannot sell X shares, only Y available"

3. Create Transaction record (operation_type: sell)

4. Calculate Realized P&L:
   realized_pl = (sell_price - weighted_cost_basis) * sell_quantity
   pl_percent = ((sell_price - weighted_cost_basis) / weighted_cost_basis) * 100

5. Store RealizedPL record

6. Derived position automatically recalculates:
   new_quantity = old_quantity - sell_quantity
   cost_basis remains unchanged (average cost method)

7. If new_quantity == 0:
   → Position is closed, only realized P&L remains
```

**Edge Cases:**
- **Sell entire position**: Position quantity → 0, but realized P&L records persist
- **Sell before any buy**: Validation error (cannot occur with proper checks)
- **Sell more than owned**: Validation error with clear message
- **Multiple sells in sequence**: Each calculates against current average cost

### 3.2 Service Layer Pseudocode

```go
func (s *PortfolioService) ExecuteSellTransaction(ctx context.Context, req SellRequest) error {
    // 1. Get current position
    position, err := s.GetCurrentPosition(ctx, req.Ticker)
    if err != nil {
        return fmt.Errorf("ticker not found in portfolio")
    }

    // 2. Validate quantity
    if req.Quantity > position.Quantity {
        return fmt.Errorf("cannot sell %v shares, only %v available", req.Quantity, position.Quantity)
    }

    // 3. Create sell transaction
    txn := Transaction{
        ID:            uuid.New().String(),
        Ticker:        req.Ticker,
        OperationType: OperationSell,
        Quantity:      req.Quantity,
        Price:         req.Price,
        TotalAmount:   req.Quantity * req.Price,
        ExecutedAt:    req.ExecutedAt,
        CreatedAt:     time.Now(),
    }

    if err := s.transactionRepo.Create(ctx, txn); err != nil {
        return err
    }

    // 4. Calculate and store realized P&L
    realizedPL := RealizedPL{
        ID:                uuid.New().String(),
        Ticker:            req.Ticker,
        SellTransactionID: txn.ID,
        Quantity:          req.Quantity,
        SellPrice:         req.Price,
        CostBasis:         position.WeightedCostBasis,
        RealizedPL:        (req.Price - position.WeightedCostBasis) * req.Quantity,
        PLPercent:         ((req.Price - position.WeightedCostBasis) / position.WeightedCostBasis) * 100,
        ExecutedAt:        req.ExecutedAt,
    }

    if err := s.realizedPLRepo.Create(ctx, realizedPL); err != nil {
        return err
    }

    // 5. Take snapshot
    s.takeSnapshot(ctx, "sell", req.Ticker)

    return nil
}

func (s *PortfolioService) GetCurrentPosition(ctx context.Context, ticker string) (*Position, error) {
    // Derive from transactions
    txns, err := s.transactionRepo.GetByTicker(ctx, ticker)
    if err != nil {
        return nil, err
    }

    return s.calculatePositionFromTransactions(txns), nil
}

func (s *PortfolioService) calculatePositionFromTransactions(txns []Transaction) *Position {
    var totalBought, totalCost float64
    var totalSold float64
    var firstBuy, lastTxn time.Time

    for _, txn := range txns {
        if txn.OperationType == OperationBuy {
            totalBought += txn.Quantity
            totalCost += txn.TotalAmount
            if firstBuy.IsZero() {
                firstBuy = txn.ExecutedAt
            }
        } else {
            totalSold += txn.Quantity
        }

        if txn.ExecutedAt.After(lastTxn) {
            lastTxn = txn.ExecutedAt
        }
    }

    openQuantity := totalBought - totalSold
    if openQuantity <= 0 {
        return nil // Position closed
    }

    // With average cost method, cost basis doesn't change on sell
    // We need to track proportion of cost remaining
    proportionOpen := openQuantity / totalBought
    remainingCost := totalCost * proportionOpen
    avgCost := remainingCost / openQuantity

    return &Position{
        Ticker:              txns[0].Ticker,
        Quantity:            openQuantity,
        WeightedCostBasis:   avgCost,
        TotalCost:           remainingCost,
        FirstBuyDate:        firstBuy,
        LastTransactionDate: lastTxn,
    }
}
```

---

## 4. UI/UX Design

### 4.1 Operation Mode Selector

**Current State:** Single "Agregar Posición" form (implicitly BUY)

**New Design:** Tab-based interface

```
┌─────────────────────────────────────┐
│  [ COMPRA ]  [ VENTA ]              │ ← Tabs
├─────────────────────────────────────┤
│  Ticker: [_______]  Cantidad: [___] │
│  Precio: [_______]  Total: [______] │
│  Fecha/Hora: [________________]     │
│  [Ejecutar Compra]                  │ ← Button text changes
└─────────────────────────────────────┘
```

**Visual Design:**
- **COMPRA tab**: Green accent (`bg-green-50 border-green-500`)
- **VENTA tab**: Red accent (`bg-red-50 border-red-500`)
- **Button**: Green for buy, Red for sell
- **Form fields**: Same as current (reuse component)
- **Validation message for sell**: "No puedes vender más de X acciones que posees"

### 4.2 Portfolio Summary Updates

**Current Display:**
```
Valor Total: $X
Costo Total: $Y
P/L Total: $Z (%)
```

**New Display:**
```
┌─────────────────────────────────────┐
│ RESUMEN DE PORTAFOLIO               │
├─────────────────────────────────────┤
│ Valor Actual: $X                    │ ← Market value of open positions
│ Inversión Abierta: $Y               │ ← Cost of open positions
│                                     │
│ P/L No Realizado: $Z (±X%)          │ ← On open positions
│ P/L Realizado: $W (histórico)       │ ← Lifetime gains/losses from sells
│ ─────────────────────────────────   │
│ P/L Total: $T (±Y%)                 │ ← Sum of unrealized + realized
└─────────────────────────────────────┘
```

**Color Coding:**
- Unrealized P/L: Green (positive) / Red (negative)
- Realized P/L: Always shown, gray if zero
- Total P/L: Bold, green/red based on value

### 4.3 Position Detail View

**Per-Ticker Breakdown:**
```
┌─────────────────────────────────────┐
│ AAPL                                │
├─────────────────────────────────────┤
│ Cantidad Abierta: 150 acciones      │
│ Precio Promedio: $160.00            │
│ Precio Actual: $180.00              │
│                                     │
│ Valor de Mercado: $27,000           │
│ Costo Invertido: $24,000            │
│ P/L No Realizado: +$3,000 (+12.5%)  │
│ P/L Realizado: +$1,200              │ ← From past sells
│ P/L Total: +$4,200 (+17.5%)         │
└─────────────────────────────────────┘
```

### 4.4 Transaction History View (New)

**New Component:** `TransactionHistoryView`

```
┌──────────────────────────────────────────────┐
│ HISTORIAL DE OPERACIONES                    │
├──────────────────────────────────────────────┤
│ Filtro: [Todos ▼] [AAPL ▼] [Últimos 30d ▼] │
├──────────────────────────────────────────────┤
│ 2026-02-10 15:30  VENTA  AAPL  30 @ $200    │
│                   → P/L: +$1,200 (+25%)      │
│                                              │
│ 2026-02-05 10:15  COMPRA AAPL  50 @ $180    │
│ 2026-01-20 09:00  COMPRA AAPL  100 @ $150   │
└──────────────────────────────────────────────┘
```

**Features:**
- Color-coded: Green BUY, Red SELL
- Shows realized P/L inline for sell transactions
- Click to expand: Transaction details
- Export to CSV (future)

---

## 5. Backend Implementation Plan

### 5.1 New Files/Modules

```
backend/portfolio-service/
├── internal/
│   ├── domain/
│   │   ├── position.go           (UPDATE: add new types)
│   │   ├── transaction.go        (NEW)
│   │   └── realized_pl.go        (NEW)
│   │
│   ├── ports/
│   │   ├── repository.go         (UPDATE: add interfaces)
│   │   └── [existing files]
│   │
│   ├── adapters/
│   │   └── repository/
│   │       ├── transaction_memory.go   (NEW)
│   │       ├── realized_pl_memory.go   (NEW)
│   │       └── [existing files]
│   │
│   ├── service/
│   │   ├── portfolio.go          (MAJOR UPDATE)
│   │   └── transaction.go        (NEW: transaction-specific logic)
│   │
│   └── handlers/
│       └── http.go               (UPDATE: new endpoints)
```

### 5.2 API Endpoints

#### New Endpoints

**POST /transactions/buy**
```json
Request:
{
  "ticker": "AAPL",
  "quantity": 50,
  "price": 180.00,
  "executed_at": "2026-02-10T15:30:00Z"  // optional, defaults to now
}

Response: 201 Created
{
  "id": "txn-uuid",
  "ticker": "AAPL",
  "operation_type": "buy",
  "quantity": 50,
  "price": 180.00,
  "total_amount": 9000.00,
  "executed_at": "2026-02-10T15:30:00Z",
  "created_at": "2026-02-10T15:30:01Z"
}
```

**POST /transactions/sell**
```json
Request:
{
  "ticker": "AAPL",
  "quantity": 30,
  "price": 200.00,
  "executed_at": "2026-02-11T10:00:00Z"
}

Response: 201 Created
{
  "transaction": {
    "id": "txn-uuid",
    "ticker": "AAPL",
    "operation_type": "sell",
    "quantity": 30,
    "price": 200.00,
    "total_amount": 6000.00,
    "executed_at": "2026-02-11T10:00:00Z",
    "created_at": "2026-02-11T10:00:01Z"
  },
  "realized_pl": {
    "id": "pl-uuid",
    "quantity": 30,
    "sell_price": 200.00,
    "cost_basis": 160.00,
    "realized_pl": 1200.00,
    "pl_percent": 25.00,
    "executed_at": "2026-02-11T10:00:00Z"
  }
}

Error: 400 Bad Request (insufficient quantity)
{
  "error": "cannot sell 30 shares, only 20 available",
  "available_quantity": 20
}
```

**GET /transactions**
```json
Query params: ?ticker=AAPL&from=2026-01-01&to=2026-02-11&limit=50

Response: 200 OK
[
  {
    "id": "txn-2",
    "ticker": "AAPL",
    "operation_type": "sell",
    "quantity": 30,
    "price": 200.00,
    "total_amount": 6000.00,
    "executed_at": "2026-02-11T10:00:00Z",
    "created_at": "2026-02-11T10:00:01Z"
  },
  {
    "id": "txn-1",
    "ticker": "AAPL",
    "operation_type": "buy",
    "quantity": 100,
    "price": 150.00,
    "total_amount": 15000.00,
    "executed_at": "2026-01-20T09:00:00Z",
    "created_at": "2026-01-20T09:00:01Z"
  }
]
```

**GET /realized-pl**
```json
Query params: ?ticker=AAPL&from=2026-01-01&to=2026-02-11

Response: 200 OK
[
  {
    "id": "pl-uuid",
    "ticker": "AAPL",
    "sell_transaction_id": "txn-2",
    "quantity": 30,
    "sell_price": 200.00,
    "cost_basis": 160.00,
    "realized_pl": 1200.00,
    "pl_percent": 25.00,
    "executed_at": "2026-02-11T10:00:00Z"
  }
]
```

**GET /realized-pl/summary**
```json
Query params: ?ticker=AAPL (optional)

Response: 200 OK
{
  "total_realized_pl": 1200.00,
  "by_ticker": {
    "AAPL": 1200.00,
    "MSFT": -500.00
  }
}
```

#### Modified Endpoints

**GET /positions** (Behavior Change)
- Now derives positions from transactions
- Returns only open positions (quantity > 0)
- Includes realized P&L per ticker

**GET /positions/grouped** (Behavior Change)
- Same derivation logic
- Adds `realized_pl` and `total_pl` fields

**GET /portfolio/summary** (Enhanced)
- Adds `realized_pl`, `unrealized_pl`, `total_pl` fields
- Calculation changes to reflect new model

#### Deprecated Endpoints

**POST /positions** → Replaced by `POST /transactions/buy`
**PUT /positions/:id** → No longer applicable (transactions are immutable)
**DELETE /positions/:id** → Replaced by `POST /transactions/sell` or `DELETE /transactions/:id`

**Migration Path:**
- Keep old endpoints for 1-2 versions with deprecation warnings
- Frontend migrates to new endpoints
- Remove after confirming no usage

---

## 6. Frontend Implementation Plan

### 6.1 Type Definitions

**New Types** (`src/types/portfolio.ts`):

```typescript
export type OperationType = 'buy' | 'sell'

export interface Transaction {
  id: string
  ticker: string
  operation_type: OperationType
  quantity: number
  price: number
  total_amount: number
  executed_at: string
  created_at: string
}

export interface RealizedPL {
  id: string
  ticker: string
  sell_transaction_id: string
  quantity: number
  sell_price: number
  cost_basis: number
  realized_pl: number
  pl_percent: number
  executed_at: string
}

export interface CreateTransactionRequest {
  ticker: string
  quantity: number
  price: number
  executed_at?: string
}

export interface SellTransactionResponse {
  transaction: Transaction
  realized_pl: RealizedPL
}
```

**Updated Types:**

```typescript
// Add to EnrichedPosition
export interface EnrichedPosition extends Position {
  current_price: number
  market_value: number
  unrealized_pl: number           // Renamed from profit_loss
  unrealized_pl_percent: number   // Renamed from pl_percent
  realized_pl: number             // NEW
  total_pl: number                // NEW
  total_pl_percent: number        // NEW
}

// Add to PortfolioSummary
export interface PortfolioSummary {
  total_value: number
  total_cost: number
  unrealized_pl: number           // Renamed
  unrealized_pl_percent: number   // Renamed
  realized_pl: number             // NEW
  total_pl: number                // NEW
  total_pl_percent: number        // NEW
  position_count: number
}
```

### 6.2 New Components

**`TransactionForm.tsx`**
- Replaces/wraps `AddPositionForm`
- Tab selector: BUY | SELL
- Conditional styling based on operation type
- Validation: Check available quantity on SELL
- Reuses existing input mode logic (nominal vs total)

**`TransactionHistoryView.tsx`**
- Displays list of all transactions
- Filters: ticker, date range, operation type
- Color-coded by operation
- Shows realized P&L for sell transactions
- Expandable details

**`RealizedPLSummary.tsx`**
- Displays lifetime realized P&L
- Breakdown by ticker
- Optional: chart/graph visualization

### 6.3 Modified Components

**`PortfolioSummary.tsx`**
- Add sections for unrealized, realized, total P/L
- Update layout to show breakdown
- Maintain responsive design

**`PositionRow.tsx` / `GroupedPositionView.tsx`**
- Add realized P/L display
- Add total P/L calculation
- Update color coding logic

### 6.4 API Client Updates

**`src/api/portfolio.ts`**

```typescript
export const portfolioAPI = {
  // New
  createBuyTransaction: (req: CreateTransactionRequest) =>
    axios.post<Transaction>('/transactions/buy', req),

  createSellTransaction: (req: CreateTransactionRequest) =>
    axios.post<SellTransactionResponse>('/transactions/sell', req),

  getTransactions: (params?: { ticker?: string; from?: string; to?: string; limit?: number }) =>
    axios.get<Transaction[]>('/transactions', { params }),

  getRealizedPL: (params?: { ticker?: string; from?: string; to?: string }) =>
    axios.get<RealizedPL[]>('/realized-pl', { params }),

  getRealizedPLSummary: (ticker?: string) =>
    axios.get<{ total_realized_pl: number; by_ticker: Record<string, number> }>(
      '/realized-pl/summary',
      { params: ticker ? { ticker } : undefined }
    ),

  // Existing (behavior unchanged from consumer perspective)
  getPositions: () => axios.get<EnrichedPosition[]>('/positions'),
  getGroupedPositions: () => axios.get<GroupedPosition[]>('/positions/grouped'),
  getSummary: () => axios.get<PortfolioSummary>('/portfolio/summary'),
}
```

### 6.5 State Management

**Option 1: Keep existing React Query approach**
- Add new queries: `useTransactions`, `useRealizedPL`
- Invalidate position queries on transaction create
- Simple, minimal refactor

**Option 2: Context API for portfolio-wide state**
- Create `PortfolioContext` to share summary/positions
- Reduces prop drilling
- More work, better for future scaling

**DECISION:** Stick with React Query (Option 1) for MVP. Migrate to Context if state management becomes complex.

---

## 7. Implementation Steps

### Phase 1: Backend Foundation (Sprint 1)
1. Create new domain models: `Transaction`, `RealizedPL`
2. Implement `TransactionRepository` (in-memory)
3. Implement `RealizedPLRepository` (in-memory)
4. Add repository interfaces to `ports/repository.go`
5. Unit tests for repositories

### Phase 2: Service Layer Logic (Sprint 1)
6. Update `PortfolioService` with transaction-based position calculation
7. Implement `ExecuteBuyTransaction` method
8. Implement `ExecuteSellTransaction` method with validation
9. Implement realized P&L calculation logic
10. Unit tests with comprehensive edge cases

### Phase 3: HTTP API (Sprint 1)
11. Add new handlers: `CreateBuyTransaction`, `CreateSellTransaction`
12. Add handlers: `GetTransactions`, `GetRealizedPL`, `GetRealizedPLSummary`
13. Update existing handlers: `GetPositions`, `GetGroupedPositions`, `GetPortfolioSummary`
14. Integration tests for all endpoints

### Phase 4: Frontend Types & API (Sprint 2)
15. Add new types to `portfolio.ts`
16. Update existing types with new fields
17. Implement API client methods
18. Add React Query hooks

### Phase 5: Frontend Components (Sprint 2)
19. Create `TransactionForm` component with tab selector
20. Add validation logic for sell operations
21. Update `PortfolioSummary` component with new P/L sections
22. Update position display components with realized/total P/L

### Phase 6: Transaction History (Sprint 2)
23. Create `TransactionHistoryView` component
24. Implement filtering and sorting
25. Add transaction details modal
26. Integrate into main dashboard

### Phase 7: Testing & Refinement (Sprint 2)
27. E2E tests for complete buy/sell flows
28. Test edge cases (sell entire position, insufficient quantity)
29. Performance testing with large transaction histories
30. UI polish and accessibility

### Phase 8: Documentation & Deployment (Sprint 3)
31. Update API documentation
32. Update user guide
33. Create migration guide for existing data
34. Deploy to staging, then production

---

## 8. Edge Cases & Error Handling

### 8.1 Identified Edge Cases

| Case | Handling |
|------|----------|
| **Sell more than owned** | Validation error before transaction creation: `"Cannot sell X, only Y available"` |
| **Sell when no position exists** | Validation error: `"No position found for ticker ABC"` |
| **Simultaneous buy/sell requests** | Repository-level locking (mutex in memory, DB transaction in SQL) |
| **Sell entire position** | Position quantity → 0, record persists with realized P&L only |
| **Transaction with timestamp in future** | Accept (user may correct timezone mistakes), but warn in UI |
| **Transaction with very old timestamp** | Accept, recalculate all dependent values |
| **Delete transaction** | Allow, but recalculate all positions and realized P&L after deletion (expensive but correct) |
| **Price = 0** | Validation error: `"Price must be positive"` |
| **Quantity = 0** | Validation error: `"Quantity must be positive"` |
| **Fractional shares** | Supported (float64), round to 6 decimal places in UI |

### 8.2 Error Response Format

```json
{
  "error": "cannot sell 50 shares, only 30 available",
  "code": "INSUFFICIENT_QUANTITY",
  "details": {
    "ticker": "AAPL",
    "requested": 50,
    "available": 30
  }
}
```

**HTTP Status Codes:**
- `400 Bad Request`: Validation errors (insufficient quantity, invalid input)
- `404 Not Found`: Ticker not in portfolio
- `409 Conflict`: Concurrent modification (rare with current design)
- `500 Internal Server Error`: Unexpected failures

---

## 9. Data Migration Strategy

### 9.1 Current State
- Positions stored as individual records with implicit "buy" semantics
- No operation history

### 9.2 Migration Plan

**Option A: Convert positions to buy transactions**
```sql
-- Pseudocode for SQL migration (when we have DB)
INSERT INTO transactions (id, ticker, operation_type, quantity, price, executed_at, created_at)
SELECT
  uuid(),
  ticker,
  'buy',
  quantity,
  cost_basis AS price,
  created_at AS executed_at,
  created_at
FROM positions;

-- Then clear old positions table (will be recalculated)
```

**Option B: Dual-mode operation (if migration is complex)**
- Keep old position records
- Add flag: `migrated: false`
- On first transaction for a ticker, migrate existing position to buy transaction
- Lazy migration

**DECISION:** Option A (clean break) since we're using in-memory storage. For SQL migration later, use Option B to avoid downtime.

### 9.3 Backward Compatibility

**During migration period:**
- Old `POST /positions` endpoint creates a buy transaction internally
- Old `DELETE /positions/:id` endpoint creates a sell transaction for full quantity
- Return deprecation warnings in response headers
- Frontend updates to new endpoints gradually

---

## 10. Testing Strategy

### 10.1 Unit Tests

**Transaction Logic:**
- [x] Calculate weighted average cost correctly
- [x] Calculate realized P&L on sell
- [x] Derive position from multiple transactions
- [x] Handle zero-quantity positions
- [x] Validate sell quantity

**Service Layer:**
- [x] ExecuteBuyTransaction creates correct records
- [x] ExecuteSellTransaction validates quantity
- [x] ExecuteSellTransaction calculates realized P&L
- [x] GetCurrentPosition derives from transactions
- [x] GetPortfolioSummary aggregates all P&L types

### 10.2 Integration Tests

**API Endpoints:**
- [x] POST /transactions/buy → creates transaction
- [x] POST /transactions/sell → creates transaction + realized P&L
- [x] POST /transactions/sell with insufficient quantity → 400 error
- [x] GET /positions → returns derived positions
- [x] GET /portfolio/summary → includes realized P&L

### 10.3 E2E Tests

**User Flows:**
1. Buy AAPL → See in portfolio → Sell partial → See updated position + realized P&L
2. Buy multiple lots → Sell in parts → Verify average cost calculation
3. Buy → Sell all → Position disappears but realized P&L remains
4. Attempt to sell more than owned → See error message

### 10.4 Performance Tests

**Scenarios:**
- Portfolio with 1000 transactions → Position calculation time < 100ms
- Summary calculation with 50 tickers → Time < 200ms
- Transaction history query with pagination

---

## 11. Monitoring & Observability

### 11.1 Metrics to Track

- **Transaction volume**: Buy vs Sell count per day
- **Error rates**: Insufficient quantity errors (indicates user confusion or bug)
- **Position calculation time**: Monitor for performance degradation
- **Realized P&L distribution**: Positive vs negative trades

### 11.2 Logging

**Key Events:**
- Transaction created: `{operation, ticker, quantity, price}`
- Realized P&L calculated: `{ticker, quantity, realized_pl}`
- Validation error: `{error_type, ticker, details}`

**Log Levels:**
- INFO: Successful transactions
- WARN: Validation errors
- ERROR: Unexpected failures in calculation

---

## 12. Future Extensions

### 12.1 Short-Term (1-2 months)
- **FIFO/LIFO cost basis**: Add as user preference
- **Transaction editing**: Allow updates within X hours of creation
- **Bulk import**: CSV upload for historical transactions
- **Export**: Download transaction history as CSV/PDF

### 12.2 Medium-Term (3-6 months)
- **Tax reporting**: Generate tax forms (Form 1099-B equivalent)
- **Performance charts**: Realized P&L over time
- **Transaction notes**: Add memo field to transactions
- **Multi-currency**: Support non-USD portfolios

### 12.3 Long-Term (6+ months)
- **Dividends**: Track dividend income separately from capital gains
- **Stock splits**: Automatic adjustment of cost basis
- **Options trading**: Add support for calls/puts
- **Portfolio comparison**: Compare actual vs benchmark performance

---

## 13. Open Questions

1. **Do we need transaction editing/deletion?**
   - MVP: No (immutable transactions)
   - Future: Add "void transaction" feature with audit trail

2. **How long to retain closed positions in history?**
   - Keep indefinitely (storage is cheap)
   - Option to archive/hide from UI after X months

3. **Should we support short selling?**
   - MVP: No (sell only what you own)
   - Future: Add separate "short position" tracking

4. **What about wash sale rules for tax?**
   - Out of scope for MVP
   - Document as future enhancement

---

## 14. Decision Summary

| Decision Point | Choice | Rationale |
|----------------|--------|-----------|
| **Data Model** | Transaction-based with derived positions | Auditability, flexibility, correctness |
| **Cost Basis Method** | Average Cost | Simplicity, matches current behavior |
| **Repository** | In-memory (MVP) | Fast iteration, migrate to SQL later |
| **API Design** | Separate buy/sell endpoints | Clear semantics, explicit operations |
| **UI Pattern** | Tab-based form | Familiar, compact, visually distinct |
| **Migration** | Convert positions to buy transactions | Clean break, no legacy complexity |
| **Testing** | Unit + Integration + E2E | Comprehensive coverage for financial logic |

---

## 15. Success Metrics

**Technical:**
- Zero data loss or corruption
- <100ms position calculation time
- 100% test coverage on transaction logic

**User Experience:**
- Users can complete buy/sell flow in <30 seconds
- Error messages clearly explain validation failures
- Realized P&L matches user expectations (verified via feedback)

**Business:**
- 90%+ of users adopt sell feature within 2 weeks
- Support tickets for "how to sell" < 5% of user base
- No critical bugs in first 2 weeks post-launch

---

## Appendix A: Example Calculation Walkthrough

**Scenario:** User builds position, then sells partial

```
Day 1: BUY 100 AAPL @ $150
  → Position: 100 shares @ $150 avg cost
  → Total cost: $15,000
  → Unrealized P&L: $0

Day 5: BUY 50 AAPL @ $180
  → Position: 150 shares @ $160 avg cost
  → Calculation: (100*150 + 50*180) / 150 = $160
  → Total cost: $24,000
  → Unrealized P&L: (current_price - $160) * 150

Day 10: Current price = $200
  → Market value: $200 * 150 = $30,000
  → Unrealized P&L: $30,000 - $24,000 = +$6,000 (+25%)

Day 12: SELL 30 AAPL @ $200
  → Cost basis for sale: $160 (avg)
  → Realized P&L: ($200 - $160) * 30 = +$1,200 (+25%)
  → New position: 120 shares @ $160 avg cost
  → New total cost: $160 * 120 = $19,200
  → Unrealized P&L: ($200 - $160) * 120 = +$4,800 (+25%)
  → Total P&L: $1,200 (realized) + $4,800 (unrealized) = +$6,000

Summary:
  → Open position: 120 shares worth $24,000, cost $19,200
  → Realized P&L: +$1,200
  → Unrealized P&L: +$4,800
  → Total P&L: +$6,000 (matches pre-sell unrealized P&L ✓)
```

---

## Appendix B: API Request/Response Examples

See Section 5.2 for complete endpoint documentation.

---

## Appendix C: Component Hierarchy

```
<Dashboard>
  ├── <Header />
  ├── <TransactionForm>           ← NEW: Replaces AddPositionForm
  │     ├── <TabSelector />       ← BUY | SELL tabs
  │     ├── <TransactionInputs /> ← Reuses existing input logic
  │     └── <SubmitButton />      ← Dynamic text/color
  │
  ├── <PortfolioSummary>          ← UPDATED
  │     ├── <TotalValue />
  │     ├── <UnrealizedPL />      ← NEW
  │     ├── <RealizedPL />        ← NEW
  │     └── <TotalPL />           ← NEW
  │
  ├── <PositionList>              ← UPDATED
  │     └── <PositionRow>
  │           ├── <PositionInfo />
  │           ├── <UnrealizedPL />
  │           ├── <RealizedPL />  ← NEW
  │           └── <TotalPL />     ← NEW
  │
  └── <TransactionHistoryView>   ← NEW
        ├── <FilterBar />
        └── <TransactionList>
              └── <TransactionRow>
                    ├── <TransactionInfo />
                    └── <RealizedPLBadge /> ← For sells
```

---

**END OF DESIGN DOCUMENT**
