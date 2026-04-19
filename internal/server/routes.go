package server

import (
	"net/http"

	"github.com/afifdnz/irrigation-iot/handler"
	"github.com/afifdnz/irrigation-iot/internal/pkg/middleware"
)

// func SetupRoutes(
//
//	mux *http.ServeMux,
//	userHandler *handler.UserHandler,
//	plotHandler *handler.PlotHandler,
//	tankHandler *handler.WaterTankHandler,
//	configHandler *handler.PlantConfigHandler,
//	sensorHandler *handler.SensorReadingHandler,
//	waterLevelHandler *handler.WaterLevelLogHandler,
//	actuatorHandler *handler.ActuatorLogHandler,
//	scheduleHandler *handler.IrrigationScheduleHandler,
//
//	) {
//		// Auth
//		mux.HandleFunc("POST /api/auth/login", userHandler.Login)
//
//		// Petak
//		mux.HandleFunc("GET    /api/plots", plotHandler.GetAll)
//		mux.HandleFunc("GET    /api/plots/{id}", plotHandler.GetByID)
//		mux.HandleFunc("POST   /api/plots", plotHandler.Create)
//		mux.HandleFunc("PUT    /api/plots/{id}", plotHandler.Update)
//		mux.HandleFunc("DELETE /api/plots/{id}", plotHandler.Deactivate)
//		// Water Tank
//		mux.HandleFunc("GET    /api/tanks", tankHandler.GetAll)
//		mux.HandleFunc("GET    /api/tanks/{id}", tankHandler.GetByID)
//		mux.HandleFunc("POST   /api/tanks", tankHandler.Create)
//		mux.HandleFunc("PUT    /api/tanks/{id}", tankHandler.Update)
//		mux.HandleFunc("DELETE /api/tanks/{id}", tankHandler.Delete)
//
//		// Plant Config
//		mux.HandleFunc("GET  /api/plots/{plot_id}/config", configHandler.GetByPlotID)
//		mux.HandleFunc("POST /api/plots/{plot_id}/config", configHandler.Create)
//		mux.HandleFunc("PUT  /api/plots/{plot_id}/config", configHandler.Update)
//
//		// Sensor Readings
//		mux.HandleFunc("GET  /api/plots/{plot_id}/sensors", sensorHandler.GetByPlotID)
//		mux.HandleFunc("GET  /api/plots/{plot_id}/sensors/latest", sensorHandler.GetLatest)
//		mux.HandleFunc("POST /api/plots/{plot_id}/sensors", sensorHandler.Record)
//
//		// Water Level Logs
//		mux.HandleFunc("GET  /api/tanks/{tank_id}/levels", waterLevelHandler.GetByTankID)
//		mux.HandleFunc("GET  /api/tanks/{tank_id}/levels/latest", waterLevelHandler.GetLatest)
//		mux.HandleFunc("POST /api/tanks/{tank_id}/levels", waterLevelHandler.Record)
//
//		// Actuator Logs
//		mux.HandleFunc("GET  /api/plots/{plot_id}/actuators", actuatorHandler.GetByPlotID)
//		mux.HandleFunc("GET  /api/plots/{plot_id}/actuators/latest", actuatorHandler.GetLatest)
//		mux.HandleFunc("POST /api/plots/{plot_id}/actuators/auto", actuatorHandler.RecordAuto)
//		mux.HandleFunc("POST /api/plots/{plot_id}/actuators/manual", actuatorHandler.ManualOverride)
//
//		// Irrigation Schedules
//		mux.HandleFunc("GET    /api/plots/{plot_id}/schedules", scheduleHandler.GetByPetakID)
//		mux.HandleFunc("GET    /api/schedules/{id}", scheduleHandler.GetByID)
//		mux.HandleFunc("POST   /api/plots/{plot_id}/schedules", scheduleHandler.Create)
//		mux.HandleFunc("PUT    /api/schedules/{id}", scheduleHandler.Update)
//		mux.HandleFunc("DELETE /api/schedules/{id}", scheduleHandler.Delete)
//	}
func SetupRoutes(mux *http.ServeMux, jwtSecret string, userHandler *handler.UserHandler,
	plotHandler *handler.PlotHandler,
	tankHandler *handler.WaterTankHandler,
	configHandler *handler.PlantConfigHandler,
	sensorHandler *handler.SensorReadingHandler,
	waterLevelHandler *handler.WaterLevelLogHandler,
	actuatorHandler *handler.ActuatorLogHandler,
	scheduleHandler *handler.IrrigationScheduleHandler,
) {
	auth := func(next http.HandlerFunc) http.HandlerFunc {
		return middleware.AuthMiddleware(jwtSecret, next)
	}

	// Public — tidak perlu token
	mux.HandleFunc("POST /api/auth/login", userHandler.Login)

	// ESP32 endpoints — tidak perlu token (pakai API key terpisah jika perlu)
	mux.HandleFunc("POST /api/plots/{plot_id}/sensors", sensorHandler.Record)
	mux.HandleFunc("POST /api/tanks/{tank_id}/levels", waterLevelHandler.Record)
	mux.HandleFunc("POST /api/plots/{plot_id}/actuators/auto", actuatorHandler.RecordAuto)

	// Protected — harus login sebagai admin
	mux.HandleFunc("GET    /api/plots", auth(plotHandler.GetAll))
	mux.HandleFunc("GET    /api/plots/{id}", auth(plotHandler.GetByID))
	mux.HandleFunc("POST   /api/plots", auth(plotHandler.Create))
	mux.HandleFunc("PUT    /api/plots/{id}", auth(plotHandler.Update))
	mux.HandleFunc("DELETE /api/plots/{id}", auth(plotHandler.Deactivate))
	mux.HandleFunc("GET    /api/tanks", auth(tankHandler.GetAll))
	mux.HandleFunc("GET    /api/tanks/{id}", auth(tankHandler.GetByID))
	mux.HandleFunc("POST   /api/tanks", auth(tankHandler.Create))
	mux.HandleFunc("PUT    /api/tanks/{id}", auth(tankHandler.Update))
	mux.HandleFunc("DELETE /api/tanks/{id}", auth(tankHandler.Delete))
	mux.HandleFunc("GET    /api/plots/{plot_id}/config", auth(configHandler.GetByPlotID))
	mux.HandleFunc("POST   /api/plots/{plot_id}/config", auth(configHandler.Create))
	mux.HandleFunc("PUT    /api/plots/{plot_id}/config", auth(configHandler.Update))
	mux.HandleFunc("GET    /api/plots/{plot_id}/sensors", auth(sensorHandler.GetByPlotID))
	mux.HandleFunc("GET    /api/plots/{plot_id}/sensors/latest", auth(sensorHandler.GetLatest))
	mux.HandleFunc("GET    /api/tanks/{tank_id}/levels", auth(waterLevelHandler.GetByTankID))
	mux.HandleFunc("GET    /api/tanks/{tank_id}/levels/latest", auth(waterLevelHandler.GetLatest))
	mux.HandleFunc("GET    /api/plots/{plot_id}/actuators", auth(actuatorHandler.GetByPlotID))
	mux.HandleFunc("GET    /api/plots/{plot_id}/actuators/latest", auth(actuatorHandler.GetLatest))
	mux.HandleFunc("POST   /api/plots/{plot_id}/actuators/manual", auth(actuatorHandler.ManualOverride))
	mux.HandleFunc("GET    /api/plots/{plot_id}/schedules", auth(scheduleHandler.GetByPetakID))
	mux.HandleFunc("GET    /api/schedules/{id}", auth(scheduleHandler.GetByID))
	mux.HandleFunc("POST   /api/plots/{plot_id}/schedules", auth(scheduleHandler.Create))
	mux.HandleFunc("PUT    /api/schedules/{id}", auth(scheduleHandler.Update))
	mux.HandleFunc("DELETE /api/schedules/{id}", auth(scheduleHandler.Delete))
}
