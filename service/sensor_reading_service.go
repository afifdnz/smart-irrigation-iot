package service

import (
	"context"
	"time"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/repository"
)

type SensorReadingService interface {
	GetByPlotID(ctx context.Context, plotID, limit, offset int) ([]*domains.SensorReading, error)
	GetLatestByPlotID(ctx context.Context, plotID int) (*domains.SensorReading, error)
	Record(ctx context.Context, reading *domains.SensorReading) error
}

type sensorReadingService struct {
	readingRepo repository.SensorReadingRepository
	configRepo  repository.PlantConfigRepository
}

func NewSensorReadingService(readingRepo repository.SensorReadingRepository, configRepo repository.PlantConfigRepository) SensorReadingService {
	return &sensorReadingService{
		readingRepo: readingRepo,
		configRepo:  configRepo,
	}
}

func (s *sensorReadingService) GetByPlotID(ctx context.Context, plotID, limit, offset int) ([]*domains.SensorReading, error) {
	return s.readingRepo.FindByPlotID(ctx, plotID, limit, offset)
}

func (s *sensorReadingService) GetLatestByPlotID(ctx context.Context, plotID int) (*domains.SensorReading, error) {
	return s.readingRepo.FindLatestByPlotID(ctx, plotID)
}

func (s *sensorReadingService) Record(ctx context.Context, reading *domains.SensorReading) error {
	config, err := s.configRepo.FindByPlotID(ctx, reading.PlotID)
	if err != nil {
		return domains.ErrConfigNotFound
	}

	reading.Status = reading.ClassifyStatus(*config)
	reading.RecordedAt = time.Now()

	return s.readingRepo.Create(ctx, reading)
}
