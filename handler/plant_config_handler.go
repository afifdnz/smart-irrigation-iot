package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/internal/pkg/httputil"
	"github.com/afifdnz/irrigation-iot/internal/pkg/response"
	"github.com/afifdnz/irrigation-iot/service"
)

type PlantConfigHandler struct {
	configService service.PlantConfigService
}

func NewPlantConfigHandler(configService service.PlantConfigService) *PlantConfigHandler {
	return &PlantConfigHandler{configService: configService}
}

func (h *PlantConfigHandler) GetByPlotID(w http.ResponseWriter, r *http.Request) {
	plotID, err := httputil.ParseIDFromPath(r, "plot_id")
	if err != nil {
		response.BadRequest(w, "plot_id not valid")
		return
	}

	config, err := h.configService.GetByPlotID(r.Context(), plotID)
	if err != nil {
		response.NotFound(w, "konfigurasi tidak ditemukan")
		return
	}
	response.Success(w, "berhasil mengambil konfigurasi", config)
}

func (h *PlantConfigHandler) Create(w http.ResponseWriter, r *http.Request) {
	plotID, err := httputil.ParseIDFromPath(r, "plot_id")
	if err != nil {
		response.BadRequest(w, "plot_id not valid")
		return
	}

	var req struct {
		TankID         int     `json:"tank_id"`
		MoistureMinPct float64 `json:"moisture_min_pct"`
		MoistureMaxPct float64 `json:"moisture_max_pct"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "request body not valid")
		return
	}

	config := &domains.PlantConfig{
		PlotID:         plotID,
		TankID:         req.TankID,
		MoistureMinPct: req.MoistureMinPct,
		MoistureMaxPct: req.MoistureMaxPct,
	}

	// updatedBy sementara 0 dulu, nanti diisi dari JWT claims
	if err := h.configService.Create(r.Context(), config, 1); err != nil {
		switch err {
		case domains.ErrPlotNotFound:
			response.NotFound(w, "plot not found")
		case domains.ErrConfigAlreadyExists:
			response.BadRequest(w, "plot already exist")
		case domains.ErrMoistureOutOfRange, domains.ErrMinMoistureExceedMaxMoisture:
			response.BadRequest(w, err.Error())
		default:
			response.InternalError(w, "failed to create config")
		}
		log.Printf("Plant Config: %v", err)
		return
	}
	response.Created(w, "success to create config", config)
}

func (h *PlantConfigHandler) Update(w http.ResponseWriter, r *http.Request) {
	plotID, err := httputil.ParseIDFromPath(r, "plot_id")
	if err != nil {
		response.BadRequest(w, "plotID not valid")
		return
	}

	var req struct {
		TankID         int     `json:"tank_id"`
		MoistureMinPct float64 `json:"moisture_min_pct"`
		MoistureMaxPct float64 `json:"moisture_max_pct"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "request body not valid")
		return
	}

	config := &domains.PlantConfig{
		PlotID:         plotID,
		TankID:         req.TankID,
		MoistureMinPct: req.MoistureMinPct,
		MoistureMaxPct: req.MoistureMaxPct,
	}

	// updatedBy sementara 0 dulu, nanti diisi dari JWT claims
	if err := h.configService.Update(r.Context(), config, 1); err != nil {
		switch err {
		case domains.ErrConfigNotFound:
			response.NotFound(w, "config not found")
		case domains.ErrMoistureOutOfRange, domains.ErrMinMoistureExceedMaxMoisture:
			response.BadRequest(w, err.Error())
		default:
			response.InternalError(w, "failed to update config")
		}
		return
	}
	response.Success(w, "success to update config", nil)
}
