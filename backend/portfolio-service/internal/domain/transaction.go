package domain

import "time"

type OperationType string

const (
	OperationBuy  OperationType = "buy"
	OperationSell OperationType = "sell"
)

type Transaction struct {
	ID            string        `json:"id"`
	Ticker        string        `json:"ticker"`
	OperationType OperationType `json:"operation_type"`
	Quantity      float64       `json:"quantity"`       // Always positive
	Price         float64       `json:"price"`          // Price per share
	TotalAmount   float64       `json:"total_amount"`   // quantity * price
	ExecutedAt    time.Time     `json:"executed_at"`    // When the transaction occurred
	CreatedAt     time.Time     `json:"created_at"`     // When record was created
}

type RealizedPL struct {
	ID                string    `json:"id"`
	Ticker            string    `json:"ticker"`
	SellTransactionID string    `json:"sell_transaction_id"`
	Quantity          float64   `json:"quantity"`       // Shares sold
	SellPrice         float64   `json:"sell_price"`     // Price per share at sale
	CostBasis         float64   `json:"cost_basis"`     // Weighted avg cost per share
	RealizedPL        float64   `json:"realized_pl"`    // (sell_price - cost_basis) * quantity
	PLPercent         float64   `json:"pl_percent"`     // Percentage gain/loss
	ExecutedAt        time.Time `json:"executed_at"`    // When the sell occurred
}

type CreateTransactionRequest struct {
	Ticker     string     `json:"ticker"`
	Quantity   float64    `json:"quantity"`
	Price      float64    `json:"price"`
	ExecutedAt *time.Time `json:"executed_at,omitempty"` // Optional, defaults to now
}

type SellTransactionResponse struct {
	Transaction Transaction `json:"transaction"`
	RealizedPL  RealizedPL  `json:"realized_pl"`
}
