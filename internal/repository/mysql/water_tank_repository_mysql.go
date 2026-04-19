package mysql

import (
	"context"
	"database/sql"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/repository"
)

type waterTankRepository struct {
	db *sql.DB
}

func NewWaterTankRepository(db *sql.DB) repository.WaterTankRepository {
	return &waterTankRepository{db: db}
}

func (r *waterTankRepository) FindAll(ctx context.Context) ([]*domains.WaterTank, error) {
	query := `
		SELECT id, tank_name, capacity_liters, height_cm, min_level_cm, created_at
		FROM water_tanks
		ORDER BY created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	tanks := make([]*domains.WaterTank, 0)
	for rows.Next() {
		t := &domains.WaterTank{}
		if err := rows.Scan(
			&t.ID, &t.TankName, &t.CapacityLiters, &t.HeightCm, &t.MinLevelCm, &t.CreatedAt,
		); err != nil {
			return nil, err
		}
		tanks = append(tanks, t)
	}
	return tanks, rows.Err()
}

func (r *waterTankRepository) FindByID(ctx context.Context, id int) (*domains.WaterTank, error) {
	query := `
		SELECT id, tank_name, capacity_liters, height_cm, min_level_cm, created_at
		FROM water_tanks
		WHERE id = ?
	`

	t := &domains.WaterTank{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&t.ID, &t.TankName, &t.CapacityLiters, &t.HeightCm, &t.MinLevelCm, &t.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, domains.ErrWaterTankNotFound
	}
	if err != nil {
		return nil, err
	}
	return t, nil
}

func (r *waterTankRepository) Create(ctx context.Context, tank *domains.WaterTank) error {
	query := `
		INSERT INTO water_tanks (tank_name, capacity_liters, height_cm, min_level_cm, created_at)
		VALUES (?, ?, ?, ? ,?)
	`

	result, err := r.db.ExecContext(ctx, query, tank.TankName, tank.CapacityLiters, tank.HeightCm, tank.MinLevelCm, tank.CreatedAt)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil
	}
	tank.ID = int(id)
	return nil
}

func (r *waterTankRepository) Update(ctx context.Context, tank *domains.WaterTank) error {
	query := `
		UPDATE water_tanks
		SET tank_name = ?, capacity_liters = ?, height_cm = ?, min_level_cm = ?
		WHERE id = ?
	`
	_, err := r.db.ExecContext(ctx, query, tank.TankName, tank.CapacityLiters, tank.HeightCm, tank.MinLevelCm, tank.ID)
	return err
}

func (r *waterTankRepository) Delete(ctx context.Context, id int) error {
	query := `DELETE FROM water_tanks WHERE id = ?`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}
