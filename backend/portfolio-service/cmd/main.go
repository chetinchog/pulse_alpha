package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
	"github.com/mgonzalez/pulse_alpha/portfolio-service/internal/adapters/marketdata"
	"github.com/mgonzalez/pulse_alpha/portfolio-service/internal/adapters/repository"
	"github.com/mgonzalez/pulse_alpha/portfolio-service/internal/handlers"
	appMiddleware "github.com/mgonzalez/pulse_alpha/portfolio-service/internal/middleware"
	"github.com/mgonzalez/pulse_alpha/portfolio-service/internal/service"
)

func main() {
	// Load shared environment variables
	_ = godotenv.Load("../.env")
	_ = godotenv.Load() // Fallback current directory just in case

	ctx := context.Background()

	// Initialize Firebase middleware (Auth + Firestore is_enabled check)
	firebaseMiddleware, err := appMiddleware.NewFirebaseMiddleware(ctx)
	if err != nil {
		log.Fatalf("Failed to initialize Firebase middleware: %v", err)
	}
	defer firebaseMiddleware.Close()

	// Initialize repositories
	transactionRepo := repository.NewMemoryTransactionRepository()
	realizedPLRepo := repository.NewMemoryRealizedPLRepository()
	snapshotRepo := repository.NewMemorySnapshotRepository()

	// Initialize market data client
	marketDataClient := marketdata.NewHTTPClient("http://localhost:8081")

	// Initialize service with repositories
	portfolioService := service.NewPortfolioService(
		transactionRepo,
		realizedPLRepo,
		snapshotRepo,
		marketDataClient,
	)

	// Initialize HTTP handler
	handler := handlers.NewHTTPHandler(portfolioService)

	// Create router and add global middleware FIRST
	r := chi.NewRouter()

	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Public routes (no auth required)
	r.Get("/health", handler.HealthCheck)

	// Protected routes — require valid Firebase token + is_enabled == true
	r.Group(func(r chi.Router) {
		r.Use(firebaseMiddleware.Authenticate)
		r.Mount("/", handlers.SetupRoutes(handler))
	})

	// Start server
	port := "8080"
	fmt.Printf("Portfolio Service starting on port %s...\n", port)
	fmt.Println("Firebase Auth middleware: ENABLED")
	fmt.Println("Protected endpoints require: Authorization: Bearer <firebase-id-token>")

	if err := http.ListenAndServe(":"+port, r); err != nil {
		log.Fatal(err)
	}
}
