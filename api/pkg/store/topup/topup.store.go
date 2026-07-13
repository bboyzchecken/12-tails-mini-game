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

func (s *topUpStore) TotalsByUser(limit int) ([]models.TopUpTotal, error) {
	var rows []models.TopUpTotal
	err := s.db.Raw(`
		SELECT t.user_id, u.family_name, u.email,
		       sum(t.amount_jil) AS total_jil, count(*) AS count
		FROM top_ups t
		JOIN users u ON u.id = t.user_id
		GROUP BY t.user_id, u.family_name, u.email
		ORDER BY total_jil DESC
		LIMIT ?`, limit).Scan(&rows).Error
	return rows, err
}
