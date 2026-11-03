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
	loginController := &controller.LoginController{
		Service: &service.LoginService{Queries: queries},
		Session: &service.SessionService{Secret: []byte(secret)},
	}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/login", loginController.Login)

	log.Print("API em http://localhost:8080")
	log.Fatal(http.ListenAndServe("localhost:8080", mux))
}
