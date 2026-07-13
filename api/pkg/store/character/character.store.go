package character

import (
	"gorm.io/gorm"

	"github.com/mac-checken/12tails-api/pkg/models"
)

type characterStore struct{ db *gorm.DB }

func New(db *gorm.DB) models.CharacterStore { return &characterStore{db: db} }

func (s *characterStore) Create(ch *models.Character) error { return s.db.Create(ch).Error }

func (s *characterStore) ListByUser(userID string) ([]*models.Character, error) {
	var chs []*models.Character
	err := s.db.Where("user_id = ?", userID).Order("slot_index").Find(&chs).Error
	return chs, err
}

func (s *characterStore) CountByUser(userID string) (int64, error) {
	var n int64
	err := s.db.Model(&models.Character{}).Where("user_id = ?", userID).Count(&n).Error
	return n, err
}

func (s *characterStore) SlotTaken(userID string, slot int) (bool, error) {
	var n int64
	err := s.db.Model(&models.Character{}).
		Where("user_id = ? AND slot_index = ?", userID, slot).Count(&n).Error
	return n > 0, err
}
