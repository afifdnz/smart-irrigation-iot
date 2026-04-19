package mysql

import (
	"context"
	"database/sql"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/repository"
)

type irrigationScheduleRepository struct {
	db *sql.DB
}

func NewIrrigationScheduleRepository(db *sql.DB) repository.IrrigationScheduleRepository {
	return &irrigationScheduleRepository{db: db}
}

func (r *irrigationScheduleRepository) FindAll(ctx context.Context) ([]*domains.IrrigationSchedule, error) {
	query := `
        SELECT id, plot_id, start_time, duration_seconds, days_of_week, is_active, created_by, created_at
        FROM irrigation_schedules
        ORDER BY created_at DESC`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	schedules := make([]*domains.IrrigationSchedule, 0)
	for rows.Next() {
		s := &domains.IrrigationSchedule{}
		if err := rows.Scan(
			&s.ID, &s.PlotID, &s.StartTime, &s.DurationSeconds,
			&s.DaysOfWeek, &s.IsActive, &s.CreatedBy, &s.CreatedAt,
		); err != nil {
			return nil, err
		}
		schedules = append(schedules, s)
	}
	return schedules, rows.Err()
}

func (r *irrigationScheduleRepository) FindByPlotID(ctx context.Context, plotID int) ([]*domains.IrrigationSchedule, error) {
	query := `
        SELECT id, plot_id, start_time, duration_seconds, days_of_week, is_active, created_by, created_at
        FROM irrigation_schedules
        WHERE plot_id = ?
        ORDER BY created_at DESC`

	rows, err := r.db.QueryContext(ctx, query, plotID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	schedules := make([]*domains.IrrigationSchedule, 0)
	for rows.Next() {
		s := &domains.IrrigationSchedule{}
		if err := rows.Scan(
			&s.ID, &s.PlotID, &s.StartTime, &s.DurationSeconds,
			&s.DaysOfWeek, &s.IsActive, &s.CreatedBy, &s.CreatedAt,
		); err != nil {
			return nil, err
		}
		schedules = append(schedules, s)
	}
	return schedules, rows.Err()
}

func (r *irrigationScheduleRepository) FindByID(ctx context.Context, id int) (*domains.IrrigationSchedule, error) {
	query := `
        SELECT id, plot_id, start_time, duration_seconds, days_of_week, is_active, created_by, created_at
        FROM irrigation_schedules
        WHERE id = ?`

	s := &domains.IrrigationSchedule{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&s.ID, &s.PlotID, &s.StartTime, &s.DurationSeconds,
		&s.DaysOfWeek, &s.IsActive, &s.CreatedBy, &s.CreatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, domains.ErrScheduleNotFound
	}
	if err != nil {
		return nil, err
	}
	return s, nil
}

func (r *irrigationScheduleRepository) Create(ctx context.Context, schedule *domains.IrrigationSchedule) error {
	query := `
        INSERT INTO irrigation_schedules
            (plot_id, start_time, duration_seconds, days_of_week, is_active, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`

	result, err := r.db.ExecContext(ctx, query,
		schedule.PlotID, schedule.StartTime, schedule.DurationSeconds,
		schedule.DaysOfWeek, schedule.IsActive, schedule.CreatedBy, schedule.CreatedAt,
	)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	schedule.ID = int(id)
	return nil
}

func (r *irrigationScheduleRepository) Update(ctx context.Context, schedule *domains.IrrigationSchedule) error {
	query := `
        UPDATE irrigation_schedules
        SET start_time = ?, duration_seconds = ?, days_of_week = ?, is_active = ?
        WHERE id = ?`

	_, err := r.db.ExecContext(ctx, query,
		schedule.StartTime, schedule.DurationSeconds,
		schedule.DaysOfWeek, schedule.IsActive, schedule.ID,
	)
	return err
}

func (r *irrigationScheduleRepository) Delete(ctx context.Context, id int) error {
	query := `DELETE FROM irrigation_schedules WHERE id = ?`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}
