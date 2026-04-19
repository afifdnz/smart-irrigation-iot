package mysql

import (
	"context"
	"database/sql"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/repository"
)

type plotRepository struct {
	db *sql.DB
}

func NewPlotRepository(db *sql.DB) repository.PlotRepository {
	return &plotRepository{db: db}
}

func (r *plotRepository) FindAll(ctx context.Context) ([]*domains.Plot, error) {
	query := `
		SELECT id, plot_name, plant_name, plant_notes, is_active, created_at, updated_at 
		FROM plots
		ORDER BY created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	plots := make([]*domains.Plot, 0)
	for rows.Next() {
		p := &domains.Plot{}
		if err := rows.Scan(
			&p.ID, &p.PlotName, &p.PlantName, &p.PlantNote, &p.IsActive, &p.CreatedAt, &p.UpdatedAt,
		); err != nil {
			return nil, err
		}
		plots = append(plots, p)
	}

	return plots, rows.Err()
}

func (r *plotRepository) FindAllActive(ctx context.Context) ([]*domains.Plot, error) {
	query := `
		SELECT id, plot_name, plant_name, plant_notes, is_active, created_at, updated_at
		FROM plots
		WHERE is_active = TRUE
		ORDER BY created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	plots := make([]*domains.Plot, 0)
	for rows.Next() {
		p := &domains.Plot{}
		if err := rows.Scan(
			&p.ID, &p.PlotName, &p.PlantName, &p.PlantNote, &p.IsActive, &p.CreatedBy, &p.UpdatedAt,
		); err != nil {
			return nil, err
		}
		plots = append(plots, p)
	}
	return plots, rows.Err()
}

func (r *plotRepository) FindByID(ctx context.Context, id int) (*domains.Plot, error) {
	query := `
		SELECT id, plot_name, plant_name, plant_notes, is_active, created_at, updated_at
		FROM plots
		WHERE id = ?
	`
	p := &domains.Plot{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&p.ID, &p.PlotName, &p.PlantName, &p.PlantNote, &p.IsActive, &p.CreatedAt, &p.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, domains.ErrPlotNotFound
	}
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (r *plotRepository) Create(ctx context.Context, plot *domains.Plot) error {
	query := `
		INSERT INTO plots (plot_name, plant_name, plant_notes, is_active, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`
	result, err := r.db.ExecContext(ctx, query, plot.PlotName, plot.PlantName, plot.PlantNote, plot.IsActive, plot.CreatedAt, plot.UpdatedAt)
	if err != nil {
		return nil
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}

	plot.ID = int(id)
	return nil
}

func (r *plotRepository) Update(ctx context.Context, plot *domains.Plot) error {
	query := `
		UPDATE plots
		SET plot_name = ?, plant_name = ?, plant_notes = ?, updated_at = ?
		WHERE id = ?
	`

	_, err := r.db.ExecContext(ctx, query, plot.PlotName, plot.PlantName, plot.PlantNote, plot.UpdatedAt, plot.ID)
	return err
}

func (r *plotRepository) SoftDelete(ctx context.Context, id int) error {
	query := `
		UPDATE plots SET is_active = FALSE, updated_at = NOW() WHERE id = ?
	`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}
