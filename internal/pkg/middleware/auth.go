package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/afifdnz/irrigation-iot/internal/pkg/jwtutil"
)

func AuthMiddleware(secret string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "authorization header kosong", http.StatusUnauthorized)
			return
		}
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, "format token tidak valid", http.StatusUnauthorized)
			return
		}

		claims, err := jwtutil.ValidateToken(parts[1], secret)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), jwtutil.ClaimsKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
