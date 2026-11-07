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

type userResponse struct {
	ID    int32  `json:"id"`
	Email string `json:"email"`
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

// o jwt continua valido ate expirar; logout so remove o cookie do navegador
func (loginController *LoginController) Logout(writer http.ResponseWriter, request *http.Request) {
	http.SetCookie(writer, &http.Cookie{
		Name:     sessionCookie,
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	})
	respond(writer, http.StatusOK, true, "Sessão encerrada")
}

func (loginController *LoginController) CurrentUser(writer http.ResponseWriter, request *http.Request) {
	user, err := loginController.Service.User(request.Context(), sessionUserID(request))
	switch {
	case err == nil:
		writeJSON(writer, http.StatusOK, userResponse{ID: user.IDUsuario, Email: user.Email})
	case errors.Is(err, service.ErrNotFound):
		respond(writer, http.StatusUnauthorized, false, "Sessão inválida ou expirada")
	default:
		log.Printf("sessao: %v", err)
		respond(writer, http.StatusInternalServerError, false, "Não foi possível consultar a sessão")
	}
}

func (loginController *LoginController) startSession(writer http.ResponseWriter, userID int32) {
	token, err := loginController.Session.Create(userID)
	if err != nil {
		log.Printf("login: %v", err)
		respond(writer, http.StatusInternalServerError, false, "Não foi possível realizar o login")
		return
	}
	http.SetCookie(writer, &http.Cookie{
		Name:     sessionCookie,
		Value:    token,
		Path:     "/",
		MaxAge:   int(service.SessionDuration.Seconds()),
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	})
	respond(writer, http.StatusOK, true, "Login realizado com sucesso")
}
