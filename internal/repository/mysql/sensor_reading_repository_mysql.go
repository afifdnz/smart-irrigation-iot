package mysql

import (
	"context"
	"database/sql"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/repository"
)

type sensorReadingRepository struct {
	db *sql.DB
}

func NewSensorReadingRepository(db *sql.DB) repository.SensorReadingRepository {
	return &sensorReadingRepository{db: db}
}

func (r *sensorReadingRepository) FindByPlotID(ctx context.Context, plotID int, limit, offset int) ([]*domains.SensorReading, error) {
	query := `
		SELECT id, plot_id, soil_moisture_pct, status_tanah, ai_pred_mins, recorded_at
		FROM sensor_readings
		WHERE plot_id = ? 
		ORDER BY recorded_at DESC 
		LIMIT ? OFFSET ?
	`

	rows, err := r.db.QueryContext(ctx, query, plotID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	readings := make([]*domains.SensorReading, 0)
	for rows.Next() {
		s := &domains.SensorReading{}
		if err := rows.Scan(
			&s.ID, &s.PlotID, &s.SoilMoisturePct,
			&s.Status, &s.AiPredMins, &s.RecordedAt,
		); err != nil {
			return nil, err
		}
		readings = append(readings, s)
	}
	return readings, rows.Err()
}

func (r *sensorReadingRepository) FindLatestByPlotID(ctx context.Context, plotID int) (*domains.SensorReading, error) {
	query := `
		SELECT id, plot_id, soil_moisture_pct, status_tanah, ai_pred_mins, recorded_at
		FROM sensor_readings
		WHERE plot_id = ?
		ORDER BY recorded_at DESC
		LIMIT 1
	`
	s := &domains.SensorReading{}
	err := r.db.QueryRowContext(ctx, query, plotID).Scan(
		&s.ID, &s.PlotID, &s.SoilMoisturePct, &s.Status, &s.AiPredMins, &s.RecordedAt,
	)
	if err == sql.ErrNoRows {
		return nil, domains.ErrSensorNotFound
	}
	if err != nil {
		return nil, err
	}
	return s, nil
}

func (r *sensorReadingRepository) Create(ctx context.Context, reading *domains.SensorReading) error {
	query := `
        INSERT INTO sensor_readings (plot_id, soil_moisture_pct, status_tanah, ai_pred_mins, recorded_at)
        VALUES (?, ?, ?, ?, ?)`

	result, err := r.db.ExecContext(ctx, query,
		reading.PlotID, reading.SoilMoisturePct,
		reading.Status, reading.AiPredMins, reading.RecordedAt,
	)
	if err != nil {
		return err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	reading.ID = int(id)
	return nil
}
