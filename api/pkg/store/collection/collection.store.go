package collection

import (
	"gorm.io/gorm"

	"github.com/mac-checken/12tails-api/pkg/models"
)

type collectionStore struct{ db *gorm.DB }

// New returns a GORM-backed CollectionStore.
func New(db *gorm.DB) models.CollectionStore { return &collectionStore{db: db} }

// ListActive returns non-archived collections with their active items preloaded.
// Whether each is actually on sale now is decided by the caller via the liveness
// util (the override semantics don't map cleanly to SQL), so this stays a coarse
// filter and the handler applies IsLiveNow.
func (s *collectionStore) ListActive() ([]*models.Collection, error) {
	var cs []*models.Collection
	err := s.db.
		Preload("Items", func(db *gorm.DB) *gorm.DB {
			return db.Where("active = ?", true).Order("price_jil asc")
		}).
		Where("is_archived = ?", false).
		Order("sale_start asc nulls last, created_at asc").
		Find(&cs).Error
	return cs, err
}

func (s *collectionStore) ListAll() ([]*models.Collection, error) {
	var cs []*models.Collection
	err := s.db.
		Preload("Items", func(db *gorm.DB) *gorm.DB { return db.Order("price_jil asc") }).
		Order("created_at desc").
		Find(&cs).Error
	return cs, err
}

func (s *collectionStore) FindByID(id string) (*models.Collection, error) {
	var c models.Collection
	err := s.db.
		Preload("Items", func(db *gorm.DB) *gorm.DB { return db.Order("price_jil asc") }).
		First(&c, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (s *collectionStore) Create(c *models.Collection) error { return s.db.Create(c).Error }

// Update saves the mutable collection fields (not Items — those have their own
// CRUD). Select the columns explicitly so a zero value (e.g. clearing dates to
// NULL) is written instead of being skipped by GORM's non-zero update.
func (s *collectionStore) Update(c *models.Collection) error {
	return s.db.Model(&models.Collection{ID: c.ID}).
		Select("name", "theme", "sale_start", "sale_end", "status", "is_archived").
		Updates(map[string]any{
			"name":        c.Name,
			"theme":       c.Theme,
			"sale_start":  c.SaleStart,
			"sale_end":    c.SaleEnd,
			"status":      c.Status,
			"is_archived": c.IsArchived,
		}).Error
}

func (s *collectionStore) UpdateStatus(id, status string) error {
	return s.db.Model(&models.Collection{ID: id}).Update("status", status).Error
}

// Delete removes a collection; its items cascade via the FK constraint.
func (s *collectionStore) Delete(id string) error {
	return s.db.Delete(&models.Collection{}, "id = ?", id).Error
}

func (s *collectionStore) CreateItem(it *models.CosmeticItem) error { return s.db.Create(it).Error }

func (s *collectionStore) FindItemByID(id string) (*models.CosmeticItem, error) {
	var it models.CosmeticItem
	if err := s.db.First(&it, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &it, nil
}

func (s *collectionStore) UpdateItem(it *models.CosmeticItem) error {
	return s.db.Model(&models.CosmeticItem{ID: it.ID}).
		Select("name", "type", "price_jil", "rarity", "preview", "sale_start", "sale_end", "active").
		Updates(map[string]any{
			"name":       it.Name,
			"type":       it.Type,
			"price_jil":  it.PriceJil,
			"rarity":     it.Rarity,
			"preview":    it.Preview,
			"sale_start": it.SaleStart,
			"sale_end":   it.SaleEnd,
			"active":     it.Active,
		}).Error
}

func (s *collectionStore) DeleteItem(id string) error {
	return s.db.Delete(&models.CosmeticItem{}, "id = ?", id).Error
}

func (s *collectionStore) Count() (int64, error) {
	var n int64
	err := s.db.Model(&models.Collection{}).Count(&n).Error
	return n, err
}

// IntentsByCollection counts buy_intent events per collection_id (pulled from the
// event JSONB meta). Used to badge each collection with its demand in the admin
// list. Collections with no intents simply won't appear in the map.
func (s *collectionStore) IntentsByCollection() (map[string]int64, error) {
	type row struct {
		CollectionID string
		Intents      int64
	}
	var rows []row
	err := s.db.Raw(`
		SELECT meta->>'collection_id' AS collection_id, count(*) AS intents
		FROM events
		WHERE type = 'buy_intent' AND meta->>'collection_id' IS NOT NULL
		GROUP BY meta->>'collection_id'`).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	out := make(map[string]int64, len(rows))
	for _, r := range rows {
		out[r.CollectionID] = r.Intents
	}
	return out, nil
}
