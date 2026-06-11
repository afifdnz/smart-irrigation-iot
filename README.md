# IoT Smart Irrigation Backend

Backend service for a Smart Irrigation system connecting hardware nodes (ESP8266/Microcontrollers) with a frontend dashboard (React). This system is built using **Go (Golang)** applying **Clean Architecture** principles (Domains, Handlers, Services, Repositories) and supports dual communication protocols (HTTP and MQTT).

## 🚀 Key Features

* **Hybrid Ingress (Multi-Protocol):**
    * **HTTP REST API:** Serves synchronous requests from client applications (Web/Frontend) for data management (CRUD operations for schedules, plots, and authentication).
    * **MQTT Broker Integration:** Handles asynchronous, two-way communication with IoT hardware (Sensor telemetry and real-time actuator control).
* **Real-time Monitoring:** Receives and stores precise soil moisture and ultrasonic sensor (water tank level) readings.
* **Actuator Control:** Sends command payloads to microcontrollers to manually turn water pumps or servos on/off.
* **Automated Scheduling:** Manages automated irrigation schedules based on active days, start time, and watering duration.
* **Security:** Secured with JWT (JSON Web Token) authentication and CORS (Cross-Origin Resource Sharing) protection.

## 🛠️ Technologies Used

* **Programming Language:** Go (Golang)
* **Database:** MySQL
* **IoT Protocol:** MQTT (Paho MQTT Client)
* **Infrastructure:** Docker & Docker Compose (Optional)

## 📁 Directory Structure (Clean Architecture)

This project is separated based on technical responsibilities to ensure maintainability and scalability:
```txt
├── cmd/
│   └── main.go                 # Main application entry point (HTTP & MQTT Initialization)
├── internal/
│   ├── domains/                # Entity definitions (Structs) and contracts (Interfaces)
│   ├── handler/                # Request entry points (HTTP API Controllers & MQTT Subscribers)
│   ├── service/                # Irrigation system business logic (Usecases)
│   └── repository/             # Direct MySQL database access (SQL Queries)
├── pkg/
│   └── middleware/             # Intermediary logic such as JWT Auth & CORS
└── go.mod
```
## 📡 MQTT Topic Communication Flow

The backend actively subscribes to and publishes messages to the broker via the following topics:

| Topic | Type | Payload Format (JSON) | Description |
| :--- | :--- | :--- | :--- |
| `iot/sensors` | Subscribe | `{"plot_id": 1, "soil_moisture_pct": 80}` | Soil moisture telemetry from ESP8266 |
| `iot/levels` | Subscribe | `{"tank_id": 1, "water_level_cm": 15}` | Ultrasonic distance for water tank level |
| `iot/control/{id}` | Publish | `{"action": "ON"}` | Sends pump actuation commands to ESP8266 |

## ⚙️ Prerequisites

Before running the application, ensure your system has the following installed:
* [Go](https://go.dev/) (version 1.18 or newer)
* MySQL Server
* MQTT Broker (e.g., Eclipse Mosquitto, EMQX, or HiveMQ)
* Docker (Optional, for containerization)

## 🔧 Installation & Configuration

1.  **Clone this repository:**
    git clone https://github.com/username/irrigation-backend.git
    cd irrigation-backend

2.  **Install dependencies:**
    go mod tidy

3.  **Environment Variables Setup:**
    Set the environment variables in a `.env` file or directly in your system environment:
    PORT=8080
    DB_DSN=user_iot:password_iot@tcp(localhost:3307)/iot_irrigation_db?parseTime=true&loc=UTC
    MQTT_BROKER=tcp://localhost:1883
    JWT_SECRET=your_system_secret
    
    *(Note: Adding the `?parseTime=true&loc=UTC` parameter to the DSN is crucial for Go to accurately parse SQL time data types).*

## ▶️ Running the Application

**Locally (Without Docker):**
go run cmd/main.go

**Using Docker Compose:**
If you have included the `docker-compose.yml`, run the following command to initiate the Go server alongside MySQL and the MQTT Broker:
docker-compose up -d --build

Once the application is running, the initialization logs will appear in your terminal:
Berhasil terhubung ke MQTT Broker
server berjalan di :8080
