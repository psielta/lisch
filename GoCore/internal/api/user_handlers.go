package api

import (
	"errors"
	"gobid/internal/jsonutils"
	"gobid/internal/services"
	"gobid/internal/usecase/user"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v4"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"go.uber.org/zap"
)

func (api *Api) handleSignupUser(w http.ResponseWriter, r *http.Request) {
	data, problems, err := jsonutils.DecodeValidJson[user.CreateUserReq](r)
	if err != nil {
		_ = jsonutils.EncodeJson(w, r, http.StatusUnprocessableEntity, problems)
		return
	}
	id, err := api.UserService.CreateUser(
		r.Context(),
		data.UserName,
		data.Email,
		data.Password,
		data.Bio,
		data.TenantID,
		data.Admin,
		data.PermissionUsers,
		data.PermissionCategoria,
		data.PermissionProduto,
		data.PermissionAdicional,
	)

	if err != nil {
		if errors.Is(err, services.ErrUserInvalidTenantId) {
			jsonutils.EncodeJson(w, r, http.StatusUnprocessableEntity, map[string]any{
				"error": "invalid tenant id",
			})
			return
		}
		if errors.Is(err, services.ErrDuplicatedEmailOrUsername) {
			_ = jsonutils.EncodeJson(w, r, http.StatusUnprocessableEntity, map[string]any{
				"error": "email or username already exists",
			})
			return
		}
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "unexpected internal server error",
		})
		return
	}

	_ = jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{
		"user_id": id,
	})
}

func (api *Api) handleUpdateUser(w http.ResponseWriter, r *http.Request) {
	data, problems, err := jsonutils.DecodeValidJson[user.UpdateUserReq](r)
	if err != nil {
		_ = jsonutils.EncodeJson(w, r, http.StatusUnprocessableEntity, problems)
		return
	}

	idUUID, err := uuid.Parse(data.ID)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{
			"error": "invalid user id",
		})
		return
	}

	user, err := api.UserService.UpdateUser(
		r.Context(),
		idUUID, data.UserName,
		data.Email,
		data.Password,
		data.Bio,
		data.Admin,
		data.PermissionUsers,
		data.PermissionCategoria,
		data.PermissionProduto,
		data.PermissionAdicional,
	)
	if err != nil {
		if errors.Is(err, services.ErrDuplicatedEmailOrUsername) {
			jsonutils.EncodeJson(w, r, http.StatusUnprocessableEntity, map[string]any{
				"error": "email or username already exists",
			})
			return
		}
		if errors.Is(err, services.ErrUserInvalidTenantId) {
			jsonutils.EncodeJson(w, r, http.StatusUnprocessableEntity, map[string]any{
				"error": "invalid tenant id",
			})
			return
		}
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "unexpected internal server error",
		})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, user)
}

func (api *Api) handleUpdateUserNoPassword(w http.ResponseWriter, r *http.Request) {
	data, problems, err := jsonutils.DecodeValidJson[user.UpdateUserReqNoPassword](r)
	if err != nil {
		_ = jsonutils.EncodeJson(w, r, http.StatusUnprocessableEntity, problems)
		return
	}

	idUUID, err := uuid.Parse(data.ID)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{
			"error": "invalid user id",
		})
		return
	}

	user, err := api.UserService.UpdateUserNoPassword(
		r.Context(),
		idUUID, data.UserName,
		data.Email,
		data.Bio,
		data.Admin,
		data.PermissionUsers,
		data.PermissionCategoria,
		data.PermissionProduto,
		data.PermissionAdicional,
	)
	if err != nil {
		if errors.Is(err, services.ErrDuplicatedEmailOrUsername) {
			jsonutils.EncodeJson(w, r, http.StatusUnprocessableEntity, map[string]any{
				"error": "email or username already exists",
			})
			return
		}
		if errors.Is(err, services.ErrUserInvalidTenantId) {
			jsonutils.EncodeJson(w, r, http.StatusUnprocessableEntity, map[string]any{
				"error": "invalid tenant id",
			})
			return
		}
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "unexpected internal server error",
		})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, user)
}

func (api *Api) handleDeleteUser(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	idUUID, err := uuid.Parse(id)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{
			"error": "invalid user id",
		})
		return
	}

	err = api.UserService.DeleteUser(r.Context(), idUUID)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "unexpected internal server error",
		})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{
		"message": "user deleted successfully",
	})
}

func (api *Api) handleListUsers(w http.ResponseWriter, r *http.Request) {
	tenantID := api.getTenantIDFromContext(r)
	if tenantID == uuid.Nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "unauthorized"})
		return
	}

	users, err := api.UserService.ListUsers(r.Context(), tenantID)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "unexpected internal server error"})
		return
	}

	if users == nil {
		jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "users not found"})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, users)
}

func (api *Api) handleLoginUser(w http.ResponseWriter, r *http.Request) {
	data, problems, err := jsonutils.DecodeValidJson[user.LoginUserReq](r)

	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusUnprocessableEntity, problems)
		return
	}

	id, err := api.UserService.AuthenticateUser(r.Context(), data.Email, data.Password)
	if err != nil {
		if errors.Is(err, services.ErrInvalidCredentials) {
			jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{
				"error": "invalid email or password",
			})
			return
		}
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "unexpected internal server error",
		})
		return
	}

	err = api.Sessions.RenewToken(r.Context())
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "unexpected internal server error",
		})
		return
	}

	// Store just the user ID (UUID) in the session
	api.Sessions.Put(r.Context(), "AuthenticatedUserId", id.ID)

	api.Logger.Info("user logged in", zap.String("user_id", id.ID.String()))
	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{
		"message": "logged in successfully",
	})
}

func (api *Api) handleLogoutUser(w http.ResponseWriter, r *http.Request) {
	err := api.Sessions.RenewToken(r.Context())
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "unexpected internal server error",
		})
		return
	}

	api.Sessions.Remove(r.Context(), "AuthenticatedUserId")
	api.Sessions.Destroy(r.Context())

	http.SetCookie(w, &http.Cookie{
		Name:     "session",
		Value:    "",
		Path:     "/",
		Expires:  time.Now().Add(-1 * time.Hour),
		HttpOnly: true,
	})

	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{
		"message": "logged out successfully",
	})
}

func (api *Api) handleGetUserByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	idUUID, err := uuid.Parse(id)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusBadRequest, map[string]any{
			"error": "invalid user id",
		})
		return
	}

	userDTO, err := api.UserService.GetUserByID(r.Context(), idUUID)
	if err != nil {
		if errors.Is(err, services.ErrUserNotFound) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{
				"error": "user not found",
			})
			return
		}
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "unexpected internal server error",
		})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, userDTO)
}

func (api *Api) handleGetCurrentUser(w http.ResponseWriter, r *http.Request) {
	userIDValue := api.Sessions.Get(r.Context(), "AuthenticatedUserId")
	if userIDValue == nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{
			"error": "not authenticated",
		})
		return
	}

	userID, ok := userIDValue.(uuid.UUID)
	if !ok {
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "invalid session data",
		})
		return
	}

	userDTO, err := api.UserService.GetUserByID(r.Context(), userID)
	if err != nil {
		if errors.Is(err, services.ErrUserNotFound) {
			jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{
				"error": "user data not found",
			})
			return
		}
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{
			"error": "unexpected internal server error",
		})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, userDTO)
}

// payload (“claims”) do JWT
type Claims struct {
	UserID string `json:"sub"`
	jwt.RegisteredClaims
}

// POST /api/v1/mobile/login
func (api *Api) handleLoginToken(w http.ResponseWriter, r *http.Request) {
	data, problems, err := jsonutils.DecodeValidJson[user.LoginUserReq](r)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusUnprocessableEntity, problems)
		return
	}

	userID, err := api.UserService.AuthenticateUser(r.Context(), data.Email, data.Password)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "credenciais inválidas"})
		return
	}

	// 1) Define claims e expiração
	exp := time.Now().Add(24 * time.Hour)
	claims := Claims{
		UserID: userID.ID.String(),
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(exp),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "gobid-api",
		},
	}

	// 2) Cria token e assina
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(api.JWTSecret)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "falha ao gerar token"})
		return
	}

	// 3) Retorna JSON com o token
	api.Logger.Info("user logged in (token generated for mobile)", zap.String("user_id", userID.ID.String()))
	jsonutils.EncodeJson(w, r, http.StatusOK, map[string]any{
		"access_token": tokenString,
		"token_type":   "Bearer",
		"expires_at":   exp.Unix(),
	})
}

func (api *Api) handleGetCurrentUserToken(w http.ResponseWriter, r *http.Request) {
	raw := r.Context().Value(userIDKey)
	userIDStr, ok := raw.(string)
	if !ok || userIDStr == "" {
		jsonutils.EncodeJson(w, r, http.StatusUnauthorized, map[string]any{"error": "não autenticado"})
		return
	}

	id, err := uuid.Parse(userIDStr)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusInternalServerError, map[string]any{"error": "formato de userID inválido"})
		return
	}

	userDTO, err := api.UserService.GetUserByID(r.Context(), id)
	if err != nil {
		jsonutils.EncodeJson(w, r, http.StatusNotFound, map[string]any{"error": "usuário não encontrado"})
		return
	}

	jsonutils.EncodeJson(w, r, http.StatusOK, userDTO)
}
