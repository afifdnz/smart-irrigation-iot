package service

import (
	"context"
	"time"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/repository"
)

type UserService interface {
	Login(ctx context.Context, username, password string) error
}

type userService struct {
	userRepo repository.UserRepository
}

func NewUserService(userRepo repository.UserRepository) UserService {
	return &userService{userRepo: userRepo}
}

func (s *userService) Login(ctx context.Context, username, password string) error {
	user, err := s.userRepo.FindByUsername(ctx, username)
	if err != nil {
		return domains.ErrInvalidCredentials
	}
	if !user.IsPasswordMatch(password) {
		return domains.ErrInvalidCredentials
	}
	if err := s.userRepo.UpdateLastLogin(ctx, user.ID, time.Now()); err != nil {
		return err
	}
	return nil
}
