package api

import (
	"net/http"
	"time"

	"github.com/labstack/echo/v4"

	"github.com/mac-checken/12tails-api/pkg/utils/liveness"
)

// activeItem is one sellable cosmetic in the public store payload.
type activeItem struct {
	ID       string     `json:"id"`
	Name     string     `json:"name"`
	Type     string     `json:"type"`
	PriceJil int        `json:"price_jil"`
	Rarity   string     `json:"rarity"`
	Preview  string     `json:"preview"`
	EndsAt   *time.Time `json:"ends_at,omitempty"` // item override end, else the collection's
}

// activeCollection is one live season in the public store payload.
type activeCollection struct {
	ID     string       `json:"id"`
	Name   string       `json:"name"`
	Theme  *string      `json:"theme,omitempty"`
	EndsAt *time.Time   `json:"ends_at,omitempty"` // for the demo countdown (FOMO)
	Items  []activeItem `json:"items"`
}

// StoreActive is the ONE public source of what is on sale right now (the game +
// demo read only this — never a hardcoded list). Liveness is computed on read
// from each collection/item window + status. ends_at is included so the demo can
// render a countdown. Empty is a valid response (nothing scheduled → []).
func (s *Server) StoreActive(c echo.Context) error {
	now := time.Now()
	cols, err := s.CollectionStore.ListActive()
	if err != nil {
		s.Log.WithError(err).Error("store/active: query failed")
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "could not load store"})
	}

	out := make([]activeCollection, 0)
	for _, col := range cols {
		if !liveness.IsLiveNow(col.Status, col.SaleStart, col.SaleEnd, now) {
			continue
		}
		items := make([]activeItem, 0, len(col.Items))
		for _, it := range col.Items {
			if !liveness.ItemLiveNow(it.Active, it.SaleStart, it.SaleEnd, now) {
				continue
			}
			items = append(items, activeItem{
				ID:       it.ID,
				Name:     it.Name,
				Type:     it.Type,
				PriceJil: it.PriceJil,
				Rarity:   it.Rarity,
				Preview:  it.Preview,
				EndsAt:   endsAt(it.SaleEnd, col.SaleEnd),
			})
		}
		if len(items) == 0 {
			continue // a live collection with nothing sellable isn't worth showing
		}
		out = append(out, activeCollection{
			ID:     col.ID,
			Name:   col.Name,
			Theme:  col.Theme,
			EndsAt: col.SaleEnd,
			Items:  items,
		})
	}

	return c.JSON(http.StatusOK, echo.Map{
		"collections": out,
		// server_time lets the client run an accurate countdown regardless of a
		// skewed local clock.
		"server_time": now,
	})
}

// endsAt prefers the item's own end override, falling back to the collection's.
func endsAt(item, collection *time.Time) *time.Time {
	if item != nil {
		return item
	}
	return collection
}
