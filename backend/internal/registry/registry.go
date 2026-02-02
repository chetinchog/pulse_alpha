package registry

import (
	"fmt"
	"sync"
)

// PluginRegistry gestiona todos los providers disponibles
type PluginRegistry struct {
	mu sync.RWMutex

	llmProviders    map[string]LLMProvider
	dbProviders     map[string]DatabaseProvider
	marketProviders map[string]MarketDataProvider
	newsProviders   map[string]NewsProvider

	// Defaults global
	defaultLLM    string
	defaultDB     string
	defaultMarket string
	defaultNews   string
}

// Instancia global (Singleton pattern)
var (
	instance *PluginRegistry
	once     sync.Once
)

// GetInstance devuelve la instancia única del registro
func GetInstance() *PluginRegistry {
	once.Do(func() {
		instance = &PluginRegistry{
			llmProviders:    make(map[string]LLMProvider),
			dbProviders:     make(map[string]DatabaseProvider),
			marketProviders: make(map[string]MarketDataProvider),
			newsProviders:   make(map[string]NewsProvider),
		}
	})
	return instance
}

// ============================================================================
// LLM PROVIDERS
// ============================================================================

func (r *PluginRegistry) RegisterLLM(name string, p LLMProvider) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.llmProviders[name] = p
}

func (r *PluginRegistry) GetLLM(name string) (LLMProvider, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	// Si nombre vacío, intentar default
	if name == "" {
		name = r.defaultLLM
	}

	if p, ok := r.llmProviders[name]; ok {
		return p, nil
	}
	return nil, fmt.Errorf("LLM provider '%s' not registered", name)
}

// ============================================================================
// MARKET DATA PROVIDERS
// ============================================================================

func (r *PluginRegistry) RegisterMarketData(name string, p MarketDataProvider) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.marketProviders[name] = p
}

func (r *PluginRegistry) GetMarketData(name string) (MarketDataProvider, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if name == "" {
		name = r.defaultMarket
	}

	if p, ok := r.marketProviders[name]; ok {
		return p, nil
	}
	return nil, fmt.Errorf("MarketData provider '%s' not registered", name)
}

// ============================================================================
// NEWS PROVIDERS
// ============================================================================

func (r *PluginRegistry) RegisterNews(name string, p NewsProvider) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.newsProviders[name] = p
}

func (r *PluginRegistry) GetNews(name string) (NewsProvider, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	if name == "" {
		name = r.defaultNews
	}

	if p, ok := r.newsProviders[name]; ok {
		return p, nil
	}
	return nil, fmt.Errorf("News provider '%s' not registered", name)
}

// ============================================================================
// DEFAULTS
// ============================================================================

func (r *PluginRegistry) SetDefaults(llm, db, market, news string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.defaultLLM = llm
	r.defaultDB = db
	r.defaultMarket = market
	r.defaultNews = news
}
