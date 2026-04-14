package service

import (
	"context"
	"time"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/repository"
)

type PlotService interface {
	GetAll(ctx context.Context) ([]*domains.Plot, error)
	GetByID(ctx context.Context, id int) (*domains.Plot, error)
	Create(ctx context.Context, plot *domains.Plot) error
	Update(ctx context.Context, plot *domains.Plot) error
	Deactivate(ctx context.Context, id int) error
}

type plotService struct {
	plotRepo repository.PlotRepository
}

func NewPlotService(plotRepo repository.PlotRepository) PlotService {
	return &plotService{plotRepo: plotRepo}
}

func (s *plotService) GetAll(ctx context.Context) ([]*domains.Plot, error) {
	return s.plotRepo.FindAll(ctx)
}

func (s *plotService) GetByID(ctx context.Context, id int) (*domains.Plot, error) {
	return s.plotRepo.FindByID(ctx, id)
}

func (s *plotService) Create(ctx context.Context, plot *domains.Plot) error {
	plot.IsActive = true
	plot.CreatedAt = time.Now()
	plot.UpdatedAt = time.Now()
	return s.plotRepo.Create(ctx, plot)
}

func (s *plotService) Update(ctx context.Context, plot *domains.Plot) error {
	existing, err := s.plotRepo.FindByID(ctx, plot.ID)
	if err != nil {
		return domains.ErrPlotNotFound
	}

	existing.PlotName = plot.PlotName
	existing.PlantName = plot.PlantName
	existing.PlantNote = plot.PlantNote
	existing.UpdatedAt = time.Now()
	return s.plotRepo.Update(ctx, existing)
}

func (s *plotService) Deactivate(ctx context.Context, id int) error {
	_, err := s.plotRepo.FindByID(ctx, id)
	if err != nil {
		return domains.ErrPlotNotFound
	}
	return s.plotRepo.SoftDelete(ctx, id)
}
