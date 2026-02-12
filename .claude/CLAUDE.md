# Pulse Alpha - Project-Specific Instructions

## Session Continuity

**CRITICAL**: Before starting any work in a new session, **ALWAYS** read `PREVIOUSLY_ON_PULSE_ALPHA.md` first. This file contains:
- Current implementation status
- Recent work completed
- Known issues and limitations
- Architecture overview
- Development commands
- Important technical notes

### When Starting a New Session:

1. **Read the session log**: `PREVIOUSLY_ON_PULSE_ALPHA.md`
2. **Check running services**:
   ```bash
   lsof -ti:8080  # Portfolio service
   lsof -ti:8081  # Market data service (optional)
   lsof -ti:5173 || lsof -ti:5174  # Frontend
   ```
3. **Verify current state**:
   ```bash
   curl http://localhost:8080/health
   curl http://localhost:8080/portfolio/summary
   ```
4. **Review recent commits**: `git log --oneline -10`

### When Ending a Session:

**Update `PREVIOUSLY_ON_PULSE_ALPHA.md`** with:
- What was implemented/fixed
- Any new known issues
- Current state of the project
- New commands or important notes
- Update the "Last Updated" date

## Project Context

This is **Pulse Alpha**, a portfolio tracking application for stocks and cryptocurrency.

**Key Architectural Decisions**:
- Transaction-based architecture (not position-based)
- In-memory storage for MVP (ready for database adapter)
- Microservices: portfolio-service + market-data-service
- Clean architecture with ports & adapters pattern
- Average cost basis method for P&L calculation

**Technology Stack**:
- Backend: Go 1.23+ with Chi router
- Frontend: React 18.3+ with TypeScript, Vite, Tailwind CSS
- No database yet (in-memory repositories)

## Development Workflow

### Starting Services

**Portfolio Service** (required):
```bash
cd backend/portfolio-service
go run cmd/main.go
# Runs on http://localhost:8080
```

**Market Data Service** (optional, provides stub prices):
```bash
cd backend/market-data-service
go run cmd/main.go
# Runs on http://localhost:8081
```

**Frontend**:
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173 (or 5174 if 5173 is taken)
```

### Testing Workflow

1. **Create buy transaction**:
   ```bash
   curl -X POST http://localhost:8080/transactions/buy \
     -H "Content-Type: application/json" \
     -d '{"ticker":"AAPL","quantity":10,"price":150}'
   ```

2. **Create sell transaction**:
   ```bash
   curl -X POST http://localhost:8080/transactions/sell \
     -H "Content-Type: application/json" \
     -d '{"ticker":"AAPL","quantity":5,"price":160}'
   ```

3. **Check results**:
   ```bash
   curl http://localhost:8080/portfolio/summary | jq .
   curl http://localhost:8080/realized-pl/summary | jq .
   ```

### Clean Memory (Reset Data)

Since we use in-memory storage, restart the portfolio service:
```bash
lsof -ti:8080 | xargs kill -9
cd backend/portfolio-service && go run cmd/main.go
```

## Code Style & Patterns

### Backend (Go)

- Use Chi router for HTTP routing
- **CRITICAL**: Middleware must be added BEFORE mounting routes:
  ```go
  r := chi.NewRouter()
  r.Use(middleware.Logger)
  r.Use(cors.Handler(...))
  r.Mount("/", handlers.SetupRoutes(handler))  // Routes last!
  ```
- Repository pattern with interfaces in `ports/`
- Business logic in `service/` layer
- HTTP handlers in `handlers/`
- Domain models in `domain/`

### Frontend (React + TypeScript)

- Functional components with hooks
- TypeScript strict mode
- Tailwind CSS with dark mode support (`dark:` classes)
- API client in `services/api.ts`
- Reusable Modal component for dialogs
- Use `useMemo` for expensive calculations

### Dark Mode Implementation

**Global background** in `frontend/src/index.css`:
```css
html { background-color: #f9fafb; }  /* gray-50 */
html.dark { background-color: #111827; }  /* gray-900 */
body { background-color: inherit; }
```

This prevents white borders on overscroll.

## Important Technical Notes

### Average Cost Basis Calculation

When selling shares:
1. Calculate weighted average cost: `totalCost / totalBought`
2. Realized P&L = `(sellPrice - weightedCostBasis) × quantity`
3. Reduce remaining cost proportionally: `remainingCost = totalCost × (openQty / totalBought)`

### Transaction Deletion

Deleting a transaction:
- Removes the transaction from the repository
- Creates a snapshot after deletion
- **Does NOT** cascade delete related realized P&L records
- Positions are recalculated on next query (derived view)

### Portfolio Summary Total P&L Percent

- **Open positions**: `totalPL / totalCost × 100`
- **All positions closed**: `totalPL / totalInvested × 100` (where totalInvested = sum of all buy transactions)

## Common Issues & Solutions

### Port Already in Use

```bash
# Kill process on specific port
lsof -ti:8080 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Frontend Not Updating

- Vite has hot reload, but sometimes needs manual refresh
- Check browser console for errors
- Verify API calls in Network tab

### CORS Issues

CORS is configured in `backend/portfolio-service/cmd/main.go`:
```go
r.Use(cors.Handler(cors.Options{
    AllowedOrigins: []string{"http://localhost:5173"},
    AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
    // ...
}))
```

Update allowed origins if frontend port changes.

## Git Workflow

- Main development branch: `prod`
- Commit messages should be descriptive
- Always include: `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`

## References

- `BUY_SELL_ARCHITECTURE.md` - Detailed transaction-based architecture design
- `QUICKSTART.md` - Quick setup and getting started guide
- `README.md` - Project overview and tech stack
- `PREVIOUSLY_ON_PULSE_ALPHA.md` - **Session continuity log (read this first!)**

---

**Remember**: This is an MVP with in-memory storage. The adapter pattern is in place to easily swap in database persistence later. Keep the architecture clean and maintainable.
