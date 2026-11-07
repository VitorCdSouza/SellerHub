package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"

	"sellerhub/api/internal/controller"
	"sellerhub/api/internal/db"
	"sellerhub/api/internal/service"
)

func main() {
	// caminho relativo a api/, de onde a api roda
	_ = godotenv.Load("../.env")

	secret := os.Getenv("JWT_SECRET")
	// hs256 exige chave de pelo menos 256 bits
	if len(secret) < 32 {
		log.Fatal("JWT_SECRET ausente ou com menos de 32 caracteres no .env")
	}

	pool, err := db.Connect(context.Background())
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	queries := db.New(pool)
	sessionService := &service.SessionService{Secret: []byte(secret)}
	loginController := &controller.LoginController{
		Service: &service.LoginService{Queries: queries},
		Session: sessionService,
	}
	productController := &controller.ProductController{
		Service: &service.ProductService{Queries: queries},
	}
	protected := func(handler http.HandlerFunc) http.HandlerFunc {
		return controller.RequireSession(sessionService, handler)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/login", loginController.Login)
	mux.HandleFunc("POST /api/logout", loginController.Logout)
	mux.HandleFunc("GET /api/sessao", protected(loginController.CurrentUser))
	mux.HandleFunc("GET /api/produtos", protected(productController.List))
	mux.HandleFunc("GET /api/produtos/{id}", protected(productController.Get))
	mux.HandleFunc("POST /api/produtos", protected(productController.Create))
	mux.HandleFunc("PUT /api/produtos/{id}", protected(productController.Update))

	log.Print("API em http://localhost:8080")
	log.Fatal(http.ListenAndServe("localhost:8080", mux))
}
