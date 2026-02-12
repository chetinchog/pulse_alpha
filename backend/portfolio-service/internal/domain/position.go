package domain

import "time"

// Position represents a derived view of current holdings (calculated from transactions)
type Position struct {
	Ticker              string    `json:"ticker"`
	Quantity            float64   `json:"quantity"`             // Current open quantity
	WeightedCostBasis   float64   `json:"weighted_cost_basis"`  // Average cost per share
	TotalCost           float64   `json:"total_cost"`           // Total invested in open shares
	FirstBuyDate        time.Time `json:"first_buy_date"`       // Date of first purchase
	LastTransactionDate time.Time `json:"last_transaction_date"`
}

// EnrichedPosition includes market data and calculated metrics
type EnrichedPosition struct {
	Position
	CurrentPrice      float64 `json:"current_price"`
	MarketValue       float64 `json:"market_value"`
	UnrealizedPL      float64 `json:"unrealized_pl"`        // Current P&L on open position
	UnrealizedPLPct   float64 `json:"unrealized_pl_percent"`
	RealizedPL        float64 `json:"realized_pl"`          // Lifetime realized P&L for this ticker
	TotalPL           float64 `json:"total_pl"`             // Unrealized + Realized
	TotalPLPct        float64 `json:"total_pl_percent"`
}

// GroupedPosition represents all positions for a ticker, grouped together
// NOTE: With transaction model, individual positions are individual transactions
// This structure is kept for backward compatibility but semantics have changed
type GroupedPosition struct {
	Ticker              string              `json:"ticker"`
	TotalQuantity       float64             `json:"total_quantity"`
	WeightedCostBasis   float64             `json:"weighted_cost_basis"`
	CurrentPrice        float64             `json:"current_price"`
	MarketValue         float64             `json:"market_value"`
	TotalCost           float64             `json:"total_cost"`
	ProfitLoss          float64             `json:"profit_loss"`           // Unrealized P&L (for backward compat)
	PLPercent           float64             `json:"pl_percent"`            // Unrealized P&L % (for backward compat)
	RealizedPL          float64             `json:"realized_pl"`           // NEW: Lifetime realized P&L
	TotalPL             float64             `json:"total_pl"`              // NEW: Unrealized + Realized
	TotalPLPercent      float64             `json:"total_pl_percent"`      // NEW: Total P&L %
	IndividualPositions []EnrichedPosition  `json:"individual_positions"`  // Now represents individual buy transactions
}

// PortfolioSummary provides aggregate portfolio metrics
type PortfolioSummary struct {
	TotalValue          float64 `json:"total_value"`           // Current market value of all positions
	TotalCost           float64 `json:"total_cost"`            // Total invested in open positions
	TotalInvested       float64 `json:"total_invested"`        // Total amount invested (all buy transactions)
	UnrealizedPL        float64 `json:"unrealized_pl"`         // P&L on open positions
	UnrealizedPLPercent float64 `json:"unrealized_pl_percent"`
	RealizedPL          float64 `json:"realized_pl"`           // Lifetime realized P&L
	TotalPL             float64 `json:"total_pl"`              // Unrealized + Realized
	TotalPLPercent      float64 `json:"total_pl_percent"`
	PositionCount       int     `json:"position_count"`
}

// PortfolioSnapshot represents the portfolio state at a point in time
type PortfolioSnapshot struct {
	Timestamp   time.Time `json:"timestamp"`
	TotalValue  float64   `json:"total_value"`
	TotalCost   float64   `json:"total_cost"`
	ProfitLoss  float64   `json:"profit_loss"`
	EventType   string    `json:"event_type"` // "add" or "delete"
	EventTicker string    `json:"event_ticker"`
}
