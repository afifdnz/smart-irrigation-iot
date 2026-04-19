package mysql

import (
	"context"
	"database/sql"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/repository"
)

type plantConfigRepository struct {
	db *sql.DB
}

func NewPlantConfigRepository(db *sql.DB) repository.PlantConfigRepository {
	return &plantConfigRepository{db: db}
}

func (r *plantConfigRepository) FindByID(ctx context.Context, id int) (*domains.PlantConfig, error) {
	query := `
		SELECT id, plot_id, tank_id, moisture_min_pct, moisture_max_pct, updated_by, updated_at 
		FROM plant_configs
		WHERE id = ?
	`

	c := &domains.PlantConfig{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&c.ID, &c.PlotID, &c.TankID, &c.MoistureMinPct, &c.MoistureMaxPct, &c.UpdatedBy, &c.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, domains.ErrConfigNotFound
	}
	if err != nil {
		return nil, err
	}
	return c, nil
}

func (r *plantConfigRepository) FindByPlotID(ctx context.Context, plotID int) (*domains.PlantConfig, error) {
	query := `
		SELECT id, plot_id, tank_id, moisture_min_pct, moisture_max_pct, updated_by, updated_at
		FROM plant_configs
		WHERE plot_id = ?
	`

	c := &domains.PlantConfig{}
	err := r.db.QueryRowContext(ctx, query, plotID).Scan(
		&c.ID, &c.PlotID, &c.TankID, &c.MoistureMinPct, &c.MoistureMaxPct, &c.UpdatedBy, &c.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, domains.ErrConfigNotFound
	}
	if err != nil {
		return nil, err
	}
	return c, nil
}

func (r *plantConfigRepository) ExistsByPlotID(ctx context.Context, plotID int) (bool, error) {
	query := `
		SELECT COUNT(1) FROM plant_configs WHERE plot_id = ?
	`
	var count int
	err := r.db.QueryRowContext(ctx, query, plotID).Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *plantConfigRepository) Create(ctx context.Context, config *domains.PlantConfig) error {
	query := `
		INSERT INTO plant_configs (plot_id, tank_id, moisture_min_pct, moisture_max_pct, updated_by, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`

	result, err := r.db.ExecContext(ctx, query, config.PlotID, config.TankID, config.MoistureMinPct, config.MoistureMaxPct, config.UpdatedBy, config.UpdatedAt)
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	config.ID = int(id)
	return nil
}

func (r *plantConfigRepository) Update(ctx context.Context, config *domains.PlantConfig) error {
	query := ` UPDATE plant_configs 
		SET tank_id = ?, moisture_min_pct = ?, moisture_max_pct = ?, updated_by = ?, updated_at = ?
		WHERE id = ?
	`

	_, err := r.db.ExecContext(ctx, query, config.TankID, config.MoistureMinPct, config.MoistureMaxPct, config.UpdatedBy, config.UpdatedAt, config.ID)
	return err
}
