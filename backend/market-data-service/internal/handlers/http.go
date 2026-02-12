package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/mgonzalez/pulse_alpha/market-data-service/internal/service"
)

type HTTPHandler struct {
	priceService *service.PriceService
}

func NewHTTPHandler(priceService *service.PriceService) *HTTPHandler {
	return &HTTPHandler{
		priceService: priceService,
	}
}

// GetPrice handles GET /prices/:ticker
func (h *HTTPHandler) GetPrice(w http.ResponseWriter, r *http.Request) {
	ticker := chi.URLParam(r, "ticker")
	if ticker == "" {
		http.Error(w, "ticker parameter required", http.StatusBadRequest)
		return
	}

	price, err := h.priceService.GetPrice(r.Context(), ticker)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(price)
}

// BatchRequest represents the request body for batch price queries
type BatchRequest struct {
	Tickers []string `json:"tickers"`
}

// GetPricesBatch handles POST /prices/batch
func (h *HTTPHandler) GetPricesBatch(w http.ResponseWriter, r *http.Request) {
	var req BatchRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	if len(req.Tickers) == 0 {
		http.Error(w, "tickers array cannot be empty", http.StatusBadRequest)
		return
	}

	prices, err := h.priceService.GetPrices(r.Context(), req.Tickers)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(prices)
}

// HealthCheck handles GET /health
func (h *HTTPHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}
