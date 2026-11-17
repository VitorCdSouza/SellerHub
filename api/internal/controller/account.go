package controller

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"sellerhub/api/internal/service"
)

type accountRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type passwordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}

type AccountController struct {
	Service *service.AccountService
}

func (accountController *AccountController) Update(writer http.ResponseWriter, request *http.Request) {
	var body accountRequest
	if err := json.NewDecoder(http.MaxBytesReader(writer, request.Body, 4096)).Decode(&body); err != nil {
		respond(writer, http.StatusBadRequest, false, "JSON inválido")
		return
	}

	err := accountController.Service.Update(request.Context(), sessionUserID(request), body.Name, body.Email)
	switch {
	case err == nil:
		respond(writer, http.StatusOK, true, "Conta atualizada")
	case errors.Is(err, service.ErrInvalidInput):
		respond(writer, http.StatusBadRequest, false, "Informe nome e e-mail válido, cada um com até 255 caracteres")
	case errors.Is(err, service.ErrEmailInUse):
		respond(writer, http.StatusConflict, false, "Este e-mail já é usado por outra conta")
	case errors.Is(err, service.ErrNotFound):
		respond(writer, http.StatusUnauthorized, false, "Sessão inválida ou expirada")
	default:
		log.Printf("atualizar conta: %v", err)
		respond(writer, http.StatusInternalServerError, false, "Não foi possível atualizar a conta")
	}
}

// senha atual errada responde 403 porque 401 encerraria a sessao no front
func (accountController *AccountController) ChangePassword(writer http.ResponseWriter, request *http.Request) {
	var body passwordRequest
	if err := json.NewDecoder(http.MaxBytesReader(writer, request.Body, 4096)).Decode(&body); err != nil {
		respond(writer, http.StatusBadRequest, false, "JSON inválido")
		return
	}

	err := accountController.Service.ChangePassword(request.Context(), sessionUserID(request), body.CurrentPassword, body.NewPassword)
	switch {
	case err == nil:
		respond(writer, http.StatusOK, true, "Senha alterada")
	case errors.Is(err, service.ErrInvalidInput):
		respond(writer, http.StatusBadRequest, false, "Informe a senha atual e uma nova senha entre 8 e 72 bytes")
	case errors.Is(err, service.ErrWrongPassword):
		respond(writer, http.StatusForbidden, false, "Senha atual incorreta")
	case errors.Is(err, service.ErrNotFound):
		respond(writer, http.StatusUnauthorized, false, "Sessão inválida ou expirada")
	default:
		log.Printf("alterar senha: %v", err)
		respond(writer, http.StatusInternalServerError, false, "Não foi possível alterar a senha")
	}
}
