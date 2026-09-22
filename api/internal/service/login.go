package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"

	"saleshub/api/internal/db"
)

var (
	ErrInvalidInput       = errors.New("dados invalidos")
	ErrInvalidCredentials = errors.New("credenciais invalidas")
)

type LoginService struct {
	Queries *db.Queries
}

func (s *LoginService) Login(ctx context.Context, email, password string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	// bcrypt ignora bytes alem do 72
	if email == "" || password == "" || len(password) > 72 {
		return ErrInvalidInput
	}

	hash, err := s.Queries.GetPasswordHash(ctx, email)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrInvalidCredentials
	}
	if err != nil {
		return fmt.Errorf("buscar usuario: %w", err)
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) != nil {
		return ErrInvalidCredentials
	}
	return nil
}
