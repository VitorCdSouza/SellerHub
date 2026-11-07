package controller

import (
	"context"
	"net/http"

	"sellerhub/api/internal/service"
)

const sessionCookie = "sessao"

type userIDKey struct{}

func RequireSession(session *service.SessionService, next http.HandlerFunc) http.HandlerFunc {
	return func(writer http.ResponseWriter, request *http.Request) {
		cookie, err := request.Cookie(sessionCookie)
		if err != nil {
			respond(writer, http.StatusUnauthorized, false, "Faça login para continuar")
			return
		}
		userID, err := session.Validate(cookie.Value)
		if err != nil {
			respond(writer, http.StatusUnauthorized, false, "Sessão inválida ou expirada")
			return
		}
		next(writer, request.WithContext(context.WithValue(request.Context(), userIDKey{}, userID)))
	}
}

// so vale em rotas protegidas por RequireSession
func sessionUserID(request *http.Request) int32 {
	return request.Context().Value(userIDKey{}).(int32)
}
