package repository

import (
	"context"

	"github.com/afifdnz/irrigation-iot/domains"
)

type IrrigationScheduleRepository interface {
	FindAll(ctx context.Context) ([]*domains.IrrigationSchedule, error)
	FindByPlotID(ctx context.Context, plotID int) ([]*domains.IrrigationSchedule, error)
	FindByID(ctx context.Context, id int) (*domains.IrrigationSchedule, error)
	Create(ctx context.Context, schedule *domains.IrrigationSchedule) error
	Update(ctx context.Context, schedule *domains.IrrigationSchedule) error
	Delete(ctx context.Context, id int) error
}
