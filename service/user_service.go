package service

import (
	"context"
	"time"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/internal/pkg/jwtutil"
	"github.com/afifdnz/irrigation-iot/repository"
)

type UserService interface {
	Login(ctx context.Context, username, password string) (string, error)
}

type userService struct {
	userRepo  repository.UserRepository
	jwtSecret string
}

func NewUserService(userRepo repository.UserRepository, jwtSecret string) UserService {
	return &userService{userRepo: userRepo, jwtSecret: jwtSecret}
}

//	func (s *userService) Login(ctx context.Context, username, password string) error {
//		user, err := s.userRepo.FindByUsername(ctx, username)
//		if err != nil {
//			return domains.ErrInvalidCredentials
//		}
//		if !user.IsPasswordMatch(password) {
//			return domains.ErrInvalidCredentials
//		}
//		if err := s.userRepo.UpdateLastLogin(ctx, user.ID, time.Now()); err != nil {
//			return err
//		}
//		return nil
//	}
func (s *userService) Login(ctx context.Context, username, password string) (string, error) {
	user, err := s.userRepo.FindByUsername(ctx, username)
	if err != nil {
		return "", domains.ErrInvalidCredentials
	}

	if !user.IsPasswordMatch(password) {
		return "", domains.ErrInvalidCredentials
	}
	if err := s.userRepo.UpdateLastLogin(ctx, user.ID, time.Now()); err != nil {
		return "", err
	}
	token, err := jwtutil.GenerateToken(user.ID, user.Username, user.Email, s.jwtSecret)
	if err != nil {
		return "", err
	}
	return token, nil
}
