package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/option"

	"cloud.google.com/go/firestore"
)

// contextKey is an unexported type for context keys in this package.
type contextKey string

const UserIDKey contextKey = "userID"

// FirebaseMiddleware holds the Firebase Auth client and Firestore client.
type FirebaseMiddleware struct {
	authClient      *auth.Client
	firestoreClient *firestore.Client
	projectID       string
}

// NewFirebaseMiddleware initializes Firebase Admin SDK using the service account
// key file path from the FIREBASE_SERVICE_ACCOUNT_KEY_PATH environment variable.
// Falls back to Application Default Credentials if the env var is not set.
func NewFirebaseMiddleware(ctx context.Context) (*FirebaseMiddleware, error) {
	projectID := os.Getenv("FIREBASE_PROJECT_ID")
	if projectID == "" {
		projectID = "pulse-alpha-ictg" // default project
	}

	var app *firebase.App
	var err error

	keyPath := os.Getenv("FIREBASE_SERVICE_ACCOUNT_KEY_PATH")
	if keyPath != "" {
		opt := option.WithCredentialsFile(keyPath)
		app, err = firebase.NewApp(ctx, &firebase.Config{ProjectID: projectID}, opt)
	} else {
		// Use Application Default Credentials (useful in GCP environments)
		app, err = firebase.NewApp(ctx, &firebase.Config{ProjectID: projectID})
	}

	if err != nil {
		return nil, fmt.Errorf("firebase.NewApp: %w", err)
	}

	authClient, err := app.Auth(ctx)
	if err != nil {
		return nil, fmt.Errorf("app.Auth: %w", err)
	}

	firestoreClient, err := app.Firestore(ctx)
	if err != nil {
		return nil, fmt.Errorf("app.Firestore: %w", err)
	}

	return &FirebaseMiddleware{
		authClient:      authClient,
		firestoreClient: firestoreClient,
		projectID:       projectID,
	}, nil
}

// Close releases the Firestore client resources.
func (m *FirebaseMiddleware) Close() {
	if m.firestoreClient != nil {
		m.firestoreClient.Close()
	}
}

// Authenticate is an HTTP middleware that:
//  1. Extracts the Bearer token from the Authorization header
//  2. Verifies it via Firebase Auth
//  3. Looks up the user doc in Firestore to check is_enabled
//  4. Returns 401 if unauthenticated, 418 if is_enabled == false
//  5. Passes the user UID via context to downstream handlers
func (m *FirebaseMiddleware) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. Extract token
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			writeJSON(w, http.StatusUnauthorized, map[string]string{
				"error": "missing or malformed Authorization header",
			})
			return
		}
		idToken := strings.TrimPrefix(authHeader, "Bearer ")

		// 2. Verify token
		token, err := m.authClient.VerifyIDToken(r.Context(), idToken)
		if err != nil {
			log.Printf("VerifyIDToken error: %v", err)
			writeJSON(w, http.StatusUnauthorized, map[string]string{
				"error": "invalid or expired token",
			})
			return
		}

		// 3. Check is_enabled in Firestore
		docRef := m.firestoreClient.Collection("users").Doc(token.UID)
		docSnap, err := docRef.Get(r.Context())
		if err != nil {
			// If the document doesn't exist yet, treat as not enabled
			log.Printf("Firestore get user %s error: %v", token.UID, err)
			writeJSON(w, http.StatusTeapot, map[string]string{
				"error": "user not enabled",
			})
			return
		}

		data := docSnap.Data()
		isEnabled, _ := data["is_enabled"].(bool)
		if !isEnabled {
			writeJSON(w, http.StatusTeapot, map[string]string{
				"error": "user not enabled",
			})
			return
		}

		// 4. Pass UID downstream
		ctx := context.WithValue(r.Context(), UserIDKey, token.UID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// writeJSON is a helper to write JSON error responses.
func writeJSON(w http.ResponseWriter, status int, body interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(body)
}
