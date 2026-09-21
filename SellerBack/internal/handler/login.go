package handler

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log"
	"mime"
	"net/http"
	"time"

	"sellerhub/sellerback/internal/service"
)

type resposta struct {
	Sucesso  bool   `json:"success"`
	Mensagem string `json:"message"`
}

func responder(w http.ResponseWriter, status int, sucesso bool, mensagem string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(resposta{sucesso, mensagem})
}

func Novo(servico *service.Login, origem string) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.Header().Set("Allow", "POST, OPTIONS")
			responder(w, http.StatusMethodNotAllowed, false, "Método não permitido")
			return
		}
		tipo, _, err := mime.ParseMediaType(r.Header.Get("Content-Type"))
		if err != nil || tipo != "application/json" {
			responder(w, http.StatusUnsupportedMediaType, false, "Envie o corpo como application/json")
			return
		}
		var dados struct {
			Email string `json:"email"`
			Senha string `json:"password"`
		}
		leitor := json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096))
		leitor.DisallowUnknownFields()
		if err := leitor.Decode(&dados); err != nil {
			responder(w, http.StatusBadRequest, false, "JSON inválido ou maior que 4 KiB")
			return
		}
		if err := leitor.Decode(&struct{}{}); err != io.EOF {
			responder(w, http.StatusBadRequest, false, "Envie apenas um objeto JSON")
			return
		}
		ctx, cancelar := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancelar()
		err = servico.Entrar(ctx, dados.Email, dados.Senha)
		switch {
		case err == nil:
			responder(w, http.StatusOK, true, "Login realizado com sucesso")
		case errors.Is(err, service.ErrDadosInvalidos):
			responder(w, http.StatusBadRequest, false, "Informe um e-mail válido e uma senha de até 72 bytes")
		case errors.Is(err, service.ErrCredenciaisInvalidas):
			responder(w, http.StatusUnauthorized, false, "Credenciais inválidas")
		default:
			log.Printf("Falha no login: %v", err)
			responder(w, http.StatusInternalServerError, false, "Não foi possível realizar o login. Tente novamente")
		}
	})
	return cors(mux, origem)
}

func cors(proximo http.Handler, origem string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Vary", "Origin")
		if recebida := r.Header.Get("Origin"); recebida != "" {
			if recebida != origem {
				responder(w, http.StatusForbidden, false, "Origem não permitida")
				return
			}
			w.Header().Set("Access-Control-Allow-Origin", origem)
			w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		}
		if r.Method == http.MethodOptions && r.URL.Path == "/login" {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		proximo.ServeHTTP(w, r)
	})
}
