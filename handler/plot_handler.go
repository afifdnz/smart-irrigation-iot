package handler

import (
	"encoding/json"
	"net/http"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/internal/pkg/httputil"
	"github.com/afifdnz/irrigation-iot/internal/pkg/response"
	"github.com/afifdnz/irrigation-iot/service"
)

type PlotHandler struct {
	plotService service.PlotService
}

func NewPlotHandler(plotService service.PlotService) *PlotHandler {
	return &PlotHandler{plotService: plotService}
}

func (h *PlotHandler) GetAll(w http.ResponseWriter, r *http.Request) {
	plots, err := h.plotService.GetAll(r.Context())
	if err != nil {
		response.InternalError(w, "failed to retrieve plot data")
		return
	}
	response.Success(w, "success to retrieve plot data", plots)
}

func (h *PlotHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	id, err := httputil.ParseIDFromPath(r, "id")
	if err != nil {
		response.BadRequest(w, "id not valid")
		return
	}

	plot, err := h.plotService.GetByID(r.Context(), id)
	if err != nil {
		response.NotFound(w, "plot not found")
		return
	}
	response.Success(w, "success to retrieve plot data", plot)
}

func (h *PlotHandler) Create(w http.ResponseWriter, r *http.Request) {
	var req struct {
		PlotName  string `json:"plot_name"`
		PlantName string `json:"plant_name"`
		PlantNote string `json:"plant_note"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "request body tidak valid")
		return
	}
	if req.PlotName == "" || req.PlantName == "" {
		response.BadRequest(w, "plot name and plant name are not valid")
		return
	}

	plot := &domains.Plot{
		PlotName:  req.PlantName,
		PlantName: req.PlantName,
		PlantNote: req.PlantNote,
	}

	if err := h.plotService.Create(r.Context(), plot); err != nil {
		response.InternalError(w, "failed to create plot")
		return
	}
	response.Success(w, "success to create plot", plot)
}

func (h *PlotHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := httputil.ParseIDFromPath(r, "id")
	if err != nil {
		response.BadRequest(w, "id not valid")
		return
	}

	var req struct {
		PlotName  string `json:"plot_name"`
		PlantName string `json:"plant_name"`
		PlantNote string `jsoon:"plant_note"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "body request not valid")
		return
	}

	plots := &domains.Plot{
		ID:        id,
		PlotName:  req.PlotName,
		PlantName: req.PlantName,
		PlantNote: req.PlantNote,
	}

	if err := h.plotService.Update(r.Context(), plots); err != nil {
		if err == domains.ErrPlotNotFound {
			response.NotFound(w, "plot not found")
		}
		response.InternalError(w, "failed to update plot")
		return
	}
	response.Success(w, "success to update plot", nil)
}

func (h *PlotHandler) Deactivate(w http.ResponseWriter, r *http.Request) {
	id, err := httputil.ParseIDFromPath(r, "id")
	if err != nil {
		response.BadRequest(w, "id not valid")
		return
	}
	if err := h.plotService.Deactivate(r.Context(), id); err != nil {
		if err == domains.ErrPlotNotFound {
			response.NotFound(w, "plot not found")
			return
		}
		response.InternalError(w, "failed to deactivate plot")
		return
	}
	response.Success(w, "success to deactivate plot", nil)
}
