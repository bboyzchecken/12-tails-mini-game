// Package liveness computes whether a season/collection or a single item is on
// sale RIGHT NOW. It is the single source of that truth — status is COMPUTED on
// read from the date window + a manual status override. There is deliberately no
// cron and no persisted "live" boolean; nothing has to run for a season to open
// or close on time. Mirrored on the TS side at web/lib/store/liveness.ts.
package liveness

import "time"

// Collection statuses. draft/ended force OFF, live forces ON, scheduled derives
// from the window.
const (
	StatusDraft     = "draft"
	StatusScheduled = "scheduled"
	StatusLive      = "live"
	StatusEnded     = "ended"
)

// IsLiveNow reports whether a collection with the given status + window is
// currently on sale.
//
//   - draft / ended → false (manual override: force off)
//   - live          → true  (manual override: force on, ignore the window)
//   - anything else (scheduled) → true iff now is inside [saleStart, saleEnd],
//     where a nil bound means "open on that side"
func IsLiveNow(status string, saleStart, saleEnd *time.Time, now time.Time) bool {
	switch status {
	case StatusDraft, StatusEnded:
		return false
	case StatusLive:
		return true
	}
	return WindowContains(saleStart, saleEnd, now)
}

// ItemLiveNow reports whether a single item is sellable: it must be active and,
// if it carries its own window override, now must be inside it. Items have no
// status override — only active + optional window.
func ItemLiveNow(active bool, saleStart, saleEnd *time.Time, now time.Time) bool {
	return active && WindowContains(saleStart, saleEnd, now)
}

// WindowContains reports whether now falls in the half-open-ish window
// [saleStart, saleEnd] (inclusive both ends). A nil bound is open on that side.
func WindowContains(saleStart, saleEnd *time.Time, now time.Time) bool {
	startOk := saleStart == nil || !saleStart.After(now) // saleStart <= now
	endOk := saleEnd == nil || !saleEnd.Before(now)      // saleEnd   >= now
	return startOk && endOk
}

// StatusLabel is the label to SHOW in the admin UI (draft | scheduled | live |
// ended). It reflects both the override and the window so the operator sees the
// effective state, not just the stored string.
func StatusLabel(status string, saleStart, saleEnd *time.Time, now time.Time) string {
	switch status {
	case StatusDraft:
		return StatusDraft
	case StatusEnded:
		return StatusEnded
	case StatusLive:
		return StatusLive
	}
	if saleStart != nil && saleStart.After(now) {
		return StatusScheduled
	}
	if saleEnd != nil && saleEnd.Before(now) {
		return StatusEnded
	}
	return StatusLive
}
