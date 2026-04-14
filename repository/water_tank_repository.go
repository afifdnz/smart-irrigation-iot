package repository

import (
	"context"

	"github.com/afifdnz/irrigation-iot/domains"
)

type WaterTankRepository interface {
	FindAll(ctx context.Context) ([]*domains.WaterTank, error)
	FindByID(ctx context.Context, id int) (*domains.WaterTank, error)
	Create(ctx context.Context, tank *domains.WaterTank) error
	Update(ctx context.Context, tank *domains.WaterTank) error
	Delete(ctx context.Context, id int) error
}
