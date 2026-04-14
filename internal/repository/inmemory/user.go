package inmemory

import (
	"context"
	"errors"
	"sync"
	"time"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/repository"
)

type userRepository struct {
	mu      sync.RWMutex
	users   map[int]*domains.User
	counter int
}

func NewUserRepository() repository.UserRepository {
	// Seed satu admin default untuk testing
	repo := &userRepository{
		users: make(map[int]*domains.User),
	}
	repo.counter = 1
	repo.users[1] = &domains.User{
		ID:        1,
		Username:  "admin",
		Password:  "admin123", // bcrypt dari "admin123"
		Email:     "admin@irigasi.com",
		CreatedAt: time.Now(),
	}
	return repo
}

func (r *userRepository) FindByUsername(ctx context.Context, username string) (*domains.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	for _, u := range r.users {
		if u.Username == username {
			return u, nil
		}
	}
	return nil, errors.New("user tidak ditemukan")
}

func (r *userRepository) FindByID(ctx context.Context, id int) (*domains.User, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	u, ok := r.users[id]
	if !ok {
		return nil, errors.New("user tidak ditemukan")
	}
	return u, nil
}

func (r *userRepository) UpdateLastLogin(ctx context.Context, id int, lastLogin time.Time) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	u, ok := r.users[id]
	if !ok {
		return errors.New("user tidak ditemukan")
	}
	u.LastLogin = lastLogin
	return nil
}
