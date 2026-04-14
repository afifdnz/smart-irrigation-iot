package inmemory

import (
	"context"
	"errors"
	"sync"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/repository"
)

type irrigationScheduleRepository struct {
	mu        sync.RWMutex
	schedules map[int]*domains.IrrigationSchedule
	counter   int
}

func NewIrrigationScheduleRepository() repository.IrrigationScheduleRepository {
	return &irrigationScheduleRepository{
		schedules: make(map[int]*domains.IrrigationSchedule),
	}
}

func (r *irrigationScheduleRepository) FindAll(ctx context.Context) ([]*domains.IrrigationSchedule, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	result := make([]*domains.IrrigationSchedule, 0, len(r.schedules))
	for _, s := range r.schedules {
		result = append(result, s)
	}
	return result, nil
}

func (r *irrigationScheduleRepository) FindByPlotID(ctx context.Context, plotID int) ([]*domains.IrrigationSchedule, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	result := make([]*domains.IrrigationSchedule, 0)
	for _, s := range r.schedules {
		if s.PlotID == plotID {
			result = append(result, s)
		}
	}
	return result, nil
}

func (r *irrigationScheduleRepository) FindByID(ctx context.Context, id int) (*domains.IrrigationSchedule, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	s, ok := r.schedules[id]
	if !ok {
		return nil, errors.New("jadwal tidak ditemukan")
	}
	return s, nil
}

func (r *irrigationScheduleRepository) Create(ctx context.Context, schedule *domains.IrrigationSchedule) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.counter++
	schedule.ID = r.counter
	r.schedules[schedule.ID] = schedule
	return nil
}

func (r *irrigationScheduleRepository) Update(ctx context.Context, schedule *domains.IrrigationSchedule) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.schedules[schedule.ID]; !ok {
		return errors.New("jadwal tidak ditemukan")
	}
	r.schedules[schedule.ID] = schedule
	return nil
}

func (r *irrigationScheduleRepository) Delete(ctx context.Context, id int) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.schedules[id]; !ok {
		return errors.New("jadwal tidak ditemukan")
	}
	delete(r.schedules, id)
	return nil
}
