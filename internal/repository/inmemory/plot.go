package inmemory

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/repository"
)

type plotRepository struct {
	mu      sync.RWMutex
	plots   map[int]*domains.Plot
	counter int
}

func NewPlotRepository() repository.PlotRepository {
	return &plotRepository{
		plots: make(map[int]*domains.Plot),
	}
}

func (r *plotRepository) FindAll(ctx context.Context) ([]*domains.Plot, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	result := make([]*domains.Plot, 0, len(r.plots))
	for _, p := range r.plots {
		result = append(result, p)
	}
	return result, nil
}

func (r *plotRepository) FindAllActive(ctx context.Context) ([]*domains.Plot, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	result := make([]*domains.Plot, 0)
	for _, p := range r.plots {
		if p.IsActive {
			result = append(result, p)
		}
	}
	return result, nil
}

func (r *plotRepository) FindByID(ctx context.Context, id int) (*domains.Plot, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	p, ok := r.plots[id]
	if !ok {
		return nil, errors.New("plot tidak ditemukan")
	}
	return p, nil
}

func (r *plotRepository) Create(ctx context.Context, plot *domains.Plot) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.counter++
	plot.ID = r.counter
	r.plots[plot.ID] = plot
	return nil
}

func (r *plotRepository) Update(ctx context.Context, plot *domains.Plot) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.plots[plot.ID]; !ok {
		return errors.New("plot tidak ditemukan")
	}
	r.plots[plot.ID] = plot
	return nil
}

func (r *plotRepository) SoftDelete(ctx context.Context, id int) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	p, ok := r.plots[id]
	if !ok {
		return errors.New("plot tidak ditemukan")
	}
	p.IsActive = false
	p.UpdatedAt = time.Now()
	return nil
}
