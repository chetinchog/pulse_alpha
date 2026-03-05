package handlers

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/mgonzalez/pulse_alpha/portfolio-service/internal/domain"
	"github.com/mgonzalez/pulse_alpha/portfolio-service/internal/service"
)

type HTTPHandler struct {
	portfolioService *service.PortfolioService
}

func NewHTTPHandler(portfolioService *service.PortfolioService) *HTTPHandler {
	return &HTTPHandler{
		portfolioService: portfolioService,
	}
}

// CreateBuyTransaction handles POST /transactions/buy
func (h *HTTPHandler) CreateBuyTransaction(w http.ResponseWriter, r *http.Request) {
	var req domain.CreateTransactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	transaction, err := h.portfolioService.ExecuteBuyTransaction(r.Context(), req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(transaction)
}

// CreateSellTransaction handles POST /transactions/sell
func (h *HTTPHandler) CreateSellTransaction(w http.ResponseWriter, r *http.Request) {
	var req domain.CreateTransactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	response, err := h.portfolioService.ExecuteSellTransaction(r.Context(), req)
	if err != nil {
		// Check if it's a validation error (insufficient quantity)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error": err.Error(),
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// GetAllTransactions handles GET /transactions
func (h *HTTPHandler) GetAllTransactions(w http.ResponseWriter, r *http.Request) {
	transactions, err := h.portfolioService.GetAllTransactions(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(transactions)
}

// ExportTransactionsToCSV handles GET /transactions/export
func (h *HTTPHandler) ExportTransactionsToCSV(w http.ResponseWriter, r *http.Request) {
	ticker := r.URL.Query().Get("ticker")
	var transactions []domain.Transaction
	var err error

	if ticker != "" {
		transactions, err = h.portfolioService.GetTransactionsByTicker(r.Context(), ticker)
	} else {
		transactions, err = h.portfolioService.GetAllTransactions(r.Context())
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	filename := "transactions.csv"
	if ticker != "" {
		filename = fmt.Sprintf("transactions_%s.csv", ticker)
	}

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment;filename=%s", filename))

	writer := csv.NewWriter(w)
	defer writer.Flush()

	// Header
	writer.Write([]string{"ID", "Ticker", "Type", "Quantity", "Price", "Total", "Executed At"})

	for _, txn := range transactions {
		writer.Write([]string{
			txn.ID,
			txn.Ticker,
			string(txn.OperationType),
			fmt.Sprintf("%.8f", txn.Quantity),
			fmt.Sprintf("%.2f", txn.Price),
			fmt.Sprintf("%.2f", txn.TotalAmount),
			txn.ExecutedAt.Format(time.RFC3339),
		})
	}
}

// GetRealizedPL handles GET /realized-pl
func (h *HTTPHandler) GetRealizedPL(w http.ResponseWriter, r *http.Request) {
	realizedPLs, err := h.portfolioService.GetRealizedPL(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(realizedPLs)
}

// ExportRealizedPLToCSV handles GET /realized-pl/export
func (h *HTTPHandler) ExportRealizedPLToCSV(w http.ResponseWriter, r *http.Request) {
	ticker := r.URL.Query().Get("ticker")
	var realizedPLs []domain.RealizedPL
	var err error

	if ticker != "" {
		realizedPLs, err = h.portfolioService.GetRealizedPLByTicker(r.Context(), ticker)
	} else {
		realizedPLs, err = h.portfolioService.GetRealizedPL(r.Context())
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	filename := "realized_pl.csv"
	if ticker != "" {
		filename = fmt.Sprintf("realized_pl_%s.csv", ticker)
	}

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment;filename=%s", filename))

	writer := csv.NewWriter(w)
	defer writer.Flush()

	// Header
	writer.Write([]string{"ID", "Ticker", "Quantity", "Sell Price", "Cost Basis", "Realized P&G", "P&G %", "Executed At"})

	for _, pl := range realizedPLs {
		writer.Write([]string{
			pl.ID,
			pl.Ticker,
			fmt.Sprintf("%.8f", pl.Quantity),
			fmt.Sprintf("%.2f", pl.SellPrice),
			fmt.Sprintf("%.2f", pl.CostBasis),
			fmt.Sprintf("%.2f", pl.RealizedPL),
			fmt.Sprintf("%.2f", pl.PLPercent),
			pl.ExecutedAt.Format(time.RFC3339),
		})
	}
}

// GetRealizedPLSummary handles GET /realized-pl/summary
func (h *HTTPHandler) GetRealizedPLSummary(w http.ResponseWriter, r *http.Request) {
	summary, err := h.portfolioService.GetRealizedPLSummary(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Calculate total realized P&L
	var totalRealizedPL float64
	for _, pl := range summary {
		totalRealizedPL += pl
	}

	response := map[string]interface{}{
		"total_realized_pl": totalRealizedPL,
		"by_ticker":         summary,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// DEPRECATED: CreatePosition handles POST /positions (for backward compatibility)
// New clients should use POST /transactions/buy instead
func (h *HTTPHandler) CreatePosition(w http.ResponseWriter, r *http.Request) {
	var req domain.CreateTransactionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Map old field names to new ones if needed
	// old: cost_basis → new: price
	// This maintains backward compatibility

	transaction, err := h.portfolioService.ExecuteBuyTransaction(r.Context(), req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Return in old format for compatibility
	w.Header().Set("Content-Type", "application/json")
	w.Header().Add("X-Deprecated", "Use POST /transactions/buy instead")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(transaction)
}

// GetAllPositions handles GET /positions
func (h *HTTPHandler) GetAllPositions(w http.ResponseWriter, r *http.Request) {
	positions, err := h.portfolioService.GetAllPositions(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(positions)
}

// GetGroupedPositions handles GET /positions/grouped
func (h *HTTPHandler) GetGroupedPositions(w http.ResponseWriter, r *http.Request) {
	grouped, err := h.portfolioService.GetGroupedPositions(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(grouped)
}

// GetPortfolioSummary handles GET /portfolio/summary
func (h *HTTPHandler) GetPortfolioSummary(w http.ResponseWriter, r *http.Request) {
	summary, err := h.portfolioService.GetPortfolioSummary(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(summary)
}

// GetPortfolioHistory handles GET /portfolio/history
func (h *HTTPHandler) GetPortfolioHistory(w http.ResponseWriter, r *http.Request) {
	history, err := h.portfolioService.GetPortfolioHistory(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(history)
}

// DeleteTransaction handles DELETE /transactions/:id (and legacy DELETE /positions/:id)
func (h *HTTPHandler) DeleteTransaction(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	if id == "" {
		http.Error(w, "transaction ID is required", http.StatusBadRequest)
		return
	}

	if err := h.portfolioService.DeleteTransaction(r.Context(), id); err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// HealthCheck handles GET /health
func (h *HTTPHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
}

// SetupRoutes configures all HTTP routes and middleware
func SetupRoutes(handler *HTTPHandler) *chi.Mux {
	r := chi.NewRouter()

	// Middleware must be added BEFORE routes
	// These are now added in main.go

	// Health check
	r.Get("/health", handler.HealthCheck)

	// Transaction endpoints (new API)
	r.Post("/transactions/buy", handler.CreateBuyTransaction)
	r.Post("/transactions/sell", handler.CreateSellTransaction)
	r.Get("/transactions", handler.GetAllTransactions)
	r.Get("/transactions/export", handler.ExportTransactionsToCSV)
	r.Delete("/transactions/{id}", handler.DeleteTransaction)

	// Realized P&L endpoints
	r.Get("/realized-pl", handler.GetRealizedPL)
	r.Get("/realized-pl/export", handler.ExportRealizedPLToCSV)
	r.Get("/realized-pl/summary", handler.GetRealizedPLSummary)

	// Position endpoints (existing + deprecated)
	r.Post("/positions", handler.CreatePosition) // DEPRECATED
	r.Get("/positions", handler.GetAllPositions)
	r.Get("/positions/grouped", handler.GetGroupedPositions)
	r.Delete("/positions/{id}", handler.DeleteTransaction) // DEPRECATED: Use DELETE /transactions/:id

	// Portfolio endpoints
	r.Get("/portfolio/summary", handler.GetPortfolioSummary)
	r.Get("/portfolio/history", handler.GetPortfolioHistory)

	return r
}
