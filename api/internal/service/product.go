package service

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"

	"sellerhub/api/internal/db"
)

const (
	DefaultPageSize = 20
	MaxPageSize     = 100
)

var ErrProductHasListings = errors.New("produto possui anuncios")

type ProductService struct {
	Queries *db.Queries
}

type ProductInput struct {
	Name      string
	SKU       string
	BasePrice pgtype.Numeric
}

func (productService *ProductService) List(ctx context.Context, userID, page, pageSize int32) ([]db.ListProdutosRow, int64, error) {
	if page < 1 || pageSize < 1 || pageSize > MaxPageSize {
		return nil, 0, ErrInvalidInput
	}
	// o offset gerado pelo sqlc e int32
	offset := int64(page-1) * int64(pageSize)
	if offset > math.MaxInt32 {
		return nil, 0, ErrInvalidInput
	}
	products, err := productService.Queries.ListProdutos(ctx, db.ListProdutosParams{
		IDUsuario: userID,
		Limit:     pageSize,
		Offset:    int32(offset),
	})
	if err != nil {
		return nil, 0, fmt.Errorf("listar produtos: %w", err)
	}
	total, err := productService.Queries.CountProdutos(ctx, userID)
	if err != nil {
		return nil, 0, fmt.Errorf("contar produtos: %w", err)
	}
	return products, total, nil
}

func (productService *ProductService) Get(ctx context.Context, userID, productID int32) (db.CadProduto, error) {
	product, err := productService.Queries.GetProdutoById(ctx, db.GetProdutoByIdParams{
		IDProduto: productID,
		IDUsuario: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return product, ErrNotFound
	}
	if err != nil {
		return product, fmt.Errorf("buscar produto: %w", err)
	}
	return product, nil
}

func (productService *ProductService) Create(ctx context.Context, userID int32, input ProductInput) (int32, error) {
	input, err := validateProduct(input)
	if err != nil {
		return 0, err
	}
	productID, err := productService.Queries.CreateProduto(ctx, db.CreateProdutoParams{
		IDUsuario:   userID,
		Sku:         input.SKU,
		NomeProduto: input.Name,
		PrecoBase:   input.BasePrice,
	})
	if err != nil {
		return 0, fmt.Errorf("criar produto: %w", err)
	}
	return productID, nil
}

func (productService *ProductService) Update(ctx context.Context, userID, productID int32, input ProductInput) error {
	input, err := validateProduct(input)
	if err != nil {
		return err
	}
	updated, err := productService.Queries.UpdateProduto(ctx, db.UpdateProdutoParams{
		IDProduto:   productID,
		IDUsuario:   userID,
		Sku:         input.SKU,
		NomeProduto: input.Name,
		PrecoBase:   input.BasePrice,
	})
	if err != nil {
		return fmt.Errorf("atualizar produto: %w", err)
	}
	if updated == 0 {
		return ErrNotFound
	}
	return nil
}

func (productService *ProductService) Delete(ctx context.Context, userID, productID int32) error {
	deleted, err := productService.Queries.DeleteProduto(ctx, db.DeleteProdutoParams{
		IDProduto: productID,
		IDUsuario: userID,
	})
	// 23503 e a fk de CAD_ANUNCIO barrando a exclusao
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23503" {
		return ErrProductHasListings
	}
	if err != nil {
		return fmt.Errorf("excluir produto: %w", err)
	}
	if deleted == 0 {
		return ErrNotFound
	}
	return nil
}

// limites seguem as colunas de CAD_PRODUTO
func validateProduct(input ProductInput) (ProductInput, error) {
	input.Name = strings.TrimSpace(input.Name)
	input.SKU = strings.TrimSpace(input.SKU)
	if input.Name == "" || utf8.RuneCountInString(input.Name) > 255 {
		return input, ErrInvalidInput
	}
	if input.SKU == "" || utf8.RuneCountInString(input.SKU) > 100 {
		return input, ErrInvalidInput
	}
	if !validPrice(input.BasePrice) {
		return input, ErrInvalidInput
	}
	return input, nil
}

// cabe em DECIMAL(10,2): maior que zero, menor que 1e8 e ate 2 casas
func validPrice(value pgtype.Numeric) bool {
	// o float so valida; o valor gravado continua exato
	price, err := value.Float64Value()
	if err != nil || !price.Valid || !(price.Float64 > 0 && price.Float64 < 1e8) {
		return false
	}
	return math.Round(price.Float64*100)/100 == price.Float64
}
