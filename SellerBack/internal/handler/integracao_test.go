package handler_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/joho/godotenv"
	"sellerhub/sellerback/internal/database"
	"sellerhub/sellerback/internal/handler"
	"sellerhub/sellerback/internal/repository"
	"sellerhub/sellerback/internal/service"
)

func TestLoginPostgreSQL(t *testing.T) {
	if os.Getenv("TEST_POSTGRES") != "1" {
		t.Skip("defina TEST_POSTGRES=1 para consultar o PostgreSQL real preparado com os scripts SQL")
	}
	if err := godotenv.Load("../../.env"); err != nil && !os.IsNotExist(err) {
		t.Fatal("não foi possível carregar .env")
	}
	banco, err := database.Conectar(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	defer banco.Close()
	api := handler.Novo(&service.Login{Usuarios: &repository.Usuarios{Banco: banco}}, "http://localhost:4200")
	for _, caso := range []struct {
		senha  string
		status int
	}{{"123456", 200}, {"incorreta", 401}} {
		r := httptest.NewRequest(http.MethodPost, "/login", strings.NewReader(`{"email":"teste@email.com","password":"`+caso.senha+`"}`))
		r.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		api.ServeHTTP(w, r)
		if w.Code != caso.status {
			t.Fatalf("status: %d; esperado: %d", w.Code, caso.status)
		}
	}
}
