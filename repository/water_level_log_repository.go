package repository

import (
	"context"

	"github.com/afifdnz/irrigation-iot/domains"
)

type WaterLevelLogRepository interface {
	FindByTankID(ctx context.Context, tankID int, limit, offset int) ([]*domains.WaterLevelLog, error)
	FindLatestByTankID(ctx context.Context, tankID int) (*domains.WaterLevelLog, error)
	Create(ctx context.Context, log *domains.WaterLevelLog) error
}
