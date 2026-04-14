package server

import (
	"net/http"

	"github.com/afifdnz/irrigation-iot/handler"
)

func SetupRoutes(
	mux *http.ServeMux,
	userHandler *handler.UserHandler,
	plotHandler *handler.PlotHandler,
	tankHandler *handler.WaterTankHandler,
	configHandler *handler.PlantConfigHandler,
	sensorHandler *handler.SensorReadingHandler,
	waterLevelHandler *handler.WaterLevelLogHandler,
	actuatorHandler *handler.ActuatorLogHandler,
	scheduleHandler *handler.IrrigationScheduleHandler,
) {
	// Auth
	mux.HandleFunc("POST /api/auth/login", userHandler.Login)

	// Petak
	mux.HandleFunc("GET    /api/plots", plotHandler.GetAll)
	mux.HandleFunc("GET    /api/plots/{id}", plotHandler.GetByID)
	mux.HandleFunc("POST   /api/plots", plotHandler.Create)
	mux.HandleFunc("PUT    /api/plots/{id}", plotHandler.Update)
	mux.HandleFunc("DELETE /api/plots/{id}", plotHandler.Deactivate)
	// Water Tank
	mux.HandleFunc("GET    /api/tanks", tankHandler.GetAll)
	mux.HandleFunc("GET    /api/tanks/{id}", tankHandler.GetByID)
	mux.HandleFunc("POST   /api/tanks", tankHandler.Create)
	mux.HandleFunc("PUT    /api/tanks/{id}", tankHandler.Update)
	mux.HandleFunc("DELETE /api/tanks/{id}", tankHandler.Delete)

	// Plant Config
	mux.HandleFunc("GET  /api/plots/{plot_id}/config", configHandler.GetByPlotID)
	mux.HandleFunc("POST /api/plots/{plot_id}/config", configHandler.Create)
	mux.HandleFunc("PUT  /api/plots/{plot_id}/config", configHandler.Update)
	// Sensor Readings
	mux.HandleFunc("GET  /api/petaks/{plot_id}/sensors", sensorHandler.GetByPlotID)
	mux.HandleFunc("GET  /api/petaks/{plot_id}/sensors/latest", sensorHandler.GetLatest)
	mux.HandleFunc("POST /api/petaks/{plot_id}/sensors", sensorHandler.Record)

	// Water Level Logs
	mux.HandleFunc("GET  /api/tanks/{tank_id}/levels", waterLevelHandler.GetByTankID)
	mux.HandleFunc("GET  /api/tanks/{tank_id}/levels/latest", waterLevelHandler.GetLatest)
	mux.HandleFunc("POST /api/tanks/{tank_id}/levels", waterLevelHandler.Record)

	// Actuator Logs
	mux.HandleFunc("GET  /api/plots/{plot_id}/actuators", actuatorHandler.GetByPlotID)
	mux.HandleFunc("GET  /api/plots/{plot_id}/actuators/latest", actuatorHandler.GetLatest)
	mux.HandleFunc("POST /api/plots/{plot_id}/actuators/auto", actuatorHandler.RecordAuto)
	mux.HandleFunc("POST /api/plots/{plot_id}/actuators/manual", actuatorHandler.ManualOverride)

	// Irrigation Schedules
	mux.HandleFunc("GET    /api/plots/{plot_id}/schedules", scheduleHandler.GetByPetakID)
	mux.HandleFunc("GET    /api/schedules/{id}", scheduleHandler.GetByID)
	mux.HandleFunc("POST   /api/plots/{plot_id}/schedules", scheduleHandler.Create)
	mux.HandleFunc("PUT    /api/schedules/{id}", scheduleHandler.Update)
	mux.HandleFunc("DELETE /api/schedules/{id}", scheduleHandler.Delete)
}
