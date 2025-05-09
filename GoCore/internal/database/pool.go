package database

import (
	"context"

	pgxzap "github.com/jackc/pgx-zap"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/tracelog"
	"go.uber.org/zap"
)

func NewPGXPool(ctx context.Context, conn string, z *zap.Logger) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(conn)
	if err != nil {
		return nil, err
	}

	//  🔑  Aqui plugamos o Zap:
	cfg.ConnConfig.Tracer = &tracelog.TraceLog{
		Logger:   pgxzap.NewLogger(z.Named("pgx")), // sub‑logger “pgx”
		LogLevel: tracelog.LogLevelError,           // Error, Warn, Info, Debug, Trace
	}

	return pgxpool.NewWithConfig(ctx, cfg)
}
