package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"slices"
	"strings"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"

	"sellerhub/api/internal/db"
)

const (
	StatusDraft    = "rascunho"
	StatusApproved = "aprovado"
)

var (
	ErrListingExists     = errors.New("produto ja anunciado no marketplace")
	ErrListingLocked     = errors.New("anuncio nao editavel")
	ErrListingHasMetrics = errors.New("anuncio possui metricas")
)

// publicado, pausado e encerrado ja estao no marketplace
var editableStatuses = []string{"rascunho", "aprovado", "erro"}

var eanPattern = regexp.MustCompile(`^(\d{8}|\d{12,14})$`)

type ListingService struct {
	Queries *db.Queries
}

// campos especificos de canal, gravados em CAD_ANUNCIO.atributos_canal
type ChannelAttributes struct {
	Condition string `json:"condicao,omitempty"`
	Brand     string `json:"marca,omitempty"`
	EAN       string `json:"ean,omitempty"`
}

type ListingInput struct {
	ProductID     int32
	MarketplaceID int32
	Title         string
	Description   string
	Price         pgtype.Numeric
	Status        string
	Attributes    ChannelAttributes
}

type ListingDetail struct {
	db.GetAnuncioByIdRow
	Attributes ChannelAttributes
}

func (listingService *ListingService) List(ctx context.Context, userID int32) ([]db.ListAnunciosRow, error) {
	listings, err := listingService.Queries.ListAnuncios(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("listar anuncios: %w", err)
	}
	return listings, nil
}

func (listingService *ListingService) Get(ctx context.Context, userID, listingID int32) (ListingDetail, error) {
	listing, err := listingService.Queries.GetAnuncioById(ctx, db.GetAnuncioByIdParams{
		IDAnuncio: listingID,
		IDUsuario: userID,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		return ListingDetail{}, ErrNotFound
	}
	if err != nil {
		return ListingDetail{}, fmt.Errorf("buscar anuncio: %w", err)
	}
	detail := ListingDetail{GetAnuncioByIdRow: listing}
	if err := json.Unmarshal(listing.AtributosCanal, &detail.Attributes); err != nil {
		return ListingDetail{}, fmt.Errorf("ler atributos do anuncio: %w", err)
	}
	return detail, nil
}

func (listingService *ListingService) Create(ctx context.Context, userID int32, input ListingInput) (int32, error) {
	input, attributes, err := validateListing(input)
	if err != nil {
		return 0, err
	}
	// confere se o produto e do usuario antes de anunciar
	productService := ProductService{Queries: listingService.Queries}
	if _, err := productService.Get(ctx, userID, input.ProductID); err != nil {
		return 0, err
	}
	listingID, err := listingService.Queries.CreateAnuncio(ctx, db.CreateAnuncioParams{
		IDMarketplace:    input.MarketplaceID,
		IDProduto:        input.ProductID,
		TituloAnuncio:    input.Title,
		DescricaoAnuncio: pgtype.Text{String: input.Description, Valid: input.Description != ""},
		PrecoVenda:       input.Price,
		StatusCampo:      input.Status,
		AtributosCanal:   attributes,
	})
	// 23505 e a unique produto + marketplace
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23505" {
		return 0, ErrListingExists
	}
	if err != nil {
		return 0, fmt.Errorf("criar anuncio: %w", err)
	}
	return listingID, nil
}

func (listingService *ListingService) Update(ctx context.Context, userID, listingID int32, input ListingInput) error {
	input, attributes, err := validateListing(input)
	if err != nil {
		return err
	}
	current, err := listingService.Get(ctx, userID, listingID)
	if err != nil {
		return err
	}
	if !slices.Contains(editableStatuses, current.StatusCampo) {
		return ErrListingLocked
	}
	err = listingService.Queries.UpdateAnuncio(ctx, db.UpdateAnuncioParams{
		IDAnuncio:        listingID,
		TituloAnuncio:    input.Title,
		DescricaoAnuncio: pgtype.Text{String: input.Description, Valid: input.Description != ""},
		PrecoVenda:       input.Price,
		StatusCampo:      input.Status,
		AtributosCanal:   attributes,
	})
	if err != nil {
		return fmt.Errorf("atualizar anuncio: %w", err)
	}
	return nil
}

func (listingService *ListingService) Delete(ctx context.Context, userID, listingID int32) error {
	current, err := listingService.Get(ctx, userID, listingID)
	if err != nil {
		return err
	}
	if !slices.Contains(editableStatuses, current.StatusCampo) {
		return ErrListingLocked
	}
	deleted, err := listingService.Queries.DeleteAnuncio(ctx, db.DeleteAnuncioParams{
		IDAnuncio: listingID,
		IDUsuario: userID,
	})
	// 23503 e a fk de HIST_METRICA_ANUNCIO barrando a exclusao
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == "23503" {
		return ErrListingHasMetrics
	}
	if err != nil {
		return fmt.Errorf("excluir anuncio: %w", err)
	}
	if deleted == 0 {
		return ErrNotFound
	}
	return nil
}

func (listingService *ListingService) Marketplaces(ctx context.Context, userID int32) ([]db.ListMarketplacesComResumoRow, error) {
	marketplaces, err := listingService.Queries.ListMarketplacesComResumo(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("listar marketplaces: %w", err)
	}
	return marketplaces, nil
}

// rascunho aceita dados incompletos; aprovado exige descricao e condicao
func validateListing(input ListingInput) (ListingInput, []byte, error) {
	input.Title = strings.TrimSpace(input.Title)
	input.Description = strings.TrimSpace(input.Description)
	input.Attributes.Brand = strings.TrimSpace(input.Attributes.Brand)
	input.Attributes.EAN = strings.TrimSpace(input.Attributes.EAN)

	if input.Status != StatusDraft && input.Status != StatusApproved {
		return input, nil, ErrInvalidInput
	}
	if input.Title == "" || utf8.RuneCountInString(input.Title) > 255 || !validPrice(input.Price) {
		return input, nil, ErrInvalidInput
	}
	if !slices.Contains([]string{"", "novo", "usado"}, input.Attributes.Condition) {
		return input, nil, ErrInvalidInput
	}
	if utf8.RuneCountInString(input.Attributes.Brand) > 100 {
		return input, nil, ErrInvalidInput
	}
	if input.Attributes.EAN != "" && !eanPattern.MatchString(input.Attributes.EAN) {
		return input, nil, ErrInvalidInput
	}
	if input.Status == StatusApproved && (input.Description == "" || input.Attributes.Condition == "") {
		return input, nil, ErrInvalidInput
	}

	attributes, err := json.Marshal(input.Attributes)
	if err != nil {
		return input, nil, fmt.Errorf("serializar atributos do anuncio: %w", err)
	}
	return input, attributes, nil
}
