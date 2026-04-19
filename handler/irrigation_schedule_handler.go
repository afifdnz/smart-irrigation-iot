package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/internal/pkg/httputil"
	"github.com/afifdnz/irrigation-iot/internal/pkg/jwtutil"
	"github.com/afifdnz/irrigation-iot/internal/pkg/response"
	"github.com/afifdnz/irrigation-iot/service"
)

type IrrigationScheduleHandler struct {
	scheduleService service.IrrigationScheduleService
}

func NewIrrigationScheduleHandler(scheduleService service.IrrigationScheduleService) *IrrigationScheduleHandler {
	return &IrrigationScheduleHandler{scheduleService: scheduleService}
}

func (h *IrrigationScheduleHandler) GetByPetakID(w http.ResponseWriter, r *http.Request) {
	plotID, err := httputil.ParseIDFromPath(r, "plot_id")
	if err != nil {
		response.BadRequest(w, "plot_id not valid")
		return
	}

	schedules, err := h.scheduleService.GetByPlotID(r.Context(), plotID)
	if err != nil {
		response.InternalError(w, "failed to retrieve irrigation scheulde")
		return
	}
	response.Success(w, "success to retrieve irrigation schedule", schedules)
}

func (h *IrrigationScheduleHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := httputil.ParseIDFromPath(r, "id")
	if err != nil {
		response.BadRequest(w, "id not valid")
		return
	}

	schedule, err := h.scheduleService.GetByID(r.Context(), id)
	if err != nil {
		response.NotFound(w, "schedule not found")
		return
	}
	response.Success(w, "success to retrieve irrigation schedule", schedule)
}

func (h *IrrigationScheduleHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		PlotID          int       `json:"plot_id"`
		StartTime       time.Time `json:"start_time"`
		DurationSeconds int       `json:"duration_seconds"`
		DaysOfWeek      string    `json:"days_of_week"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "request body not valid")
		return
	}

	schedule := &domains.IrrigationSchedule{
		PlotID:          req.PlotID,
		StartTime:       req.StartTime,
		DurationSeconds: req.DurationSeconds,
		DaysOfWeek:      req.DaysOfWeek,
	}

	// createdBy sementara 0 dulu, nanti diisi dari JWT claims
	claims, _ := jwtutil.GetClaims(r.Context())
	if err := h.scheduleService.Create(r.Context(), schedule, claims.UserID); err != nil {
		if err == domains.ErrPlotNotFound {
			response.NotFound(w, "plot not found")
			return
		}
		response.InternalError(w, "failed to create irrigation schedule")
		return
	}
	response.Created(w, "success to create irrigation schedule", schedule)
}

func (h *IrrigationScheduleHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := httputil.ParseIDFromPath(r, "id")
	if err != nil {
		response.BadRequest(w, "id not valid")
		return
	}

	var req struct {
		StartTime       time.Time `json:"start_time"`
		DurationSeconds int       `json:"duration_seconds"`
		DaysOfWeek      string    `json:"days_of_week"`
		IsActive        bool      `json:"is_active"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "request body not valid")
		return
	}

	schedule := &domains.IrrigationSchedule{
		ID:              id,
		StartTime:       req.StartTime,
		DurationSeconds: req.DurationSeconds,
		DaysOfWeek:      req.DaysOfWeek,
		IsActive:        req.IsActive,
	}

	if err := h.scheduleService.Update(r.Context(), schedule); err != nil {
		if err == domains.ErrScheduleNotFound {
			response.NotFound(w, "schedule not found")
			return
		}
		response.InternalError(w, "failed to update irrigation schedule")
		return
	}
	response.Success(w, "success to update irrigation schedule", nil)
}

func (h *IrrigationScheduleHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := httputil.ParseIDFromPath(r, "id")
	if err != nil {
		response.BadRequest(w, "id not valid")
		return
	}

	if err := h.scheduleService.Delete(r.Context(), id); err != nil {
		if err == domains.ErrScheduleNotFound {
			response.NotFound(w, "schedule not found")
			return
		}
		response.InternalError(w, "failed to delete irrigation schedule")
		return
	}
	response.Success(w, "success to delete irrigation schedule", nil)
}
