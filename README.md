# 🚀 PulseAlpha

[![Status](https://img.shields.io/badge/status-preliminary-yellow)](./SPEC_TECNICA.md)
[![Version](https://img.shields.io/badge/version-0.1.0-blue)](./SPEC_TECNICA.md)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

**Plataforma de gestión de inversiones e inteligencia financiera de nivel institucional.**

> Análisis automático + Agentes IA + UX moderna = Inversión inteligente sin costos de API

---

## ✨ Características

- 📊 **Análisis Automático**: Técnico + fundamental ejecutado cada noche
- 🤖 **Agentes IA Locales**: Sistema multi-agente con Ollama (mistral:7b)
- 📈 **Señales Accionables**: BUY/SELL/HOLD con score y justificación
- 🔔 **Alertas Inteligentes**: Cambios de recomendación, noticias críticas
- 💼 **Gestión de Portfolio**: Rebalanceo, análisis de riesgo, diversificación
- 🌙 **100% Local**: Sin API keys pagas, todo ejecutable en tu máquina

---

## 🛠️ Tech Stack

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 18 + TypeScript + Tailwind CSS |
| **Backend** | Go 1.21+ (Gin Framework) |
| **Database** | PostgreSQL 15 + Redis 7 |
| **IA** | Ollama (mistral:7b) + ReAct Agents |
| **Data** | Yahoo Finance + CoinGecko + RSS Feeds |
| **Infra** | Docker + Kubernetes |

---

## 🚀 Quick Start

### Prerrequisitos

- Docker & Docker Compose
- Go 1.21+
- Node.js 18+
- Make

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/chetinchog/pulse_alpha.git
cd pulse_alpha

# Setup inicial (instala deps + descarga modelo Ollama)
make setup

# Levantar servicios
make dev
```

### URLs de Desarrollo

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Ollama**: http://localhost:11434

---

## 📁 Estructura del Proyecto

```
pulsealpha/
├── backend/          # Servicios Go (API, Analysis, Agents)
├── frontend/         # React + TypeScript
├── infra/            # Kubernetes, scripts de deploy
├── docs/             # Documentación
├── Makefile          # Comandos principales
└── docker-compose.yml
```

Ver [SPEC_TECNICA.md](./SPEC_TECNICA.md) para documentación completa.

---

## 📋 Comandos Disponibles

```bash
make help           # Ver todos los comandos
make dev            # Desarrollo (docker + hot reload)
make build          # Compilar todo
make test           # Ejecutar tests
make lint           # Linting
make docker-up      # Levantar servicios Docker
make ollama-setup   # Descargar modelo IA
```

---

## 📚 Documentación

- [📘 Especificación Técnica](./SPEC_TECNICA.md) - Arquitectura completa
- [� Transferencia (Handoff)](./HANDOFF.md) - Estado actual y próximos pasos

---

## 🤝 Contribuir

1. Fork del proyecto
2. Crear branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'feat: descripción'`)
4. Push al branch (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

---

## 📄 Licencia

MIT License - ver [LICENSE](./LICENSE) para detalles.

---

**Desarrollado con ❤️ para inversores que merecen herramientas institucionales.**
