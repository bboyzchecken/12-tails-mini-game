package api

import (
	"encoding/csv"
	"net/http"
	"strconv"
	"time"

	"github.com/labstack/echo/v4"
)

// funnelStages is the demand funnel in order: land → play → shop → intent.
var funnelStages = []string{"game_open", "play_start", "shop_open", "buy_intent"}

// parseRange reads ?from / ?to (YYYY-MM-DD or RFC3339), defaulting to the last
// 30 days. A bare `to` date is treated as inclusive (extended to end of day).
func parseRange(c echo.Context) (from, to time.Time) {
	now := time.Now()
	from, to = now.AddDate(0, 0, -30), now
	if v := c.QueryParam("from"); v != "" {
		if t, ok := parseTime(v); ok {
			from = t
		}
	}
	if v := c.QueryParam("to"); v != "" {
		if t, ok := parseTime(v); ok {
			if len(v) == 10 { // bare date → include the whole day
				t = t.AddDate(0, 0, 1)
			}
			to = t
		}
	}
	return from, to
}

func parseTime(v string) (time.Time, bool) {
	for _, layout := range []string{time.RFC3339, "2006-01-02"} {
		if t, err := time.ParseInLocation(layout, v, time.Local); err == nil {
			return t, true
		}
	}
	return time.Time{}, false
}

// AdminMetrics returns the dashboard aggregates for a date range. A single
// failing query is logged and degrades to zero rather than blanking the board.
func (s *Server) AdminMetrics(c echo.Context) error {
	from, to := parseRange(c)

	fail := func(what string, err error) {
		if err != nil {
			s.Log.WithError(err).Warnf("admin metrics: %s failed", what)
		}
	}

	uniqSessions, err := s.EventStore.UniqueSessions(from, to)
	fail("unique_sessions", err)
	activeAccounts, err := s.EventStore.UniqueAccounts(from, to)
	fail("active_accounts", err)
	buyIntents, err := s.EventStore.CountByType("buy_intent", from, to)
	fail("buy_intents", err)
	revenue, err := s.EventStore.WouldBeRevenue(from, to)
	fail("would_be_revenue", err)
	registered, err := s.UserStore.CountRegistered()
	fail("registered_users", err)
	waitlist, err := s.WaitlistStore.Count()
	fail("waitlist", err)

	funnel, err := s.EventStore.Funnel(funnelStages, from, to)
	fail("funnel", err)
	demand, err := s.EventStore.Demand(from, to, 20)
	fail("demand", err)
	series, err := s.EventStore.TimeSeries(from, to)
	fail("timeseries", err)
	referrers, err := s.EventStore.Referrers(from, to, 10)
	fail("referrers", err)
	topups, err := s.TopUpStore.TotalsByUser(20)
	fail("topups", err)

	return c.JSON(http.StatusOK, echo.Map{
		"range": echo.Map{"from": from, "to": to},
		"cards": echo.Map{
			"unique_sessions":  uniqSessions,
			"active_accounts":  activeAccounts,
			"registered_users": registered,
			"waitlist":         waitlist,
			"buy_intents":      buyIntents,
			"would_be_revenue": revenue,
		},
		// Coerce nil→[] so the frontend can always .map() the lists.
		"funnel":     orEmpty(funnel),
		"demand":     orEmpty(demand),
		"timeseries": orEmpty(series),
		"referrers":  orEmpty(referrers),
		"topups":     orEmpty(topups),
		// Dashboard copy must never call this "revenue/ยอดขาย".
		"note": "buy_intent = ความสนใจ/ประมาณการ ไม่ใช่ยอดขายจริง",
	})
}

// orEmpty returns a non-nil slice so JSON encodes [] instead of null.
func orEmpty[T any](s []T) []T {
	if s == nil {
		return []T{}
	}
	return s
}

// AdminExport streams the raw events in range as CSV for the pitch deck.
func (s *Server) AdminExport(c echo.Context) error {
	from, to := parseRange(c)
	limit := 50000
	if v := c.QueryParam("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 && n <= 200000 {
			limit = n
		}
	}

	events, err := s.EventStore.ListForExport(from, to, limit)
	if err != nil {
		s.Log.WithError(err).Error("admin export: query failed")
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "could not export events"})
	}

	res := c.Response()
	res.Header().Set(echo.HeaderContentType, "text/csv; charset=utf-8")
	res.Header().Set(echo.HeaderContentDisposition, `attachment; filename="12tails-events.csv"`)
	res.WriteHeader(http.StatusOK)

	w := csv.NewWriter(res)
	_ = w.Write([]string{"id", "created_at", "type", "session_id", "account_id", "item_id", "referrer", "meta"})
	for _, e := range events {
		_ = w.Write([]string{
			e.ID,
			e.CreatedAt.Format(time.RFC3339),
			e.Type,
			e.SessionID,
			deref(e.AccountID),
			deref(e.ItemID),
			deref(e.Referrer),
			string(e.Meta),
		})
	}
	w.Flush()
	return w.Error()
}

func deref(p *string) string {
	if p == nil {
		return ""
	}
	return *p
}
