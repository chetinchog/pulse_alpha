package main

import (
	"context"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"

	"github.com/chetinchog/pulse_alpha/backend/internal/pkg/config"
	"github.com/chetinchog/pulse_alpha/backend/internal/plugins/llm/ollama"
	"github.com/chetinchog/pulse_alpha/backend/internal/registry"
)

func main() {
	// 1. Logger
	logger, _ := zap.NewProduction()
	defer logger.Sync()
	sugar := logger.Sugar()

	// 2. Config
	cfg, err := config.Load()
	if err != nil {
		sugar.Fatalf("Failed to load config: %v", err)
	}

	// 3. Plugin Registry Init
	reg := registry.GetInstance()

	// Register Ollama if enabled
	if cfg.Ollama.Enabled {
		sugar.Infof("Registering Ollama provider (URL: %s, Model: %s)", cfg.Ollama.URL, cfg.Ollama.Model)
		p := ollama.NewProvider(cfg.Ollama.URL, cfg.Ollama.Model)

		reg.RegisterLLM("ollama", p)
		reg.SetDefaults("ollama", "", "", "") // Set as default LLM
	}

	// 4. Gin Server
	if cfg.Server.Mode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}
	r := gin.Default()

	// Health Check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "version": "0.1.0"})
	})

	// Test LLM Endpoint (para verificar el plugin)
	r.POST("/api/test-llm", func(c *gin.Context) {
		var req struct {
			Prompt string `json:"prompt"`
		}
		if err := c.BindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
			return
		}

		llm, err := reg.GetLLM("ollama")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "llm provider not found"})
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
		defer cancel()

		resp, err := llm.Generate(ctx, req.Prompt)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"response": resp})
	})

	// 5. Start
	serverAddr := ":" + cfg.Server.Port
	sugar.Infof("Starting server on %s", serverAddr)
	if err := r.Run(serverAddr); err != nil {
		sugar.Fatalf("Server failed: %v", err)
	}
}
