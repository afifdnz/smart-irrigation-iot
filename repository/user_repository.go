package repository

import (
	"context"
	"time"

	"github.com/afifdnz/irrigation-iot/domains"
)

type UserRepository interface {
	FindByUsername(ctx context.Context, username string) (*domains.User, error)
	FindByID(ctx context.Context, id int) (*domains.User, error)
	UpdateLastLogin(ctx context.Context, id int, lastLogin time.Time) error
}
