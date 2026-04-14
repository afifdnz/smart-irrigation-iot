package handler

import (
	"encoding/json"
	"net/http"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/internal/pkg/httputil"
	"github.com/afifdnz/irrigation-iot/internal/pkg/response"
	"github.com/afifdnz/irrigation-iot/service"
)

type WaterTankHandler struct {
	tankService service.WaterTankService
}

func NewWaterTankHandler(tankService service.WaterTankService) *WaterTankHandler {
	return &WaterTankHandler{tankService: tankService}
}

func (h *WaterTankHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	tanks, err := h.tankService.GetAll(r.Context())
	if err != nil {
		response.InternalError(w, "failed to retrieve water tank data")
		return
	}
	response.Success(w, "success to retrieve water tank data", tanks)
}

func (h *WaterTankHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := httputil.ParseIDFromPath(r, "id")
	if err != nil {
		response.BadRequest(w, "id not valid")
		return
	}

	tank, err := h.tankService.GetByID(r.Context(), id)
	if err != nil {
		response.NotFound(w, "water tank not found")
		return
	}
	response.Success(w, "success to retrieve water tank data", tank)
}

func (h *WaterTankHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		TankName       string  `json:"tank_name"`
		CapacityLiters float64 `json:"capacity_liters"`
		HeightCm       float64 `json:"height_cm"`
		MinLevelCm     float64 `json:"min_level_cm"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "request body not valid")
		return
	}

	if req.TankName == "" {
		response.BadRequest(w, "tank_name must be filled")
		return
	}

	tank := &domains.WaterTank{
		TankName:       req.TankName,
		CapacityLiters: req.CapacityLiters,
		HeightCm:       req.HeightCm,
		MinLevelCm:     req.MinLevelCm,
	}

	if err := h.tankService.Create(r.Context(), tank); err != nil {
		if err == domains.ErrInvalidTankConfig {
			response.BadRequest(w, "min_level_cm exceed height_cm")
			return
		}
		response.InternalError(w, "failed to create water tank")
		return
	}
	response.Created(w, "success to create water tank", tank)
}

func (h *WaterTankHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := httputil.ParseIDFromPath(r, "id")
	if err != nil {
		response.BadRequest(w, "id not valid")
		return
	}

	var req struct {
		TankName       string  `json:"tank_name"`
		CapacityLiters float64 `json:"capacity_liters"`
		HeightCm       float64 `json:"height_cm"`
		MinLevelCm     float64 `json:"min_level_cm"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "request body not valid")
		return
	}

	tank := &domains.WaterTank{
		ID:             id,
		TankName:       req.TankName,
		CapacityLiters: req.CapacityLiters,
		HeightCm:       req.HeightCm,
		MinLevelCm:     req.MinLevelCm,
	}

	if err := h.tankService.Update(r.Context(), tank); err != nil {
		if err == domains.ErrWaterTankNotFound {
			response.NotFound(w, "water tank not found")
			return
		}
		if err == domains.ErrInvalidTankConfig {
			response.BadRequest(w, "min_level_cm exceed height_cm")
			return
		}
		response.InternalError(w, "failed to update water tank")
		return
	}
	response.Success(w, "success to update water tank", nil)
}

func (h *WaterTankHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := httputil.ParseIDFromPath(r, "id")
	if err != nil {
		response.BadRequest(w, "id not valid")
		return
	}

	if err := h.tankService.Delete(r.Context(), id); err != nil {
		if err == domains.ErrWaterTankNotFound {
			response.NotFound(w, "water tank not found")
			return
		}
		response.InternalError(w, "failed to delete water tank")
		return
	}
	response.Success(w, "success to delete water tank", nil)
}
