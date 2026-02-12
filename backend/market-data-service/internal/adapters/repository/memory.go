package repository

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/mgonzalez/pulse_alpha/market-data-service/internal/domain"
)

var ErrNotFound = errors.New("price not found in cache")

type cacheEntry struct {
	price  domain.Price
	expiry time.Time
}

// MemoryCache implements PriceCache interface with in-memory storage
type MemoryCache struct {
	mu    sync.RWMutex
	cache map[string]cacheEntry
}

// NewMemoryCache creates a new in-memory cache
func NewMemoryCache() *MemoryCache {
	return &MemoryCache{
		cache: make(map[string]cacheEntry),
	}
}

// Get retrieves a price from cache if not expired
func (m *MemoryCache) Get(ctx context.Context, ticker string) (*domain.Price, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	entry, exists := m.cache[ticker]
	if !exists {
		return nil, ErrNotFound
	}

	if time.Now().After(entry.expiry) {
		return nil, ErrNotFound
	}

	return &entry.price, nil
}

// Set stores a price in cache with TTL
func (m *MemoryCache) Set(ctx context.Context, price domain.Price, ttl time.Duration) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.cache[price.Ticker] = cacheEntry{
		price:  price,
		expiry: time.Now().Add(ttl),
	}

	return nil
}
