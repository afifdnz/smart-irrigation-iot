package domains

import "time"

type LandStatus string

const (
	DryStatus     LandStatus = "Dry"
	OptimalStatus LandStatus = "Optimal"
	WetStatus     LandStatus = "Wet"
)

type SensorReading struct {
	ID              int
	PlotID          int
	SoilMoisturePct float64
	Status          LandStatus
	RecordedAt      time.Time
}

func (sr *SensorReading) ClassifyStatus(config PlantConfig) LandStatus {
	if sr.SoilMoisturePct < config.MoistureMinPct {
		return DryStatus
	}
	if sr.SoilMoisturePct > config.MoistureMaxPct {
		return WetStatus
	}
	return OptimalStatus
}

// func (sr *SensorReading) NeedsIrrigation() bool {
// 	return sr.Status == DryStatus
// }

// func (sr *SensorReading) ShouldStopIrrigation() bool {
// 	return sr.Status == WetStatus || sr.Status == OptimalStatus
// }
