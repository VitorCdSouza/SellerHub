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
	listingController := &controller.ListingController{
		Service: &service.ListingService{Queries: queries},
	}
	stockController := &controller.StockController{
		Service: &service.StockService{Queries: queries},
	}
	accountController := &controller.AccountController{
		Service: &service.AccountService{Queries: queries},
	}
	metricsController := &controller.MetricsController{
		Service: &service.MetricsService{Queries: queries},
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
	mux.HandleFunc("DELETE /api/produtos/{id}", protected(productController.Delete))
	mux.HandleFunc("GET /api/marketplaces", protected(listingController.Marketplaces))
	mux.HandleFunc("GET /api/anuncios", protected(listingController.List))
	mux.HandleFunc("GET /api/anuncios/{id}", protected(listingController.Get))
	mux.HandleFunc("POST /api/anuncios", protected(listingController.Create))
	mux.HandleFunc("PUT /api/anuncios/{id}", protected(listingController.Update))
	mux.HandleFunc("GET /api/estoque", protected(stockController.List))
	mux.HandleFunc("POST /api/estoque/{id}/entradas", protected(stockController.AddEntry))
	mux.HandleFunc("PUT /api/conta", protected(accountController.Update))
	mux.HandleFunc("PUT /api/conta/senha", protected(accountController.ChangePassword))
	mux.HandleFunc("GET /api/indicadores", protected(metricsController.List))

	log.Print("API em http://localhost:8080")
	log.Fatal(http.ListenAndServe("localhost:8080", mux))
}
