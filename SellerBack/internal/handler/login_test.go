package handler_test

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"sellerhub/sellerback/internal/handler"
	"sellerhub/sellerback/internal/repository"
	"sellerhub/sellerback/internal/service"
)

type usuariosTeste struct{ hash string }

func (u usuariosTeste) BuscarHash(_ context.Context, email string) (string, error) {
	if email == "falha@email.com" {
		return "", errors.New("banco indisponível")
	}
	if email != "teste@email.com" {
		return "", repository.ErrUsuarioNaoEncontrado
	}
	return u.hash, nil
}

func TestLogin(t *testing.T) {
	// Usa o próprio hash do SQL para detectar divergência com a senha documentada.
	sql, err := os.ReadFile("../../sql/02_usuario_teste.sql")
	if err != nil {
		t.Fatal(err)
	}
	inicio := strings.Index(string(sql), "$2a$")
	if inicio < 0 || len(sql) < inicio+60 {
		t.Fatal("hash ausente no SQL de teste")
	}
	hash := string(sql[inicio : inicio+60])
	api := handler.Novo(&service.Login{Usuarios: usuariosTeste{hash}}, "http://localhost:4200")
	casos := []struct {
		nome, corpo string
		status      int
	}{
		{"sucesso", `{"email":"teste@email.com","password":"123456"}`, 200},
		{"email normalizado", `{"email":" TESTE@email.com ","password":"123456"}`, 200},
		{"senha errada", `{"email":"teste@email.com","password":"errada"}`, 401},
		{"senha não aparada", `{"email":"teste@email.com","password":"123456 "}`, 401},
		{"usuário ausente", `{"email":"outro@email.com","password":"123456"}`, 401},
		{"campos vazios", `{}`, 400},
		{"email inválido", `{"email":"invalido","password":"123456"}`, 400},
		{"senha longa", `{"email":"teste@email.com","password":"` + strings.Repeat("a", 73) + `"}`, 400},
		{"json inválido", `{`, 400},
		{"campo desconhecido", `{"email":"teste@email.com","password":"123456","admin":true}`, 400},
		{"objetos extras", `{} {}`, 400},
		{"corpo excessivo", strings.Repeat(" ", 4097) + `{}`, 400},
		{"banco indisponível", `{"email":"falha@email.com","password":"123456"}`, 500},
	}
	for _, caso := range casos {
		t.Run(caso.nome, func(t *testing.T) {
			requisicao := httptest.NewRequest(http.MethodPost, "/login", strings.NewReader(caso.corpo))
			requisicao.Header.Set("Content-Type", "application/json")
			requisicao.Header.Set("Origin", "http://localhost:4200")
			resposta := httptest.NewRecorder()
			api.ServeHTTP(resposta, requisicao)
			if resposta.Code != caso.status {
				t.Fatalf("status: %d; esperado: %d", resposta.Code, caso.status)
			}
			var dados struct {
				Success bool
				Message string
			}
			if err := json.Unmarshal(resposta.Body.Bytes(), &dados); err != nil {
				t.Fatal(err)
			}
			if dados.Success != (caso.status == 200) || dados.Message == "" {
				t.Fatalf("resposta inesperada: %+v", dados)
			}
			if caso.status == 401 && dados.Message != "Credenciais inválidas" {
				t.Fatal("resposta deve ser igual para usuário ausente e senha errada")
			}
			if resposta.Header().Get("Access-Control-Allow-Origin") != "http://localhost:4200" {
				t.Fatal("CORS ausente")
			}
		})
	}
}

func TestContratoHTTP(t *testing.T) {
	api := handler.Novo(nil, "http://localhost:4200")
	for _, caso := range []struct {
		nome, metodo, origem, tipo string
		status                     int
	}{
		{"preflight", "OPTIONS", "http://localhost:4200", "", 204},
		{"origem rejeitada", "POST", "http://outro.local", "application/json", 403},
		{"método rejeitado", "GET", "", "", 405},
		{"tipo rejeitado", "POST", "", "text/plain", 415},
	} {
		t.Run(caso.nome, func(t *testing.T) {
			r := httptest.NewRequest(caso.metodo, "/login", nil)
			r.Header.Set("Origin", caso.origem)
			r.Header.Set("Content-Type", caso.tipo)
			w := httptest.NewRecorder()
			api.ServeHTTP(w, r)
			if w.Code != caso.status {
				t.Fatalf("status: %d; esperado: %d", w.Code, caso.status)
			}
			if caso.status == 403 && w.Header().Get("Access-Control-Allow-Origin") != "" {
				t.Fatal("origem indevida liberada")
			}
		})
	}
}
