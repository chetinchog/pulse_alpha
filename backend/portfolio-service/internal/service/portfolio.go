package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/mgonzalez/pulse_alpha/portfolio-service/internal/domain"
	"github.com/mgonzalez/pulse_alpha/portfolio-service/internal/ports"
)

// PortfolioService handles business logic for portfolio management
type PortfolioService struct {
	transactionRepo  ports.TransactionRepository
	realizedPLRepo   ports.RealizedPLRepository
	snapshotRepo     ports.SnapshotRepository
	marketDataClient ports.MarketDataClient
}

// NewPortfolioService creates a new portfolio service
func NewPortfolioService(
	transactionRepo ports.TransactionRepository,
	realizedPLRepo ports.RealizedPLRepository,
	snapshotRepo ports.SnapshotRepository,
	marketDataClient ports.MarketDataClient,
) *PortfolioService {
	return &PortfolioService{
		transactionRepo:  transactionRepo,
		realizedPLRepo:   realizedPLRepo,
		snapshotRepo:     snapshotRepo,
		marketDataClient: marketDataClient,
	}
}

// ExecuteBuyTransaction creates a buy transaction
func (s *PortfolioService) ExecuteBuyTransaction(ctx context.Context, req domain.CreateTransactionRequest) (*domain.Transaction, error) {
	// Validation
	if req.Quantity <= 0 {
		return nil, fmt.Errorf("quantity must be positive")
	}
	if req.Price <= 0 {
		return nil, fmt.Errorf("price must be positive")
	}
	if req.Ticker == "" {
		return nil, fmt.Errorf("ticker is required")
	}

	executedAt := time.Now()
	if req.ExecutedAt != nil {
		executedAt = *req.ExecutedAt
	}

	transaction := domain.Transaction{
		ID:            uuid.New().String(),
		Ticker:        req.Ticker,
		OperationType: domain.OperationBuy,
		Quantity:      req.Quantity,
		Price:         req.Price,
		TotalAmount:   req.Quantity * req.Price,
		ExecutedAt:    executedAt,
		CreatedAt:     time.Now(),
	}

	if err := s.transactionRepo.Create(ctx, transaction); err != nil {
		return nil, err
	}

	// Take snapshot
	s.takeSnapshot(ctx, "buy", req.Ticker, executedAt)

	return &transaction, nil
}

// ExecuteSellTransaction creates a sell transaction and calculates realized P&L
func (s *PortfolioService) ExecuteSellTransaction(ctx context.Context, req domain.CreateTransactionRequest) (*domain.SellTransactionResponse, error) {
	// Validation
	if req.Quantity <= 0 {
		return nil, fmt.Errorf("quantity must be positive")
	}
	if req.Price <= 0 {
		return nil, fmt.Errorf("price must be positive")
	}
	if req.Ticker == "" {
		return nil, fmt.Errorf("ticker is required")
	}

	// Get current position to validate sell
	position, err := s.GetCurrentPosition(ctx, req.Ticker)
	if err != nil {
		return nil, fmt.Errorf("ticker not found in portfolio: %w", err)
	}

	if req.Quantity > position.Quantity {
		return nil, fmt.Errorf("cannot sell %.2f shares, only %.2f available", req.Quantity, position.Quantity)
	}

	executedAt := time.Now()
	if req.ExecutedAt != nil {
		executedAt = *req.ExecutedAt
	}

	// Create sell transaction
	transaction := domain.Transaction{
		ID:            uuid.New().String(),
		Ticker:        req.Ticker,
		OperationType: domain.OperationSell,
		Quantity:      req.Quantity,
		Price:         req.Price,
		TotalAmount:   req.Quantity * req.Price,
		ExecutedAt:    executedAt,
		CreatedAt:     time.Now(),
	}

	if err := s.transactionRepo.Create(ctx, transaction); err != nil {
		return nil, err
	}

	// Calculate realized P&L
	realizedPLAmount := (req.Price - position.WeightedCostBasis) * req.Quantity
	plPercent := 0.0
	if position.WeightedCostBasis > 0 {
		plPercent = ((req.Price - position.WeightedCostBasis) / position.WeightedCostBasis) * 100
	}

	realizedPL := domain.RealizedPL{
		ID:                uuid.New().String(),
		Ticker:            req.Ticker,
		SellTransactionID: transaction.ID,
		Quantity:          req.Quantity,
		SellPrice:         req.Price,
		CostBasis:         position.WeightedCostBasis,
		RealizedPL:        realizedPLAmount,
		PLPercent:         plPercent,
		ExecutedAt:        executedAt,
	}

	if err := s.realizedPLRepo.Create(ctx, realizedPL); err != nil {
		return nil, err
	}

	// Take snapshot
	s.takeSnapshot(ctx, "sell", req.Ticker, executedAt)

	return &domain.SellTransactionResponse{
		Transaction: transaction,
		RealizedPL:  realizedPL,
	}, nil
}

// GetCurrentPosition derives a position from transactions
func (s *PortfolioService) GetCurrentPosition(ctx context.Context, ticker string) (*domain.Position, error) {
	transactions, err := s.transactionRepo.GetByTicker(ctx, ticker)
	if err != nil {
		return nil, err
	}

	if len(transactions) == 0 {
		return nil, fmt.Errorf("no transactions found for ticker %s", ticker)
	}

	return s.calculatePositionFromTransactions(transactions), nil
}

// calculatePositionFromTransactions derives position from transaction history
func (s *PortfolioService) calculatePositionFromTransactions(txns []domain.Transaction) *domain.Position {
	if len(txns) == 0 {
		return nil
	}

	var totalBought, totalCost float64
	var totalSold float64
	var firstBuy, lastTxn time.Time

	for _, txn := range txns {
		if txn.OperationType == domain.OperationBuy {
			totalBought += txn.Quantity
			totalCost += txn.TotalAmount
			if firstBuy.IsZero() {
				firstBuy = txn.ExecutedAt
			}
		} else if txn.OperationType == domain.OperationSell {
			totalSold += txn.Quantity
		}

		if txn.ExecutedAt.After(lastTxn) {
			lastTxn = txn.ExecutedAt
		}
	}

	openQuantity := totalBought - totalSold
	if openQuantity <= 0 {
		return nil // Position closed
	}

	// With average cost method, calculate proportional cost remaining
	proportionOpen := openQuantity / totalBought
	remainingCost := totalCost * proportionOpen
	avgCost := remainingCost / openQuantity

	return &domain.Position{
		Ticker:              txns[0].Ticker,
		Quantity:            openQuantity,
		WeightedCostBasis:   avgCost,
		TotalCost:           remainingCost,
		FirstBuyDate:        firstBuy,
		LastTransactionDate: lastTxn,
	}
}

// GetAllPositions returns all open positions with market data enrichment
func (s *PortfolioService) GetAllPositions(ctx context.Context) ([]domain.EnrichedPosition, error) {
	// Get all transactions
	transactions, err := s.transactionRepo.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	if len(transactions) == 0 {
		return []domain.EnrichedPosition{}, nil
	}

	// Group by ticker
	grouped := make(map[string][]domain.Transaction)
	for _, txn := range transactions {
		grouped[txn.Ticker] = append(grouped[txn.Ticker], txn)
	}

	// Calculate positions for each ticker
	tickers := make([]string, 0)
	positions := make([]domain.Position, 0)
	for ticker, txns := range grouped {
		pos := s.calculatePositionFromTransactions(txns)
		if pos != nil && pos.Quantity > 0 {
			positions = append(positions, *pos)
			tickers = append(tickers, ticker)
		}
	}

	if len(positions) == 0 {
		return []domain.EnrichedPosition{}, nil
	}

	// Fetch prices in batch
	prices, err := s.marketDataClient.GetPrices(ctx, tickers)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch prices: %w", err)
	}

	// Get realized P&L summary
	realizedPLSummary, err := s.realizedPLRepo.GetSummary(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch realized P&L: %w", err)
	}

	// Enrich positions
	enriched := make([]domain.EnrichedPosition, 0, len(positions))
	for _, pos := range positions {
		currentPrice := prices[pos.Ticker]
		realizedPL := realizedPLSummary[pos.Ticker]
		enriched = append(enriched, s.enrichPosition(pos, currentPrice, realizedPL))
	}

	return enriched, nil
}

// GetGroupedPositions returns positions grouped by ticker (now just returns all positions)
func (s *PortfolioService) GetGroupedPositions(ctx context.Context) ([]domain.GroupedPosition, error) {
	enrichedPositions, err := s.GetAllPositions(ctx)
	if err != nil {
		return nil, err
	}

	if len(enrichedPositions) == 0 {
		return []domain.GroupedPosition{}, nil
	}

	// With transaction model, each ticker has one derived position
	// But we keep the same structure for backward compatibility
	result := make([]domain.GroupedPosition, 0, len(enrichedPositions))
	for _, pos := range enrichedPositions {
		result = append(result, domain.GroupedPosition{
			Ticker:            pos.Ticker,
			TotalQuantity:     pos.Quantity,
			WeightedCostBasis: pos.WeightedCostBasis,
			CurrentPrice:      pos.CurrentPrice,
			MarketValue:       pos.MarketValue,
			TotalCost:         pos.TotalCost,
			ProfitLoss:        pos.UnrealizedPL,     // For backward compat
			PLPercent:         pos.UnrealizedPLPct,  // For backward compat
			RealizedPL:        pos.RealizedPL,
			TotalPL:           pos.TotalPL,
			TotalPLPercent:    pos.TotalPLPct,
			IndividualPositions: []domain.EnrichedPosition{pos}, // Single position per ticker now
		})
	}

	return result, nil
}

// GetPortfolioHistory returns all portfolio snapshots
func (s *PortfolioService) GetPortfolioHistory(ctx context.Context) ([]domain.PortfolioSnapshot, error) {
	return s.snapshotRepo.GetAll(ctx)
}

// GetPortfolioSummary calculates aggregate metrics
func (s *PortfolioService) GetPortfolioSummary(ctx context.Context) (*domain.PortfolioSummary, error) {
	enrichedPositions, err := s.GetAllPositions(ctx)
	if err != nil {
		return nil, err
	}

	summary := &domain.PortfolioSummary{
		PositionCount: len(enrichedPositions),
	}

	// Sum up open positions
	for _, pos := range enrichedPositions {
		summary.TotalValue += pos.MarketValue
		summary.TotalCost += pos.TotalCost
		summary.UnrealizedPL += pos.UnrealizedPL
	}

	// IMPORTANT: Get total realized P&L directly from repository
	// This ensures we include realized P&L even when all positions are closed
	realizedPLSummary, err := s.realizedPLRepo.GetSummary(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get realized P&L: %w", err)
	}

	// Sum all realized P&L across all tickers
	for _, pl := range realizedPLSummary {
		summary.RealizedPL += pl
	}

	summary.TotalPL = summary.UnrealizedPL + summary.RealizedPL

	if summary.TotalCost > 0 {
		summary.UnrealizedPLPercent = (summary.UnrealizedPL / summary.TotalCost) * 100
	}

	// Total P&L percent is based on total capital deployed (including sold positions)
	// When all positions are closed, use realized P&L as denominator
	totalCapitalDeployed := summary.TotalCost
	if totalCapitalDeployed == 0 && summary.RealizedPL != 0 {
		// All positions closed, calculate based on realized gains
		// Get all transactions to calculate original investment
		allTxns, _ := s.transactionRepo.GetAll(ctx)
		var totalInvested float64
		for _, txn := range allTxns {
			if txn.OperationType == domain.OperationBuy {
				totalInvested += txn.TotalAmount
			}
		}
		totalCapitalDeployed = totalInvested
	}

	if totalCapitalDeployed > 0 {
		summary.TotalPLPercent = (summary.TotalPL / totalCapitalDeployed) * 100
	}

	return summary, nil
}

// GetAllTransactions returns all transactions
func (s *PortfolioService) GetAllTransactions(ctx context.Context) ([]domain.Transaction, error) {
	return s.transactionRepo.GetAll(ctx)
}

// GetTransactionsByTicker returns transactions for a specific ticker
func (s *PortfolioService) GetTransactionsByTicker(ctx context.Context, ticker string) ([]domain.Transaction, error) {
	return s.transactionRepo.GetByTicker(ctx, ticker)
}

// GetRealizedPL returns all realized P&L records
func (s *PortfolioService) GetRealizedPL(ctx context.Context) ([]domain.RealizedPL, error) {
	return s.realizedPLRepo.GetAll(ctx)
}

// GetRealizedPLByTicker returns realized P&L for a specific ticker
func (s *PortfolioService) GetRealizedPLByTicker(ctx context.Context, ticker string) ([]domain.RealizedPL, error) {
	return s.realizedPLRepo.GetByTicker(ctx, ticker)
}

// GetRealizedPLSummary returns aggregate realized P&L by ticker
func (s *PortfolioService) GetRealizedPLSummary(ctx context.Context) (map[string]float64, error) {
	return s.realizedPLRepo.GetSummary(ctx)
}

// enrichPosition calculates derived metrics
func (s *PortfolioService) enrichPosition(pos domain.Position, currentPrice float64, realizedPL float64) domain.EnrichedPosition {
	marketValue := pos.Quantity * currentPrice
	unrealizedPL := marketValue - pos.TotalCost
	unrealizedPLPct := 0.0
	if pos.TotalCost > 0 {
		unrealizedPLPct = (unrealizedPL / pos.TotalCost) * 100
	}

	totalPL := unrealizedPL + realizedPL
	totalPLPct := 0.0
	if pos.TotalCost > 0 {
		totalPLPct = (totalPL / pos.TotalCost) * 100
	}

	return domain.EnrichedPosition{
		Position:        pos,
		CurrentPrice:    currentPrice,
		MarketValue:     marketValue,
		UnrealizedPL:    unrealizedPL,
		UnrealizedPLPct: unrealizedPLPct,
		RealizedPL:      realizedPL,
		TotalPL:         totalPL,
		TotalPLPct:      totalPLPct,
	}
}

// DeleteTransaction deletes a transaction by ID
func (s *PortfolioService) DeleteTransaction(ctx context.Context, id string) error {
	// Get transaction to know which ticker for snapshot
	txn, err := s.transactionRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	// Delete the transaction
	if err := s.transactionRepo.Delete(ctx, id); err != nil {
		return err
	}

	// Take snapshot after deletion
	s.takeSnapshot(ctx, "delete", txn.Ticker, time.Now())

	return nil
}

// takeSnapshot creates a portfolio snapshot
func (s *PortfolioService) takeSnapshot(ctx context.Context, eventType, ticker string, timestamp time.Time) {
	summary, err := s.GetPortfolioSummary(ctx)
	if err != nil {
		return // Don't fail operation if snapshot fails
	}

	snapshot := domain.PortfolioSnapshot{
		Timestamp:   timestamp,
		TotalValue:  summary.TotalValue,
		TotalCost:   summary.TotalCost,
		ProfitLoss:  summary.TotalPL,
		EventType:   eventType,
		EventTicker: ticker,
	}

	_ = s.snapshotRepo.Create(ctx, snapshot)
}
