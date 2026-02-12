package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/mgonzalez/pulse_alpha/market-data-service/internal/adapters/providers"
	"github.com/mgonzalez/pulse_alpha/market-data-service/internal/adapters/repository"
	"github.com/mgonzalez/pulse_alpha/market-data-service/internal/handlers"
	"github.com/mgonzalez/pulse_alpha/market-data-service/internal/service"
)

func main() {
	// Initialize dependencies
	cache := repository.NewMemoryCache()
	provider := providers.NewStubProvider()
	priceService := service.NewPriceService(cache, provider)
	handler := handlers.NewHTTPHandler(priceService)

	// Setup router
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Routes
	r.Get("/health", handler.HealthCheck)
	r.Get("/prices/{ticker}", handler.GetPrice)
	r.Post("/prices/batch", handler.GetPricesBatch)

	// Start server
	port := "8081"
	fmt.Printf("Market Data Service starting on port %s...\n", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}
