package mysql

import (
	"context"
	"database/sql"

	"github.com/afifdnz/irrigation-iot/domains"
	"github.com/afifdnz/irrigation-iot/repository"
)

type waterLevelLogRepository struct {
	db *sql.DB
}

func NewWaterLevelLogRepository(db *sql.DB) repository.WaterLevelLogRepository {
	return &waterLevelLogRepository{db: db}
}

func (r *waterLevelLogRepository) FindByTankID(ctx context.Context, tankID, limit, offset int) ([]*domains.WaterLevelLog, error) {
	query := `
        SELECT id, tank_id, water_level_cm, water_volume_l, recorded_at
        FROM water_level_logs
        WHERE tank_id = ?
        ORDER BY recorded_at DESC
        LIMIT ? OFFSET ?`

	rows, err := r.db.QueryContext(ctx, query, tankID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	logs := make([]*domains.WaterLevelLog, 0)
	for rows.Next() {
		l := &domains.WaterLevelLog{}
		if err := rows.Scan(
			&l.ID, &l.TankID, &l.WaterLevelCm,
			&l.WaterVolume, &l.RecordedAt,
		); err != nil {
			return nil, err
		}
		logs = append(logs, l)
	}
	return logs, rows.Err()
}

func (r *waterLevelLogRepository) FindLatestByTankID(ctx context.Context, tankID int) (*domains.WaterLevelLog, error) {
	query := `
		SELECT id, tank_id, water_level_cm, water_volume_l, recorded_at
		FROM water_level_logs
		WHERE tank_id = ?
		ORDER BY recorded_at DESC
		LIMIT 1
	`

	l := &domains.WaterLevelLog{}
	err := r.db.QueryRowContext(ctx, query, tankID).Scan(
		&l.ID, &l.TankID, &l.WaterLevelCm, &l.WaterVolume, &l.RecordedAt,
	)
	if err == sql.ErrNoRows {
		return nil, domains.ErrWaterTankNotFound
	}
	if err != nil {
		return nil, err
	}
	return l, nil
}

func (r *waterLevelLogRepository) Create(ctx context.Context, log *domains.WaterLevelLog) error {
	query := `
        INSERT INTO water_level_logs (tank_id, water_level_cm, water_volume_l, recorded_at)
        VALUES (?, ?, ?, ?)`

	result, err := r.db.ExecContext(ctx, query,
		log.TankID, log.WaterLevelCm,
		log.WaterVolume, log.RecordedAt,
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
