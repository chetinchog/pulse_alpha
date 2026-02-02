# ============================================
# PULSEALPHA INFRA - MAKEFILE
# ============================================
# Comandos para infraestructura y deployment
# ============================================

.PHONY: help deploy-dev deploy-prod k8s-apply k8s-delete

# Variables
KUBECTL = kubectl
NAMESPACE_DEV = pulsealpha-dev
NAMESPACE_PROD = pulsealpha-prod

# ============================================
# HELP
# ============================================
help:
	@echo "Infra Makefile - Comandos disponibles:"
	@echo "  make deploy-dev   - Deploy a desarrollo"
	@echo "  make deploy-prod  - Deploy a producción"
	@echo "  make k8s-apply    - Aplicar manifests K8s"
	@echo "  make k8s-delete   - Eliminar recursos K8s"
	@echo "  make k8s-status   - Ver estado del cluster"

# ============================================
# KUBERNETES
# ============================================
k8s-apply-dev:
	@echo "📦 Aplicando manifests a desarrollo..."
	$(KUBECTL) apply -f k8s/dev/ -n $(NAMESPACE_DEV)

k8s-apply-prod:
	@echo "📦 Aplicando manifests a producción..."
	$(KUBECTL) apply -f k8s/prod/ -n $(NAMESPACE_PROD)

k8s-delete-dev:
	@echo "🗑️ Eliminando recursos de desarrollo..."
	$(KUBECTL) delete -f k8s/dev/ -n $(NAMESPACE_DEV)

k8s-status:
	@echo "📊 Estado del cluster:"
	$(KUBECTL) get pods,svc,deployments -n $(NAMESPACE_DEV)

# ============================================
# DEPLOY
# ============================================
deploy-dev: k8s-apply-dev
	@echo "✅ Deploy a desarrollo completado"

deploy-prod:
	@echo "⚠️  Deploying a PRODUCCIÓN..."
	@read -p "¿Estás seguro? (y/N): " confirm && [ "$$confirm" = "y" ]
	$(KUBECTL) apply -f k8s/prod/ -n $(NAMESPACE_PROD)
	@echo "✅ Deploy a producción completado"

# ============================================
# SCRIPTS
# ============================================
backup-db:
	@echo "💾 Backup de base de datos..."
	./scripts/backup-db.sh

restore-db:
	@echo "📥 Restaurando base de datos..."
	./scripts/restore-db.sh
