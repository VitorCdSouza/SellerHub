package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"

	"saleshub/api/internal/controller"
	"saleshub/api/internal/db"
	"saleshub/api/internal/service"
)

func main() {
	// caminho relativo a api/, de onde a api roda
	_ = godotenv.Load("../.env")

	pool, err := db.Connect(context.Background())
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()

	queries := db.New(pool)
	loginController := &controller.LoginController{Service: &service.LoginService{Queries: queries}}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /login", loginController.Login)

	log.Print("API em http://localhost:8080")
	log.Fatal(http.ListenAndServe("localhost:8080", cors(mux, os.Getenv("FRONTEND_ORIGIN"))))
}

func cors(next http.Handler, origin string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Origin") == origin {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "POST")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
