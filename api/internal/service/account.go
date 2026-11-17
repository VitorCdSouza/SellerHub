package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"golang.org/x/crypto/bcrypt"

	"sellerhub/api/internal/db"
)

var (
	ErrEmailInUse    = errors.New("email em uso")
	ErrWrongPassword = errors.New("senha atual incorreta")
)

type AccountService struct {
	Queries *db.Queries
}

// o email fica em minusculas porque o login compara assim
func (accountService *AccountService) Update(ctx context.Context, userID int32, name, email string) error {
	name = strings.TrimSpace(name)
	email = strings.ToLower(strings.TrimSpace(email))
	if name == "" || utf8.RuneCountInString(name) > 255 {
		return ErrInvalidInput
	}
	if !strings.Contains(email, "@") || utf8.RuneCountInString(email) > 255 {
		return ErrInvalidInput
	}

	updated, err := accountService.Queries.UpdateConta(ctx, db.UpdateContaParams{
		IDUsuario: userID,
		Nome:      name,
		Email:     email,
	})
	// 23505 e o email unico de CAD_USUARIO
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return ErrEmailInUse
	}
	if err != nil {
		return fmt.Errorf("atualizar conta: %w", err)
	}
	if updated == 0 {
		return ErrNotFound
	}
	return nil
}

// bcrypt ignora bytes alem do 72
func (accountService *AccountService) ChangePassword(ctx context.Context, userID int32, current, next string) error {
	if current == "" || len(next) < 8 || len(next) > 72 {
		return ErrInvalidInput
	}

	hash, err := accountService.Queries.GetSenhaHash(ctx, userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return fmt.Errorf("buscar senha: %w", err)
	}
	if bcrypt.CompareHashAndPassword([]byte(hash), []byte(current)) != nil {
		return ErrWrongPassword
	}

	newHash, err := bcrypt.GenerateFromPassword([]byte(next), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("gerar hash da senha: %w", err)
	}
	if _, err := accountService.Queries.UpdateSenha(ctx, db.UpdateSenhaParams{
		IDUsuario: userID,
		SenhaHash: string(newHash),
	}); err != nil {
		return fmt.Errorf("atualizar senha: %w", err)
	}
	return nil
}
