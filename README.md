# Pulse Alpha

A portfolio tracking application for managing stocks and cryptocurrency holdings with transaction-based architecture, realized P&L tracking, and dark mode support.

## Quick Links

- 📋 **[Quick Start Guide](QUICKSTART.md)** - Get up and running in minutes
- 🏗️ **[Architecture Documentation](BUY_SELL_ARCHITECTURE.md)** - Detailed transaction-based design
- 📝 **[Session Continuity Log](PREVIOUSLY_ON_PULSE_ALPHA.md)** - Current implementation status

## Architecture

This is a **microservices-based application** with clean architecture:

- **Portfolio Service** (Port 8080) - Transaction management, P&L calculation, position derivation
- **Market Data Service** (Port 8081) - Price provider (currently stubbed)
- **Frontend** (Port 5173/5174) - React SPA with dark mode

### Key Architectural Decision: Transaction-Based Model

Unlike traditional portfolio apps that store positions directly, **Pulse Alpha stores all buy/sell operations as transactions** and derives positions dynamically. This provides:

- Complete audit trail of all operations
- Accurate realized P&L tracking (even after positions are closed)
- Simple data model (transactions + realized P&L records)
- Easy to implement undo/rollback features

**See [BUY_SELL_ARCHITECTURE.md](BUY_SELL_ARCHITECTURE.md) for detailed design documentation.**

## Tech Stack

### Backend
- **Go 1.23+** with Chi router
- Clean architecture with **ports & adapters pattern**
- **In-memory repositories** for MVP (ready for database adapter swap)
- Average cost basis method for P&L calculation

### Frontend
- **React 18.3+** with TypeScript
- **Vite** for blazing fast dev experience
- **Tailwind CSS** with dark mode support
- Axios for API communication

## Getting Started

### Prerequisites

- Go 1.23 or higher
- Node.js 20+ and npm

### Quick Start

**See [QUICKSTART.md](QUICKSTART.md) for detailed setup instructions.**

**TL;DR:**

```bash
# Terminal 1 - Portfolio Service (required)
cd backend/portfolio-service
go run cmd/main.go

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** (or 5174 if 5173 is taken)

**Market Data Service is optional** - the portfolio service will work with stub prices if it's not running.

## Features

### Implemented ✅

- **Buy/Sell Transactions** - Record all trading activity with timestamps
- **Position Tracking** - Positions derived from transaction history with average cost basis
- **Realized P&L** - Automatically calculated when selling shares
- **Unrealized P&L** - Live calculation for open positions
- **Total P&L** - Combined realized + unrealized gains/losses
- **Portfolio Summary** - Total value, cost, and performance metrics
- **Transaction History** - Paginated view of all buy/sell operations
- **Portfolio Chart** - Historical value tracking with time period selector (hour/day/month/year)
- **Dark Mode** - Full theme support with toggle
- **Delete Transactions** - Remove incorrect entries
- **Clean Architecture** - Ready for database adapter integration
- **Google Authentication** - Secured via Firebase Auth & Firestore with an `is_enabled` gate validation

### UI Highlights

- Responsive design with mobile support
- Color-coded buy (blue) and sell (red) operations
- Expandable position grouping by ticker
- Real-time P&L calculation
- Smooth animations and transitions
- No white borders on overscroll in dark mode

### Future Enhancements

- Real price feeds (Yahoo Finance, CoinGecko APIs)
- Database persistence (PostgreSQL adapter)
- Multi-user data isolation (Currently global)
- Transaction editing capability
- Historical price charts with candlesticks
- WebSocket for live price updates
- Export to CSV
- Performance analytics (Sharpe ratio, max drawdown)

## API Endpoints

### Portfolio Service (Port 8080)

**Transactions:**
- `POST /transactions/buy` - Create buy transaction
- `POST /transactions/sell` - Create sell transaction (auto-calculates realized P&L)
- `GET /transactions` - List all transactions
- `DELETE /transactions/{id}` - Delete transaction

**Realized P&L:**
- `GET /realized-pl` - List all realized P&L records
- `GET /realized-pl/summary` - Aggregate realized P&L by ticker

**Positions (derived views):**
- `GET /positions` - List enriched positions with market data
- `GET /positions/grouped` - Positions grouped by ticker

**Portfolio:**
- `GET /portfolio/summary` - Portfolio-wide metrics
- `GET /portfolio/history` - Portfolio snapshots over time

**Health:**
- `GET /health` - Service health check

**Legacy (deprecated but supported):**
- `POST /positions` - Redirects to buy transaction
- `DELETE /positions/{id}` - Redirects to delete transaction

### Market Data Service (Port 8081)

- `GET /prices/:ticker` - Get price for a ticker
- `POST /prices/batch` - Get prices for multiple tickers (JSON body: `{"tickers": ["AAPL", "BTC-USD"]}`)
- `GET /health` - Health check

## Testing the Backend

```bash
# Create buy transaction
curl -X POST http://localhost:8080/transactions/buy \
  -H "Content-Type: application/json" \
  -d '{"ticker":"AAPL","quantity":10,"price":150}'

# Create sell transaction
curl -X POST http://localhost:8080/transactions/sell \
  -H "Content-Type: application/json" \
  -d '{"ticker":"AAPL","quantity":5,"price":160}'

# Get portfolio summary
curl http://localhost:8080/portfolio/summary | jq .

# Get realized P&L summary
curl http://localhost:8080/realized-pl/summary | jq .

# Get all transactions
curl http://localhost:8080/transactions | jq .

# Delete transaction
curl -X DELETE http://localhost:8080/transactions/{id}
```

## Project Structure

```
pulse_alpha/
├── .claude/
│   └── CLAUDE.md                      # Project-specific instructions
├── PREVIOUSLY_ON_PULSE_ALPHA.md       # Session continuity log
├── BUY_SELL_ARCHITECTURE.md           # Architecture documentation
├── QUICKSTART.md                      # Setup guide
├── README.md                          # This file
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.tsx          # Main container
│   │   │   ├── PortfolioSummary.tsx   # Metrics card
│   │   │   ├── PortfolioChart.tsx     # Historical chart
│   │   │   ├── PositionList.tsx       # Position table
│   │   │   ├── AddPositionForm.tsx    # Buy/sell modal
│   │   │   ├── TransactionHistoryModal.tsx
│   │   │   ├── Modal.tsx              # Reusable modal
│   │   │   └── DarkModeToggle.tsx
│   │   ├── services/
│   │   │   └── api.ts                 # API client
│   │   ├── types/
│   │   │   └── portfolio.ts           # TypeScript interfaces
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
└── backend/
    ├── portfolio-service/
    │   ├── cmd/
    │   │   └── main.go                # Entry point
    │   └── internal/
    │       ├── domain/
    │       │   ├── transaction.go     # Transaction models
    │       │   └── position.go        # Position models
    │       ├── ports/
    │       │   ├── repository.go      # Repository interfaces
    │       │   └── marketdata.go      # Market data interface
    │       ├── adapters/
    │       │   ├── repository/
    │       │   │   ├── transaction_memory.go
    │       │   │   ├── realized_pl_memory.go
    │       │   │   └── snapshot.go
    │       │   └── marketdata/
    │       │       └── client.go
    │       ├── service/
    │       │   └── portfolio.go       # Business logic
    │       └── handlers/
    │           └── http.go            # HTTP handlers
    │
    └── market-data-service/
        ├── cmd/
        │   └── main.go
        └── internal/
            ├── domain/
            ├── ports/
            ├── adapters/
            ├── service/
            └── handlers/
```

## Development Notes

### Resetting Data (In-Memory Storage)

Since the MVP uses in-memory storage, restart the portfolio service to clear all data:

```bash
lsof -ti:8080 | xargs kill -9
cd backend/portfolio-service && go run cmd/main.go
```

### Chi Middleware Ordering

**CRITICAL**: When using Chi router, middleware must be added **before** mounting routes:

```go
r := chi.NewRouter()
r.Use(middleware.Logger)       // Middleware first
r.Use(cors.Handler(...))        // Middleware first
r.Mount("/", handlers.SetupRoutes(handler))  // Routes last!
```

### Average Cost Basis Calculation

When selling shares:
1. Calculate weighted average cost: `totalCost / totalBought`
2. Realized P&L = `(sellPrice - weightedCostBasis) × quantity`
3. Reduce remaining cost proportionally: `remainingCost = totalCost × (openQty / totalBought)`

### Dark Mode

- Global background colors set in `frontend/src/index.css`
- `html { background-color: #f9fafb; }` for light mode
- `html.dark { background-color: #111827; }` for dark mode
- Prevents white borders on overscroll

## Documentation

- **[PREVIOUSLY_ON_PULSE_ALPHA.md](PREVIOUSLY_ON_PULSE_ALPHA.md)** - Current implementation status, commands, and session continuity log
- **[BUY_SELL_ARCHITECTURE.md](BUY_SELL_ARCHITECTURE.md)** - Detailed transaction-based architecture design
- **[QUICKSTART.md](QUICKSTART.md)** - Quick setup and getting started guide
- **[.claude/CLAUDE.md](.claude/CLAUDE.md)** - Project-specific instructions for Claude Code

## License

MIT
