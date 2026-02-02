# ============================================
# PULSEALPHA - MAKEFILE RAÍZ
# ============================================
# Orquesta todos los sub-proyectos del monorepo
# Ejecutar: make help para ver comandos disponibles
# ============================================

.PHONY: help setup dev build test lint clean docker-up docker-down all

# Variables
DOCKER_COMPOSE = docker compose
BACKEND_DIR = backend
FRONTEND_DIR = frontend
INFRA_DIR = infra

# ============================================
# HELP
# ============================================
help:
	@echo "╔══════════════════════════════════════════════════════════════╗"
	@echo "║              PULSEALPHA - Comandos Disponibles               ║"
	@echo "╠══════════════════════════════════════════════════════════════╣"
	@echo "║ DESARROLLO                                                   ║"
	@echo "║   make setup          - Instalar dependencias (todos)        ║"
	@echo "║   make dev            - Iniciar desarrollo (docker + watch)  ║"
	@echo "║   make dev-backend    - Solo backend en modo desarrollo      ║"
	@echo "║   make dev-frontend   - Solo frontend en modo desarrollo     ║"
	@echo "║                                                              ║"
	@echo "║ BUILD                                                        ║"
	@echo "║   make build          - Compilar todo                        ║"
	@echo "║   make build-backend  - Compilar solo backend                ║"
	@echo "║   make build-frontend - Compilar solo frontend               ║"
	@echo "║                                                              ║"
	@echo "║ TESTING                                                      ║"
	@echo "║   make test           - Ejecutar todos los tests             ║"
	@echo "║   make test-backend   - Tests backend                        ║"
	@echo "║   make test-frontend  - Tests frontend                       ║"
	@echo "║   make test-coverage  - Tests con coverage report            ║"
	@echo "║                                                              ║"
	@echo "║ CALIDAD                                                      ║"
	@echo "║   make lint           - Linting (todos)                      ║"
	@echo "║   make lint-fix       - Fix automático de linting            ║"
	@echo "║   make fmt            - Formatear código                     ║"
	@echo "║                                                              ║"
	@echo "║ DOCKER                                                       ║"
	@echo "║   make docker-up      - Levantar servicios (dev)             ║"
	@echo "║   make docker-down    - Bajar servicios                      ║"
	@echo "║   make docker-logs    - Ver logs de servicios                ║"
	@echo "║   make docker-clean   - Limpiar volúmenes y containers       ║"
	@echo "║                                                              ║"
	@echo "║ OLLAMA                                                       ║"
	@echo "║   make ollama-setup   - Descargar modelo mistral:7b          ║"
	@echo "║   make ollama-test    - Probar conexión con Ollama           ║"
	@echo "║                                                              ║"
	@echo "║ DATABASE                                                     ║"
	@echo "║   make db-migrate     - Ejecutar migraciones                 ║"
	@echo "║   make db-rollback    - Rollback última migración            ║"
	@echo "║   make db-seed        - Cargar datos de prueba               ║"
	@echo "║                                                              ║"
	@echo "║ DEPLOY                                                       ║"
	@echo "║   make deploy-dev     - Deploy a ambiente de desarrollo      ║"
	@echo "║   make deploy-prod    - Deploy a producción                  ║"
	@echo "║                                                              ║"
	@echo "║ UTILIDADES                                                   ║"
	@echo "║   make clean          - Limpiar artefactos de build          ║"
	@echo "║   make deps           - Actualizar dependencias              ║"
	@echo "║   make docs           - Generar documentación                ║"
	@echo "╚══════════════════════════════════════════════════════════════╝"

# ============================================
# SETUP
# ============================================
setup: setup-backend setup-frontend ollama-setup
	@echo "✅ Setup completo"

setup-backend:
	@echo "📦 Instalando dependencias backend..."
	@$(MAKE) -C $(BACKEND_DIR) setup

setup-frontend:
	@echo "📦 Instalando dependencias frontend..."
	@$(MAKE) -C $(FRONTEND_DIR) setup

# ============================================
# DESARROLLO
# ============================================
dev: docker-up
	@echo "🚀 Ambiente de desarrollo listo"
	@echo "   Backend:  http://localhost:8080"
	@echo "   Frontend: http://localhost:3000"
	@echo "   Ollama:   http://localhost:11434"

dev-backend:
	@$(MAKE) -C $(BACKEND_DIR) dev

dev-frontend:
	@$(MAKE) -C $(FRONTEND_DIR) dev

# ============================================
# BUILD
# ============================================
build: build-backend build-frontend
	@echo "✅ Build completo"

build-backend:
	@$(MAKE) -C $(BACKEND_DIR) build

build-frontend:
	@$(MAKE) -C $(FRONTEND_DIR) build

# ============================================
# TESTING
# ============================================
test: test-backend test-frontend
	@echo "✅ Todos los tests pasaron"

test-backend:
	@$(MAKE) -C $(BACKEND_DIR) test

test-frontend:
	@$(MAKE) -C $(FRONTEND_DIR) test

test-coverage:
	@$(MAKE) -C $(BACKEND_DIR) test-coverage
	@$(MAKE) -C $(FRONTEND_DIR) test-coverage

# ============================================
# LINTING
# ============================================
lint: lint-backend lint-frontend
	@echo "✅ Linting completo"

lint-backend:
	@$(MAKE) -C $(BACKEND_DIR) lint

lint-frontend:
	@$(MAKE) -C $(FRONTEND_DIR) lint

lint-fix:
	@$(MAKE) -C $(BACKEND_DIR) lint-fix
	@$(MAKE) -C $(FRONTEND_DIR) lint-fix

fmt:
	@$(MAKE) -C $(BACKEND_DIR) fmt
	@$(MAKE) -C $(FRONTEND_DIR) fmt

# ============================================
# DOCKER
# ============================================
docker-up:
	@echo "🐳 Levantando servicios Docker..."
	@$(DOCKER_COMPOSE) up -d
	@echo "⏳ Esperando que los servicios estén listos..."
	@sleep 5
	@$(DOCKER_COMPOSE) ps

docker-down:
	@echo "🛑 Bajando servicios Docker..."
	@$(DOCKER_COMPOSE) down

docker-logs:
	@$(DOCKER_COMPOSE) logs -f

docker-clean:
	@echo "🧹 Limpiando Docker..."
	@$(DOCKER_COMPOSE) down -v --remove-orphans
	@docker system prune -f

# ============================================
# OLLAMA
# ============================================
ollama-setup:
	@echo "🤖 Configurando Ollama..."
	@docker compose up -d ollama
	@echo "⏳ Esperando que Ollama esté listo..."
	@sleep 10
	@docker compose exec ollama ollama pull mistral:7b
	@echo "✅ Modelo mistral:7b descargado"

ollama-test:
	@echo "🧪 Probando conexión con Ollama..."
	@curl -s http://localhost:11434/api/generate -d '{"model":"mistral:7b","prompt":"Hello","stream":false}' | head -c 200
	@echo ""

# ============================================
# DATABASE
# ============================================
db-migrate:
	@$(MAKE) -C $(BACKEND_DIR) db-migrate

db-rollback:
	@$(MAKE) -C $(BACKEND_DIR) db-rollback

db-seed:
	@$(MAKE) -C $(BACKEND_DIR) db-seed

# ============================================
# DEPLOY
# ============================================
deploy-dev:
	@$(MAKE) -C $(INFRA_DIR) deploy-dev

deploy-prod:
	@$(MAKE) -C $(INFRA_DIR) deploy-prod

# ============================================
# UTILIDADES
# ============================================
clean:
	@echo "🧹 Limpiando artefactos..."
	@$(MAKE) -C $(BACKEND_DIR) clean
	@$(MAKE) -C $(FRONTEND_DIR) clean
	@echo "✅ Limpieza completa"

deps:
	@$(MAKE) -C $(BACKEND_DIR) deps
	@$(MAKE) -C $(FRONTEND_DIR) deps

docs:
	@echo "📚 Generando documentación..."
	@$(MAKE) -C $(BACKEND_DIR) docs

# ============================================
# ALL-IN-ONE
# ============================================
all: setup build test lint
	@echo "🎉 Todo listo!"
