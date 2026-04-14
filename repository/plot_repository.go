package repository

import (
	"context"

	"github.com/afifdnz/irrigation-iot/domains"
)

type PlotRepository interface {
	FindAll(ctx context.Context) ([]*domains.Plot, error)
	FindAllActive(ctx context.Context) ([]*domains.Plot, error)
	FindByID(ctx context.Context, id int) (*domains.Plot, error)
	Create(ctx context.Context, plot *domains.Plot) error
	Update(ctx context.Context, plot *domains.Plot) error
	SoftDelete(ctx context.Context, id int) error
}
