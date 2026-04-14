package domains

import (
	"time"
)

type PlantConfig struct {
	ID             int
	PlotID         int
	TankID         int
	MoistureMinPct float64
	MoistureMaxPct float64
	UpdatedBy      int
	UpdatedAt      time.Time
}

func (pc *PlantConfig) IsValid() error {
	if pc.MoistureMinPct < 0 || pc.MoistureMaxPct > 100 {
		return ErrMoistureOutOfRange
	}
	if pc.MoistureMinPct >= pc.MoistureMaxPct {
		return ErrMinMoistureExceedMaxMoisture
	}
	return nil
}
