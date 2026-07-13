package models

import (
	"time"

	"gorm.io/datatypes"
)

// Event is one analytics/telemetry event from the landing page or the game.
// The taxonomy of `Type` lives on the TS side (12tails-web/lib/analytics/events.ts);
// this table stores whatever the clients send. buy_intent = interest signal, NOT a sale.
type Event struct {
	ID        string         `gorm:"primaryKey" json:"id"`
	SessionID string         `gorm:"index;not null" json:"session_id"`             // anonymous, client-generated UUID
	AccountID *string        `gorm:"index" json:"account_id,omitempty"`            // set once logged in (Phase P)
	Type      string         `gorm:"index:idx_events_type_created,priority:1;not null" json:"type"`
	ItemID    *string        `gorm:"index" json:"item_id,omitempty"`               // e.g. cosmetic id for buy_intent
	Meta      datatypes.JSON `gorm:"type:jsonb" json:"meta,omitempty"`             // arbitrary payload (price, tab, character_id...)
	Referrer  *string        `json:"referrer,omitempty"`
	CreatedAt time.Time      `gorm:"index:idx_events_type_created,priority:2" json:"created_at"`
}

// EventStore is the data-access contract for events.
type EventStore interface {
	Create(e *Event) error

	// Phase 4 admin aggregates — all bounded to the half-open range [from, to).
	UniqueSessions(from, to time.Time) (int64, error)
	UniqueAccounts(from, to time.Time) (int64, error)
	CountByType(eventType string, from, to time.Time) (int64, error)
	WouldBeRevenue(from, to time.Time) (int64, error)
	Funnel(stages []string, from, to time.Time) ([]FunnelStage, error)
	Demand(from, to time.Time, limit int) ([]DemandRow, error)
	TimeSeries(from, to time.Time) ([]DailyPoint, error)
	Referrers(from, to time.Time, limit int) ([]CountRow, error)
	ListForExport(from, to time.Time, limit int) ([]*Event, error)
}
