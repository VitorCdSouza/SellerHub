package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrUsuarioNaoEncontrado = errors.New("usuário não encontrado")

type Usuarios struct {
	Banco *pgxpool.Pool
}

func (r *Usuarios) BuscarHash(ctx context.Context, email string) (string, error) {
	var hash string
	err := r.Banco.QueryRow(ctx, `SELECT password FROM users WHERE email = $1`, email).Scan(&hash)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrUsuarioNaoEncontrado
	}
	if err != nil {
		return "", fmt.Errorf("consultar usuário: %w", err)
	}
	return hash, nil
}
