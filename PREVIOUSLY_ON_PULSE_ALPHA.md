# Previously On Pulse Alpha

**Last Updated**: 2026-02-13

## Quick Status

✅ **Portfolio tracking application with buy/sell transactions, realized/unrealized P&L, and transaction history**
- Frontend: React + TypeScript + Vite + Tailwind (port 5174)
- Backend: Go microservices with in-memory storage (portfolio: 8080, market-data: 8081)
- Clean architecture with adapter pattern ready for database integration

---

## Current Implementation Status

### ✅ Completed Features

1. **Transaction-Based Architecture**
   - Buy/sell operations as individual transactions
   - Positions derived dynamically from transaction history
   - Complete audit trail maintained
   - Average cost basis method for P&L calculation

2. **Portfolio Tracking**
   - Real-time positions with market prices
   - Unrealized P&L for open positions
   - Realized P&L from closed positions
   - Total P&L (unrealized + realized)
   - Portfolio summary with aggregate metrics

3. **Transaction Management**
   - POST /transactions/buy - Create buy transaction
   - POST /transactions/sell - Create sell transaction with automatic realized P&L calculation
   - GET /transactions - List all transactions
   - DELETE /transactions/{id} - Delete transaction (also DELETE /positions/{id} for legacy)

4. **Realized P&L Tracking**
   - GET /realized-pl - All realized P&L records
   - GET /realized-pl/summary - Aggregate by ticker
   - Calculated using average cost basis when selling

5. **UI Components**
   - Dashboard with dark mode support
   - Portfolio summary card (total value, cost, P&L)
   - Portfolio chart with time period selector (last X hours/days/months/years)
   - Position list with grouping by ticker
   - Add position modal with buy/sell tabs
   - Transaction history modal with pagination (20 items per page)

6. **Recent Features & Fixes**
   - Portfolio Summary: Added "Inversión Total" field (sum of all buy transactions)
   - Position List: Quantity format up to 8 decimals with trailing zeros removed (for BTC precision)
   - Actions Column: Replaced expand/collapse with 3 action buttons (Add, History, Delete)
   - Ticker History Modal: New dedicated modal for ticker-specific transactions and P&L summary
   - Modal Portal: All modals render at body level using React Portal for proper z-index
   - Scroll Optimization: Modals scroll only in table area, keeping summaries fixed
   - Consistency: Changed all "P/L" to "P&L" across the application
   - Best Performer Icon: Changed from trophy to golden star (⭐) with sparkle animation
   - Quick Actions: "+" button pre-fills ticker in transaction form
   - Fixed realized P&L showing $0 when all positions closed
   - Fixed dark mode overscroll showing white borders

### 🔄 Architecture

**Backend Structure**:
```
backend/
├── portfolio-service/
│   ├── cmd/main.go - Entry point
│   ├── internal/
│   │   ├── domain/ - Business entities (Transaction, Position, RealizedPL, etc.)
│   │   ├── ports/ - Repository interfaces
│   │   ├── adapters/
│   │   │   ├── repository/ - In-memory implementations
│   │   │   └── marketdata/ - Market data client
│   │   ├── service/ - Business logic
│   │   └── handlers/ - HTTP handlers
│   └── go.mod
└── market-data-service/ - Provides price data (stub implementation)
```

**Frontend Structure**:
```
frontend/src/
├── components/
│   ├── Dashboard.tsx - Main container
│   ├── PortfolioSummary.tsx - Metrics card
│   ├── PortfolioChart.tsx - Historical chart with time filter
│   ├── PositionList.tsx - Position table with "Operar" and "Histórico" buttons
│   ├── AddPositionForm.tsx - Buy/sell modal form
│   ├── TransactionHistoryModal.tsx - Paginated transaction list
│   ├── Modal.tsx - Reusable modal wrapper
│   └── DarkModeToggle.tsx
├── services/api.ts - API client
├── types/portfolio.ts - TypeScript interfaces
└── index.css - Global styles with dark mode support
```

### 📊 Data Models

**Transaction** (stored):
```typescript
{
  id: string
  ticker: string
  operation_type: "buy" | "sell"
  quantity: number
  price: number
  total_amount: number
  executed_at: string (ISO 8601)
  created_at: string
}
```

**Position** (derived):
```typescript
{
  ticker: string
  quantity: number (open shares)
  weighted_cost_basis: number (average cost per share)
  total_cost: number (cost of open shares)
  first_buy_date: string
  last_transaction_date: string
}
```

**RealizedPL** (stored, created on sell):
```typescript
{
  id: string
  ticker: string
  sell_transaction_id: string
  quantity: number (shares sold)
  sell_price: number
  cost_basis: number (average cost at time of sale)
  realized_pl: number (gain/loss)
  pl_percent: number
  executed_at: string
}
```

### 🚀 Development Commands

**Start Backend Services**:
```bash
# Portfolio Service (port 8080)
cd backend/portfolio-service
go run cmd/main.go

# Market Data Service (port 8081) - if needed
cd backend/market-data-service
go run cmd/main.go
```

**Start Frontend**:
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173 (or 5174 if 5173 is taken)
```

**Clean Memory** (restart portfolio service):
```bash
lsof -ti:8080 | xargs kill -9
cd backend/portfolio-service && go run cmd/main.go
```

**Test Endpoints**:
```bash
# Health check
curl http://localhost:8080/health

# Create buy transaction
curl -X POST http://localhost:8080/transactions/buy \
  -H "Content-Type: application/json" \
  -d '{"ticker":"AAPL","quantity":10,"price":150}'

# Create sell transaction
curl -X POST http://localhost:8080/transactions/sell \
  -H "Content-Type: application/json" \
  -d '{"ticker":"AAPL","quantity":5,"price":160}'

# Get all transactions
curl http://localhost:8080/transactions

# Get portfolio summary
curl http://localhost:8080/portfolio/summary

# Delete transaction
curl -X DELETE http://localhost:8080/transactions/{id}
```

### ⚠️ Known Limitations

1. **In-Memory Storage**: All data is lost on service restart (by design for MVP)
2. **Mock Market Prices**: Market data service returns stub prices, not real data
3. **No User Authentication**: Single-user application
4. **No Realized P&L Cascade Delete**: Deleting a buy transaction doesn't clean up related realized P&L records
5. **No Transaction Editing**: Once created, transactions can only be deleted, not edited

### 🎯 Potential Next Steps (Not Implemented)

- [ ] Real market data integration (Yahoo Finance, CoinGecko)
- [ ] Database persistence (PostgreSQL adapter)
- [ ] User authentication & multi-user support
- [ ] Transaction editing capability
- [ ] Export to CSV
- [ ] Performance analytics (Sharpe ratio, etc.)
- [ ] WebSocket for live price updates
- [ ] Docker Compose for easy orchestration

### 🔧 Important Technical Notes

**Chi Router Middleware Ordering**:
```go
// Must create router, add middleware, THEN mount routes
r := chi.NewRouter()
r.Use(middleware.Logger)
r.Use(middleware.Recoverer)
r.Use(cors.Handler(...))
r.Mount("/", handlers.SetupRoutes(handler))  // Routes added last
```

**Average Cost Basis Calculation**:
- When selling, uses weighted average of all buy transactions
- Proportionally reduces cost basis: `remainingCost = totalCost * (openQty / totalBought)`
- Realized P&L = (sell_price - weighted_cost_basis) × quantity

**Portfolio Summary Total P&L Percent**:
- When positions are open: based on `total_cost` of open positions
- When all positions closed: based on total capital originally deployed (sum of all buy transactions)

**Dark Mode Implementation**:
- Uses Tailwind's `dark:` classes
- Global background set in `index.css` on `html` and `html.dark`
- Prevents white borders on overscroll

### 📝 Session Context

**Last Major Work**:
1. Added "Inversión Total" field to Portfolio Summary (backend + frontend)
2. Redesigned Position List actions: removed expand/collapse, added action buttons column
3. Created TickerHistoryModal component with 2-row summary layout (6 cards) and table scroll
4. Implemented Modal Portal system for proper z-index layering
5. Optimized modal scrolling: fixed headers/summaries, scrollable tables only
6. Updated quantity display to 8 decimals without trailing zeros (BTC precision)
7. Changed P/L notation to P&L for consistency across all components
8. Replaced trophy icon with golden star for best performer (with sparkle animation)
9. Added ticker pre-fill functionality when opening transaction modal from position list

**Current State**:
- All services running and tested
- Frontend on port 5173, backend on 8080
- New UI patterns: action buttons, ticker-specific modals, optimized scrolling
- No pending bugs or issues

**Git Branch**: `prod`

---

## How to Continue This Session

1. **Read this file first** to understand what's been implemented
2. **Check running services**:
   - `lsof -ti:8080` (portfolio service)
   - `lsof -ti:8081` (market data service)
   - `lsof -ti:5173` or `lsof -ti:5174` (frontend)
3. **Review recent changes**: `git log --oneline -10`
4. **Test current state**:
   ```bash
   curl http://localhost:8080/health
   curl http://localhost:8080/portfolio/summary
   ```
5. **Refer to architecture docs**:
   - `BUY_SELL_ARCHITECTURE.md` - Detailed transaction-based design
   - `QUICKSTART.md` - Quick setup guide
   - `README.md` - Project overview

---

**Note**: Update this file at the end of each significant session to maintain continuity.
