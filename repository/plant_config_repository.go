package repository

import (
	"context"

	"github.com/afifdnz/irrigation-iot/domains"
)

type PlantConfigRepository interface {
	FindByID(ctx context.Context, id int) (*domains.PlantConfig, error)
	FindByPlotID(ctx context.Context, plotID int) (*domains.PlantConfig, error)
	ExistsByPlotID(ctx context.Context, plotID int) (bool, error)
	Create(ctx context.Context, config *domains.PlantConfig) error
	Update(ctx context.Context, config *domains.PlantConfig) error
}
