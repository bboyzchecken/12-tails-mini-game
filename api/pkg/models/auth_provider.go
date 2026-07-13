package models

import "time"

// AuthProvider links a social login (Google/Apple/Line) to a User. One account
// can link several providers. Schema lives here now; the OAuth link/callback
// endpoints come in a later phase (see 12tails-web-BUILD-PLAN.md Phase P).
type AuthProvider struct {
	ID             string    `gorm:"primaryKey" json:"id"`
	UserID         string    `gorm:"index;not null" json:"user_id"`
	Provider       string    `gorm:"uniqueIndex:idx_provider_uid,priority:1;not null" json:"provider"` // google | apple | line
	ProviderUserID string    `gorm:"uniqueIndex:idx_provider_uid,priority:2;not null" json:"provider_user_id"`
	LinkedAt       time.Time `json:"linked_at"`
}
