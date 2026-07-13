package event

import (
	"gorm.io/gorm"

	"github.com/mac-checken/12tails-api/pkg/models"
)

type eventStore struct{ db *gorm.DB }

// New returns a GORM-backed EventStore.
func New(db *gorm.DB) models.EventStore { return &eventStore{db: db} }

func (s *eventStore) Create(e *models.Event) error {
	return s.db.Create(e).Error
}
