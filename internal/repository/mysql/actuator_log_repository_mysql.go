package mysql

import (
	"context"
	"database/sql"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/repository"
)

type actuatorLogRepository struct {
	db *sql.DB
}

func NewActuatorLogRepository(db *sql.DB) repository.ActuatorLogRepository {
	return &actuatorLogRepository{db: db}
}

func (r *actuatorLogRepository) FindByPlotID(ctx context.Context, plotID, limit, offset int) ([]*domains.ActuatorLog, error) {
	query := `
        SELECT id, plot_id, action, triggered_by, duration_seconds, triggered_at
        FROM actuator_logs
        WHERE plot_id = ?
        ORDER BY triggered_at DESC
        LIMIT ? OFFSET ?`

	rows, err := r.db.QueryContext(ctx, query, plotID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	logs := make([]*domains.ActuatorLog, 0)
	for rows.Next() {
		l := &domains.ActuatorLog{}
		if err := rows.Scan(
			&l.ID, &l.PlotID, &l.Action,
			&l.TriggeredBy, &l.DurationSecond, &l.TriggeredAt,
		); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	return logs, rows.Err()
}

func (r *actuatorLogRepository) FindLatestByPlotID(ctx context.Context, plotID int) (*domains.ActuatorLog, error) {
	query := `
        SELECT id, plot_id, action, triggered_by, duration_seconds, triggered_at
        FROM actuator_logs
        WHERE plot_id = ?
        ORDER BY triggered_at DESC
        LIMIT 1`

	l := &domains.ActuatorLog{}
	err := r.db.QueryRowContext(ctx, query, plotID).Scan(
		&l.ID, &l.PlotID, &l.Action,
		&l.TriggeredBy, &l.DurationSecond, &l.TriggeredAt,
	)
	if err == sql.ErrNoRows {
		return nil, domains.ErrActuatorLogNotFound
	}
	if err != nil {
		return nil, err
	}
	return l, nil
}

func (r *actuatorLogRepository) Create(ctx context.Context, log *domains.ActuatorLog) error {
	query := `
        INSERT INTO actuator_logs (plot_id, action, triggered_by, duration_seconds, triggered_at)
        VALUES (?, ?, ?, ?, ?)`

	result, err := r.db.ExecContext(ctx, query,
		log.PlotID, log.Action,
		log.TriggeredBy, log.DurationSecond, log.TriggeredAt,
	)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	log.ID = int(id)
	return nil
}
