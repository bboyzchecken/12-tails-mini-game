package models

import "time"

// User is a player (or admin) account — the identity that owns characters and
// top-up history. Registration is standalone (email + password, no social
// required); Google/Apple/Line can be linked later via AuthProvider.
type User struct {
	ID           string    `gorm:"primaryKey" json:"id"`
	Email        string    `gorm:"uniqueIndex;not null" json:"email"`
	Username     *string   `gorm:"uniqueIndex" json:"username,omitempty"`
	PasswordHash string    `gorm:"not null" json:"-"`
	FamilyName   string    `gorm:"uniqueIndex;not null" json:"family_name"` // permanent family/guild tag
	Role         string    `gorm:"default:user" json:"role"`                // user | admin
	Status       string    `gorm:"default:active" json:"status"`            // active | deactivated
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type UserStore interface {
	Create(u *User) error
	FindByID(id string) (*User, error)
	FindByEmail(email string) (*User, error)
	FindByFamilyName(name string) (*User, error)
	CountRegistered() (int64, error)
}
