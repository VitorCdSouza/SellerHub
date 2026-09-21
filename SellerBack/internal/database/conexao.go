package database

import (
	"context"
	"fmt"
	"net"
	"net/url"
	"os"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func Conectar(ctx context.Context) (*pgxpool.Pool, error) {
	for _, nome := range []string{"DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME", "DB_SSLMODE"} {
		if os.Getenv(nome) == "" {
			return nil, fmt.Errorf("configurar banco: variável %s obrigatória", nome)
		}
	}
	porta, err := strconv.Atoi(os.Getenv("DB_PORT"))
	if err != nil || porta < 1 || porta > 65535 {
		return nil, fmt.Errorf("configurar banco: DB_PORT inválida")
	}
	endereco := url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(os.Getenv("DB_USER"), os.Getenv("DB_PASSWORD")),
		Host:   net.JoinHostPort(os.Getenv("DB_HOST"), os.Getenv("DB_PORT")),
		Path:   "/" + os.Getenv("DB_NAME"),
	}
	parametros := url.Values{"sslmode": {os.Getenv("DB_SSLMODE")}}
	endereco.RawQuery = parametros.Encode()
	config, err := pgxpool.ParseConfig(endereco.String())
	if err != nil {
		// O erro do parser pode incluir a URL com a senha.
		return nil, fmt.Errorf("configurar banco: confira as variáveis DB_*")
	}
	config.MaxConns = 4
	config.ConnConfig.ConnectTimeout = 5 * time.Second
	banco, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, fmt.Errorf("criar conexão: %w", err)
	}
	limite, cancelar := context.WithTimeout(ctx, 5*time.Second)
	defer cancelar()
	if err := banco.Ping(limite); err != nil {
		banco.Close()
		return nil, fmt.Errorf("conectar ao PostgreSQL: %w", err)
	}
	return banco, nil
}
