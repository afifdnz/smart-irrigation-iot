package domains

import "time"

type Plot struct {
	ID        int
	PlotName  string
	PlantName string
	PlantNote string
	IsActive  bool
	CreatedBy int
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (p *Plot) Activate() error {
	if p.IsActive {
		return ErrAlreadyActivated
	}
	p.IsActive = true
	p.UpdatedAt = time.Now()
	return nil
}

func (p *Plot) Deactivate() error {
	if !p.IsActive {
		return ErrAlreadyInactivated
	}
	p.IsActive = false
	p.UpdatedAt = time.Now()
	return nil
}
