package ports

import "context"

// MarketDataClient defines the interface for fetching market prices
type MarketDataClient interface {
	GetPrice(ctx context.Context, ticker string) (float64, error)
	GetPrices(ctx context.Context, tickers []string) (map[string]float64, error)
}
