package waitlist

import (
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/mac-checken/12tails-api/pkg/models"
)

type waitlistStore struct{ db *gorm.DB }

// New returns a GORM-backed WaitlistStore.
func New(db *gorm.DB) models.WaitlistStore { return &waitlistStore{db: db} }

func (s *waitlistStore) Create(w *models.Waitlist) (bool, error) {
	res := s.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "email"}},
		DoNothing: true,
	}).Create(w)
	if res.Error != nil {
		return false, res.Error
	}
	return res.RowsAffected > 0, nil
}

func (s *waitlistStore) Count() (int64, error) {
	var n int64
	err := s.db.Model(&models.Waitlist{}).Count(&n).Error
	return n, err
}
