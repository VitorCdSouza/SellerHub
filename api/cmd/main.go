package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
	"sellerhub/sellerback/internal/database"
	"sellerhub/sellerback/internal/handler"
	"sellerhub/sellerback/internal/repository"
	"sellerhub/sellerback/internal/service"
)

func main() {
	if err := godotenv.Load(); err != nil && !errors.Is(err, os.ErrNotExist) {
		log.Fatal("Não foi possível ler .env; confira o formato e as permissões")
	}
	banco, err := database.Conectar(context.Background())
	if err != nil {
		log.Fatal(err)
	}
	defer banco.Close()
	origem := os.Getenv("FRONTEND_ORIGIN")
	if origem == "" {
		origem = "http://localhost:4200"
	}
	servico := &service.Login{Usuarios: &repository.Usuarios{Banco: banco}}
	servidor := &http.Server{
		Addr:              "localhost:8080",
		Handler:           handler.Novo(servico, origem),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	log.Print("API disponível em http://localhost:8080")
	if err := servidor.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
		log.Printf("Executar servidor: %v", err)
	}
}
