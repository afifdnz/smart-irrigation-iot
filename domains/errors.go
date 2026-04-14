package domains

import "errors"

var (
	ErrInvalidInput                 = errors.New("the input you entered is not valid!")
	ErrAlreadyInactivated           = errors.New("it is already inactivated!")
	ErrAlreadyActivated             = errors.New("it is already activated!")
	ErrMoistureOutOfRange           = errors.New("moisture is out of range")
	ErrMinMoistureExceedMaxMoisture = errors.New("minimum moisture is exceed the max of moisture")
	ErrPlotNotActive                = errors.New("plot is not active!")
	ErrInsufficientWater            = errors.New("water is insufficient for irrigation")
	ErrInvalidCredentials           = errors.New("invalid credentials!")
	ErrPlotNotFound                 = errors.New("plot not found!")
	ErrInvalidTankConfig            = errors.New("invalid tank config!")
	ErrWaterTankNotFound            = errors.New("water tank not found!")
	ErrConfigAlreadyExists          = errors.New("plant config is already exists!")
	ErrConfigNotFound               = errors.New("config not found!")
	ErrWaterLevelNotFound           = errors.New("water level not found!")
	ErrScheduleNotFound             = errors.New("schedule not found!")
)
