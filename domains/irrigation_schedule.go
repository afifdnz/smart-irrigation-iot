package domains

import (
	"strconv"
	"strings"
	"time"
)

type IrrigationSchedule struct {
	ID              int
	PlotID          int
	StartTime       time.Time
	DurationSeconds int
	DaysOfWeek      string
	IsActive        bool
	CreatedBy       int
	CreatedAt       time.Time
}

// func (s *IrrigationSchedule) IsDueAt(t time.Time) bool {
// 	if !s.IsActive {
// 		return false
// 	}
// 	if !s.isScheduledOnDay(t.Weekday()) {
// 		return false
// 	}
// 	return s.isWithinStartWindow(t)
// }

func (s *IrrigationSchedule) isScheduledOnDay(day time.Weekday) bool {
	dayStr := strconv.Itoa(int(day))
	for _, d := range strings.Split(s.DaysOfWeek, ",") {
		if strings.TrimSpace(d) == dayStr {
			return true
		}
	}
	return false
}

func (s *IrrigationSchedule) isWithinStartWindow(t time.Time) bool {
	schedH, schedM, _ := s.StartTime.Clock()
	nowH, nowM := t.Hour(), t.Minute()
	return nowH == schedH && nowM == schedM
}
