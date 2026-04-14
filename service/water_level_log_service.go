package service

import (
	"context"
	"time"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/repository"
)

type WaterLevelLogService interface {
	GetByTankID(ctx context.Context, tankID, limit, offset int) ([]*domains.WaterLevelLog, error)
	GetLatestByTankID(ctx context.Context, tankID int) (*domains.WaterLevelLog, error)
	Record(ctx context.Context, log *domains.WaterLevelLog) error
}

type waterLevelLogService struct {
	logRepo  repository.WaterLevelLogRepository
	tankRepo repository.WaterTankRepository
}

func NewWaterLevelLogService(logRepo repository.WaterLevelLogRepository, tankRepo repository.WaterTankRepository) WaterLevelLogService {
	return &waterLevelLogService{
		logRepo:  logRepo,
		tankRepo: tankRepo,
	}
}

func (s *waterLevelLogService) GetByTankID(ctx context.Context, tankID, limit, offset int) ([]*domains.WaterLevelLog, error) {
	return s.logRepo.FindByTankID(ctx, tankID, limit, offset)
}

func (s *waterLevelLogService) GetLatestByTankID(ctx context.Context, tankID int) (*domains.WaterLevelLog, error) {
	return s.logRepo.FindLatestByTankID(ctx, tankID)
}

func (s *waterLevelLogService) Record(ctx context.Context, log *domains.WaterLevelLog) error {
	tank, err := s.tankRepo.FindByID(ctx, log.TankID)
	if err != nil {
		return domains.ErrWaterTankNotFound
	}

	log.WaterLevelCm = tank.CalculateVolume(log.WaterLevelCm)
	log.RecordedAt = time.Now()
	return s.logRepo.Create(ctx, log)
}
