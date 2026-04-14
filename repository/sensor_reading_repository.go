package repository

import (
	"context"

	"github.com/afifdnz/irrigation-iot/domains"
)

type SensorReadingRepository interface {
	FindByPlotID(ctx context.Context, plotID int, limit, offset int) ([]*domains.SensorReading, error)
	FindLatestByPlotID(ctx context.Context, plotID int) (*domains.SensorReading, error)
	Create(ctx context.Context, reading *domains.SensorReading) error
}
