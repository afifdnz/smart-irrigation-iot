package inmemory

import (
	"context"
	"errors"
	"sync"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/repository"
)

type waterLevelLogRepository struct {
	mu      sync.RWMutex
	logs    []*domains.WaterLevelLog
	counter int
}

func NewWaterLevelLogRepository() repository.WaterLevelLogRepository {
	return &waterLevelLogRepository{
		logs: make([]*domains.WaterLevelLog, 0),
	}
}

func (r *waterLevelLogRepository) FindByTankID(ctx context.Context, tankID, limit, offset int) ([]*domains.WaterLevelLog, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	filtered := make([]*domains.WaterLevelLog, 0)
	for _, l := range r.logs {
		if l.TankID == tankID {
			filtered = append(filtered, l)
		}
	}

	if offset >= len(filtered) {
		return []*domains.WaterLevelLog{}, nil
	}
	end := offset + limit
	if end > len(filtered) {
		end = len(filtered)
	}
	return filtered[offset:end], nil
}

func (r *waterLevelLogRepository) FindLatestByTankID(ctx context.Context, tankID int) (*domains.WaterLevelLog, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var latest *domains.WaterLevelLog
	for _, l := range r.logs {
		if l.TankID == tankID {
			if latest == nil || l.RecordedAt.After(latest.RecordedAt) {
				latest = l
			}
		}
	}
	if latest == nil {
		return nil, errors.New("data level air tidak ditemukan")
	}
	return latest, nil
}

func (r *waterLevelLogRepository) Create(ctx context.Context, log *domains.WaterLevelLog) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.counter++
	log.ID = r.counter
	r.logs = append(r.logs, log)
	return nil
}
