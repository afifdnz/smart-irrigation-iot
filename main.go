package main

import (
	"log"
	"net/http"
	"os"

	"github.com/afifdnz/irrigation-iot/handler"
	"github.com/afifdnz/irrigation-iot/internal/repository/inmemory"
	"github.com/afifdnz/irrigation-iot/internal/server"
	"github.com/afifdnz/irrigation-iot/service"
)

func main() {
	// Mengambil port dari environment variable yang ada di docker-compose
	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080" // Default jika tidak ada
	}

	// http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
	// 	fmt.Fprintf(w, "Backend Sistem Irigasi IoT siap menerima data!")
	// })

	// fmt.Printf("Server berjalan di port %s...\n", port)

	// Perintah ini akan "menahan" aplikasi agar terus berjalan
	// selama server tidak dimatikan atau terjadi error.
	// err := http.ListenAndServe(":"+port, nil)
	// if err != nil {
	// 	fmt.Printf("Gagal menjalankan server: %v\n", err)
	// }
	userRepo := inmemory.NewUserRepository()
	plotRepo := inmemory.NewPlotRepository()
	tankRepo := inmemory.NewWaterTankRepository()
	configRepo := inmemory.NewPlantConfigRepository()
	sensorRepo := inmemory.NewSensorReadingRepository()
	levelRepo := inmemory.NewWaterLevelLogRepository()
	actuatorRepo := inmemory.NewActuatorLogRepository()
	scheduleRepo := inmemory.NewIrrigationScheduleRepository()

	// Service
	userService := service.NewUserService(userRepo)
	plotService := service.NewPlotService(plotRepo)
	tankService := service.NewWaterTankService(tankRepo)
	configService := service.NewPlantConfigService(configRepo, plotRepo)
	sensorService := service.NewSensorReadingService(sensorRepo, configRepo)
	levelService := service.NewWaterLevelLogService(levelRepo, tankRepo)
	actuatorService := service.NewActuatorLogService(actuatorRepo, plotRepo, tankRepo, levelRepo, configRepo)
	scheduleService := service.NewIrrigationScheduleService(scheduleRepo, plotRepo)

	// Handler
	userHandler := handler.NewUserHandler(userService)
	plotHandler := handler.NewPlotHandler(plotService)
	tankHandler := handler.NewWaterTankHandler(tankService)
	configHandler := handler.NewPlantConfigHandler(configService)
	sensorHandler := handler.NewSensorReadingHandler(sensorService)
	levelHandler := handler.NewWaterLevelLogHandler(levelService)
	actuatorHandler := handler.NewActuatorLogHandler(actuatorService)
	scheduleHandler := handler.NewIrrigationScheduleHandler(scheduleService)

	// Router
	mux := http.NewServeMux()
	server.SetupRoutes(
		mux,
		userHandler,
		plotHandler,
		tankHandler,
		configHandler,
		sensorHandler,
		levelHandler,
		actuatorHandler,
		scheduleHandler,
	)

	log.Println("server berjalan di :8080")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
