package repository

import (
	"context"
	"sort"
	"sync"

	"github.com/mgonzalez/pulse_alpha/portfolio-service/internal/domain"
)

// MemorySnapshotRepository implements SnapshotRepository with in-memory storage
type MemorySnapshotRepository struct {
	mu        sync.RWMutex
	snapshots []domain.PortfolioSnapshot
}

// NewMemorySnapshotRepository creates a new in-memory snapshot repository
func NewMemorySnapshotRepository() *MemorySnapshotRepository {
	return &MemorySnapshotRepository{
		snapshots: make([]domain.PortfolioSnapshot, 0),
	}
}

// Create adds a new snapshot
func (m *MemorySnapshotRepository) Create(ctx context.Context, snapshot domain.PortfolioSnapshot) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.snapshots = append(m.snapshots, snapshot)
	return nil
}

// GetAll returns all snapshots sorted by timestamp
func (m *MemorySnapshotRepository) GetAll(ctx context.Context) ([]domain.PortfolioSnapshot, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	// Make a copy to avoid race conditions
	result := make([]domain.PortfolioSnapshot, len(m.snapshots))
	copy(result, m.snapshots)

	// Sort by timestamp
	sort.Slice(result, func(i, j int) bool {
		return result[i].Timestamp.Before(result[j].Timestamp)
	})

	return result, nil
}
