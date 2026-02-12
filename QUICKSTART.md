# Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- Go 1.23+ installed: `go version`
- Node.js 20+ installed: `node --version`
- npm installed: `npm --version`

## Installation (One-Time Setup)

Run these commands once to install dependencies:

```bash
# Install frontend dependencies
cd frontend
npm install
cd ..

# Download Go dependencies
cd backend/market-data-service
go mod download
cd ../portfolio-service
go mod download
cd ../..
```

## Running the Application

You need **3 terminal windows** running simultaneously.

### Terminal 1: Market Data Service
```bash
cd backend/market-data-service
go run cmd/main.go
```
You should see: `Market Data Service starting on port 8081...`

### Terminal 2: Portfolio Service
```bash
cd backend/portfolio-service
go run cmd/main.go
```
You should see: `Portfolio Service starting on port 8080...`

### Terminal 3: Frontend
```bash
cd frontend
npm run dev
```
You should see: `Local: http://localhost:5173/`

## Access the Application

Open your browser to: **http://localhost:5173**

## Testing the Backend (Optional)

In a new terminal, test the backend directly:

```bash
# Check health
curl http://localhost:8081/health
curl http://localhost:8080/health

# Add a position
curl -X POST http://localhost:8080/positions \
  -H "Content-Type: application/json" \
  -d '{"ticker":"AAPL","quantity":10,"cost_basis":150.0}'

# View positions
curl http://localhost:8080/positions

# View summary
curl http://localhost:8080/portfolio/summary
```

## Troubleshooting

### Port Already in Use
If you get "address already in use" errors:
- **Port 8081**: Another process is using this port. Kill it or change the port in `backend/market-data-service/cmd/main.go`
- **Port 8080**: Another process is using this port. Kill it or change the port in `backend/portfolio-service/cmd/main.go`
- **Port 5173**: Another Vite server is running. Kill it or change the port in `frontend/vite.config.ts`

### Frontend Can't Connect to Backend
- Make sure both backend services are running
- Check the browser console for errors
- Verify the proxy configuration in `frontend/vite.config.ts`

### Go Module Errors
If you get "missing go.sum entry" errors:
```bash
cd backend/market-data-service
go mod tidy

cd ../portfolio-service
go mod tidy
```

### TypeScript Errors
If you get TypeScript compilation errors:
```bash
cd frontend
rm -rf node_modules
npm install
```

## What to Expect

Once everything is running, you should be able to:

1. **Add Positions**: Enter ticker symbol (e.g., AAPL, BTC-USD), quantity, and cost basis
2. **View Portfolio**: See all positions with current prices (mocked for now)
3. **See P&L**: View profit/loss for each position and total portfolio
4. **Delete Positions**: Remove positions you no longer want to track

### Sample Tickers (with mock prices)
- **AAPL** - ~$178.50
- **GOOGL** - ~$142.30
- **MSFT** - ~$380.00
- **TSLA** - ~$245.60
- **BTC-USD** - ~$45,000.00
- **ETH-USD** - ~$2,500.00

Note: Prices are currently mocked with ±2% random variation. Real price integration is a future enhancement.

## Stopping the Application

Press `Ctrl+C` in each terminal window to stop the services.
