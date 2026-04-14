package service

import (
	"context"
	"time"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/repository"
)

type PlantConfigService interface {
	GetByPlotID(ctx context.Context, plotID int) (*domains.PlantConfig, error)
	Create(ctx context.Context, plantConfig *domains.PlantConfig, updatedBy int) error
	Update(ctx context.Context, plantConfig *domains.PlantConfig, updatedBy int) error
}

type plantConfigService struct {
	plantConfigRepo repository.PlantConfigRepository
	plotRepo        repository.PlotRepository
}

func NewPlantConfigService(configRepo repository.PlantConfigRepository, plotRepo repository.PlotRepository) PlantConfigService {
	return &plantConfigService{
		plantConfigRepo: configRepo,
		plotRepo:        plotRepo,
	}
}

func (s *plantConfigService) GetByPlotID(ctx context.Context, plotID int) (*domains.PlantConfig, error) {
	return s.plantConfigRepo.FindByPlotID(ctx, plotID)
}

func (s *plantConfigService) Create(ctx context.Context, plantConfig *domains.PlantConfig, updatedBy int) error {
	_, err := s.plotRepo.FindByID(ctx, plantConfig.PlotID)
	if err != nil {
		return domains.ErrPlotNotFound
	}
	exists, err := s.plantConfigRepo.ExistsByPlotID(ctx, plantConfig.PlotID)
	if err != nil {
		return err
	}
	if exists {
		return domains.ErrConfigAlreadyExists
	}
	if err := plantConfig.IsValid(); err != nil {
		return err
	}
	plantConfig.UpdatedBy = updatedBy
	plantConfig.UpdatedAt = time.Now()
	return s.plantConfigRepo.Create(ctx, plantConfig)
}

func (s *plantConfigService) Update(ctx context.Context, plantConfig *domains.PlantConfig, updatedBy int) error {
	existing, err := s.plantConfigRepo.FindByPlotID(ctx, plantConfig.PlotID)
	if err != nil {
		return domains.ErrConfigNotFound
	}
	if err := plantConfig.IsValid(); err != nil {
		return err
	}
	existing.MoistureMaxPct = plantConfig.MoistureMaxPct
	existing.MoistureMinPct = plantConfig.MoistureMinPct
	existing.UpdatedBy = updatedBy
	existing.UpdatedAt = time.Now()
	return s.plantConfigRepo.Update(ctx, existing)
}
