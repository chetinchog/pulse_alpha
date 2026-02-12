package marketdata

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// HTTPClient implements MarketDataClient using HTTP calls
type HTTPClient struct {
	baseURL    string
	httpClient *http.Client
}

// NewHTTPClient creates a new market data HTTP client
func NewHTTPClient(baseURL string) *HTTPClient {
	return &HTTPClient{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 5 * time.Second,
		},
	}
}

type priceResponse struct {
	Ticker    string    `json:"ticker"`
	Price     float64   `json:"price"`
	Timestamp time.Time `json:"timestamp"`
}

// GetPrice fetches price for a single ticker
func (c *HTTPClient) GetPrice(ctx context.Context, ticker string) (float64, error) {
	url := fmt.Sprintf("%s/prices/%s", c.baseURL, ticker)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return 0, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return 0, fmt.Errorf("failed to fetch price: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("market data service returned status %d", resp.StatusCode)
	}

	var priceResp priceResponse
	if err := json.NewDecoder(resp.Body).Decode(&priceResp); err != nil {
		return 0, fmt.Errorf("failed to decode response: %w", err)
	}

	return priceResp.Price, nil
}

type batchRequest struct {
	Tickers []string `json:"tickers"`
}

// GetPrices fetches prices for multiple tickers
func (c *HTTPClient) GetPrices(ctx context.Context, tickers []string) (map[string]float64, error) {
	url := fmt.Sprintf("%s/prices/batch", c.baseURL)

	reqBody := batchRequest{Tickers: tickers}
	reqBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(reqBytes))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch prices: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("market data service returned status %d", resp.StatusCode)
	}

	var priceData map[string]*priceResponse
	if err := json.NewDecoder(resp.Body).Decode(&priceData); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	// Convert to simple map
	prices := make(map[string]float64)
	for ticker, data := range priceData {
		prices[ticker] = data.Price
	}

	return prices, nil
}
