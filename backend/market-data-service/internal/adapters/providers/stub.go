package providers

import (
	"context"
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/mgonzalez/pulse_alpha/market-data-service/internal/domain"
)

// StubProvider provides mock prices for testing
type StubProvider struct {
	basePrice map[string]float64
}

// NewStubProvider creates a new stub price provider with realistic mock prices
func NewStubProvider() *StubProvider {
	return &StubProvider{
		basePrice: map[string]float64{
			"AAPL":    178.50,
			"GOOGL":   142.30,
			"MSFT":    380.00,
			"TSLA":    245.60,
			"AMZN":    175.20,
			"BTC-USD": 45000.00,
			"ETH-USD": 2500.00,
			"SOL-USD": 110.00,
		},
	}
}

// GetPrice returns a mock price with slight random variation
func (s *StubProvider) GetPrice(ctx context.Context, ticker string) (*domain.Price, error) {
	base, exists := s.basePrice[strings.ToUpper(ticker)]
	if !exists {
		// Default price for unknown tickers
		base = 100.00
	}

	// Add random variation ±2%
	variation := (rand.Float64() - 0.5) * 0.04
	price := base * (1 + variation)

	return &domain.Price{
		Ticker:    ticker,
		Price:     price,
		Timestamp: time.Now(),
	}, nil
}

// GetPrices returns mock prices for multiple tickers
func (s *StubProvider) GetPrices(ctx context.Context, tickers []string) (map[string]*domain.Price, error) {
	prices := make(map[string]*domain.Price)

	for _, ticker := range tickers {
		price, err := s.GetPrice(ctx, ticker)
		if err != nil {
			return nil, fmt.Errorf("failed to get price for %s: %w", ticker, err)
		}
		prices[ticker] = price
	}

	return prices, nil
}
