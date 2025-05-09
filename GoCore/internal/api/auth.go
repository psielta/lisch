package api

import (
	"context"
	"github.com/golang-jwt/jwt/v4"
	"github.com/gorilla/csrf"
	"gobid/internal/jsonutils"
	"net/http"
	"strings"
)

func (api *Api) HandleGetCSRFToken(w http.ResponseWriter, r *http.Request) {
	token := csrf.Token(r)
	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{
		"csrf_token": token,
	})
}

func (api *Api) AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !api.Sessions.Exists(r.Context(), "AuthenticatedUserId") {
			jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{
				"message": "must be logged in",
			})
			return
		}
		next.ServeHTTP(w, r)
	})
}

type ctxKey string

const userIDKey ctxKey = "userID"

// JWTAuthMiddleware valida o Bearer token
func (api *Api) JWTAuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		auth := r.Header.Get("Authorization")
		parts := strings.SplitN(auth, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "token ausente ou inválido"})
			return
		}

		tokenString := parts[1]
		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (any, error) {
			return api.JWTSecret, nil
		})
		if err != nil || !token.Valid {
			jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "token inválido ou expirado"})
			return
		}

		claims := token.Claims.(*Claims)
		// injeta o userID no contexto
		ctx := context.WithValue(r.Context(), userIDKey, claims.UserID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
