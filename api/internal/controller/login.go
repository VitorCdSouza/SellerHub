package controller

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"saleshub/api/internal/service"
)

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type response struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

type LoginController struct {
	Service *service.LoginService
}

func (c *LoginController) Login(w http.ResponseWriter, r *http.Request) {
	var request loginRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 4096)).Decode(&request); err != nil {
		respond(w, http.StatusBadRequest, false, "JSON inválido")
		return
	}

	err := c.Service.Login(r.Context(), request.Email, request.Password)
	switch {
	case err == nil:
		respond(w, http.StatusOK, true, "Login realizado com sucesso")
	case errors.Is(err, service.ErrInvalidInput):
		respond(w, http.StatusBadRequest, false, "Informe e-mail e senha de até 72 bytes")
	case errors.Is(err, service.ErrInvalidCredentials):
		respond(w, http.StatusUnauthorized, false, "Credenciais inválidas")
	default:
		log.Printf("login: %v", err)
		respond(w, http.StatusInternalServerError, false, "Não foi possível realizar o login")
	}
}

func respond(w http.ResponseWriter, status int, success bool, message string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(response{Success: success, Message: message})
}
