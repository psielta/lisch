package api

import (
	"gobid/internal/httpmiddleware"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func (api *Api) BindRoutes() {
	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins:   []string{"https://psielt.com", "http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	})

	api.Router.Use(corsMiddleware.Handler)
	api.Router.Use(middleware.RequestID,
		httpmiddleware.ZapLogger(api.Logger),
		middleware.Recoverer,
		api.Sessions.LoadAndSave)

	api.Router.Route("/api", func(r chi.Router) {
		r.Route("/v1", func(r chi.Router) {
			r.Route("/users", func(r chi.Router) {
				r.Post("/signup", api.handleSignupUser)
				r.Post("/login", api.handleLoginUser)
				r.Post("/logout", api.handleLogoutUser)

				r.Group(func(r chi.Router) {
					r.Use(api.AuthMiddleware)
					r.Get("/get/{id}", api.handleGetUserByID)
					r.Get("/tenant/{id}", api.handleGetTenantByID)
					r.Get("/me", api.handleGetCurrentUser)
					r.Put("/put/{id}", api.handleUpdateUser)
					r.Put("/putnopassword/{id}", api.handleUpdateUserNoPassword)
					r.Delete("/delete/{id}", api.handleDeleteUser)
					r.Get("/list", api.handleListUsers)
				})
			})

			r.Route("/categorias", func(r chi.Router) {
				r.Group(func(r chi.Router) {
					r.Use(api.AuthMiddleware)
					r.Get("/", api.handleCategorias_List)
					r.Get("/{id}", api.handleCategorias_Get)
					r.Post("/", api.handleCategorias_Post)
					r.Put("/{id}", api.handleCategorias_Put)
					r.Put("/{id}/status", api.handleCategorias_PutStatus)
					r.Put("/{id}/ordem", api.handleCategorias_PutOrdem)
					r.Put("/{id}/opcoes/{opcaoId}/status", api.handleCategorias_PutOpcoesAlterarStatus)
				})
			})
			r.Route("/culinarias", func(r chi.Router) {
				r.Group(func(r chi.Router) {
					r.Use(api.AuthMiddleware)
					r.Get("/", api.handleCulinarias_List)
				})
			})
			// Continuação das rotas de produtos
			r.Route("/produtos", func(r chi.Router) {
				r.Group(func(r chi.Router) {
					r.Use(api.AuthMiddleware)
					r.Get("/", api.handleProdutos_List)
					r.Get("/{id}", api.handleProdutos_Get)
					r.Post("/", api.handleProdutos_Post)
					r.Put("/{id}", api.handleProdutos_Put)
					r.Delete("/{id}", api.handleProdutos_Delete)
					r.Put("/{id}/status", api.handleProdutos_PutStatus)
					r.Put("/{id}/ordem", api.handleProdutos_PutOrdem)

					// Rotas para gerenciamento de preços
					r.Post("/{id}/precos", api.handleProdutoPrecos_Post)
					r.Put("/{id}/precos/{precoId}", api.handleProdutoPrecos_Put)
					r.Delete("/{id}/precos/{precoId}", api.handleProdutoPrecos_Delete)
					r.Put("/{id}/precos/{precoId}/disponibilidade", api.handleProdutoPrecos_PutDisponibilidade)
				})
			})

			r.Route("/pedido-pagamentos", func(r chi.Router) {
				r.Get("/", api.handlePedidoPagamentos_List)
				r.Post("/", api.handlePedidoPagamentos_Post)
				r.Post("/bulk", api.handlePedidoPagamentos_BulkPost) // novo
				r.Delete("/{id}", api.handlePedidoPagamentos_Delete)
			})

			r.Route("/contas-receber", func(r chi.Router) {
				r.Get("/", api.handleContasReceber_List)
				r.Post("/", api.handleContasReceber_Post)
				r.Post("/bulk", api.handleContasReceber_BulkPost) // novo
			})

			r.Route("/pedidos", func(r chi.Router) {
				r.Group(func(r chi.Router) {
					r.Use(api.AuthMiddleware)

					// CRUD básico
					r.Get("/", api.handlePedidos_List)          // GET /api/v1/pedidos - lista paginada com filtros
					r.Get("/count", api.handlePedidos_Count)    // GET /api/v1/pedidos/count - contagem total com filtros
					r.Get("/{id}", api.handlePedidos_Get)       // GET /api/v1/pedidos/{id}
					r.Post("/", api.handlePedidos_Post)         // POST /api/v1/pedidos
					r.Put("/{id}", api.handlePedidos_Put)       // PUT /api/v1/pedidos/{id}
					r.Delete("/{id}", api.handlePedidos_Delete) // DELETE /api/v1/pedidos/{id}

					// NOVA ROTA PARA DADOS DE EDIÇÃO
					r.Get("/{id}/dados-edicao", api.handlePedidos_GetDadosEdicao) // GET /api/v1/pedidos/{id}/dados-edicao

					// Operações específicas
					r.Put("/{id}/status", api.handlePedidos_PutStatus)              // PUT /api/v1/pedidos/{id}/status
					r.Put("/{id}/pedido-pronto", api.handlePedidos_PutPedidoPronto) // PUT /api/v1/pedidos/{id}/pedido-pronto

					// Busca por código
					r.Get("/codigo/{codigo}", api.handlePedidos_GetByCodigoPedido) // GET /api/v1/pedidos/codigo/{codigo}
				})
			})

			r.Route("/clientes", func(r chi.Router) {
				r.Group(func(r chi.Router) {
					r.Use(api.AuthMiddleware)

					// CRUD básico
					r.Get("/", api.handleListClientes)             // GET /api/v1/clientes - lista paginada com filtros
					r.Get("/simple", api.handleListClientesSimple) // GET /api/v1/clientes/simple - lista simples com limit/offset
					r.Get("/count", api.handleCountClientes)       // GET /api/v1/clientes/count - contagem total
					r.Get("/{id}", api.handleGetCliente)           // GET /api/v1/clientes/{id}
					r.Post("/", api.handleCreateCliente)           // POST /api/v1/clientes
					r.Put("/{id}", api.handleUpdateCliente)        // PUT /api/v1/clientes/{id}
					r.Delete("/{id}", api.handleDeleteCliente)     // DELETE /api/v1/clientes/{id}

					r.Get("/smartsearch", api.handleListClientesSmartSearch) // GET /api/v1/clientes/smartsearch - busca inteligente

					// Busca por documento
					r.Get("/cpf/{cpf}", api.handleGetClienteByCPF)    // GET /api/v1/clientes/cpf/{cpf}
					r.Get("/cnpj/{cnpj}", api.handleGetClienteByCNPJ) // GET /api/v1/clientes/cnpj/{cnpj}
				})
			})

			r.Route("/categoria-adicionais", func(r chi.Router) {
				r.Group(func(r chi.Router) {
					r.Use(api.AuthMiddleware)
					r.Get("/", api.handleCategoriaAdicionais_List)
					r.Get("/tenant/{tenantId}", api.handleCategoriaAdicionais_ListByTenant)
					r.Get("/{id}", api.handleCategoriaAdicionais_Get)
					r.Post("/", api.handleCategoriaAdicionais_Post)
					r.Put("/{id}", api.handleCategoriaAdicionais_Put)
					r.Delete("/{id}", api.handleCategoriaAdicionais_Delete)
					r.Put("/{id}/status", api.handleCategoriaAdicionais_PutStatus)

					// Rotas para gerenciamento de opções
					r.Post("/{id}/opcoes", api.handleCategoriaAdicionalOpcoes_Post)
					r.Put("/{id}/opcoes/{opcaoId}", api.handleCategoriaAdicionalOpcoes_Put)
					r.Delete("/{id}/opcoes/{opcaoId}", api.handleCategoriaAdicionalOpcoes_Delete)
					r.Put("/{id}/opcoes/{opcaoId}/status", api.handleCategoriaAdicionalOpcoes_PutStatus)
				})
			})
		})
	})

	api.Router.Route("/api/v1/mobile", func(r chi.Router) {
		r.Post("/login", api.handleLoginToken)

		r.Group(func(r chi.Router) {
			r.Use(api.JWTAuthMiddleware)
			r.Get("/me", api.handleGetCurrentUserToken)
		})

	})

}
