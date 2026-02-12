package ports

import (
	"context"

	"github.com/mgonzalez/pulse_alpha/market-data-service/internal/domain"
)

// PriceProvider defines the interface for fetching prices from external sources
type PriceProvider interface {
	GetPrice(ctx context.Context, ticker string) (*domain.Price, error)
	GetPrices(ctx context.Context, tickers []string) (map[string]*domain.Price, error)
}
