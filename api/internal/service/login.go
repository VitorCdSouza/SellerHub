package service

import (
	"context"
	"errors"
	"fmt"
	"net/mail"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"sellerhub/sellerback/internal/repository"
)

var (
	ErrDadosInvalidos       = errors.New("informe um e-mail válido e uma senha de até 72 bytes")
	ErrCredenciaisInvalidas = errors.New("credenciais inválidas")
)

type ConsultaUsuario interface {
	BuscarHash(context.Context, string) (string, error)
}

type Login struct {
	Usuarios ConsultaUsuario
}

func (s *Login) Entrar(ctx context.Context, email, senha string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	endereco, err := mail.ParseAddress(email)
	if err != nil || endereco.Address != email || len(email) > 254 || len(senha) == 0 || len(senha) > 72 {
		return ErrDadosInvalidos
	}
	hash, err := s.Usuarios.BuscarHash(ctx, email)
	if errors.Is(err, repository.ErrUsuarioNaoEncontrado) {
		return ErrCredenciaisInvalidas
	}
	if err != nil {
		return fmt.Errorf("realizar login: %w", err)
	}
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(senha)); err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			return ErrCredenciaisInvalidas
		}
		return fmt.Errorf("verificar hash armazenado: %w", err)
	}
	return nil
}
