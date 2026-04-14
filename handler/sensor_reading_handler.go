package handler

import (
	"encoding/json"
	"net/http"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/internal/pkg/httputil"
	"github.com/afifdnz/irrigation-iot/internal/pkg/response"
	"github.com/afifdnz/irrigation-iot/service"
)

type SensorReadingHandler struct {
	readingService service.SensorReadingService
}

func NewSensorReadingHandler(readingService service.SensorReadingService) *SensorReadingHandler {
	return &SensorReadingHandler{readingService: readingService}
}

func (h *SensorReadingHandler) GetByPlotID(w http.ResponseWriter, r *http.Request) {
	plotID, err := httputil.ParseIDFromPath(r, "plot_id")
	if err != nil {
		response.BadRequest(w, "plot_id not valid")
		return
	}

	limit, offset := httputil.ParsePagination(r)

	readings, err := h.readingService.GetByPlotID(r.Context(), plotID, limit, offset)
	if err != nil {
		response.InternalError(w, "failed to retrieve sensor data")
		return
	}
	response.Success(w, "success to retrieve sensor data", readings)
}

func (h *SensorReadingHandler) GetLatest(w http.ResponseWriter, r *http.Request) {
	plotID, err := httputil.ParseIDFromPath(r, "plot_id")
	if err != nil {
		response.BadRequest(w, "plot_id not valid")
		return
	}

	reading, err := h.readingService.GetLatestByPlotID(r.Context(), plotID)
	if err != nil {
		response.NotFound(w, "sensor data not found")
		return
	}
	response.Success(w, "success to retrieve latest sensor data", reading)
}

func (h *SensorReadingHandler) Record(w http.ResponseWriter, r *http.Request) {
	var req struct {
		PlotID          int     `json:"plot_id"`
		SoilMoisturePct float64 `json:"soil_moisture_pct"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "request body not valid")
		return
	}

	reading := &domains.SensorReading{
		PlotID:          req.PlotID,
		SoilMoisturePct: req.SoilMoisturePct,
	}

	if err := h.readingService.Record(r.Context(), reading); err != nil {
		if err == domains.ErrConfigNotFound {
			response.NotFound(w, "plot config not found")
			return
		}
		response.InternalError(w, "failed to save sensor data")
		return
	}
	response.Created(w, "success to save sensor data", reading)
}
