package response

import (
	"encoding/json"
	"net/http"
)

type Response struct {
	Status  int    `json:"status`
	Message string `json:"message"`
	Data    any    `json:"data"`
}

func WriteJSON(w http.ResponseWriter, status int, message string, data any) {
	w.Header().Set("Content-type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(Response{
		Status:  status,
		Message: message,
		Data:    data,
	})
}

func Success(w http.ResponseWriter, message string, data any) {
	WriteJSON(w, http.StatusOK, message, data)
}

func Created(w http.ResponseWriter, message string, data any) {
	WriteJSON(w, http.StatusCreated, message, data)
}

func BadRequest(w http.ResponseWriter, message string) {
	WriteJSON(w, http.StatusBadRequest, message, nil)
}

func NotFound(w http.ResponseWriter, message string) {
	WriteJSON(w, http.StatusNotFound, message, nil)
}

func InternalError(w http.ResponseWriter, message string) {
	WriteJSON(w, http.StatusInternalServerError, message, nil)
}

func Unauthorized(w http.ResponseWriter, message string) {
	WriteJSON(w, http.StatusUnauthorized, message, nil)
}
