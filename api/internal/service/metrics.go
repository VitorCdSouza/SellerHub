package service

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"sellerhub/api/internal/db"
)

type MetricsService struct {
	Queries *db.Queries
}

// month no formato 2026-11; o periodo vai do dia 1 ao ultimo dia do mes
func (metricsService *MetricsService) ByListing(ctx context.Context, userID int32, month string) ([]db.ListMetricasPorAnuncioRow, error) {
	start, err := time.Parse("2006-01", month)
	if err != nil {
		return nil, ErrInvalidInput
	}
	end := start.AddDate(0, 1, -1)

	metrics, err := metricsService.Queries.ListMetricasPorAnuncio(ctx, db.ListMetricasPorAnuncioParams{
		IDUsuario: userID,
		Inicio:    pgtype.Date{Time: start, Valid: true},
		Fim:       pgtype.Date{Time: end, Valid: true},
	})
	if err != nil {
		return nil, fmt.Errorf("listar metricas por anuncio: %w", err)
	}
	return metrics, nil
}
