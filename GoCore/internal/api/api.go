package api

import (
	"context"
	"gobid/internal/database"
	"gobid/internal/services"
	"gobid/internal/store/pgstore"
	"net/http"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/alexedwards/scs/v2"
	"github.com/go-chi/chi/v5"
	"github.com/go-playground/validator/v10"
	"go.uber.org/zap"

	"github.com/google/uuid"
)

type Api struct {
	Router          *chi.Mux
	Logger          *zap.Logger
	UserService     services.UserService
	Sessions        *scs.SessionManager
	JWTSecret       []byte
	tenantCache     sync.Map
	userCache       sync.Map // <-- novo
	cacheExpiration time.Duration
	// S3Service               services.S3Service
	// ProdutoImagemService    services.ProdutoImagemService
	Validate    *validator.Validate
	DBPool      *pgxpool.Pool
	SQLBoilerDB *database.SQLBoilerDB
}

type userCacheEntry struct {
	user      pgstore.GetUserByIDRow
	timestamp time.Time
}

type cacheEntry struct {
	tenantID  uuid.UUID
	timestamp time.Time
}

func NewApi(router *chi.Mux,
	logger *zap.Logger,
	userService services.UserService,
	sessions *scs.SessionManager, jwtSecret []byte,
	validate *validator.Validate,
	pool *pgxpool.Pool,
	sqlBoilerDB *database.SQLBoilerDB) *Api {
	return &Api{
		Router:          router,
		Logger:          logger,
		UserService:     userService,
		Sessions:        sessions,
		JWTSecret:       jwtSecret,
		cacheExpiration: 15 * time.Minute, // Cache expira em 15 minutos
		Validate:        validate,
		DBPool:          pool,
		SQLBoilerDB:     sqlBoilerDB,
	}
}

func (api *Api) getTenantIDFromContext(r *http.Request) uuid.UUID {
	userIDValue := api.Sessions.Get(r.Context(), "AuthenticatedUserId")
	if userIDValue == nil {
		return uuid.Nil
	}

	userID, ok := userIDValue.(uuid.UUID)
	if !ok {
		return uuid.Nil
	}

	// Verifica se existe no cache e se não expirou
	if entry, found := api.tenantCache.Load(userID); found {
		cachedEntry, ok := entry.(cacheEntry)
		if ok && time.Since(cachedEntry.timestamp) < api.cacheExpiration {
			return cachedEntry.tenantID
		}
	}

	// Se não encontrou no cache ou expirou, busca do banco de dados
	user, err := api.UserService.GetUserByID(r.Context(), userID)
	if err != nil {
		return uuid.Nil
	}

	// Armazena no cache
	api.tenantCache.Store(userID, cacheEntry{
		tenantID:  user.TenantID,
		timestamp: time.Now(),
	})

	return user.TenantID
}

// Método para limpar cache expirado (pode ser chamado periodicamente)
func (api *Api) cleanExpiredCache() {
	now := time.Now()

	// tenantCache
	api.tenantCache.Range(func(k, v any) bool {
		if c := v.(cacheEntry); now.Sub(c.timestamp) > api.cacheExpiration {
			api.tenantCache.Delete(k)
		}
		return true
	})

	// userCache
	api.userCache.Range(func(k, v any) bool {
		if c := v.(userCacheEntry); now.Sub(c.timestamp) > api.cacheExpiration {
			api.userCache.Delete(k)
		}
		return true
	})
}

func (api *Api) getUserFromContext(r *http.Request) pgstore.GetUserByIDRow {
	var zero pgstore.GetUserByIDRow

	// 1 - recupera o ID da sessão, validando tipo
	v := api.Sessions.Get(r.Context(), "AuthenticatedUserId")
	userID, ok := v.(uuid.UUID)
	if !ok {
		return zero
	}

	// 2 - verifica cache
	if entry, found := api.userCache.Load(userID); found {
		cached := entry.(userCacheEntry)
		if time.Since(cached.timestamp) < api.cacheExpiration {
			return cached.user // hit
		}
	}

	// 3 - consulta rápida ao banco (timeout defensivo)
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	user, err := api.UserService.GetUserByID(ctx, userID)
	if err != nil {
		api.Logger.Warn("getUserFromContext: lookup failed",
			zap.Error(err), zap.Any("userID", userID))
		return zero
	}

	// 4 - atualiza cache e retorna
	api.userCache.Store(userID, userCacheEntry{
		user:      user,
		timestamp: time.Now(),
	})
	return user
}

// func (api *Api) getTenantIDFromContext(r *http.Request) uuid.UUID {
//     userIDValue := api.Sessions.Get(r.Context(), "AuthenticatedUserId")
//     if userIDValue == nil {
//         return uuid.Nil
//     }

//     userID, ok := userIDValue.(uuid.UUID)
//     if !ok {
//         return uuid.Nil
//     }

//     user, err := api.UserService.GetUserByID(r.Context(), userID)
//     if err != nil {
//         return uuid.Nil
//     }

//     return user.TenantID
// }
