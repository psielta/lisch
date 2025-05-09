// main.go
package main

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gen"
	"gorm.io/gen/field"
	"gorm.io/gorm"
)

func main() {
	// Carrega variáveis de ambiente do arquivo .env
	if err := godotenv.Load(); err != nil {
		panic("Falha ao carregar .env: " + err.Error())
	}

	// Monta DSN a partir das variáveis de ambiente
	host := os.Getenv("GOBID_DATABASE_HOST")
	port := os.Getenv("GOBID_DATABASE_PORT")
	user := os.Getenv("GOBID_DATABASE_USER")
	password := os.Getenv("GOBID_DATABASE_PASSWORD")
	dbname := os.Getenv("GOBID_DATABASE_NAME")
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname,
	)

	// Conecta ao PostgreSQL
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("Falha ao conectar ao banco: " + err.Error())
	}

	// Inicializa o generator
	g := gen.NewGenerator(gen.Config{
		OutPath: "./internal/models_gorm", // pasta de saída
		Mode:    gen.WithoutContext | gen.WithDefaultQuery | gen.WithQueryInterface,
	})
	g.UseDB(db)

	// Gera modelo de pedido_itens (será referenciado abaixo)
	itemModel := g.GenerateModel("pedido_itens")

	// Gera modelo de pedidos com relação HasMany → PedidoItens
	pedidoModel := g.GenerateModel("pedidos",
		gen.FieldRelate(
			field.HasMany, // tipo de relação
			"Itens",       // nome do campo
			itemModel,     // modelo referenciado
			&field.RelateConfig{
				GORMTag: field.GormTag{
					"foreignKey": []string{"PedidoID"},
					"references": []string{"ID"},
				},
			},
		),
	)

	// Re-gerar pedido_itens adicionando relação BelongsTo ← Pedido (opcional)
	itemModel = g.GenerateModel("pedido_itens",
		gen.FieldRelate(
			field.BelongsTo,
			"Pedido",
			pedidoModel,
			&field.RelateConfig{
				GORMTag: field.GormTag{
					"foreignKey": []string{"PedidoID"},
					"references": []string{"ID"},
				},
			},
		),
	)

	// Aplica configurações básicas (camada de query/API)
	g.ApplyBasic(pedidoModel, itemModel)

	// Executa a geração dos arquivos
	g.Execute()

	fmt.Println("Modelos GORM gerados com sucesso em ./internal/models_gorm")
}
