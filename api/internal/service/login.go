package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"

	"sellerhub/api/internal/db"
)

var (
	ErrInvalidInput       = errors.New("dados invalidos")
	ErrInvalidCredentials = errors.New("credenciais invalidas")
	ErrNotFound           = errors.New("nao encontrado")
)

type LoginService struct {
	Queries *db.Queries
}

func (loginService *LoginService) Login(ctx context.Context, email, password string) (int32, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	// bcrypt ignora bytes alem do 72
	if email == "" || password == "" || len(password) > 72 {
		return 0, ErrInvalidInput
	}

	user, err := loginService.Queries.GetUserByEmail(ctx, email)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, ErrInvalidCredentials
	}
	if err != nil {
		return 0, fmt.Errorf("buscar usuario: %w", err)
	}
	if bcrypt.CompareHashAndPassword([]byte(user.SenhaHash), []byte(password)) != nil {
		return 0, ErrInvalidCredentials
	}
	return user.IDUsuario, nil
}

func (loginService *LoginService) User(ctx context.Context, userID int32) (db.GetUserByIdRow, error) {
	user, err := loginService.Queries.GetUserById(ctx, userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return user, ErrNotFound
	}
	if err != nil {
		return user, fmt.Errorf("buscar usuario: %w", err)
	}
	return user, nil
}
