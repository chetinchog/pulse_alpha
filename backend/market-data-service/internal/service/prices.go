package service

import (
	"context"
	"time"

	"github.com/mgonzalez/pulse_alpha/market-data-service/internal/domain"
	"github.com/mgonzalez/pulse_alpha/market-data-service/internal/ports"
)

const defaultCacheTTL = 1 * time.Minute

// PriceService handles business logic for price data
type PriceService struct {
	cache    ports.PriceCache
	provider ports.PriceProvider
	cacheTTL time.Duration
}

// NewPriceService creates a new price service
func NewPriceService(cache ports.PriceCache, provider ports.PriceProvider) *PriceService {
	return &PriceService{
		cache:    cache,
		provider: provider,
		cacheTTL: defaultCacheTTL,
	}
}

// GetPrice retrieves price for a ticker, using cache when available
func (s *PriceService) GetPrice(ctx context.Context, ticker string) (*domain.Price, error) {
	// Try cache first
	price, err := s.cache.Get(ctx, ticker)
	if err == nil {
		return price, nil
	}

	// Cache miss - fetch from provider
	price, err = s.provider.GetPrice(ctx, ticker)
	if err != nil {
		return nil, err
	}

	// Update cache
	_ = s.cache.Set(ctx, *price, s.cacheTTL)

	return price, nil
}

// GetPrices retrieves prices for multiple tickers
func (s *PriceService) GetPrices(ctx context.Context, tickers []string) (map[string]*domain.Price, error) {
	prices := make(map[string]*domain.Price)

	// Check cache for each ticker
	uncachedTickers := []string{}
	for _, ticker := range tickers {
		price, err := s.cache.Get(ctx, ticker)
		if err == nil {
			prices[ticker] = price
		} else {
			uncachedTickers = append(uncachedTickers, ticker)
		}
	}

	// Fetch uncached prices from provider
	if len(uncachedTickers) > 0 {
		freshPrices, err := s.provider.GetPrices(ctx, uncachedTickers)
		if err != nil {
			return nil, err
		}

		// Add to result and update cache
		for ticker, price := range freshPrices {
			prices[ticker] = price
			_ = s.cache.Set(ctx, *price, s.cacheTTL)
		}
	}

	return prices, nil
}
