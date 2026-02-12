package repository

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/mgonzalez/pulse_alpha/portfolio-service/internal/domain"
)

type MemoryTransactionRepository struct {
	transactions map[string]domain.Transaction
	mu           sync.RWMutex
}

func NewMemoryTransactionRepository() *MemoryTransactionRepository {
	return &MemoryTransactionRepository{
		transactions: make(map[string]domain.Transaction),
	}
}

func (r *MemoryTransactionRepository) Create(ctx context.Context, transaction domain.Transaction) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.transactions[transaction.ID]; exists {
		return fmt.Errorf("transaction with ID %s already exists", transaction.ID)
	}

	r.transactions[transaction.ID] = transaction
	return nil
}

func (r *MemoryTransactionRepository) GetAll(ctx context.Context) ([]domain.Transaction, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	transactions := make([]domain.Transaction, 0, len(r.transactions))
	for _, txn := range r.transactions {
		transactions = append(transactions, txn)
	}

	// Sort by executed_at descending (most recent first)
	for i := 0; i < len(transactions)-1; i++ {
		for j := i + 1; j < len(transactions); j++ {
			if transactions[i].ExecutedAt.Before(transactions[j].ExecutedAt) {
				transactions[i], transactions[j] = transactions[j], transactions[i]
			}
		}
	}

	return transactions, nil
}

func (r *MemoryTransactionRepository) GetByID(ctx context.Context, id string) (*domain.Transaction, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	txn, exists := r.transactions[id]
	if !exists {
		return nil, fmt.Errorf("transaction not found")
	}

	return &txn, nil
}

func (r *MemoryTransactionRepository) GetByTicker(ctx context.Context, ticker string) ([]domain.Transaction, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	transactions := make([]domain.Transaction, 0)
	for _, txn := range r.transactions {
		if txn.Ticker == ticker {
			transactions = append(transactions, txn)
		}
	}

	// Sort by executed_at ascending (oldest first) for correct cost basis calculation
	for i := 0; i < len(transactions)-1; i++ {
		for j := i + 1; j < len(transactions); j++ {
			if transactions[i].ExecutedAt.After(transactions[j].ExecutedAt) {
				transactions[i], transactions[j] = transactions[j], transactions[i]
			}
		}
	}

	return transactions, nil
}

func (r *MemoryTransactionRepository) GetByDateRange(ctx context.Context, from, to time.Time) ([]domain.Transaction, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	transactions := make([]domain.Transaction, 0)
	for _, txn := range r.transactions {
		if (txn.ExecutedAt.Equal(from) || txn.ExecutedAt.After(from)) &&
			(txn.ExecutedAt.Equal(to) || txn.ExecutedAt.Before(to)) {
			transactions = append(transactions, txn)
		}
	}

	// Sort by executed_at descending
	for i := 0; i < len(transactions)-1; i++ {
		for j := i + 1; j < len(transactions); j++ {
			if transactions[i].ExecutedAt.Before(transactions[j].ExecutedAt) {
				transactions[i], transactions[j] = transactions[j], transactions[i]
			}
		}
	}

	return transactions, nil
}

func (r *MemoryTransactionRepository) Delete(ctx context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, exists := r.transactions[id]; !exists {
		return fmt.Errorf("transaction not found")
	}

	delete(r.transactions, id)
	return nil
}
