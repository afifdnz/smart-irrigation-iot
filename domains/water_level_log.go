package domains

import "time"

type WaterLevelLog struct {
	ID           int
	TankID       int
	WaterLevelCm float64
	WaterVolume  float64
	RecordedAt   time.Time
}
