package models

import (
	"time"

	"gorm.io/datatypes"
)

// Character is one playable character owned by a User (multi-slot). Its Name is
// the permanent chat name (nameplate line 2, under the account's family name);
// changing it later requires a Jil item, so there is no free rename endpoint.
type Character struct {
	ID          string         `gorm:"primaryKey" json:"id"`
	UserID      string         `gorm:"index;uniqueIndex:idx_char_user_slot,priority:1;not null" json:"user_id"`
	Name        string         `gorm:"not null" json:"name"`
	CharacterID string         `gorm:"not null" json:"character_id"` // tribe/species id, e.g. "wolf"
	Appearance  datatypes.JSON `gorm:"type:jsonb" json:"appearance,omitempty"`
	SlotIndex   int            `gorm:"uniqueIndex:idx_char_user_slot,priority:2;not null" json:"slot_index"`
	CreatedAt   time.Time      `json:"created_at"`
}

type CharacterStore interface {
	Create(ch *Character) error
	ListByUser(userID string) ([]*Character, error)
	CountByUser(userID string) (int64, error)
	SlotTaken(userID string, slot int) (bool, error)
}
