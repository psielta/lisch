package main

import (
	"context"
	"encoding/gob"
	"fmt"
	"gobid/internal/api"
	"gobid/internal/database"
	"gobid/internal/logging"
	"gobid/internal/services"
	"gobid/internal/validation"
	"net/http"
	"os"
	"time"

	"github.com/alexedwards/scs/pgxstore"
	"github.com/alexedwards/scs/v2"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"go.uber.org/zap"
)

func main() {
	gob.Register(uuid.UUID{})
	logger := logging.New()
	defer logger.Sync()

	if err := godotenv.Load(); err != nil {
		logger.Fatal("erro carregando .env", zap.Error(err))
	}

	if err := godotenv.Load(); err != nil {
		panic(err)
	}

	ctx := context.Background()
	pool, err := database.NewPGXPool(ctx, fmt.Sprintf("user=%s password=%s host=%s port=%s dbname=%s",
		os.Getenv("GOBID_DATABASE_USER"),
		os.Getenv("GOBID_DATABASE_PASSWORD"),
		os.Getenv("GOBID_DATABASE_HOST"),
		os.Getenv("GOBID_DATABASE_PORT"),
		os.Getenv("GOBID_DATABASE_NAME"),
	), logger)

	if err != nil {
		panic(err)
	}

	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		panic(err)
	}

	// Crie o adaptador SQLBoiler
	sqlBoilerDB := database.NewSQLBoilerDB(pool)
	defer sqlBoilerDB.Close() // Importante para liberar recursos

	s := scs.New()
	s.Store = pgxstore.New(pool)
	s.Lifetime = 24 * time.Hour
	s.Cookie.HttpOnly = true
	s.Cookie.Path = "/"
	s.Cookie.Secure = true
	s.Cookie.SameSite = http.SameSiteLaxMode

	isProduction := os.Getenv("GOBID_PRODUCTION")
	if isProduction == "true" {
		s.Cookie.Domain = ".psielt.com.br"
	}

	jwtSecret := os.Getenv("GOBID_JWT_SECRET")
	if jwtSecret == "" {
		panic("GOBID_JWT_SECRET não configurado")
	}
	validate := validation.Init()

	api := api.Api{
		Router:               chi.NewMux(),
		Logger:               logger,
		UserService:          services.NewUserService(pool),
		ClienteService:       services.NewClienteService(pool),
		DashboardService:     services.NewDashboardService(pool),
		OutboxService:        services.NewOutboxService(pool),
		OperadorCaixaService: services.NewOperadorCaixaService(pool),
		Sessions:             s,
		JWTSecret:            []byte(jwtSecret),
		Validate:             validate,
		DBPool:               pool,
		SQLBoilerDB:          sqlBoilerDB, // Use o adaptador SQLBoiler
	}

	api.BindRoutes()

	fmt.Println("Staring Server on port :3081")
	if err := http.ListenAndServe("0.0.0.0:3081", api.Router); err != nil {
		panic(err)
	}
}
