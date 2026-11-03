package controller

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"sellerhub/api/internal/service"
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
	Session *service.SessionService
}

func (loginController *LoginController) Login(writer http.ResponseWriter, request *http.Request) {
	var credentials loginRequest
	if err := json.NewDecoder(http.MaxBytesReader(writer, request.Body, 4096)).Decode(&credentials); err != nil {
		respond(writer, http.StatusBadRequest, false, "JSON inválido")
		return
	}

	userID, err := loginController.Service.Login(request.Context(), credentials.Email, credentials.Password)
	switch {
	case err == nil:
		loginController.startSession(writer, userID)
	case errors.Is(err, service.ErrInvalidInput):
		respond(writer, http.StatusBadRequest, false, "Informe e-mail e senha de até 72 bytes")
	case errors.Is(err, service.ErrInvalidCredentials):
		respond(writer, http.StatusUnauthorized, false, "Credenciais inválidas")
	default:
		log.Printf("login: %v", err)
		respond(writer, http.StatusInternalServerError, false, "Não foi possível realizar o login")
	}
}

func (loginController *LoginController) startSession(writer http.ResponseWriter, userID int64) {
	token, err := loginController.Session.Create(userID)
	if err != nil {
		log.Printf("login: %v", err)
		respond(writer, http.StatusInternalServerError, false, "Não foi possível realizar o login")
		return
	}
	http.SetCookie(writer, &http.Cookie{
		Name:     "sessao",
		Value:    token,
		Path:     "/",
		MaxAge:   int(service.SessionDuration.Seconds()),
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	})
	respond(writer, http.StatusOK, true, "Login realizado com sucesso")
}

func respond(writer http.ResponseWriter, status int, success bool, message string) {
	writer.Header().Set("Content-Type", "application/json; charset=utf-8")
	writer.WriteHeader(status)
	_ = json.NewEncoder(writer).Encode(response{Success: success, Message: message})
}
