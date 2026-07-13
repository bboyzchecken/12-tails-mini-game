package models

import "time"

// TopUp is a DEMO top-up record (no real payment) — it captures "who topped up
// how much" so the admin dashboard can show top-up history per account. Jil is
// the paid currency; this is mock but the attribution is real.
type TopUp struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	UserID    string    `gorm:"index;not null" json:"user_id"`
	AmountJil int       `gorm:"not null" json:"amount_jil"`
	Note      *string   `json:"note,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

type TopUpStore interface {
	Create(t *TopUp) error
	ListByUser(userID string) ([]*TopUp, error)
}
