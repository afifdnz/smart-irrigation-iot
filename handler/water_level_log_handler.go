package handler

import (
	"encoding/json"
	"net/http"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/internal/pkg/httputil"
	"github.com/afifdnz/irrigation-iot/internal/pkg/response"
	"github.com/afifdnz/irrigation-iot/service"
)

type WaterLevelLogHandler struct {
	logService service.WaterLevelLogService
}

func NewWaterLevelLogHandler(logService service.WaterLevelLogService) *WaterLevelLogHandler {
	return &WaterLevelLogHandler{logService: logService}
}

func (h *WaterLevelLogHandler) GetByTankID(w http.ResponseWriter, r *http.Request) {
	tankID, err := httputil.ParseIDFromPath(r, "tank_id")
	if err != nil {
		response.BadRequest(w, "tank_id not valid")
		return
	}

	limit, offset := httputil.ParsePagination(r)

	logs, err := h.logService.GetByTankID(r.Context(), tankID, limit, offset)
	if err != nil {
		response.InternalError(w, "failed to retrieve water level data")
		return
	}
	response.Success(w, "success to retrieve water level data", logs)
}

func (h *WaterLevelLogHandler) GetLatest(w http.ResponseWriter, r *http.Request) {
	tankID, err := httputil.ParseIDFromPath(r, "tank_id")
	if err != nil {
		response.BadRequest(w, "tank_id not valid")
		return
	}

	log, err := h.logService.GetLatestByTankID(r.Context(), tankID)
	if err != nil {
		response.NotFound(w, "water level data not found")
		return
	}
	response.Success(w, "success to retrieve latest water level data", log)
}

func (h *WaterLevelLogHandler) Record(w http.ResponseWriter, r *http.Request) {
	var req struct {
		TankID       int     `json:"tank_id"`
		WaterLevelCm float64 `json:"water_level_cm"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "request body not valid")
		return
	}

	log := &domains.WaterLevelLog{
		TankID:       req.TankID,
		WaterLevelCm: req.WaterLevelCm,
	}

	if err := h.logService.Record(r.Context(), log); err != nil {
		if err == domains.ErrWaterTankNotFound {
			response.NotFound(w, "water tank not found")
			return
		}
		response.InternalError(w, "failed to save water level")
		return
	}
	response.Created(w, "success to save water level data", log)
}
