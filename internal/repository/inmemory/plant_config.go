package inmemory

import (
	"context"
	"errors"
	"sync"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/repository"
)

type plantConfigRepository struct {
	mu      sync.RWMutex
	configs map[int]*domains.PlantConfig // key: id
	counter int
}

func NewPlantConfigRepository() repository.PlantConfigRepository {
	return &plantConfigRepository{
		configs: make(map[int]*domains.PlantConfig),
	}
}

func (r *plantConfigRepository) FindByID(ctx context.Context, id int) (*domains.PlantConfig, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	c, ok := r.configs[id]
	if !ok {
		return nil, errors.New("konfigurasi tidak ditemukan")
	}
	return c, nil
}

func (r *plantConfigRepository) FindByPlotID(ctx context.Context, plotID int) (*domains.PlantConfig, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, c := range r.configs {
		if c.PlotID == plotID {
			return c, nil
		}
	}
	return nil, errors.New("konfigurasi tidak ditemukan")
}

func (r *plantConfigRepository) ExistsByPlotID(ctx context.Context, plotID int) (bool, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, c := range r.configs {
		if c.PlotID == plotID {
			return true, nil
		}
	}
	return false, nil
}

func (r *plantConfigRepository) Create(ctx context.Context, config *domains.PlantConfig) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.counter++
	config.ID = r.counter
	r.configs[config.ID] = config
	return nil
}

func (r *plantConfigRepository) Update(ctx context.Context, config *domains.PlantConfig) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.configs[config.ID]; !ok {
		return errors.New("konfigurasi tidak ditemukan")
	}
	r.configs[config.ID] = config
	return nil
}
