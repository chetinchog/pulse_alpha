package ports

import (
	"context"
	"time"

	"github.com/mgonzalez/pulse_alpha/portfolio-service/internal/domain"
)

// TransactionRepository defines the interface for transaction storage
type TransactionRepository interface {
	Create(ctx context.Context, transaction domain.Transaction) error
	GetAll(ctx context.Context) ([]domain.Transaction, error)
	GetByID(ctx context.Context, id string) (*domain.Transaction, error)
	GetByTicker(ctx context.Context, ticker string) ([]domain.Transaction, error)
	GetByDateRange(ctx context.Context, from, to time.Time) ([]domain.Transaction, error)
	Delete(ctx context.Context, id string) error
}

// RealizedPLRepository defines the interface for realized P&L storage
type RealizedPLRepository interface {
	Create(ctx context.Context, realizedPL domain.RealizedPL) error
	GetAll(ctx context.Context) ([]domain.RealizedPL, error)
	GetByTicker(ctx context.Context, ticker string) ([]domain.RealizedPL, error)
	GetSummary(ctx context.Context) (map[string]float64, error) // Returns map of ticker -> total realized P&L
}

// PositionRepository defines the interface for position storage
// DEPRECATED: Positions are now derived from transactions. This will be removed in future version.
type PositionRepository interface {
	Create(ctx context.Context, position domain.Position) error
	GetAll(ctx context.Context) ([]domain.Position, error)
	GetByID(ctx context.Context, id string) (*domain.Position, error)
	Update(ctx context.Context, position domain.Position) error
	Delete(ctx context.Context, id string) error
}

// SnapshotRepository defines the interface for portfolio snapshot storage
type SnapshotRepository interface {
	Create(ctx context.Context, snapshot domain.PortfolioSnapshot) error
	GetAll(ctx context.Context) ([]domain.PortfolioSnapshot, error)
}
