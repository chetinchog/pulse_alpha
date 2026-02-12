package ports

import (
	"context"
	"time"

	"github.com/mgonzalez/pulse_alpha/market-data-service/internal/domain"
)

// PriceCache defines the interface for caching price data
type PriceCache interface {
	Get(ctx context.Context, ticker string) (*domain.Price, error)
	Set(ctx context.Context, price domain.Price, ttl time.Duration) error
}
