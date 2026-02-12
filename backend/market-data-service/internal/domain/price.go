package domain

import "time"

// Price represents a market price for a ticker at a specific time
type Price struct {
	Ticker    string    `json:"ticker"`
	Price     float64   `json:"price"`
	Timestamp time.Time `json:"timestamp"`
}
