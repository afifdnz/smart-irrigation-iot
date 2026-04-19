package mysql

import (
	"context"
	"database/sql"
	"time"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/repository"
)

type userRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) repository.UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) FindByUsername(ctx context.Context, username string) (*domains.User, error) {
	query := `
        SELECT id, username, password_hash, email, created_at, last_login
        FROM users
        WHERE username = ?`

	user := &domains.User{}
	err := r.db.QueryRowContext(ctx, query, username).Scan(
		&user.ID,
		&user.Username,
		&user.Password,
		&user.Email,
		&user.CreatedAt,
		&user.LastLogin,
	)
	if err == sql.ErrNoRows {
		return nil, domains.ErrInvalidCredentials
	}
	if err != nil {
		return nil, err
	}
	return user, nil
}

func (r *userRepository) FindByID(ctx context.Context, id int) (*domains.User, error) {
	query := `
		SELECT id, username, password_hash, email, created_at, last_login
		FROM users
		WHERE id = ?
	`
	user := &domains.User{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&user.ID,
		&user.Username,
		&user.Password,
		&user.Email,
		&user.CreatedAt,
		&user.LastLogin,
	)

	if err == sql.ErrNoRows {
		return nil, domains.ErrInvalidCredentials
	}
	if err != nil {
		return nil, err
	}

	return user, nil
}

func (r *userRepository) UpdateLastLogin(ctx context.Context, id int, lastLogin time.Time) error {
	query := `UPDATE users SET last_login = ? WHERE id = ?`
	_, err := r.db.ExecContext(ctx, query, lastLogin, id)
	return err
}
