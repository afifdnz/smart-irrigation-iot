package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/afifdnz/irrigation-iot/internal/pkg/response"
	"github.com/afifdnz/irrigation-iot/service"
)

type UserHandler struct {
	userService service.UserService
}

func NewUserHandler(userService service.UserService) *UserHandler {
	return &UserHandler{userService: userService}
}

func (h *UserHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "request body not valid")
		return
	}
	log.Printf("Password User: %v", req.Password)
	if req.Username == "" || req.Password == "" {
		response.BadRequest(w, "username and password not valid")
		return
	}
	token, err := h.userService.Login(r.Context(), req.Username, req.Password)
	if err != nil {
		log.Printf("Error: ", err)
		response.Unauthorized(w, "usename and password are wrong")
		return
	}

	response.Success(w, "login success", map[string]string{
		"token": token,
	})
}
