package controller

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"time"

	"sellerhub/api/internal/service"
)

type stockItem struct {
	ID             int32     `json:"id"`
	Name           string    `json:"name"`
	SKU            string    `json:"sku"`
	Stock          int32     `json:"stock"`
	StockUpdatedAt time.Time `json:"stockUpdatedAt"`
}

type stockEntryRequest struct {
	Quantity int32 `json:"quantity"`
}

type stockEntryResponse struct {
	Stock int32 `json:"stock"`
}

type StockController struct {
	Service *service.StockService
}

func (stockController *StockController) List(writer http.ResponseWriter, request *http.Request) {
	products, err := stockController.Service.List(request.Context(), sessionUserID(request))
	if err != nil {
		log.Printf("listar estoque: %v", err)
		respond(writer, http.StatusInternalServerError, false, "Não foi possível listar o estoque")
		return
	}
	items := make([]stockItem, 0, len(products))
	for _, product := range products {
		items = append(items, stockItem{
			ID:             product.IDProduto,
			Name:           product.NomeProduto,
			SKU:            product.Sku,
			Stock:          product.Saldo,
			StockUpdatedAt: product.SaldoAtualizadoEm.Time,
		})
	}
	writeJSON(writer, http.StatusOK, items)
}

func (stockController *StockController) AddEntry(writer http.ResponseWriter, request *http.Request) {
	productID, ok := pathID(request)
	if !ok {
		respond(writer, http.StatusNotFound, false, "Produto não encontrado")
		return
	}
	var body stockEntryRequest
	if err := json.NewDecoder(http.MaxBytesReader(writer, request.Body, 1024)).Decode(&body); err != nil {
		respond(writer, http.StatusBadRequest, false, "JSON inválido")
		return
	}

	stock, err := stockController.Service.AddEntry(request.Context(), sessionUserID(request), productID, body.Quantity)
	switch {
	case err == nil:
		writeJSON(writer, http.StatusOK, stockEntryResponse{Stock: stock})
	case errors.Is(err, service.ErrInvalidInput):
		respond(writer, http.StatusBadRequest, false, "Informe uma quantidade inteira entre 1 e 100000")
	case errors.Is(err, service.ErrNotFound):
		respond(writer, http.StatusNotFound, false, "Produto não encontrado")
	default:
		log.Printf("registrar entrada de estoque: %v", err)
		respond(writer, http.StatusInternalServerError, false, "Não foi possível registrar a entrada")
	}
}
