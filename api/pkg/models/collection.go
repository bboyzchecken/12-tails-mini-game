package models

import "time"

// Collection is a themed set of cosmetics sold inside a scheduling window (a
// "season"). Whether it is on sale RIGHT NOW is COMPUTED on read from the date
// window + status override (see pkg/utils/liveness) — there is no cron and no
// persisted "live" flag as source of truth. Seasonal rotation (เวียนขาย) =
// duplicate a collection with a fresh window, never mutate the past one.
//
// status: draft | scheduled | live | ended
//   - draft  → manual override, force OFF (not ready)
//   - ended  → manual override, force OFF (retired)
//   - live   → manual override, force ON (ignore the window)
//   - scheduled (default working state) → derived purely from sale_start/sale_end
type Collection struct {
	ID         string         `gorm:"primaryKey" json:"id"`
	Name       string         `gorm:"not null" json:"name"` // "ชุดฤดูร้อน 2026"
	Theme      *string        `json:"theme,omitempty"`      // "summer"
	SaleStart  *time.Time     `json:"sale_start,omitempty"` // null = not scheduled yet
	SaleEnd    *time.Time     `json:"sale_end,omitempty"`
	Status     string         `gorm:"default:draft;not null" json:"status"`
	IsArchived bool           `gorm:"default:false;not null" json:"is_archived"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	Items      []CosmeticItem `gorm:"foreignKey:CollectionID;constraint:OnDelete:CASCADE" json:"items,omitempty"`
}

// CosmeticItem is one purchasable cosmetic inside a Collection. Buying it in the
// demo fires buy_intent (an interest signal), never a real sale. Preview is a
// placeholder asset path until Bigbug approves real art. An item may carry its
// own sale window to differ from the parent collection.
type CosmeticItem struct {
	ID           string     `gorm:"primaryKey" json:"id"`
	CollectionID string     `gorm:"index;not null" json:"collection_id"`
	Name         string     `gorm:"not null" json:"name"`
	Type         string     `gorm:"not null" json:"type"`      // skin | color | emote | chat_frame
	PriceJil     int        `gorm:"not null" json:"price_jil"` // mock price (Jil, not real money)
	Rarity       string     `gorm:"not null" json:"rarity"`    // common | rare | epic
	Preview      string     `json:"preview"`                   // asset path (placeholder for now)
	SaleStart    *time.Time `json:"sale_start,omitempty"`      // per-item override (optional)
	SaleEnd      *time.Time `json:"sale_end,omitempty"`
	Active       bool       `gorm:"default:true;not null" json:"active"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// CollectionStore is the data-access contract for seasons (Phase 5 / S0–S2).
type CollectionStore interface {
	// Public read (game/demo).
	ListActive() ([]*Collection, error) // non-archived + items, liveness filtered by the caller

	// Admin.
	ListAll() ([]*Collection, error)
	FindByID(id string) (*Collection, error) // with items
	Create(c *Collection) error
	Update(c *Collection) error
	UpdateStatus(id, status string) error
	Delete(id string) error

	CreateItem(it *CosmeticItem) error
	FindItemByID(id string) (*CosmeticItem, error)
	UpdateItem(it *CosmeticItem) error
	DeleteItem(id string) error

	Count() (int64, error)

	// IntentsByCollection returns buy_intent counts grouped by collection_id
	// (read from the events' JSONB meta) for the admin list badges.
	IntentsByCollection() (map[string]int64, error)
}
