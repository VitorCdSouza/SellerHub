package controller

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/jackc/pgx/v5/pgtype"

	"sellerhub/api/internal/service"
)

// pgtype.Numeric vira numero no json sem passar por float
type productRequest struct {
	Name      string         `json:"name"`
	SKU       string         `json:"sku"`
	BasePrice pgtype.Numeric `json:"basePrice"`
}

type productResponse struct {
	ID        int32          `json:"id"`
	Name      string         `json:"name"`
	SKU       string         `json:"sku"`
	BasePrice pgtype.Numeric `json:"basePrice"`
}

type productPage struct {
	Items []productResponse `json:"items"`
	Total int64             `json:"total"`
}

type createdResponse struct {
	ID int32 `json:"id"`
}

const invalidProductMessage = "Informe nome (até 255 caracteres), SKU (até 100) e preço base maior que zero com até 2 casas decimais"

type ProductController struct {
	Service *service.ProductService
}

func (productController *ProductController) List(writer http.ResponseWriter, request *http.Request) {
	page, pageErr := queryInt32(request, "pagina", 1)
	pageSize, sizeErr := queryInt32(request, "limite", service.DefaultPageSize)
	if pageErr != nil || sizeErr != nil {
		respond(writer, http.StatusBadRequest, false, "Parâmetros de paginação inválidos")
		return
	}

	products, total, err := productController.Service.List(request.Context(), sessionUserID(request), page, pageSize)
	switch {
	case err == nil:
		items := make([]productResponse, 0, len(products))
		for _, product := range products {
			items = append(items, productResponse{
				ID:        product.IDProduto,
				Name:      product.NomeProduto,
				SKU:       product.Sku,
				BasePrice: product.PrecoBase,
			})
		}
		writeJSON(writer, http.StatusOK, productPage{Items: items, Total: total})
	case errors.Is(err, service.ErrInvalidInput):
		respond(writer, http.StatusBadRequest, false, "Parâmetros de paginação inválidos")
	default:
		log.Printf("listar produtos: %v", err)
		respond(writer, http.StatusInternalServerError, false, "Não foi possível listar os produtos")
	}
}

func (productController *ProductController) Get(writer http.ResponseWriter, request *http.Request) {
	productID, ok := pathID(request)
	if !ok {
		respond(writer, http.StatusNotFound, false, "Produto não encontrado")
		return
	}

	product, err := productController.Service.Get(request.Context(), sessionUserID(request), productID)
	switch {
	case err == nil:
		writeJSON(writer, http.StatusOK, productResponse{
			ID:        product.IDProduto,
			Name:      product.NomeProduto,
			SKU:       product.Sku,
			BasePrice: product.PrecoBase,
		})
	case errors.Is(err, service.ErrNotFound):
		respond(writer, http.StatusNotFound, false, "Produto não encontrado")
	default:
		log.Printf("buscar produto: %v", err)
		respond(writer, http.StatusInternalServerError, false, "Não foi possível buscar o produto")
	}
}

func (productController *ProductController) Create(writer http.ResponseWriter, request *http.Request) {
	input, ok := decodeProduct(writer, request)
	if !ok {
		return
	}

	productID, err := productController.Service.Create(request.Context(), sessionUserID(request), input)
	switch {
	case err == nil:
		writeJSON(writer, http.StatusCreated, createdResponse{ID: productID})
	case errors.Is(err, service.ErrInvalidInput):
		respond(writer, http.StatusBadRequest, false, invalidProductMessage)
	default:
		log.Printf("criar produto: %v", err)
		respond(writer, http.StatusInternalServerError, false, "Não foi possível cadastrar o produto")
	}
}

func (productController *ProductController) Update(writer http.ResponseWriter, request *http.Request) {
	productID, ok := pathID(request)
	if !ok {
		respond(writer, http.StatusNotFound, false, "Produto não encontrado")
		return
	}
	input, ok := decodeProduct(writer, request)
	if !ok {
		return
	}

	err := productController.Service.Update(request.Context(), sessionUserID(request), productID, input)
	switch {
	case err == nil:
		respond(writer, http.StatusOK, true, "Produto atualizado")
	case errors.Is(err, service.ErrInvalidInput):
		respond(writer, http.StatusBadRequest, false, invalidProductMessage)
	case errors.Is(err, service.ErrNotFound):
		respond(writer, http.StatusNotFound, false, "Produto não encontrado")
	default:
		log.Printf("atualizar produto: %v", err)
		respond(writer, http.StatusInternalServerError, false, "Não foi possível atualizar o produto")
	}
}

func decodeProduct(writer http.ResponseWriter, request *http.Request) (service.ProductInput, bool) {
	var body productRequest
	if err := json.NewDecoder(http.MaxBytesReader(writer, request.Body, 4096)).Decode(&body); err != nil {
		respond(writer, http.StatusBadRequest, false, "JSON inválido")
		return service.ProductInput{}, false
	}
	return service.ProductInput{Name: body.Name, SKU: body.SKU, BasePrice: body.BasePrice}, true
}

func pathID(request *http.Request) (int32, bool) {
	id, err := strconv.ParseInt(request.PathValue("id"), 10, 32)
	return int32(id), err == nil && id > 0
}

func queryInt32(request *http.Request, name string, fallback int32) (int32, error) {
	text := request.URL.Query().Get(name)
	if text == "" {
		return fallback, nil
	}
	value, err := strconv.ParseInt(text, 10, 32)
	return int32(value), err
}
