package topup

import (
	"gorm.io/gorm"

	"github.com/mac-checken/12tails-api/pkg/models"
)

type topUpStore struct{ db *gorm.DB }

func New(db *gorm.DB) models.TopUpStore { return &topUpStore{db: db} }

func (s *topUpStore) Create(t *models.TopUp) error { return s.db.Create(t).Error }

func (s *topUpStore) ListByUser(userID string) ([]*models.TopUp, error) {
	var ts []*models.TopUp
	err := s.db.Where("user_id = ?", userID).Order("created_at desc").Find(&ts).Error
	return ts, err
}
