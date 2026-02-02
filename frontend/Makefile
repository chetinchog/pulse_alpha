# ============================================
# PULSEALPHA FRONTEND - MAKEFILE
# ============================================
# Comandos para el frontend React/TypeScript
# ============================================

.PHONY: help setup dev build test lint clean

# Variables
NPM = npm
NODE_ENV ?= development

# ============================================
# HELP
# ============================================
help:
	@echo "Frontend Makefile - Comandos disponibles:"
	@echo "  make setup      - Instalar dependencias"
	@echo "  make dev        - Ejecutar en modo desarrollo"
	@echo "  make build      - Compilar para producción"
	@echo "  make test       - Ejecutar tests"
	@echo "  make lint       - Ejecutar linters"
	@echo "  make lint-fix   - Fix automático de linting"
	@echo "  make fmt        - Formatear código"
	@echo "  make clean      - Limpiar artefactos"

# ============================================
# SETUP
# ============================================
setup:
	@echo "📦 Instalando dependencias..."
	$(NPM) install
	@echo "✅ Dependencias instaladas"

deps:
	$(NPM) update
	$(NPM) audit fix

# ============================================
# DESARROLLO
# ============================================
dev:
	@echo "🚀 Iniciando servidor de desarrollo..."
	$(NPM) run dev

# ============================================
# BUILD
# ============================================
build:
	@echo "🔨 Compilando para producción..."
	NODE_ENV=production $(NPM) run build
	@echo "✅ Build generado en dist/"

build-analyze:
	@echo "📊 Analizando bundle..."
	$(NPM) run build -- --analyze

# ============================================
# TESTING
# ============================================
test:
	@echo "🧪 Ejecutando tests..."
	$(NPM) run test

test-watch:
	$(NPM) run test -- --watch

test-coverage:
	@echo "🧪 Ejecutando tests con coverage..."
	$(NPM) run test -- --coverage
	@echo "📊 Coverage report generado"

# ============================================
# LINTING
# ============================================
lint:
	@echo "🔍 Ejecutando linters..."
	$(NPM) run lint

lint-fix:
	@echo "🔧 Corrigiendo problemas de linting..."
	$(NPM) run lint -- --fix

fmt:
	@echo "✨ Formateando código..."
	$(NPM) run format

typecheck:
	@echo "🔍 Verificando tipos TypeScript..."
	$(NPM) run typecheck

# ============================================
# CLEAN
# ============================================
clean:
	@echo "🧹 Limpiando artefactos..."
	rm -rf dist/
	rm -rf node_modules/.cache
	rm -rf coverage/
	@echo "✅ Limpieza completa"

clean-all: clean
	rm -rf node_modules/
	@echo "✅ Limpieza total (incluyendo node_modules)"

# ============================================
# DOCKER
# ============================================
docker-build:
	docker build -t pulsealpha-frontend:latest .

docker-run:
	docker run -p 3000:3000 pulsealpha-frontend:latest
