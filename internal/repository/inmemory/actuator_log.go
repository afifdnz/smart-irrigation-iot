package inmemory

import (
	"context"
	"errors"
	"sync"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/repository"
)

type actuatorLogRepository struct {
	mu      sync.RWMutex
	logs    []*domains.ActuatorLog
	counter int
}

func NewActuatorLogRepository() repository.ActuatorLogRepository {
	return &actuatorLogRepository{
		logs: make([]*domains.ActuatorLog, 0),
	}
}

func (r *actuatorLogRepository) FindByPlotID(ctx context.Context, plotID, limit, offset int) ([]*domains.ActuatorLog, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	filtered := make([]*domains.ActuatorLog, 0)
	for _, l := range r.logs {
		if l.PlotID == plotID {
			filtered = append(filtered, l)
		}
	}

	if offset >= len(filtered) {
		return []*domains.ActuatorLog{}, nil
	}
	end := offset + limit
	if end > len(filtered) {
		end = len(filtered)
	}
	return filtered[offset:end], nil
}

func (r *actuatorLogRepository) FindLatestByPlotID(ctx context.Context, plotID int) (*domains.ActuatorLog, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var latest *domains.ActuatorLog
	for _, l := range r.logs {
		if l.PlotID == plotID {
			if latest == nil || l.TriggeredAt.After(latest.TriggeredAt) {
				latest = l
			}
		}
	}
	if latest == nil {
		return nil, errors.New("log aktuator tidak ditemukan")
	}
	return latest, nil
}

func (r *actuatorLogRepository) Create(ctx context.Context, log *domains.ActuatorLog) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.counter++
	log.ID = r.counter
	r.logs = append(r.logs, log)
	return nil
}
