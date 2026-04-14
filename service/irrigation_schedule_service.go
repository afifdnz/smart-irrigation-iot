package service

import (
	"context"
	"time"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/repository"
)

type IrrigationScheduleService interface {
	GetByPlotID(ctx context.Context, plotID int) ([]*domains.IrrigationSchedule, error)
	GetByID(ctx context.Context, id int) (*domains.IrrigationSchedule, error)
	Create(ctx context.Context, schedule *domains.IrrigationSchedule, createdBy int) error
	Update(ctx context.Context, schedule *domains.IrrigationSchedule) error
	Delete(ctx context.Context, id int) error
}

type irrigationScheduleService struct {
	scheduleRepo repository.IrrigationScheduleRepository
	plotRepo     repository.PlotRepository
}

func NewIrrigationScheduleService(scheduleRepo repository.IrrigationScheduleRepository, plotRepo repository.PlotRepository) IrrigationScheduleService {
	return &irrigationScheduleService{
		scheduleRepo: scheduleRepo,
		plotRepo:     plotRepo,
	}
}

func (s *irrigationScheduleService) GetByPlotID(ctx context.Context, plotID int) ([]*domains.IrrigationSchedule, error) {
	return s.scheduleRepo.FindByPlotID(ctx, plotID)
}

func (s *irrigationScheduleService) GetByID(ctx context.Context, id int) (*domains.IrrigationSchedule, error) {
	return s.scheduleRepo.FindByID(ctx, id)
}

func (s *irrigationScheduleService) Create(ctx context.Context, schedule *domains.IrrigationSchedule, createdBy int) error {
	_, err := s.plotRepo.FindByID(ctx, schedule.PlotID)
	if err != nil {
		return domains.ErrPlotNotFound
	}
	schedule.CreatedAt = time.Now()
	schedule.CreatedBy = createdBy
	schedule.IsActive = true
	return s.scheduleRepo.Create(ctx, schedule)
}

func (s *irrigationScheduleService) Update(ctx context.Context, schedule *domains.IrrigationSchedule) error {
	existing, err := s.scheduleRepo.FindByID(ctx, schedule.ID)
	if err != nil {
		return domains.ErrScheduleNotFound
	}
	existing.StartTime = schedule.StartTime
	existing.DurationSeconds = schedule.DurationSeconds
	existing.DaysOfWeek = schedule.DaysOfWeek
	existing.IsActive = schedule.IsActive
	return s.scheduleRepo.Update(ctx, existing)
}

func (s *irrigationScheduleService) Delete(ctx context.Context, id int) error {
	_, err := s.scheduleRepo.FindByID(ctx, id)
	if err != nil {
		return domains.ErrScheduleNotFound
	}
	return s.scheduleRepo.Delete(ctx, id)
}
