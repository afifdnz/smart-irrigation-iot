package handler

import (
	"encoding/json"
	"net/http"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/internal/pkg/httputil"
	"github.com/afifdnz/irrigation-iot/internal/pkg/response"
	"github.com/afifdnz/irrigation-iot/service"
)

type ActuatorLogHandler struct {
	logService service.ActuatorLogService
}

func NewActuatorLogHandler(logService service.ActuatorLogService) *ActuatorLogHandler {
	return &ActuatorLogHandler{logService: logService}
}

func (h *ActuatorLogHandler) GetByPlotID(w http.ResponseWriter, r *http.Request) {
	plotID, err := httputil.ParseIDFromPath(r, "plot_id")
	if err != nil {
		response.BadRequest(w, "plot_id not valid")
		return
	}

	limit, offset := httputil.ParsePagination(r)

	logs, err := h.logService.GetByPlotID(r.Context(), plotID, limit, offset)
	if err != nil {
		response.InternalError(w, "failed to retrieve actuator log")
		return
	}
	response.Success(w, "success to retrieve actuator log", logs)
}

func (h *ActuatorLogHandler) GetLatest(w http.ResponseWriter, r *http.Request) {
	plotID, err := httputil.ParseIDFromPath(r, "plot_id")
	if err != nil {
		response.BadRequest(w, "plot_id not valid")
		return
	}

	log, err := h.logService.GetLatestByPlotID(r.Context(), plotID)
	if err != nil {
		response.NotFound(w, "actuator log not found")
		return
	}
	response.Success(w, "success to retrieve latest actuator log", log)
}

func (h *ActuatorLogHandler) RecordAuto(w http.ResponseWriter, r *http.Request) {
	var req struct {
		PlotID         int                `json:"plot_id"`
		Action         domains.ActionType `json:"action"`
		DurationSecond int                `json:"duration_seconds"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "request body not valid")
		return
	}

	log := &domains.ActuatorLog{
		PlotID:         req.PlotID,
		Action:         req.Action,
		DurationSecond: req.DurationSecond,
	}

	if err := h.logService.RecordAuto(r.Context(), log); err != nil {
		response.InternalError(w, "failed to save actuator log")
		return
	}
	response.Created(w, "success to save actuator log", log)
}

func (h *ActuatorLogHandler) ManualOverride(w http.ResponseWriter, r *http.Request) {
	var req struct {
		PlotID         int                `json:"plot_id"`
		Action         domains.ActionType `json:"action"`
		DurationSecond int                `json:"duration_seconds"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "request body not valid")
		return
	}

	log := &domains.ActuatorLog{
		PlotID:         req.PlotID,
		Action:         req.Action,
		DurationSecond: req.DurationSecond,
	}

	if err := h.logService.RecordManualOverride(r.Context(), log); err != nil {
		switch err {
		case domains.ErrPlotNotActive:
			response.BadRequest(w, "plot inactive")
		case domains.ErrInsufficientWater:
			response.BadRequest(w, "water level is under minimum")
		case domains.ErrPlotNotFound:
			response.NotFound(w, "plot not found")
		default:
			response.InternalError(w, "failed to override")
		}
		return
	}
	response.Created(w, "success to override", log)
}
