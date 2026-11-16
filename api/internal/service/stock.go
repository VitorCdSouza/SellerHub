package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"

	"sellerhub/api/internal/db"
)

type StockService struct {
	Queries *db.Queries
}

func (stockService *StockService) List(ctx context.Context, userID int32) ([]db.ListEstoqueRow, error) {
	items, err := stockService.Queries.ListEstoque(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("listar estoque: %w", err)
	}
	return items, nil
}

func (stockService *StockService) AddEntry(ctx context.Context, userID, productID, quantity int32) (int32, error) {
	if quantity < 1 || quantity > 100000 {
		return 0, ErrInvalidInput
	}
	stock, err := stockService.Queries.AddSaldo(ctx, db.AddSaldoParams{
		IDProduto:  productID,
		IDUsuario:  userID,
		Quantidade: quantity,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, ErrNotFound
	}
	if err != nil {
		return 0, fmt.Errorf("registrar entrada de estoque: %w", err)
	}
	return stock, nil
}
