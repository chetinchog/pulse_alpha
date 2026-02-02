# ============================================
# PULSEALPHA BACKEND - MAKEFILE
# ============================================
# Comandos para el servicio backend en Go
# ============================================

.PHONY: help setup dev build test lint clean

# Variables
BINARY_NAME = pulsealpha-api
GO = go
GOFLAGS = -v
COVERAGE_FILE = coverage.out

# ============================================
# HELP
# ============================================
help:
	@echo "Backend Makefile - Comandos disponibles:"
	@echo "  make setup        - Instalar dependencias"
	@echo "  make dev          - Ejecutar en modo desarrollo (hot reload)"
	@echo "  make build        - Compilar binario"
	@echo "  make test         - Ejecutar tests"
	@echo "  make test-coverage- Tests con coverage"
	@echo "  make lint         - Ejecutar linters"
	@echo "  make lint-fix     - Fix automático de linting"
	@echo "  make fmt          - Formatear código"
	@echo "  make clean        - Limpiar artefactos"
	@echo "  make db-migrate   - Ejecutar migraciones"
	@echo "  make db-rollback  - Rollback migración"
	@echo "  make docs         - Generar documentación API"

# ============================================
# SETUP
# ============================================
setup:
	@echo "📦 Instalando dependencias Go..."
	$(GO) mod download
	$(GO) install github.com/air-verse/air@latest
	$(GO) install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	$(GO) install github.com/swaggo/swag/cmd/swag@latest
	@echo "✅ Dependencias instaladas"

deps:
	$(GO) mod tidy
	$(GO) mod verify

# ============================================
# DESARROLLO
# ============================================
dev:
	@echo "🚀 Iniciando servidor en modo desarrollo..."
	air -c .air.toml

run:
	$(GO) run $(GOFLAGS) ./cmd/api/main.go

# ============================================
# BUILD
# ============================================
build:
	@echo "🔨 Compilando $(BINARY_NAME)..."
	CGO_ENABLED=0 $(GO) build $(GOFLAGS) -o bin/$(BINARY_NAME) ./cmd/api/main.go
	@echo "✅ Binario generado: bin/$(BINARY_NAME)"

build-all:
	@echo "🔨 Compilando todos los servicios..."
	CGO_ENABLED=0 $(GO) build $(GOFLAGS) -o bin/api ./cmd/api/main.go
	CGO_ENABLED=0 $(GO) build $(GOFLAGS) -o bin/analysis ./cmd/analysis/main.go
	CGO_ENABLED=0 $(GO) build $(GOFLAGS) -o bin/news ./cmd/news/main.go
	CGO_ENABLED=0 $(GO) build $(GOFLAGS) -o bin/agents ./cmd/agents/main.go
	@echo "✅ Todos los binarios generados"

# ============================================
# TESTING
# ============================================
test:
	@echo "🧪 Ejecutando tests..."
	$(GO) test $(GOFLAGS) ./...

test-coverage:
	@echo "🧪 Ejecutando tests con coverage..."
	$(GO) test -coverprofile=$(COVERAGE_FILE) -covermode=atomic ./...
	$(GO) tool cover -html=$(COVERAGE_FILE) -o coverage.html
	@echo "📊 Coverage report: coverage.html"

test-race:
	@echo "🧪 Ejecutando tests con race detector..."
	$(GO) test -race ./...

# ============================================
# LINTING
# ============================================
lint:
	@echo "🔍 Ejecutando linters..."
	golangci-lint run ./...

lint-fix:
	@echo "🔧 Corrigiendo problemas de linting..."
	golangci-lint run --fix ./...

fmt:
	@echo "✨ Formateando código..."
	$(GO) fmt ./...
	goimports -w .

vet:
	$(GO) vet ./...

# ============================================
# DATABASE
# ============================================
db-migrate:
	@echo "📦 Ejecutando migraciones..."
	migrate -path ./migrations -database "$${DATABASE_URL}" up

db-rollback:
	@echo "⏪ Rollback última migración..."
	migrate -path ./migrations -database "$${DATABASE_URL}" down 1

db-seed:
	@echo "🌱 Cargando datos de prueba..."
	$(GO) run ./cmd/seed/main.go

db-create-migration:
	@read -p "Nombre de migración: " name; \
	migrate create -ext sql -dir ./migrations -seq $$name

# ============================================
# DOCUMENTACIÓN
# ============================================
docs:
	@echo "📚 Generando documentación Swagger..."
	swag init -g cmd/api/main.go -o docs/swagger
	@echo "✅ Documentación generada en docs/swagger"

# ============================================
# CLEAN
# ============================================
clean:
	@echo "🧹 Limpiando artefactos..."
	rm -rf bin/
	rm -f $(COVERAGE_FILE) coverage.html
	$(GO) clean -cache
	@echo "✅ Limpieza completa"

# ============================================
# DOCKER
# ============================================
docker-build:
	docker build -t pulsealpha-backend:latest .

docker-run:
	docker run -p 8080:8080 pulsealpha-backend:latest
