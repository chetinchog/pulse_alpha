# 🚀 PULSEALPHA - ESPECIFICACIÓN TÉCNICA

**Status**: 🟡 VERSIÓN PRELIMINAR | **Version**: 0.1.0 | **Última actualización**: 2026-02-02

---

## ⚡ RESUMEN EJECUTIVO

**PulseAlpha** es una plataforma moderna de gestión de inversiones e inteligencia financiera de **nivel institucional**, diseñada como **soporte vital para inversores**. La aplicación combina análisis técnico y fundamental automáticos, monitoreo 24/7, asesoría inteligente mediante **agentes de IA locales (Ollama)**, y arquitectura de microservicios escalable y resiliente.

### Filosofía de Desarrollo
- **100% Local First**: Ejecutable sin APIs pagas, usando Ollama + Yahoo Finance + CoinGecko
- **Monorepo Splittable**: Estructura preparada para separar en repos independientes
- **Agentes IA Autónomos**: Arquitectura multi-agente con patrón ReAct para maximizar resultados

**Diferenciador Clave**: Performance institucional + UX retail-friendly + Agentes IA locales = inversión inteligente sin costos de API.

---

## 📋 TABLA DE CONTENIDOS

1. [Visión Estratégica](#visión-estratégica)
2. [Principios Arquitectónicos](#principios-arquitectónicos)
3. [Funcionalidades Core](#funcionalidades-core)
4. [Arquitectura Técnica](#arquitectura-técnica)
5. [Patrones y Best Practices](#patrones-y-best-practices)
6. [Especificación Detallada](#especificación-detallada)
7. [Flujos de Usuario](#flujos-de-usuario)
8. [Deployment & DevOps](#deployment--devops)

---

## VISIÓN ESTRATÉGICA

### Propósito
PulseAlpha democratiza el acceso a análisis de inversiones de nivel Bloomberg, permitiendo a inversores retail tomar decisiones informadas sin pagar $20k/año. **Es el soporte vital para cualquier inversor serio**.

### Promesa de Valor
- ✅ **Análisis Automático**: Técnico + fundamental ejecutado cada noche, sin intervención
- ✅ **Señales Accionables**: BUY/SELL/HOLD con score de confianza y justificación estructurada
- ✅ **Agentes IA**: Sistema multi-agente con Ollama (mistral:7b) local, 24/7
- ✅ **Gestión Inteligente**: Alertas, rebalanceo automático, análisis de riesgo
- ✅ **UX Moderna**: Interfaz limpia, mobile-first, orientada a acciones
- ✅ **Escalable**: Arquitectura microservicios que crece con tus usuarios

---

## PRINCIPIOS ARQUITECTÓNICOS

### 1. KISS (Keep It Simple, Stupid)
- **Cada módulo**: Una responsabilidad clara, sin entanglement
- **APIs**: Simples, RESTful, documentadas con OpenAPI/Swagger
- **Configuración**: Centralizada, 12-factor app compliant
- **Código**: Legible antes que clever; comentarios para lógica compleja

### 2. Escalabilidad Horizontal
- **Stateless Services**: Ningún estado en memoria, todo en BD/Redis
- **Load Balancing**: Nginx/HAProxy distribuyendo tráfico
- **Database**: Connection pooling, read replicas para queries pesadas
- **Message Queue**: RabbitMQ/Kafka para decoupling de análisis pesados

### 3. Resiliencia
- **Circuit Breaker**: Detener calls a servicios fallidos, reintentos exponenciales
- **Timeouts Explícitos**: En toda IO (DB, APIs externas)
- **Graceful Degradation**: Si IA no responde, mostrar análisis técnico base
- **Health Checks**: Liveness + Readiness probes para orchestración

### 4. Baja Latencia
- **Caching en Capas**: 
  * Nivel 1: Browser (assets estáticos)
  * Nivel 2: API responses (Redis, 15min TTL)
  * Nivel 3: Database queries (connection pool)
- **Async Processing**: Análisis pesados en background jobs
- **CDN**: Assets estáticos (JS, CSS, imágenes) servidos desde edge

### 5. Alta Disponibilidad
- **Multi-Region**: Deploy en 2+ regiones geográficas (failover automático)
- **Database Redundancy**: PostgreSQL + hot standby (streaming replication)
- **Service Mesh**: Istio/Linkerd para observabilidad y retry automático
- **SLA 99.9%**: Máximo 43 min downtime/mes

### 6. Observabilidad (3 Pilares)
- **Logging**: ELK (Elasticsearch, Logstash, Kibana) o DataDog
- **Metrics**: Prometheus + Grafana (latency, error rate, throughput)
- **Tracing**: Jaeger/Zipkin para distributed tracing

---

## FUNCIONALIDADES CORE

### 1. Cartera Inteligente
**Objetivo**: Gestión sencilla pero poderosa de instrumentos

- Agregar/editar/eliminar tickers (acciones, ETFs, criptos, derivados)
- Visualización en tabla: Ticker | Precio | Cambio% | Recomendación | Score | Cambio 7d
- Visualización en cards (mobile): Precios grandes, trending visual indicators
- Watchlist: Tickers monitoreados sin posesión
- Ranking: Sorteable por performance, sector, volatilidad, recomendación
- Historial: Timeline de cambios de recomendación

**Patrón**: Repository pattern para acceso a datos, caché de consultas frecuentes

### 2. Motor de Análisis Automático 24/7
**Objetivo**: Análisis exhaustivo ejecutado automáticamente post-cierre de mercados

**Arquitectura**: Microservicio separado (Analysis Service) con su propia DB

**A. Recopilación de Novedades** (News Aggregator Service)
```
Fuentes GRATUITAS (sin API keys):
├─ RSS Feeds:
│   ├─ Yahoo Finance RSS: https://feeds.finance.yahoo.com/rss/2.0/
│   ├─ Reuters RSS: https://www.reutersagency.com/feed/
│   ├─ Google News RSS: https://news.google.com/rss/search?q={ticker}
│   └─ Seeking Alpha RSS: https://seekingalpha.com/feed.xml
├─ Fetch noticias últimas 24h por ticker
├─ NLP Filtering con Ollama: relevancia + materialidad
├─ Categorización: Earnings, Management, Regulation, Partnership, etc.
├─ Ranking por importancia (sentiment score local)
└─ Storage: PostgreSQL + Redis (TTL 7 días)
```

**B. Análisis Técnico** (Technical Analysis Engine)
```
Indicadores Primarios:
├─ RSI(14): Sobrecompra(>70), Sobreventa(<30), divergencias
├─ MACD(12,26,9): Cruces signal, momentum, divergencias
├─ Bollinger Bands(20,2): Volatilidad, breakouts
└─ SMA(20,50,200): Tendencia, golden/death cross

Indicadores Secundarios:
├─ Stochastic: Momentum oscilador
├─ Williams %R: Presión compra/venta
├─ Volume Analysis: OBV, A/D, volumen relativo
└─ ATR(14): Volatilidad histórica

Análisis Estructural:
├─ Soportes/resistencias dinámicas (52 semanas)
├─ Patrones: Double Top/Bottom, H&S, Triangles, Breakouts
├─ Trend classification: Uptrend/Downtrend/Consolidation
└─ Volatilidad: Low(<15%), Medium(15-25%), High(>25%)

Output: Score Técnico 0-100 + Narrativa + 2-4 semana outlook
```

**C. Análisis Fundamental** (Fundamental Analysis Engine)
```
Valuación:
├─ P/E, PEG, P/B, EV/EBITDA, Price/Sales
└─ Comparativa vs. peer group, sector

Rentabilidad:
├─ ROE, ROA, ROIC
└─ Profit margins (bruto, operativo, neto)

Salud Financiera:
├─ Current Ratio, Debt-to-Equity, Interest Coverage
└─ Free Cash Flow trend

Crecimiento:
├─ EPS growth (YoY, 5Y)
├─ Revenue growth
└─ Forward guidance (si disponible)

Eventos:
├─ Earnings beat/miss histórico
├─ Próximas dates (earnings, dividends, ex-dates)
└─ Cambios management, regulaciones, litigios

Output: Score Fundamental 0-100 + Narrativa + Outlook 6-12 meses
```

**D. Síntesis Inteligente y Generación de Señales**
```
Algorithm (Weighted Fusion):
Signal Score = (Tech×0.45) + (Fund×0.45) + (News×0.10)

BUY FUERTE  → Score ≥ 75
BUY         → Score 70-74
HOLD        → Score 45-69
VENTA       → Score 20-29
VENTA FUERTE → Score < 20

Output por Recomendación:
├─ Top 3 razones técnicas
├─ Top 3 razones fundamentales
├─ Top 3 factores de riesgo
├─ Próximos catalizadores
├─ Entry/Target/Stop-loss prices
└─ Confidence score, timeframe (corto/medio/largo)
```

**Patrón**: Strategy pattern para diferentes algoritmos de análisis, Chain of Responsibility para procesar indicadores

### 3. Sistema de Agentes IA (Ollama Local)
**Objetivo**: Arquitectura multi-agente autónoma usando Ollama (mistral:7b) con patrón ReAct

**Stack IA Local**:
```
Motor: Ollama (localhost:11434)
Modelo: mistral:7b (7B params, rápido para desarrollo)
Patrón: ReAct (Reasoning + Acting) con tool-calling
Framework: LangChain Go / custom agent loop
```

**Arquitectura Multi-Agente**:
```
┌─────────────────────────────────────────────────────────┐
│                  Agent Orchestrator                      │
│            (Router + Context Manager)                    │
└─────────────────┬───────────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┬─────────────┐
    ▼             ▼             ▼             ▼
┌────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐
│Analysis│  │  News    │  │Portfolio │  │   Chat     │
│ Agent  │  │  Agent   │  │  Agent   │  │   Agent    │
└────┬───┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘
     │           │             │              │
   Tools       Tools         Tools          Tools
```

**Agent 1: Analysis Agent**
- `get_price_data()`: Yahoo Finance API
- `calculate_indicators()`: RSI, MACD, Bollinger (go-talib)
- `get_fundamentals()`: P/E, ROE, debt ratios
- `generate_signal()`: BUY/HOLD/SELL con score

**Agent 2: News Agent**
- `fetch_rss_feeds()`: Reuters, Yahoo, Google News
- `analyze_sentiment()`: Local NLP con Ollama
- `summarize_news()`: Resúmenes ejecutivos
- `detect_material_events()`: Earnings, M&A, regulaciones

**Agent 3: Portfolio Agent**
- `calculate_risk()`: Volatilidad, Sharpe, VaR
- `suggest_rebalance()`: Optimización de allocation
- `compare_scenarios()`: What-if analysis
- `track_performance()`: ROI, benchmarks

**Agent 4: Chat Agent (User-Facing)**
- `route_to_specialist()`: Delega a agentes especializados
- `explain_simply()`: Traduce jerga financiera
- `remember_context()`: Mantiene historial de conversación
- `suggest_actions()`: Proactivamente sugiere siguiente paso

**Ciclo ReAct**:
```
1. THOUGHT: "El usuario pregunta por AAPL, necesito análisis técnico"
2. ACTION: call get_price_data("AAPL") → {"price": 185.50, ...}
3. ACTION: call calculate_indicators("AAPL") → {"rsi": 65, "macd": ...}
4. THOUGHT: "RSI en 65 indica momentum positivo, MACD cruzando..."
5. RESPONSE: "Apple muestra señales alcistas con RSI en 65..."
```

**Interface Usuario**:
- Chat bubble (bottom-right) o página full-screen
- Conversación persistente por session
- Context injection: análisis completo del ticker + perfil usuario
- Streaming responses para UX fluida

**Capacidades**:
1. Explicaciones de análisis: "¿Por qué COMPRA en Apple?"
2. Análisis comparativo: "Comparar AAPL vs MSFT"
3. Educación financiera: Explicar P/E, RSI, etc.
4. Análisis de noticias: Impact assessment
5. Estrategia de trading: Entry/exit timing
6. Recomendaciones portfolio: Diversificación, rebalanceo
7. Risk analysis: Downside scenarios, VaR
8. Earnings analysis: Interpretación de resultados

**Patrón**: Adapter pattern para Ollama API, Strategy para selección de agente, Chain of Responsibility para pipeline de tools

### 4. Recomendaciones Inteligentes Multi-Modal
**Individual** (por ticker):
- Recomendación clara: BUY/HOLD/SELL (score 0-100)
- Justificación: 3 razones técnicas + 3 fundamentales + 3 riesgos
- Timeframe: Corto (2-4w), Medio (3-6m), Largo (1y+)
- Niveles: Entry, Target, Stop-loss

**Portfolio**:
- Dashboard: Valor total, allocation by sector/asset class
- Diversificación: Sector exposure, correlación, Beta
- Rebalanceo: Qué vender, qué comprar, montos
- Riesgo: Volatilidad, Sharpe Ratio, Max Drawdown, VaR

**Temáticos Pre-construidos**:
- Conservative, Balanced, Growth, Tech-Heavy, Dividend Hunter, International, ESG Focus

**Smart Alerts**:
- Cambio de recomendación FUERTE: notificación inmediata
- Noticia crítica: resumen + análisis de impacto
- Price target alcanzado: sugerencia de tomar ganancias
- Earnings próxima semana: preparación para volatilidad

**Patrón**: Observer pattern para alertas, Factory pattern para portafolios temáticos

### 5. Dashboard Estratégico
**Secciones**:
1. **Resumen Ejecutivo**: Valor cartera, cambio %, Sharpe Ratio, acciones sugeridas
2. **Tabla Holdings**: Ticker, Cantidad, Precio, Cambio%, Recomendación, Score
3. **Gráficos**: Performance histórica, allocation pie, correlación heatmap
4. **Alertas**: Timeline de cambios, noticias críticas, eventos próximos
5. **Risk Analysis**: Distribución sectorial, exposición volatilidad, oportunidades rebalanceo

**Patrón**: Composite pattern para composición de widgets, MVC para data binding

### 6. Vista Detallada por Instrumento
**Componentes**:
- Header: Ticker, precio actual, cambio%, rating
- Recomendación: Card prominente con justificación estructurada
- Análisis Técnico: Gráfico interactivo + indicadores + narrativa
- Análisis Fundamental: Ratios, comparativas, growth metrics
- Noticias: Timeline filtrado, categorizado
- Comparativa: vs. peers, sector, índice
- Historial: Timeline de cambios de recomendación

**Patrón**: Decorator pattern para enriquecer datos de ticker

### 7. Configuración Personalizada
- Perfil inversor: Experiencia, horizonte, riesgo, objetivo
- Preferencias análisis: Indicadores, timeframe, sensibilidad alertas
- Notificaciones: Canales, frecuencia, tipos
- Visualización: Dark/light, tamaño fuente, densidad datos
- Integración: Moneda base, zona horaria, idioma

**Patrón**: Builder pattern para construcción de perfiles

---

## ARQUITECTURA TÉCNICA

### Microservicios (Recomendado para Escala)

**Módulos Independientes**:

```
API Gateway (Nginx/Kong)
├── Auth Service (JWT/OAuth)
├── User Service (Perfiles, preferencias)
├── Ticker Service (CRUD, watchlist)
├── Analysis Service (Motor de análisis)
│   ├─ Technical Analyzer
│   ├─ Fundamental Analyzer
│   └─ Signal Generator
├── News Service (Agregación noticias)
├── AI Service (Chat, análisis IA)
├── Portfolio Service (Rebalanceo, riesgo)
├── Alert Service (Notificaciones)
└── WebSocket Service (Real-time updates)

Shared Infrastructure:
├── PostgreSQL (Primary DB)
├── Redis (Caching, sessions)
├── Message Queue (RabbitMQ/Kafka)
├── Blob Storage (AWS S3, históricos)
└── Service Mesh (Istio)
```

### Stack Detallado

**Frontend**:
- React 18+ con TypeScript
- Tailwind CSS + custom CSS modules
- State: Zustand
- Charts: TradingView Lightweight Charts / Recharts
- HTTP: Axios + interceptors
- WebSocket: Socket.io (updates en tiempo real)
- Testing: Jest + React Testing Library

**Backend (Go 1.21+)**:

```go
// Gin Framework
github.com/gin-gonic/gin                    // API framework

// Database
github.com/jackc/pgx/v5                     // PostgreSQL driver
sqlc (code generation for type-safe SQL)    // SQL queries
github.com/golang-migrate/migrate            // Migrations

// Caching & Storage
github.com/redis/go-redis/v9                // Redis client
aws-sdk-go-v2                               // S3, CloudWatch

// Message Queue
github.com/rabbitmq/amqp091-go              // RabbitMQ
// or github.com/segmentio/kafka-go          // Kafka

// Job Scheduling
github.com/robfig/cron/v3                   // Cron jobs
github.com/google/uuid                      // UUID generation

// Authentication & Security
github.com/golang-jwt/jwt/v5                // JWT
golang.org/x/crypto/bcrypt                  // Password hashing

// Logging & Monitoring
go.uber.org/zap                             // Structured logging
github.com/prometheus/client_golang         // Metrics

// Technical Analysis
ta-lib-go (wrapper of ta-lib C library)    // Indicators
github.com/shopspring/decimal                // Precise decimal math

// HTTP Clients & Parsing
net/http (built-in)                         // HTTP client
encoding/json                               // JSON parsing

// Observability
github.com/grpc-ecosystem/go-grpc-middleware // gRPC (optional)
github.com/opentelemetry/go-otel             // OpenTelemetry

// Testing
github.com/stretchr/testify                 // Assertions
github.com/DATA-DOG/go-sqlmock              // SQL mocking

// ============================================
// FUENTES DE DATOS GRATUITAS (sin API keys)
// ============================================

// Market Data
github.com/piquette/finance-go              // Yahoo Finance (stocks, ETFs)
// or github.com/go-resty/resty/v2          // HTTP client para Yahoo Finance API

// Crypto Data
// CoinGecko API: https://api.coingecko.com/api/v3/ (gratis, sin key)
// Endpoints: /simple/price, /coins/{id}/market_chart

// RSS Parsing
github.com/mmcdole/gofeed                   // RSS/Atom parser

// ============================================
// AGENTES IA (Ollama Local)
// ============================================

// Ollama Client
// HTTP API: http://localhost:11434/api/generate
// Modelo: mistral:7b

// Agent Framework (custom o LangChain-like)
// ReAct pattern implementation
// Tool registry + execution
```

**Infrastructure**:
- Docker: Containerización de servicios
- Docker Compose: Local development
- Kubernetes: Production orchestration
- Helm: Kubernetes package management
- PostgreSQL 15+: Database primaria
- Redis 7+: Caching y sessions
- RabbitMQ/Kafka: Message queue para análisis async
- Prometheus/Grafana: Metrics & monitoring
- ELK Stack: Logging centralizado
- Nginx/Kong: API Gateway

### Estructura Monorepo (Splittable)

```
pulsealpha/
├── Makefile                    # Makefile raíz (orquesta sub-proyectos)
├── docker-compose.yml          # Desarrollo local
├── docker-compose.prod.yml     # Producción
├── .github/
│   └── workflows/
│       ├── backend.yml         # CI/CD backend
│       ├── frontend.yml        # CI/CD frontend
│       └── release.yml         # Release workflow
│
├── backend/                    # → Futuro repo: pulsealpha-backend
│   ├── Makefile               # make build, test, lint, run
│   ├── go.mod
│   ├── go.sum
│   ├── cmd/
│   │   ├── api/               # API Gateway service
│   │   ├── analysis/          # Analysis worker service
│   │   ├── news/              # News aggregator service
│   │   └── agents/            # AI Agents service
│   ├── internal/
│   │   ├── domain/            # Entities, value objects
│   │   ├── repository/        # Data access layer
│   │   ├── service/           # Business logic
│   │   ├── handler/           # HTTP handlers
│   │   ├── agent/             # IA agents (ReAct)
│   │   └── infra/             # External services adapters
│   ├── pkg/                   # Shared utilities
│   ├── migrations/            # Database migrations
│   └── configs/               # Configuration files
│
├── frontend/                   # → Futuro repo: pulsealpha-frontend
│   ├── Makefile               # make dev, build, test, lint
│   ├── package.json
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── services/
│   └── public/
│
├── infra/                      # → Futuro repo: pulsealpha-infra
│   ├── Makefile               # make deploy-dev, deploy-prod
│   ├── k8s/                   # Kubernetes manifests
│   ├── terraform/             # Infrastructure as Code (opcional)
│   └── scripts/               # Deployment scripts
│
└── docs/                       # Documentación
    ├── api/                   # OpenAPI specs
    ├── architecture/          # ADRs, diagramas
    └── guides/                # Guías de desarrollo
```

**Split Strategy**: Cada directorio principal tiene su propio Makefile y puede extraerse a repo independiente manteniendo la misma estructura interna.

---

## PATRONES Y BEST PRACTICES

### Patrones de Diseño (Gang of Four)

| Patrón | Módulo | Caso de Uso |
|--------|--------|-----------|
| **Repository** | Data Access | Abstracción BD, testabilidad |
| **Factory** | Portfolio Generator | Crear portafolios temáticos |
| **Strategy** | Analysis Engines | Diferentes algoritmos análisis |
| **Decorator** | Ticker Enrichment | Agregar datos a tickers |
| **Observer** | Alerts | Reaccionar a cambios |
| **Chain of Responsibility** | Analysis Pipeline | Procesar indicadores secuencialmente |
| **Adapter** | AI Integration | Adaptar Ollama API a interface interna |
| **Builder** | Profile Creation | Construir perfiles de usuario |
| **Composite** | Dashboard Widgets | Composición de componentes |
| **Facade** | Analysis Service | Interface simplificada para análisis complejo |

### Patrones de Concurrencia (Go)

```go
// 1. Worker Pool para análisis paralelo
type WorkerPool struct {
    workers int
    jobs chan Job
}

// 2. Semaphore para limitar goroutines
sem := semaphore.NewWeighted(int64(maxConcurrency))

// 3. Context cancellation para shutdown graceful
ctx, cancel := context.WithCancel(context.Background())

// 4. Channel buffering para backpressure
jobsChan := make(chan Job, 1000)
```

### Patrones de Resiliencia

```go
// 1. Circuit Breaker (para APIs externas)
type CircuitBreaker struct {
    maxFailures int
    timeout time.Duration
    state State // Open, Closed, Half-Open
}

// 2. Retry con Exponential Backoff
func RetryWithBackoff(maxRetries int, fn func() error) error {
    for i := 0; i < maxRetries; i++ {
        if err := fn(); err == nil {
            return nil
        }
        time.Sleep(time.Duration(math.Pow(2, float64(i))) * time.Second)
    }
}

// 3. Timeouts Explícitos
ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
defer cancel()
```

### Patrones de Caching

```
1. Cache-Aside (Lazy Loading)
   Client → Cache miss → Load from DB → Store in cache

2. Write-Through
   Client → Cache + DB (simultáneo)

3. Cache Invalidation
   Key: ticker:{symbol}:{analysisDate}
   TTL: 24h for daily analysis, 1h for prices

4. Distributed Cache (Redis Cluster)
   Replicación x3, Persistence, Sentinel para failover
```

### Error Handling

```go
// Definir errores específicos
var (
    ErrTickerNotFound = errors.New("ticker not found")
    ErrInsufficientData = errors.New("insufficient data for analysis")
    ErrExternalAPI = errors.New("external API error")
)

// Retry policy por tipo de error
func ShouldRetry(err error) bool {
    if errors.Is(err, ErrExternalAPI) {
        return true // Reintentar APIs externas
    }
    return false
}
```

### SOLID Principles

**S - Single Responsibility**: Un servicio = una responsabilidad
- AnalysisService: solo análisis
- UserService: solo gestión usuarios
- AIService: solo integración IA

**O - Open/Closed**: Abierto extensión, cerrado modificación
- Strategy pattern para nuevos análisis sin modificar código existente

**L - Liskov Substitution**: Subtipos intercambiables
- Interface Analyzer { Analyze(ticker) Score }
- TechnicalAnalyzer, FundamentalAnalyzer intercambiables

**I - Interface Segregation**: Interfaces específicas, no generic
- AnalysisWriter vs GenericWriter
- NewsProvider vs GenericProvider

**D - Dependency Injection**: Inyectar dependencias, no crearlas
```go
type AnalysisService struct {
    ticker TickerRepository    // Inyectada
    news NewsProvider          // Inyectada
    db Database               // Inyectada
}
```

### Code Quality

- **Linting**: golangci-lint (20+ linters)
- **Testing**: >80% coverage (unit + integration)
- **Benchmarking**: medir latency de análisis críticos
- **Documentation**: Godoc comments en funciones públicas
- **CI/CD**: GitHub Actions, test antes de merge

---

## ESPECIFICACIÓN DETALLADA

### Database Schema

```sql
-- Users (1 tabla)
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User Profiles
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id),
    risk_profile VARCHAR(50), -- conservative, moderate, aggressive
    investment_horizon VARCHAR(50), -- short, medium, long
    objective VARCHAR(50), -- growth, income, preservation
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tickers (watchlist + holdings)
CREATE TABLE tickers (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    symbol VARCHAR(20) NOT NULL,
    quantity DECIMAL(18,8),
    entry_price DECIMAL(18,8),
    entry_date DATE,
    is_watchlist BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, symbol)
);

-- Daily Analysis (resultado de análisis)
CREATE TABLE daily_analyses (
    id UUID PRIMARY KEY,
    ticker_id UUID REFERENCES tickers(id),
    analysis_date DATE NOT NULL,
    technical_score SMALLINT, -- 0-100
    fundamental_score SMALLINT, -- 0-100
    news_sentiment SMALLINT, -- -100 to 100
    signal_score SMALLINT, -- 0-100
    recommendation VARCHAR(50), -- BUY, HOLD, SELL
    confidence SMALLINT, -- 0-100
    justification_technical TEXT,
    justification_fundamental TEXT,
    risk_factors TEXT,
    entry_price DECIMAL(18,8),
    target_price DECIMAL(18,8),
    stop_loss DECIMAL(18,8),
    technical_data JSONB, -- Indicadores técnicos
    fundamental_data JSONB, -- Métricas fundamentales
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX(ticker_id, analysis_date)
);

-- News
CREATE TABLE news (
    id UUID PRIMARY KEY,
    ticker_id UUID REFERENCES tickers(id),
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    source VARCHAR(100),
    category VARCHAR(50), -- earnings, management, regulation, etc.
    impact_level VARCHAR(20), -- low, medium, high
    url VARCHAR(1000),
    published_at TIMESTAMP,
    fetched_at TIMESTAMP DEFAULT NOW(),
    INDEX(ticker_id, published_at)
);

-- Chat History
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    ticker_id UUID REFERENCES tickers(id),
    message TEXT NOT NULL,
    role VARCHAR(20), -- user, assistant
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX(user_id, created_at)
);

-- Alerts
CREATE TABLE alerts (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    ticker_id UUID REFERENCES tickers(id),
    alert_type VARCHAR(50), -- recommendation_change, price_target, news
    trigger_condition TEXT,
    is_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP
);

-- Audit Log (compliance)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(100),
    resource VARCHAR(100),
    changes JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX(user_id, created_at)
);
```

### REST API Specification

```
Base URL: /api/v1

-- AUTHENTICATION
POST   /auth/register              # Register user
POST   /auth/login                 # Login, get JWT
POST   /auth/refresh               # Refresh token
POST   /auth/logout                # Logout (blacklist token)

-- USERS
GET    /users/profile              # Get current user profile
PUT    /users/profile              # Update profile
GET    /users/preferences          # Get preferences
PUT    /users/preferences          # Update preferences

-- TICKERS
GET    /tickers                    # List user's tickers
POST   /tickers                    # Add new ticker
GET    /tickers/:id                # Get ticker details
PUT    /tickers/:id                # Update ticker
DELETE /tickers/:id                # Remove ticker
GET    /tickers/:id/watchlist      # Toggle watchlist

-- ANALYSIS
GET    /analysis/:tickerId         # Latest analysis
GET    /analysis/:tickerId/history # Analysis history (paginated)
GET    /analysis/:tickerId/compare # Compare vs. benchmark

-- NEWS
GET    /news/:tickerId             # News for ticker
GET    /news/trending              # Trending news across portfolio

-- PORTFOLIO
GET    /portfolio                  # Portfolio overview
GET    /portfolio/metrics           # Volatility, Sharpe, etc.
POST   /portfolio/rebalance        # Get rebalancing suggestions
GET    /portfolio/templates        # Pre-built portfolio templates

-- AI CHAT
POST   /chat                       # Send message
GET    /chat/history               # Get conversation history
DELETE /chat/history               # Clear history

-- ALERTS
GET    /alerts                     # Get user's alerts
POST   /alerts                     # Create alert
PUT    /alerts/:id                 # Update alert
DELETE /alerts/:id                 # Delete alert

-- HEALTH
GET    /health                     # Liveness probe
GET    /health/ready               # Readiness probe
```

### Rate Limiting

```
Endpoint Category    | Limit           | Window  | Burst
---------------------|-----------------|---------|-------
Authentication       | 5 req           | 1 min   | 10
API General          | 100 req         | 1 min   | 150
AI Chat              | 10 req          | 1 min   | 15
Analysis Trigger     | 5 req           | 5 min   | 5
WebSocket Connect    | 3 connections   | session | 3

Headers de respuesta:
- X-RateLimit-Limit: 100
- X-RateLimit-Remaining: 95
- X-RateLimit-Reset: 1612137600
```

### Error Codes (Catálogo)

```
Code     | HTTP | Descripción                    | Acción Sugerida
---------|------|--------------------------------|------------------
PA001    | 400  | Invalid ticker symbol          | Verificar símbolo
PA002    | 400  | Missing required field         | Revisar payload
PA003    | 401  | Token expired                  | Refresh token
PA004    | 401  | Invalid credentials            | Re-login
PA005    | 403  | Rate limit exceeded            | Esperar X segundos
PA006    | 404  | Ticker not found               | Agregar a watchlist
PA007    | 404  | Analysis not available         | Esperar próximo análisis
PA008    | 500  | External API failure           | Retry automático
PA009    | 500  | AI Agent timeout               | Retry con fallback
PA010    | 503  | Service temporarily unavailable| Retry con backoff

Response format:
{
  "error": {
    "code": "PA008",
    "message": "Yahoo Finance API temporarily unavailable",
    "retry_after": 30,
    "fallback_used": true
  }
}
```

### WebSocket Events

```
Endpoint: ws://localhost:8080/ws

-- CLIENT → SERVER
{ "type": "subscribe", "tickers": ["AAPL", "MSFT", "BTC"] }
{ "type": "unsubscribe", "tickers": ["MSFT"] }
{ "type": "ping" }

-- SERVER → CLIENT
{ "type": "price_update", "ticker": "AAPL", "price": 185.50, "change": 1.2 }
{ "type": "recommendation_change", "ticker": "AAPL", "old": "HOLD", "new": "BUY", "score": 75 }
{ "type": "alert_triggered", "alert_id": "uuid", "message": "AAPL reached target price" }
{ "type": "news_alert", "ticker": "AAPL", "headline": "...", "impact": "high" }
{ "type": "analysis_complete", "ticker": "AAPL", "timestamp": "..." }
{ "type": "agent_response", "message": "...", "streaming": true }
{ "type": "pong" }
{ "type": "error", "code": "PA005", "message": "..." }

Heartbeat: ping/pong cada 30 segundos
Reconnect: Exponential backoff (1s, 2s, 4s, 8s, max 60s)
```

### Data Provider Fallback Chain

```
Stocks/ETFs:
  Primary:   Yahoo Finance (go-finance)
  Fallback:  Alpha Vantage (free tier: 5 req/min)
  Cache:     Redis (TTL 15 min para precios, 24h para fundamentals)

Crypto:
  Primary:   CoinGecko API (gratis, sin key)
  Fallback:  CoinCap API (gratis, sin key)
  Cache:     Redis (TTL 5 min)

News:
  Sources:   RSS Feeds (Yahoo, Reuters, Google News)
  Fallback:  Cache de últimas 24h
  Refresh:   Cada 15 minutos
```

### Job Scheduler (Background Tasks)

```
cronId | Schedule | Task | Timeout
-------|----------|------|--------
1      | 17:00 ET * * 1-5 | Daily Analysis (all tickers) | 30min
2      | 06:00 UTC daily  | Price Sync from APIs | 10min
3      | 09:00 UTC daily  | Generate Alerts | 5min
4      | Every 1h | Cache Refresh (trending) | 2min
5      | Every 24h | Clean old sessions | 5min
6      | Every 7d | Audit log archival | 10min
```

---

## FLUJOS DE USUARIO

### Flujo 1: Onboarding (5-10 minutos)
```
1. Registro (email + password)
   └─ Send verification email
2. Completar perfil inversor (5 preguntas)
   └─ Store profile en DB
3. Agregar 3-5 tickers iniciales
   └─ Trigger análisis inicial en background
4. Dashboard inicial con recomendaciones
   └─ Show tour/tooltips
```

### Flujo 2: Monitoreo Diario (5-15 minutos)
```
1. Abrir app → Dashboard carga análisis pre-ejecutados
2. Revisar cambios de recomendación (visuales destacados)
3. Click en notificación de alerta → Navegar a análisis
4. Consultar IA: "¿Por qué cambió AAPL a VENTA?"
5. IA responde en 2-5 segundos con contexto
6. Tomar decisión: comprar, vender, esperar
```

### Flujo 3: Rebalanceo (10-20 minutos)
```
1. Click "Rebalance Portfolio" → Modal sugiere ajustes
2. Ver cambios propuestos + impacto en Sharpe/Volatilidad
3. Revisar antes/después allocation
4. Aceptar → Sistema genera lista de órdenes
5. Copiar órdenes a broker
```

### Flujo 4: Deep Dive (15-30 minutos)
```
1. Click en ticker → Detailed view se abre
2. Revisar gráfico técnico (múltiples timeframes)
3. Leer análisis técnico + fundamental resumido
4. Preguntar IA: "¿Cuál es el próximo soporte?"
5. IA proporciona análisis detallado
6. Explorar comparativa vs. peers
7. Tomar decisión informada
```

---

## DEPLOYMENT & DEVOPS

### Local Development (Docker Compose)

```yaml
version: '3.9'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: pulsealpha
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    # Descomentar para GPU: deploy: { resources: { reservations: { devices: [{ driver: nvidia, count: 1, capabilities: [gpu] }] } } }

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgres://postgres:dev_password@postgres:5432/pulsealpha
      REDIS_URL: redis://redis:6379
      OLLAMA_URL: http://ollama:11434
      OLLAMA_MODEL: mistral:7b
    ports:
      - "8080:8080"
    depends_on:
      - postgres
      - redis
      - ollama

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
  ollama_data:
```

### Production Deployment (Kubernetes)

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pulsealpha-backend
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
      - name: backend
        image: pulsealpha:latest
        resources:
          requests:
            cpu: 250m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

### CI/CD Pipeline (GitHub Actions)

```yaml
name: Test & Deploy
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-go@v4
        with:
          go-version: '1.21'
      - run: go test ./... -v -cover
      - run: golangci-lint run

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: docker build -t pulsealpha:${{ github.sha }} .
      - run: docker push pulsealpha:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - run: kubectl set image deployment/pulsealpha-backend backend=pulsealpha:${{ github.sha }}
```

### Monitoring & Alerting

```
Prometheus Alerts:
├─ HighErrorRate: error_rate > 1% → Slack
├─ HighLatency: p99_latency > 1000ms → Slack
├─ DBConnectionPoolExhausted: pool_usage > 90% → PagerDuty
├─ DiskSpace: available < 10% → Slack
└─ AnalysisJobFailed: daily_analysis job > 1h → PagerDuty

Grafana Dashboards:
├─ System: CPU, Memory, Disk
├─ Application: Request rate, latency, error rate
├─ Database: Connections, query latency, replication lag
└─ Business: Analysis completion rate, alert delivery rate
```

---

## CHECKLIST DE CALIDAD

✅ **Funcionalidad**:
- [x] Análisis técnico completo (9+ indicadores)
- [x] Análisis fundamental automático
- [x] Recomendaciones BUY/SELL/HOLD con score
- [x] IA conversacional contextual
- [x] Alertas inteligentes
- [x] Dashboard moderno
- [x] Gestión portfolio

✅ **Performance**:
- [x] <2s initial page load
- [x] <500ms API responses
- [x] <30s análisis de 1000 tickers
- [x] Caching en 3 capas
- [x] Async processing
- [x] CDN para assets

✅ **Escalabilidad**:
- [x] Horizontal scaling (stateless)
- [x] Load balancing
- [x] Database connection pooling
- [x] Redis clustering
- [x] Message queue for async jobs
- [x] Microservices architecture

✅ **Resiliencia**:
- [x] Circuit breaker
- [x] Retry logic
- [x] Timeouts explícitos
- [x] Graceful degradation
- [x] Health checks
- [x] Automated failover

✅ **Availability**:
- [x] Multi-region deployment
- [x] Database replication
- [x] Load balancing
- [x] SLA 99.9%
- [x] Disaster recovery plan

✅ **Seguridad**:
- [x] JWT authentication
- [x] Password hashing (bcrypt)
- [x] HTTPS/TLS
- [x] Input validation
- [x] SQL injection prevention (prepared statements)
- [x] Rate limiting
- [x] Audit logging

✅ **Observabilidad**:
- [x] Structured logging (ELK)
- [x] Metrics (Prometheus/Grafana)
- [x] Distributed tracing (Jaeger)
- [x] Error tracking (Sentry)
- [x] Alerting

✅ **Code Quality**:
- [x] >80% test coverage
- [x] Linting (golangci-lint)
- [x] SOLID principles
- [x] Design patterns aplicados
- [x] Documentation (Godoc)
- [x] Semantic versioning

---

## DECISIONES ARQUITECTÓNICAS (ADRs)

### ADR-1: Golang Backend
**Decisión**: Use Go para backend en lugar de Python/Node.js
**Razón**: Performance crítica (1000 tickers en 15-30s vs. minutos), concurrencia nativa, deployable como binario único
**Trade-off**: Curva de aprendizaje, pero excelente para fintech

### ADR-2: Microservicios
**Decisión**: Dividir en servicios independientes (Analysis, News, AI, Portfolio, etc.)
**Razón**: Escalabilidad independiente, resiliencia, deployment granular
**Trade-off**: Complejidad en orquestación, debe usar service mesh

### ADR-3: PostgreSQL + Redis
**Decisión**: PostgreSQL para datos persistentes, Redis para caching y sessions
**Razón**: PostgreSQL es robusto (ACID, replicación), Redis es ultra-rápido
**Trade-off**: Operational overhead (2 bases de datos vs. 1)

### ADR-4: Message Queue (RabbitMQ/Kafka)
**Decisión**: Encolar análisis pesados en background, no en request path
**Razón**: Mantiene API rápida, evita timeouts, permite retry
**Trade-off**: Complejidad en debugging, eventual consistency

### ADR-5: Ollama Local (mistral:7b)
**Decisión**: Usar Ollama con mistral:7b en lugar de APIs pagas (Claude, OpenAI)
**Razón**: 100% local, sin costos de API, privacidad total, desarrollo rápido
**Trade-off**: Menor capacidad que modelos grandes, requiere GPU para mejor performance
**Upgrade Path**: Migrar a llama3:70b o Claude cuando se requiera más potencia

---

## ROADMAP FUTURO (V2+)

**Phase 1 (MVP)**: Core features + análisis automático + IA chat ✅ (Este documento)

**Phase 2 (3-6 meses)**:
- [ ] Backtesting de estrategias
- [ ] Integración directa con brokers (ejecutar órdenes)
- [ ] Mobile app (iOS/Android nativa)
- [ ] Community features (compartir análisis, seguir traders)

**Phase 3 (6-12 meses)**:
- [ ] Machine Learning models (predicción de precios)
- [ ] Voice commands ("Hey PulseAlpha, ¿qué dicen del Bitcoin?")
- [ ] Integraciones con webhooks (IFTTT, Zapier)
- [ ] API publica para third-parties

**Phase 4 (12+ meses)**:
- [ ] Multi-language support (10+ idiomas)
- [ ] Enterprise edition (para advisors)
- [ ] Compliance/reporting automation
- [ ] IPO/acquisition readiness

---

## CONSIDERACIONES FINALES

### ¿Por qué PulseAlpha es diferente?

| Aspecto | Bloomberg | Robinhood | **PulseAlpha** |
|---------|-----------|-----------|----------------|
| Precio | $20k/año | $0 (pero limitado) | $0-50/mes |
| Análisis | Institucional | Básico | **Institucional** |
| IA Asesor | ❌ | ❌ | **✅ 24/7** |
| UX | Compleja | Simple | **Simple + Potente** |
| Escalabilidad | Enterprise | N/A | **Retail + Enterprise** |

### Métricas de Éxito

**Usuario**:
- DAU > 10k (1 año)
- Retención 30-día > 50%
- NPS > 50

**Técnico**:
- SLA 99.9% (máx 43min downtime/mes)
- p99 latency < 1s
- Error rate < 0.1%

**Negocio**:
- ARR > $1M (año 2)
- CAC < $50
- LTV > $500

---

## CONCLUSIÓN

PulseAlpha es una aplicación **production-grade, enterprise-ready, fintech-focused** que democratiza el acceso a análisis institucionales. La arquitectura está diseñada para **escalar horizontalmente, mantenerse resiliente ante fallos, entregar baja latencia, y garantizar alta disponibilidad**.

Este documento proporciona la **roadmap técnica completa**: desde arquitetura hasta deployment, desde patrones de diseño hasta observabilidad. Todo lo necesario para llevar PulseAlpha a producción.

**Stack Final**: React + Go + PostgreSQL + Redis + Kubernetes = **La plataforma de inversiones del futuro** 🚀

---

**Desarrollado iterativamente | Stack: Go + React + Ollama + PostgreSQL**
**Fecha**: 2026-02-02 | **Versión**: 0.1.0 | **Status**: 🟡 VERSIÓN PRELIMINAR

