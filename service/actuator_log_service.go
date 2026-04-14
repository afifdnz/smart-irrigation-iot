package service

import (
	"context"
	"time"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/repository"
)

type ActuatorLogService interface {
	GetByPlotID(ctx context.Context, plotID, limit, offset int) ([]*domains.ActuatorLog, error)
	GetLatestByPlotID(ctx context.Context, plotID int) (*domains.ActuatorLog, error)
	RecordAuto(ctx context.Context, log *domains.ActuatorLog) error
	RecordManualOverride(ctx context.Context, log *domains.ActuatorLog) error
}

type actuatorLogService struct {
	logRepo   repository.ActuatorLogRepository
	plotRepo  repository.PlotRepository
	tankRepo  repository.WaterTankRepository
	levelRepo repository.WaterLevelLogRepository
	plantRepo repository.PlantConfigRepository
}

func NewActuatorLogService(
	logRepo repository.ActuatorLogRepository,
	plotRepo repository.PlotRepository,
	tankRepo repository.WaterTankRepository,
	levelRepo repository.WaterLevelLogRepository,
	configRepo repository.PlantConfigRepository,
) ActuatorLogService {
	return &actuatorLogService{
		logRepo:   logRepo,
		plotRepo:  plotRepo,
		tankRepo:  tankRepo,
		levelRepo: levelRepo,
		plantRepo: configRepo,
	}
}

func (s *actuatorLogService) GetByPlotID(ctx context.Context, plotID, limit, offset int) ([]*domains.ActuatorLog, error) {
	return s.logRepo.FindByPlotID(ctx, plotID, limit, offset)
}

func (s *actuatorLogService) GetLatestByPlotID(ctx context.Context, plotID int) (*domains.ActuatorLog, error) {
	return s.logRepo.FindLatestByPlotID(ctx, plotID)
}

func (s *actuatorLogService) RecordAuto(ctx context.Context, log *domains.ActuatorLog) error {
	log.TriggeredAt = time.Now()
	log.TriggeredBy = domains.TrigerredAuto
	return s.logRepo.Create(ctx, log)
}

func (s *actuatorLogService) RecordManualOverride(ctx context.Context, log *domains.ActuatorLog) error {
	plot, err := s.plotRepo.FindByID(ctx, log.PlotID)
	if err != nil {
		return domains.ErrPlotNotFound
	}
	if log.Action == domains.StatusOn {
		tank, err := s.tankRepo.FindByID(ctx, 0)
		if err != nil {
			return domains.ErrWaterTankNotFound
		}
		latestLevel, err := s.levelRepo.FindLatestByTankID(ctx, tank.ID)
		if err != nil {
			return domains.ErrWaterLevelNotFound
		}
		if err := domains.CanManualOverride(*plot, *tank, latestLevel.WaterLevelCm, log.Action); err != nil {
			return nil
		}
	}
	log.TriggeredAt = time.Now()
	log.TriggeredBy = domains.TrigerredManual
	return s.logRepo.Create(ctx, log)
}
