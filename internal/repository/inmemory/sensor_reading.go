package inmemory

import (
	"context"
	"errors"
	"sync"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/repository"
)

type sensorReadingRepository struct {
	mu       sync.RWMutex
	readings []*domains.SensorReading
	counter  int
}

func NewSensorReadingRepository() repository.SensorReadingRepository {
	return &sensorReadingRepository{
		readings: make([]*domains.SensorReading, 0),
	}
}

func (r *sensorReadingRepository) FindByPlotID(ctx context.Context, plotID, limit, offset int) ([]*domains.SensorReading, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	filtered := make([]*domains.SensorReading, 0)
	for _, s := range r.readings {
		if s.PlotID == plotID {
			filtered = append(filtered, s)
		}
	}

	// Terapkan offset dan limit
	if offset >= len(filtered) {
		return []*domains.SensorReading{}, nil
	}
	end := offset + limit
	if end > len(filtered) {
		end = len(filtered)
	}
	return filtered[offset:end], nil
}

func (r *sensorReadingRepository) FindLatestByPlotID(ctx context.Context, plotID int) (*domains.SensorReading, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	var latest *domains.SensorReading
	for _, s := range r.readings {
		if s.PlotID == plotID {
			if latest == nil || s.RecordedAt.After(latest.RecordedAt) {
				latest = s
			}
		}
	}
	if latest == nil {
		return nil, errors.New("data sensor tidak ditemukan")
	}
	return latest, nil
}

func (r *sensorReadingRepository) Create(ctx context.Context, reading *domains.SensorReading) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.counter++
	reading.ID = r.counter
	r.readings = append(r.readings, reading)
	return nil
}
