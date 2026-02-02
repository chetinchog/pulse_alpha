package registry

import (
	"context"
	"database/sql"
)

// ===========================================
// Tipos Comunes
// ===========================================

type Tool struct {
	Name        string
	Description string
	Parameters  map[string]any
}

type ToolResponse struct {
	Content string
	Calls   []ToolCall
}

type ToolCall struct {
	ToolName  string
	Arguments map[string]any
}

type LLMOption func(map[string]any)

type Period struct {
	Timeframe string // "1d", "1wk", "1mo"
	Days      int
}

type Price struct {
	Symbol    string
	Price     float64
	Change    float64
	ChangePct float64
	Currency  string
}

type OHLCV struct {
	Time   int64
	Open   float64
	High   float64
	Low    float64
	Close  float64
	Volume float64
}

type NewsItem struct {
	Title       string
	Summary     string
	Source      string
	URL         string
	PublishedAt int64
	Sentiment   float64 // -1.0 a 1.0
}

type NewsOptions struct {
	Limit int
	Days  int
}

// ===========================================
// INTERFACES (PLUGINS)
// ===========================================

// LLMProvider define la interfaz para modelos de lenguaje
type LLMProvider interface {
	Name() string
	Generate(ctx context.Context, prompt string, opts ...LLMOption) (string, error)
	GenerateWithTools(ctx context.Context, prompt string, tools []Tool) (ToolResponse, error)
	Stream(ctx context.Context, prompt string) (<-chan string, error)
	Ping(ctx context.Context) error
}

// DatabaseProvider define la interfaz para almacenamiento
type DatabaseProvider interface {
	Connect(ctx context.Context) error
	Close() error
	GetDB() *sql.DB // Para compatibilidad con sql standard, o usar wrappers custom
	Ping(ctx context.Context) error
}

// MarketDataProvider define fuentes de datos de mercado
type MarketDataProvider interface {
	Name() string
	GetPrice(ctx context.Context, symbol string) (Price, error)
	GetHistorical(ctx context.Context, symbol string, period Period) ([]OHLCV, error)
}

// NewsProvider define fuentes de noticias
type NewsProvider interface {
	Name() string
	FetchNews(ctx context.Context, symbol string, opts NewsOptions) ([]NewsItem, error)
}
