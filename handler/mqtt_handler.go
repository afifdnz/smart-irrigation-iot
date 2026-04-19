package handler

import (
	"context"
	"encoding/json"
	"log"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/service"
	mqtt "github.com/eclipse/paho.mqtt.golang"
)

type MQTTHandler struct {
	sensorService service.SensorReadingService
	levelService  service.WaterLevelLogService
}

func NewMQTTHandler(sensorService service.SensorReadingService, levelService service.WaterLevelLogService) *MQTTHandler {
	return &MQTTHandler{
		sensorService: sensorService,
		levelService:  levelService,
	}
}

func (h *MQTTHandler) HandleSensorReading(client mqtt.Client, msg mqtt.Message) {
	log.Printf("MQTT RAW PAYLOAD: %s", string(msg.Payload()))
	var reading domains.SensorReading
	var req struct {
		PlotID          int     `json:"plot_id"`
		SoilMoisturePct float64 `json:"soil_moisture_pct"`
	}

	if err := json.Unmarshal(msg.Payload(), &req); err != nil {
		log.Printf("MQTT Error [Sensor]: %v", err)
		return
	}
	reading = domains.SensorReading{
		PlotID:          req.PlotID,
		SoilMoisturePct: req.SoilMoisturePct,
	}

	log.Printf("DEBUG DECODED: PlotID=%d, Moisture=%.2f", reading.PlotID, reading.SoilMoisturePct)
	if err := h.sensorService.Record(context.Background(), &reading); err != nil {
		log.Printf("MQTT Error [Record Sensor]: %v", err)
	} else {
		log.Printf("MQTT Success: Recorded sensor for Plot %d", reading.PlotID)
	}
}

func (h *MQTTHandler) HandleWaterLevel(client mqtt.Client, msg mqtt.Message) {
	var level domains.WaterLevelLog
	var req struct {
		TankID       int     `json:"tank_id"`
		WaterLevelCm float64 `json:"water_level_cm"`
	}
	if err := json.Unmarshal(msg.Payload(), &level); err != nil {
		log.Printf("MQTT Error [Level]: %v", err)
		return
	}
	level = domains.WaterLevelLog{
		TankID:       req.TankID,
		WaterLevelCm: req.WaterLevelCm,
	}

	if err := h.levelService.Record(context.Background(), &level); err != nil {
		log.Printf("MQTT Error [Record Level]: %v", err)
	} else {
		log.Printf("MQTT Success: Recorded level for Tank %d", level.TankID)
	}
}
