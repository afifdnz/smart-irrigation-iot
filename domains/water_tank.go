package domains

import "time"

type WaterTank struct {
	ID             int
	TankName       string
	CapacityLiters float64
	HeightCm       float64
	MinLevelCm     float64
	CreatedAt      time.Time
}

// is the water in water tank enough to irrigate the plot
func (wt *WaterTank) HasSufficientWater(currentLevelCm float64) bool {
	return currentLevelCm > wt.MinLevelCm
}

// calculate volume of the water tank
func (wt *WaterTank) CalculateVolume(waterLevelCm float64) float64 {
	if wt.HeightCm == 0 {
		return 0
	}
	return (waterLevelCm / wt.HeightCm) * wt.CapacityLiters
}

// calculate water percentage
func (wt *WaterTank) WaterPercentage(currentLevelCm float64) float64 {
	if wt.HeightCm == 0 {
		return 0
	}
	pct := (currentLevelCm / wt.HeightCm) * 100
	if pct > 100 {
		return 100
	}
	return pct
}
