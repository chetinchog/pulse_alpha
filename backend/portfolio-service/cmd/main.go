package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/mgonzalez/pulse_alpha/portfolio-service/internal/adapters/marketdata"
	"github.com/mgonzalez/pulse_alpha/portfolio-service/internal/adapters/repository"
	"github.com/mgonzalez/pulse_alpha/portfolio-service/internal/handlers"
	"github.com/mgonzalez/pulse_alpha/portfolio-service/internal/service"
)

func main() {
	// Initialize repositories
	transactionRepo := repository.NewMemoryTransactionRepository()
	realizedPLRepo := repository.NewMemoryRealizedPLRepository()
	snapshotRepo := repository.NewMemorySnapshotRepository()

	// Initialize market data client
	marketDataClient := marketdata.NewHTTPClient("http://localhost:8081")

	// Initialize service with new repositories
	portfolioService := service.NewPortfolioService(
		transactionRepo,
		realizedPLRepo,
		snapshotRepo,
		marketDataClient,
	)

	// Initialize HTTP handler
	handler := handlers.NewHTTPHandler(portfolioService)

	// Create router and add middleware FIRST
	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Mount all routes
	r.Mount("/", handlers.SetupRoutes(handler))

	// Start server
	port := "8080"
	fmt.Printf("Portfolio Service starting on port %s...\n", port)
	fmt.Println("New endpoints:")
	fmt.Println("  POST   /transactions/buy")
	fmt.Println("  POST   /transactions/sell")
	fmt.Println("  GET    /transactions")
	fmt.Println("  GET    /realized-pl")
	fmt.Println("  GET    /realized-pl/summary")
	fmt.Println("Existing endpoints (updated):")
	fmt.Println("  GET    /positions")
	fmt.Println("  GET    /positions/grouped")
	fmt.Println("  GET    /portfolio/summary")
	fmt.Println("  GET    /portfolio/history")

	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}
