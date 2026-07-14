package api

import (
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/mac-checken/12tails-api/pkg/models"
	"github.com/mac-checken/12tails-api/pkg/utils/liveness"
)

// ── shared request/response shapes ─────────────────────────────────────────

// collectionDTO is a Collection plus its computed (on-read) sale state, so the
// admin UI never has to re-derive liveness — but the timeline still gets the raw
// window to draw the bars.
type collectionDTO struct {
	models.Collection
	StatusLabel string `json:"status_label"` // draft | scheduled | live | ended (effective)
	IsLive      bool   `json:"is_live"`
	Intents     int64  `json:"intents"` // buy_intent count for this collection (demand)
}

func newCollectionDTO(col *models.Collection, intents int64, now time.Time) collectionDTO {
	return collectionDTO{
		Collection:  *col,
		StatusLabel: liveness.StatusLabel(col.Status, col.SaleStart, col.SaleEnd, now),
		IsLive:      liveness.IsLiveNow(col.Status, col.SaleStart, col.SaleEnd, now),
		Intents:     intents,
	}
}

type collectionRequest struct {
	Name       string     `json:"name" validate:"required,min=1,max=80"`
	Theme      *string    `json:"theme"`
	SaleStart  *time.Time `json:"sale_start"`
	SaleEnd    *time.Time `json:"sale_end"`
	Status     string     `json:"status"` // draft | scheduled | live | ended (optional)
	IsArchived *bool      `json:"is_archived"`
}

type itemRequest struct {
	Name      string     `json:"name" validate:"required,min=1,max=80"`
	Type      string     `json:"type" validate:"required"`
	PriceJil  int        `json:"price_jil" validate:"gte=0"`
	Rarity    string     `json:"rarity"`
	Preview   string     `json:"preview"`
	SaleStart *time.Time `json:"sale_start"`
	SaleEnd   *time.Time `json:"sale_end"`
	Active    *bool      `json:"active"`
}

// ── collections ────────────────────────────────────────────────────────────

// AdminListCollections returns every collection (with items) plus its effective
// status and buy_intent count for the list + timeline.
func (s *Server) AdminListCollections(c echo.Context) error {
	cols, err := s.CollectionStore.ListAll()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "could not load collections"})
	}
	intents, err := s.CollectionStore.IntentsByCollection()
	if err != nil {
		s.Log.WithError(err).Warn("admin collections: intents lookup failed")
		intents = map[string]int64{}
	}
	now := time.Now()
	out := make([]collectionDTO, 0, len(cols))
	for _, col := range cols {
		out = append(out, newCollectionDTO(col, intents[col.ID], now))
	}
	return c.JSON(http.StatusOK, echo.Map{"collections": out, "server_time": now})
}

// AdminCreateCollection creates a season (defaults to draft until scheduled).
func (s *Server) AdminCreateCollection(c echo.Context) error {
	body, ok := s.bindCollection(c)
	if !ok {
		return nil
	}
	status := body.Status
	if status == "" {
		status = liveness.StatusDraft
	}
	if !validStatus(status) {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "invalid status"})
	}
	if !windowValid(body.SaleStart, body.SaleEnd) {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "sale_end must be after sale_start"})
	}
	col := &models.Collection{
		ID:         uuid.NewString(),
		Name:       strings.TrimSpace(body.Name),
		Theme:      trimPtr(body.Theme),
		SaleStart:  body.SaleStart,
		SaleEnd:    body.SaleEnd,
		Status:     status,
		IsArchived: derefBool(body.IsArchived, false),
	}
	if err := s.CollectionStore.Create(col); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "could not create collection"})
	}
	return c.JSON(http.StatusCreated, echo.Map{"ok": true, "collection": newCollectionDTO(col, 0, time.Now())})
}

// AdminUpdateCollection edits a season's name/theme/window/status/archive. Dates
// sent as null are cleared. Status, when omitted, is kept as-is.
func (s *Server) AdminUpdateCollection(c echo.Context) error {
	id := c.Param("id")
	existing, err := s.CollectionStore.FindByID(id)
	if err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "collection not found"})
	}
	body, ok := s.bindCollection(c)
	if !ok {
		return nil
	}
	if !windowValid(body.SaleStart, body.SaleEnd) {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "sale_end must be after sale_start"})
	}
	status := body.Status
	if status == "" {
		status = existing.Status
	}
	if !validStatus(status) {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "invalid status"})
	}

	existing.Name = strings.TrimSpace(body.Name)
	existing.Theme = trimPtr(body.Theme)
	existing.SaleStart = body.SaleStart
	existing.SaleEnd = body.SaleEnd
	existing.Status = status
	existing.IsArchived = derefBool(body.IsArchived, existing.IsArchived)

	if err := s.CollectionStore.Update(existing); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "could not update collection"})
	}
	fresh, _ := s.CollectionStore.FindByID(id)
	if fresh == nil {
		fresh = existing
	}
	intents, _ := s.CollectionStore.IntentsByCollection()
	return c.JSON(http.StatusOK, echo.Map{"ok": true, "collection": newCollectionDTO(fresh, intents[id], time.Now())})
}

// AdminSetCollectionStatus is the quick override toggle: live | off | draft.
// "off" retires the season (status=ended); "live" forces it on regardless of the
// window; "draft" pulls it back to not-ready.
func (s *Server) AdminSetCollectionStatus(c echo.Context) error {
	id := c.Param("id")
	if _, err := s.CollectionStore.FindByID(id); err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "collection not found"})
	}
	var body struct {
		Status string `json:"status" validate:"required"`
	}
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid body"})
	}
	status, ok := overrideToStatus(body.Status)
	if !ok {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "status must be live | off | draft"})
	}
	if err := s.CollectionStore.UpdateStatus(id, status); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "could not update status"})
	}
	fresh, _ := s.CollectionStore.FindByID(id)
	intents, _ := s.CollectionStore.IntentsByCollection()
	return c.JSON(http.StatusOK, echo.Map{"ok": true, "collection": newCollectionDTO(fresh, intents[id], time.Now())})
}

// AdminDuplicateCollection clones a season for next rotation (เวียนขาย): copies
// items, clears every date window, and resets status to draft — the past season
// is never mutated.
func (s *Server) AdminDuplicateCollection(c echo.Context) error {
	src, err := s.CollectionStore.FindByID(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "collection not found"})
	}
	clone := &models.Collection{
		ID:         uuid.NewString(),
		Name:       src.Name + " (คัดลอก)",
		Theme:      src.Theme,
		SaleStart:  nil,
		SaleEnd:    nil,
		Status:     liveness.StatusDraft,
		IsArchived: false,
	}
	if err := s.CollectionStore.Create(clone); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "could not duplicate collection"})
	}
	for _, it := range src.Items {
		cp := &models.CosmeticItem{
			ID:           uuid.NewString(),
			CollectionID: clone.ID,
			Name:         it.Name,
			Type:         it.Type,
			PriceJil:     it.PriceJil,
			Rarity:       it.Rarity,
			Preview:      it.Preview,
			SaleStart:    nil,
			SaleEnd:      nil,
			Active:       it.Active,
		}
		if err := s.CollectionStore.CreateItem(cp); err != nil {
			s.Log.WithError(err).Warn("duplicate: copy item failed")
		}
	}
	fresh, _ := s.CollectionStore.FindByID(clone.ID)
	if fresh == nil {
		fresh = clone
	}
	return c.JSON(http.StatusCreated, echo.Map{"ok": true, "collection": newCollectionDTO(fresh, 0, time.Now())})
}

// AdminDeleteCollection removes a season and cascades its items.
func (s *Server) AdminDeleteCollection(c echo.Context) error {
	id := c.Param("id")
	if _, err := s.CollectionStore.FindByID(id); err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "collection not found"})
	}
	if err := s.CollectionStore.Delete(id); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "could not delete collection"})
	}
	return c.JSON(http.StatusOK, echo.Map{"ok": true})
}

// ── items ──────────────────────────────────────────────────────────────────

// AdminCreateItem adds a cosmetic to a collection.
func (s *Server) AdminCreateItem(c echo.Context) error {
	colID := c.Param("id")
	if _, err := s.CollectionStore.FindByID(colID); err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "collection not found"})
	}
	body, ok := s.bindItem(c)
	if !ok {
		return nil
	}
	it := &models.CosmeticItem{
		ID:           uuid.NewString(),
		CollectionID: colID,
		Name:         strings.TrimSpace(body.Name),
		Type:         strings.TrimSpace(body.Type),
		PriceJil:     body.PriceJil,
		Rarity:       normalizeRarity(body.Rarity),
		Preview:      body.Preview,
		SaleStart:    body.SaleStart,
		SaleEnd:      body.SaleEnd,
		Active:       derefBool(body.Active, true),
	}
	if err := s.CollectionStore.CreateItem(it); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "could not create item"})
	}
	return c.JSON(http.StatusCreated, echo.Map{"ok": true, "item": it})
}

// AdminUpdateItem edits one cosmetic. The item must belong to the URL collection.
func (s *Server) AdminUpdateItem(c echo.Context) error {
	colID, itemID := c.Param("id"), c.Param("itemId")
	existing, err := s.CollectionStore.FindItemByID(itemID)
	if err != nil || existing.CollectionID != colID {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "item not found"})
	}
	body, ok := s.bindItem(c)
	if !ok {
		return nil
	}
	existing.Name = strings.TrimSpace(body.Name)
	existing.Type = strings.TrimSpace(body.Type)
	existing.PriceJil = body.PriceJil
	existing.Rarity = normalizeRarity(body.Rarity)
	existing.Preview = body.Preview
	existing.SaleStart = body.SaleStart
	existing.SaleEnd = body.SaleEnd
	existing.Active = derefBool(body.Active, existing.Active)
	if err := s.CollectionStore.UpdateItem(existing); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "could not update item"})
	}
	return c.JSON(http.StatusOK, echo.Map{"ok": true, "item": existing})
}

// AdminDeleteItem removes one cosmetic from a collection.
func (s *Server) AdminDeleteItem(c echo.Context) error {
	colID, itemID := c.Param("id"), c.Param("itemId")
	existing, err := s.CollectionStore.FindItemByID(itemID)
	if err != nil || existing.CollectionID != colID {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "item not found"})
	}
	if err := s.CollectionStore.DeleteItem(itemID); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "could not delete item"})
	}
	return c.JSON(http.StatusOK, echo.Map{"ok": true})
}

// ── helpers ────────────────────────────────────────────────────────────────

// bindCollection binds+validates the body, writing the error response itself and
// returning ok=false when it fails (caller returns nil).
func (s *Server) bindCollection(c echo.Context) (collectionRequest, bool) {
	var body collectionRequest
	if err := c.Bind(&body); err != nil {
		_ = c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid body"})
		return body, false
	}
	if err := c.Validate(&body); err != nil {
		_ = c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "name is required (1-80 chars)"})
		return body, false
	}
	return body, true
}

func (s *Server) bindItem(c echo.Context) (itemRequest, bool) {
	var body itemRequest
	if err := c.Bind(&body); err != nil {
		_ = c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid body"})
		return body, false
	}
	if err := c.Validate(&body); err != nil {
		_ = c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "name, type and a non-negative price are required"})
		return body, false
	}
	return body, true
}

func validStatus(s string) bool {
	switch s {
	case liveness.StatusDraft, liveness.StatusScheduled, liveness.StatusLive, liveness.StatusEnded:
		return true
	}
	return false
}

// overrideToStatus maps the quick-toggle action to a stored status.
func overrideToStatus(action string) (string, bool) {
	switch action {
	case "live":
		return liveness.StatusLive, true
	case "off":
		return liveness.StatusEnded, true
	case "draft":
		return liveness.StatusDraft, true
	}
	return "", false
}

// windowValid rejects a window whose end is not strictly after its start (both
// must be set for the check to apply; an open-ended window is fine).
func windowValid(start, end *time.Time) bool {
	if start == nil || end == nil {
		return true
	}
	return end.After(*start)
}

func normalizeRarity(r string) string {
	switch strings.ToLower(strings.TrimSpace(r)) {
	case "rare":
		return "rare"
	case "epic":
		return "epic"
	default:
		return "common"
	}
}

func trimPtr(p *string) *string {
	if p == nil {
		return nil
	}
	t := strings.TrimSpace(*p)
	if t == "" {
		return nil
	}
	return &t
}

func derefBool(p *bool, fallback bool) bool {
	if p == nil {
		return fallback
	}
	return *p
}
