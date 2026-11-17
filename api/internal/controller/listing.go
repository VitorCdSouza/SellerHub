package controller

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"github.com/jackc/pgx/v5/pgtype"

	"sellerhub/api/internal/service"
)

type attributesJSON struct {
	Condition string `json:"condition"`
	Brand     string `json:"brand"`
	EAN       string `json:"ean"`
}

type listingRequest struct {
	ProductID     int32          `json:"productId"`
	MarketplaceID int32          `json:"marketplaceId"`
	Title         string         `json:"title"`
	Description   string         `json:"description"`
	Price         pgtype.Numeric `json:"price"`
	Status        string         `json:"status"`
	Attributes    attributesJSON `json:"attributes"`
}

type listingSummary struct {
	ID            int32          `json:"id"`
	MarketplaceID int32          `json:"marketplaceId"`
	Marketplace   string         `json:"marketplace"`
	ProductID     int32          `json:"productId"`
	Product       string         `json:"product"`
	SKU           string         `json:"sku"`
	Title         string         `json:"title"`
	Price         pgtype.Numeric `json:"price"`
	Status        string         `json:"status"`
}

type listingDetail struct {
	listingSummary
	Stock       int32          `json:"stock"`
	Description string         `json:"description"`
	Attributes  attributesJSON `json:"attributes"`
}

type marketplaceResponse struct {
	ID         int32          `json:"id"`
	Name       string         `json:"name"`
	Commission pgtype.Numeric `json:"commission"`
	Listings   int32          `json:"listings"`
}

const invalidListingMessage = "Informe título (até 255 caracteres) e preço maior que zero com até 2 casas decimais. Para publicar, informe também descrição e condição. EAN, se informado, deve ter 8, 12, 13 ou 14 dígitos"

type ListingController struct {
	Service *service.ListingService
}

func (listingController *ListingController) List(writer http.ResponseWriter, request *http.Request) {
	listings, err := listingController.Service.List(request.Context(), sessionUserID(request))
	if err != nil {
		log.Printf("listar anuncios: %v", err)
		respond(writer, http.StatusInternalServerError, false, "Não foi possível listar os anúncios")
		return
	}
	items := make([]listingSummary, 0, len(listings))
	for _, listing := range listings {
		items = append(items, listingSummary{
			ID:            listing.IDAnuncio,
			MarketplaceID: listing.IDMarketplace,
			Marketplace:   listing.NomeMarketplace,
			ProductID:     listing.IDProduto,
			Product:       listing.NomeProduto,
			SKU:           listing.Sku,
			Title:         listing.TituloAnuncio,
			Price:         listing.PrecoVenda,
			Status:        listing.StatusCampo,
		})
	}
	writeJSON(writer, http.StatusOK, items)
}

func (listingController *ListingController) Get(writer http.ResponseWriter, request *http.Request) {
	listingID, ok := pathID(request)
	if !ok {
		respond(writer, http.StatusNotFound, false, "Anúncio não encontrado")
		return
	}

	listing, err := listingController.Service.Get(request.Context(), sessionUserID(request), listingID)
	switch {
	case err == nil:
		writeJSON(writer, http.StatusOK, listingDetail{
			listingSummary: listingSummary{
				ID:            listing.IDAnuncio,
				MarketplaceID: listing.IDMarketplace,
				Marketplace:   listing.NomeMarketplace,
				ProductID:     listing.IDProduto,
				Product:       listing.NomeProduto,
				SKU:           listing.Sku,
				Title:         listing.TituloAnuncio,
				Price:         listing.PrecoVenda,
				Status:        listing.StatusCampo,
			},
			Stock:       listing.Saldo,
			Description: listing.DescricaoAnuncio.String,
			Attributes: attributesJSON{
				Condition: listing.Attributes.Condition,
				Brand:     listing.Attributes.Brand,
				EAN:       listing.Attributes.EAN,
			},
		})
	case errors.Is(err, service.ErrNotFound):
		respond(writer, http.StatusNotFound, false, "Anúncio não encontrado")
	default:
		log.Printf("buscar anuncio: %v", err)
		respond(writer, http.StatusInternalServerError, false, "Não foi possível buscar o anúncio")
	}
}

func (listingController *ListingController) Create(writer http.ResponseWriter, request *http.Request) {
	input, ok := decodeListing(writer, request)
	if !ok {
		return
	}

	listingID, err := listingController.Service.Create(request.Context(), sessionUserID(request), input)
	switch {
	case err == nil:
		writeJSON(writer, http.StatusCreated, createdResponse{ID: listingID})
	case errors.Is(err, service.ErrInvalidInput):
		respond(writer, http.StatusBadRequest, false, invalidListingMessage)
	case errors.Is(err, service.ErrNotFound):
		respond(writer, http.StatusNotFound, false, "Produto não encontrado")
	case errors.Is(err, service.ErrListingExists):
		respond(writer, http.StatusConflict, false, "O produto já possui anúncio neste marketplace")
	default:
		log.Printf("criar anuncio: %v", err)
		respond(writer, http.StatusInternalServerError, false, "Não foi possível cadastrar o anúncio")
	}
}

func (listingController *ListingController) Update(writer http.ResponseWriter, request *http.Request) {
	listingID, ok := pathID(request)
	if !ok {
		respond(writer, http.StatusNotFound, false, "Anúncio não encontrado")
		return
	}
	input, ok := decodeListing(writer, request)
	if !ok {
		return
	}

	err := listingController.Service.Update(request.Context(), sessionUserID(request), listingID, input)
	switch {
	case err == nil:
		respond(writer, http.StatusOK, true, "Anúncio atualizado")
	case errors.Is(err, service.ErrInvalidInput):
		respond(writer, http.StatusBadRequest, false, invalidListingMessage)
	case errors.Is(err, service.ErrNotFound):
		respond(writer, http.StatusNotFound, false, "Anúncio não encontrado")
	case errors.Is(err, service.ErrListingLocked):
		respond(writer, http.StatusConflict, false, "Anúncio publicado, pausado ou encerrado não pode ser editado")
	default:
		log.Printf("atualizar anuncio: %v", err)
		respond(writer, http.StatusInternalServerError, false, "Não foi possível atualizar o anúncio")
	}
}

func (listingController *ListingController) Delete(writer http.ResponseWriter, request *http.Request) {
	listingID, ok := pathID(request)
	if !ok {
		respond(writer, http.StatusNotFound, false, "Anúncio não encontrado")
		return
	}

	err := listingController.Service.Delete(request.Context(), sessionUserID(request), listingID)
	switch {
	case err == nil:
		respond(writer, http.StatusOK, true, "Anúncio excluído")
	case errors.Is(err, service.ErrNotFound):
		respond(writer, http.StatusNotFound, false, "Anúncio não encontrado")
	case errors.Is(err, service.ErrListingLocked):
		respond(writer, http.StatusConflict, false, "Anúncio publicado, pausado ou encerrado não pode ser excluído")
	case errors.Is(err, service.ErrListingHasMetrics):
		respond(writer, http.StatusConflict, false, "O anúncio possui métricas registradas e não pode ser excluído")
	default:
		log.Printf("excluir anuncio: %v", err)
		respond(writer, http.StatusInternalServerError, false, "Não foi possível excluir o anúncio")
	}
}

func (listingController *ListingController) Marketplaces(writer http.ResponseWriter, request *http.Request) {
	marketplaces, err := listingController.Service.Marketplaces(request.Context(), sessionUserID(request))
	if err != nil {
		log.Printf("listar marketplaces: %v", err)
		respond(writer, http.StatusInternalServerError, false, "Não foi possível listar os marketplaces")
		return
	}
	items := make([]marketplaceResponse, 0, len(marketplaces))
	for _, marketplace := range marketplaces {
		items = append(items, marketplaceResponse{
			ID:         marketplace.IDMarketplace,
			Name:       marketplace.NomeMarketplace,
			Commission: marketplace.TaxaComissao,
			Listings:   marketplace.TotalAnuncios,
		})
	}
	writeJSON(writer, http.StatusOK, items)
}

func decodeListing(writer http.ResponseWriter, request *http.Request) (service.ListingInput, bool) {
	var body listingRequest
	// a descricao aceita ate 50000 caracteres
	if err := json.NewDecoder(http.MaxBytesReader(writer, request.Body, 256*1024)).Decode(&body); err != nil {
		respond(writer, http.StatusBadRequest, false, "JSON inválido")
		return service.ListingInput{}, false
	}
	return service.ListingInput{
		ProductID:     body.ProductID,
		MarketplaceID: body.MarketplaceID,
		Title:         body.Title,
		Description:   body.Description,
		Price:         body.Price,
		Status:        body.Status,
		Attributes: service.ChannelAttributes{
			Condition: body.Attributes.Condition,
			Brand:     body.Attributes.Brand,
			EAN:       body.Attributes.EAN,
		},
	}, true
}
