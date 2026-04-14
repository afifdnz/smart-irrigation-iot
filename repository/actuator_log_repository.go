package repository

import (
	"context"

	"github.com/afifdnz/irrigation-iot/domains"
)

type ActuatorLogRepository interface {
	FindByPlotID(ctx context.Context, plotID int, limit, offset int) ([]*domains.ActuatorLog, error)
	FindLatestByPlotID(ctx context.Context, plotID int) (*domains.ActuatorLog, error)
	Create(ctx context.Context, log *domains.ActuatorLog) error
}
