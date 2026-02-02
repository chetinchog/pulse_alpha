package ollama

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/chetinchog/pulse_alpha/backend/internal/registry"
)

type Provider struct {
	baseURL string
	model   string
	client  *http.Client
}

// Ensure interface compliance
var _ registry.LLMProvider = (*Provider)(nil)

func NewProvider(baseURL, model string) *Provider {
	if baseURL == "" {
		baseURL = "http://localhost:11434"
	}
	if model == "" {
		model = "mistral:7b"
	}

	return &Provider{
		baseURL: baseURL,
		model:   model,
		client:  &http.Client{Timeout: 120 * time.Second},
	}
}

func (p *Provider) Name() string {
	return fmt.Sprintf("ollama-%s", p.model)
}

func (p *Provider) Generate(ctx context.Context, prompt string, opts ...registry.LLMOption) (string, error) {
	reqBody := map[string]any{
		"model":  p.model,
		"prompt": prompt,
		"stream": false,
	}

	// Apply options (if any)
	for _, opt := range opts {
		opt(reqBody)
	}

	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", p.baseURL+"/api/generate", bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := p.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("ollama request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("ollama API returned status: %d", resp.StatusCode)
	}

	var result struct {
		Response string `json:"response"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", fmt.Errorf("failed to decode ollama response: %w", err)
	}

	return result.Response, nil
}

func (p *Provider) GenerateWithTools(ctx context.Context, prompt string, tools []registry.Tool) (registry.ToolResponse, error) {
	// Ollama support for tools is model-dependent and varies.
	// For basic mistral implementation, we might simulate it or use specific function calling prompt formats.
	// This is a placeholder for future robust implementation.
	return registry.ToolResponse{Content: "Tool calling not yet implemented for basic Ollama provider"}, nil
}

func (p *Provider) Stream(ctx context.Context, prompt string) (<-chan string, error) {
	ch := make(chan string)

	go func() {
		defer close(ch)

		reqBody := map[string]any{
			"model":  p.model,
			"prompt": prompt,
			"stream": true,
		}

		jsonBody, _ := json.Marshal(reqBody)
		req, err := http.NewRequestWithContext(ctx, "POST", p.baseURL+"/api/generate", bytes.NewBuffer(jsonBody))
		if err != nil {
			return
		}

		resp, err := p.client.Do(req)
		if err != nil {
			return
		}
		defer resp.Body.Close()

		decoder := json.NewDecoder(resp.Body)
		for {
			var chunk struct {
				Response string `json:"response"`
				Done     bool   `json:"done"`
			}
			if err := decoder.Decode(&chunk); err != nil {
				break
			}
			ch <- chunk.Response
			if chunk.Done {
				break
			}
		}
	}()

	return ch, nil
}

func (p *Provider) Ping(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, "GET", p.baseURL+"/api/version", nil)
	if err != nil {
		return err
	}

	resp, err := p.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("ollama ping failed with status: %d", resp.StatusCode)
	}
	return nil
}
