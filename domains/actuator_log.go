package domains

import "time"

type (
	ActionType    string
	TriggeredType string
)

const (
	StatusOn        ActionType    = "ON"
	StatusOff       ActionType    = "OFF"
	TrigerredAuto   TriggeredType = "auto"
	TrigerredManual TriggeredType = "manual"
)

type ActuatorLog struct {
	ID             int
	PlotID         int
	Action         ActionType
	TriggeredBy    TriggeredType
	DurationSecond int
	TriggeredAt    time.Time
}

func CanManualOverride(plot Plot, tank WaterTank, currentLevelCm float64, action ActionType) error {
	if !plot.IsActive {
		return ErrPlotNotActive
	}
	if action == StatusOn && !tank.HasSufficientWater(currentLevelCm) {
		return ErrInsufficientWater
	}
	return nil
}

// func CanActuate(plot Plot, tank WaterTank, currentLevelCm float64, action ActionType) error {
// 	if !plot.IsActive {
// 		return ErrPlotNotActive
// 	}
// 	if action == StatusOn && !tank.HasSufficientWater(currentLevelCm) {
// 		return ErrInsufficientWater
// 	}
// 	return nil
// }

func (a *ActuatorLog) IsAutoTrigger() bool {
	return a.TriggeredBy == TrigerredAuto
}
