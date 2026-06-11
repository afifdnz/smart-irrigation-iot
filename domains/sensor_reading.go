package domains

import "time"

type LandStatus string

const (
	DryStatus     LandStatus = "kering"
	OptimalStatus LandStatus = "optimal"
	WetStatus     LandStatus = "basah"
)

type SensorReading struct {
	ID              int
	PlotID          int
	SoilMoisturePct float64
	Status          LandStatus
	AiPredMins      *float64
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
