package database

import (
	"database/sql"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/volatiletech/sqlboiler/v4/boil"
)

// SQLBoilerDB é um adaptador para usar SQLBoiler com pgxpool
type SQLBoilerDB struct {
	Pool *pgxpool.Pool
	DB   *sql.DB
}

// NewSQLBoilerDB cria uma nova instância de SQLBoilerDB
func NewSQLBoilerDB(pool *pgxpool.Pool) *SQLBoilerDB {
	// Converter pgxpool para sql.DB
	conn := stdlib.OpenDBFromPool(pool)

	// Configurar o SQLBoiler para usar o sql.DB
	boil.SetDB(conn)

	return &SQLBoilerDB{
		Pool: pool,
		DB:   conn,
	}
}

// GetDB retorna a conexão sql.DB para uso com SQLBoiler
func (db *SQLBoilerDB) GetDB() *sql.DB {
	return db.DB
}

// Close fecha a conexão sql.DB
func (db *SQLBoilerDB) Close() error {
	return db.DB.Close()
}
