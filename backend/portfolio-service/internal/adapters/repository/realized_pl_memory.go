package repository

import (
	"context"
	"fmt"
	"sync"

	"github.com/mgonzalez/pulse_alpha/portfolio-service/internal/domain"
)

type MemoryRealizedPLRepository struct {
	realizedPLs map[string]domain.RealizedPL
	mu          sync.RWMutex
}

func NewMemoryRealizedPLRepository() *MemoryRealizedPLRepository {
	return &MemoryRealizedPLRepository{
		realizedPLs: make(map[string]domain.RealizedPL),
	}
}

func (r *MemoryRealizedPLRepository) Create(ctx context.Context, realizedPL domain.RealizedPL) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.realizedPLs[realizedPL.ID]; exists {
		return fmt.Errorf("realized P&L with ID %s already exists", realizedPL.ID)
	}

	r.realizedPLs[realizedPL.ID] = realizedPL
	return nil
}

func (r *MemoryRealizedPLRepository) GetAll(ctx context.Context) ([]domain.RealizedPL, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	pls := make([]domain.RealizedPL, 0, len(r.realizedPLs))
	for _, pl := range r.realizedPLs {
		pls = append(pls, pl)
	}

	// Sort by executed_at descending (most recent first)
	for i := 0; i < len(pls)-1; i++ {
		for j := i + 1; j < len(pls); j++ {
			if pls[i].ExecutedAt.Before(pls[j].ExecutedAt) {
				pls[i], pls[j] = pls[j], pls[i]
			}
		}
	}

	return pls, nil
}

func (r *MemoryRealizedPLRepository) GetByTicker(ctx context.Context, ticker string) ([]domain.RealizedPL, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	pls := make([]domain.RealizedPL, 0)
	for _, pl := range r.realizedPLs {
		if pl.Ticker == ticker {
			pls = append(pls, pl)
		}
	}

	// Sort by executed_at descending
	for i := 0; i < len(pls)-1; i++ {
		for j := i + 1; j < len(pls); j++ {
			if pls[i].ExecutedAt.Before(pls[j].ExecutedAt) {
				pls[i], pls[j] = pls[j], pls[i]
			}
		}
	}

	return pls, nil
}

func (r *MemoryRealizedPLRepository) GetSummary(ctx context.Context) (map[string]float64, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	summary := make(map[string]float64)
	for _, pl := range r.realizedPLs {
		summary[pl.Ticker] += pl.RealizedPL
	}

	return summary, nil
}
