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
			//r.Get("/csrftoken", api.HandleGetCSRFToken)
			r.Route("/users", func(r chi.Router) {
				r.Post("/signup", api.handleSignupUser)
				r.Post("/login", api.handleLoginUser)
				r.Post("/logout", api.handleLogoutUser)

				r.Group(func(r chi.Router) {
					r.Use(api.AuthMiddleware)
					r.Get("/get/{id}", api.handleGetUserByID)
					r.Get("/me", api.handleGetCurrentUser)
					r.Put("/put/{id}", api.handleUpdateUser)
					r.Put("/putnopassword/{id}", api.handleUpdateUserNoPassword)
					r.Delete("/delete/{id}", api.handleDeleteUser)
					r.Get("/list", api.handleListUsers)
				})
			})

			// r.Route("/depositos", func(r chi.Router) {
			// 	r.Group(func(r chi.Router) {
			// 		r.Use(api.AuthMiddleware)
			// 		r.Get("/", api.handleDeposito_List)
			// 		r.Get("/{id}", api.handleDeposito_Get)
			// 		r.Post("/", api.handleDeposito_Post)
			// 		r.Put("/{id}", api.handleDeposito_Put)
			// 		r.Delete("/{id}", api.handleDeposito_Delete)
			// 	})
			// })
		})
	})

	api.Router.Route("/api/v1/mobile", func(r chi.Router) {
		// rota de login retorna token JWT
		r.Post("/login", api.handleLoginToken)

		// grupo protegido por JWT
		r.Group(func(r chi.Router) {
			r.Use(api.JWTAuthMiddleware)
			r.Get("/me", api.handleGetCurrentUserToken)
		})
		// r.Route("/clientes", func(r chi.Router) {
		// 	r.Group(func(r chi.Router) {
		// 		r.Use(api.JWTAuthMiddleware)
		// 		r.Get("/", api.handleCliente_ListJwt)
		// 		r.Get("/{id}", api.handleCliente_GetJwt)
		// 		r.Post("/", api.handleCliente_PostJwt)
		// 		r.Put("/{id}", api.handleCliente_PutJwt)
		// 		r.Delete("/{id}", api.handleCliente_DeleteJwt)
		// 	})
		// })

	})

}
