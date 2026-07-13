package models

import "time"

// Waitlist is a consented email signup from the landing page. Only PII we keep.
type Waitlist struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	Email     string    `gorm:"uniqueIndex;not null" json:"email"`
	Source    *string   `json:"source,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

// WaitlistStore is the data-access contract for waitlist signups.
type WaitlistStore interface {
	// Create inserts the signup, deduping on email. created=false means the
	// email was already on the list (idempotent, no error).
	Create(w *Waitlist) (created bool, err error)
}
