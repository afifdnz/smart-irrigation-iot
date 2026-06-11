package domains

import "time"

type WaterLevelLog struct {
	ID           int       `json:"id"`
	TankID       int       `json:"tank_id"`
	WaterLevelCm float64   `json:"water_level_cm"`
	WaterVolume  float64   `json:"water_volume_l"`
	RecordedAt   time.Time `json:"recorded_at"`
}
