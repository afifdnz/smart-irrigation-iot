package service

import (
	"context"
	"time"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/repository"
)

type WaterTankService interface {
	GetAll(ctx context.Context) ([]*domains.WaterTank, error)
	GetByID(ctx context.Context, id int) (*domains.WaterTank, error)
	Create(ctx context.Context, tank *domains.WaterTank) error
	Update(ctx context.Context, tank *domains.WaterTank) error
	Delete(ctx context.Context, id int) error
}

type waterTankService struct {
	waterTankRepo repository.WaterTankRepository
}

func NewWaterTankService(tankRepo repository.WaterTankRepository) WaterTankService {
	return &waterTankService{waterTankRepo: tankRepo}
}

func (wt *waterTankService) GetAll(ctx context.Context) ([]*domains.WaterTank, error) {
	return wt.waterTankRepo.FindAll(ctx)
}

func (wt *waterTankService) GetByID(ctx context.Context, id int) (*domains.WaterTank, error) {
	return wt.waterTankRepo.FindByID(ctx, id)
}

func (wt *waterTankService) Create(ctx context.Context, tank *domains.WaterTank) error {
	if tank.MinLevelCm >= tank.HeightCm {
		return domains.ErrInvalidTankConfig
	}
	tank.CreatedAt = time.Now()
	return wt.waterTankRepo.Create(ctx, tank)
}

func (wt *waterTankService) Update(ctx context.Context, tank *domains.WaterTank) error {
	existing, err := wt.waterTankRepo.FindByID(ctx, tank.ID)
	if err != nil {
		return domains.ErrWaterTankNotFound
	}
	existing.TankName = tank.TankName
	existing.HeightCm = tank.HeightCm
	existing.CapacityLiters = tank.CapacityLiters
	existing.MinLevelCm = tank.MinLevelCm
	return wt.waterTankRepo.Update(ctx, existing)
}

func (wt *waterTankService) Delete(ctx context.Context, id int) error {
	_, err := wt.waterTankRepo.FindByID(ctx, id)
	if err != nil {
		return domains.ErrWaterTankNotFound
	}
	return wt.waterTankRepo.Delete(ctx, id)
}
