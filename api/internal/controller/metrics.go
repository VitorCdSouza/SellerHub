package controller

import (
	"errors"
	"log"
	"net/http"

	"sellerhub/api/internal/service"
)

type listingMetrics struct {
	ListingID   int32  `json:"listingId"`
	Title       string `json:"title"`
	Marketplace string `json:"marketplace"`
	Visits      int32  `json:"visits"`
	Conversions int32  `json:"conversions"`
}

type MetricsController struct {
	Service *service.MetricsService
}

func (metricsController *MetricsController) List(writer http.ResponseWriter, request *http.Request) {
	metrics, err := metricsController.Service.ByListing(request.Context(), sessionUserID(request), request.URL.Query().Get("mes"))
	switch {
	case err == nil:
		items := make([]listingMetrics, 0, len(metrics))
		for _, metric := range metrics {
			items = append(items, listingMetrics{
				ListingID:   metric.IDAnuncio,
				Title:       metric.TituloAnuncio,
				Marketplace: metric.NomeMarketplace,
				Visits:      metric.TotalVisualizacoes,
				Conversions: metric.TotalConversoes,
			})
		}
		writeJSON(writer, http.StatusOK, items)
	case errors.Is(err, service.ErrInvalidInput):
		respond(writer, http.StatusBadRequest, false, "Informe o mês no formato AAAA-MM")
	default:
		log.Printf("listar indicadores: %v", err)
		respond(writer, http.StatusInternalServerError, false, "Não foi possível carregar os indicadores")
	}
}
