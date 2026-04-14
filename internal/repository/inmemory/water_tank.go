package inmemory

import (
	"context"
	"errors"
	"sync"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/repository"
)

type waterTankRepository struct {
	mu      sync.RWMutex
	tanks   map[int]*domains.WaterTank
	counter int
}

func NewWaterTankRepository() repository.WaterTankRepository {
	return &waterTankRepository{
		tanks: make(map[int]*domains.WaterTank),
	}
}

func (r *waterTankRepository) FindAll(ctx context.Context) ([]*domains.WaterTank, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	result := make([]*domains.WaterTank, 0, len(r.tanks))
	for _, t := range r.tanks {
		result = append(result, t)
	}
	return result, nil
}

func (r *waterTankRepository) FindByID(ctx context.Context, id int) (*domains.WaterTank, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	t, ok := r.tanks[id]
	if !ok {
		return nil, errors.New("tandon tidak ditemukan")
	}
	return t, nil
}

func (r *waterTankRepository) Create(ctx context.Context, tank *domains.WaterTank) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.counter++
	tank.ID = r.counter
	r.tanks[tank.ID] = tank
	return nil
}

func (r *waterTankRepository) Update(ctx context.Context, tank *domains.WaterTank) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.tanks[tank.ID]; !ok {
		return errors.New("tandon tidak ditemukan")
	}
	r.tanks[tank.ID] = tank
	return nil
}

func (r *waterTankRepository) Delete(ctx context.Context, id int) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if _, ok := r.tanks[id]; !ok {
		return errors.New("tandon tidak ditemukan")
	}
	delete(r.tanks, id)
	return nil
}
