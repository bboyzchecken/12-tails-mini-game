package event

import (
	"time"

	"gorm.io/gorm"

	"github.com/mac-checken/12tails-api/pkg/models"
)

type eventStore struct{ db *gorm.DB }

// New returns a GORM-backed EventStore.
func New(db *gorm.DB) models.EventStore { return &eventStore{db: db} }

func (s *eventStore) Create(e *models.Event) error {
	return s.db.Create(e).Error
}

// inRange scopes a query to the half-open window [from, to).
func (s *eventStore) inRange(from, to time.Time) *gorm.DB {
	return s.db.Model(&models.Event{}).Where("created_at >= ? AND created_at < ?", from, to)
}

func (s *eventStore) UniqueSessions(from, to time.Time) (int64, error) {
	var n int64
	err := s.inRange(from, to).Distinct("session_id").Count(&n).Error
	return n, err
}

func (s *eventStore) UniqueAccounts(from, to time.Time) (int64, error) {
	var n int64
	err := s.inRange(from, to).Where("account_id IS NOT NULL").Distinct("account_id").Count(&n).Error
	return n, err
}

func (s *eventStore) CountByType(eventType string, from, to time.Time) (int64, error) {
	var n int64
	err := s.inRange(from, to).Where("type = ?", eventType).Count(&n).Error
	return n, err
}

func (s *eventStore) WouldBeRevenue(from, to time.Time) (int64, error) {
	var v int64
	// price_jil lives in the JSONB meta; NULLs are skipped by sum().
	row := s.db.Raw(`
		SELECT COALESCE(sum((meta->>'price_jil')::numeric), 0)::bigint
		FROM events
		WHERE type = 'buy_intent' AND created_at >= ? AND created_at < ?`, from, to).Row()
	err := row.Scan(&v)
	return v, err
}

// Funnel returns, per stage, the number of distinct sessions that reached it.
func (s *eventStore) Funnel(stages []string, from, to time.Time) ([]models.FunnelStage, error) {
	out := make([]models.FunnelStage, 0, len(stages))
	for _, st := range stages {
		var n int64
		if err := s.inRange(from, to).Where("type = ?", st).Distinct("session_id").Count(&n).Error; err != nil {
			return nil, err
		}
		out = append(out, models.FunnelStage{Key: st, Sessions: n})
	}
	return out, nil
}

func (s *eventStore) Demand(from, to time.Time, limit int) ([]models.DemandRow, error) {
	var rows []models.DemandRow
	err := s.db.Raw(`
		SELECT item_id,
		       COALESCE(max(meta->>'item_type'), '') AS item_type,
		       count(*) AS intents,
		       COALESCE(sum((meta->>'price_jil')::numeric), 0)::bigint AS would_be_revenue
		FROM events
		WHERE type = 'buy_intent' AND item_id IS NOT NULL
		  AND created_at >= ? AND created_at < ?
		GROUP BY item_id
		ORDER BY intents DESC, would_be_revenue DESC
		LIMIT ?`, from, to, limit).Scan(&rows).Error
	return rows, err
}

// DemandByCollection groups buy_intent by the collection_id carried in the event
// meta (set when an item is bought from a season in the demo store), joined to
// the collections table for a display name. Powers "ดีมานด์ต่อซีซัน".
func (s *eventStore) DemandByCollection(from, to time.Time) ([]models.CollectionDemandRow, error) {
	var rows []models.CollectionDemandRow
	err := s.db.Raw(`
		SELECT e.meta->>'collection_id' AS collection_id,
		       COALESCE(max(c.name), '') AS name,
		       COALESCE(max(e.meta->>'theme'), '') AS theme,
		       count(*) AS intents,
		       COALESCE(sum((e.meta->>'price_jil')::numeric), 0)::bigint AS would_be_revenue
		FROM events e
		LEFT JOIN collections c ON c.id = e.meta->>'collection_id'
		WHERE e.type = 'buy_intent' AND e.meta->>'collection_id' IS NOT NULL
		  AND e.created_at >= ? AND e.created_at < ?
		GROUP BY e.meta->>'collection_id'
		ORDER BY intents DESC, would_be_revenue DESC`, from, to).Scan(&rows).Error
	return rows, err
}

func (s *eventStore) TimeSeries(from, to time.Time) ([]models.DailyPoint, error) {
	var rows []models.DailyPoint
	err := s.db.Raw(`
		SELECT to_char(created_at::date, 'YYYY-MM-DD') AS day,
		       count(*) AS total,
		       count(*) FILTER (WHERE type = 'buy_intent') AS buy_intent,
		       count(DISTINCT session_id) AS sessions
		FROM events
		WHERE created_at >= ? AND created_at < ?
		GROUP BY day
		ORDER BY day`, from, to).Scan(&rows).Error
	return rows, err
}

func (s *eventStore) Referrers(from, to time.Time, limit int) ([]models.CountRow, error) {
	var rows []models.CountRow
	err := s.db.Raw(`
		SELECT referrer AS key, count(*) AS count
		FROM events
		WHERE referrer IS NOT NULL AND referrer <> ''
		  AND created_at >= ? AND created_at < ?
		GROUP BY referrer
		ORDER BY count DESC
		LIMIT ?`, from, to, limit).Scan(&rows).Error
	return rows, err
}

func (s *eventStore) ListForExport(from, to time.Time, limit int) ([]*models.Event, error) {
	var evs []*models.Event
	err := s.db.Where("created_at >= ? AND created_at < ?", from, to).
		Order("created_at asc").Limit(limit).Find(&evs).Error
	return evs, err
}
