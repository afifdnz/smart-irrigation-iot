package main

import (
	"log"
	"net/http"
	"os"

	"github.com/afifdnz/irrigation-iot/handler"
	// "github.com/afifdnz/irrigation-iot/internal/repository/inmemory"
	mysqlrepo "github.com/afifdnz/irrigation-iot/internal/repository/mysql"
	"github.com/afifdnz/irrigation-iot/internal/server"
	"github.com/afifdnz/irrigation-iot/internal/storage"
	"github.com/afifdnz/irrigation-iot/service"
	mqtt "github.com/eclipse/paho.mqtt.golang"
	_ "github.com/go-sql-driver/mysql"
)

func main() {
	// Mengambil port dari environment variable yang ada di docker-compose
	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8080" // Default jika tidak ada
	}

	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		// Fallback untuk development lokal tanpa docker
		dsn = "user_iot:password_iot@tcp(localhost:3307)/iot_irrigation_db?parseTime=true"
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET tidak boleh kosong")
	}

	db, err := storage.NewMySQL(dsn)
	if err != nil {
		log.Fatalf("gagal koneksi database: %v", err)
	}
	defer db.Close()

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
	// userRepo := inmemory.NewUserRepository()
	// plotRepo := inmemory.NewPlotRepository()
	// tankRepo := inmemory.NewWaterTankRepository()
	// configRepo := inmemory.NewPlantConfigRepository()
	// sensorRepo := inmemory.NewSensorReadingRepository()
	// levelRepo := inmemory.NewWaterLevelLogRepository()
	// actuatorRepo := inmemory.NewActuatorLogRepository()
	// scheduleRepo := inmemory.NewIrrigationScheduleRepository()

	userRepo := mysqlrepo.NewUserRepository(db)
	plotRepo := mysqlrepo.NewPlotRepository(db)
	tankRepo := mysqlrepo.NewWaterTankRepository(db)
	configRepo := mysqlrepo.NewPlantConfigRepository(db)
	sensorRepo := mysqlrepo.NewSensorReadingRepository(db)
	levelRepo := mysqlrepo.NewWaterLevelLogRepository(db)
	actuatorRepo := mysqlrepo.NewActuatorLogRepository(db)
	scheduleRepo := mysqlrepo.NewIrrigationScheduleRepository(db)

	// Service
	userService := service.NewUserService(userRepo, jwtSecret)
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
	mqttHandler := handler.NewMQTTHandler(sensorService, levelService)

	// Router
	mux := http.NewServeMux()
	server.SetupRoutes(
		mux,
		jwtSecret,
		userHandler,
		plotHandler,
		tankHandler,
		configHandler,
		sensorHandler,
		levelHandler,
		actuatorHandler,
		scheduleHandler,
	)

	mqttBroker := os.Getenv("MQTT_BROKER")
	if mqttBroker == "" {
		mqttBroker = "tcp://localhost:1883"
	}

	opts := mqtt.NewClientOptions().AddBroker(mqttBroker)
	opts.SetClientID("irrigation_backend")

	client := mqtt.NewClient(opts)
	if token := client.Connect(); token.Wait() && token.Error() != nil {
		log.Printf("MQTT Connection Error: %v", token.Error())
	} else {
		log.Println("Berhasil terhubung ke MQTT Broker")
		client.Subscribe("iot/sensors", 1, mqttHandler.HandleSensorReading)
		client.Subscribe("iot/levels", 1, mqttHandler.HandleWaterLevel)
	}

	log.Println("server berjalan di :8080")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
