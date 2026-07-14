package liveness

import (
	"testing"
	"time"
)

func TestIsLiveNow(t *testing.T) {
	now := time.Date(2026, 7, 14, 12, 0, 0, 0, time.UTC)
	past := now.Add(-24 * time.Hour)
	future := now.Add(24 * time.Hour)

	cases := []struct {
		name       string
		status     string
		start, end *time.Time
		want       bool
	}{
		{"scheduled window open now", StatusScheduled, &past, &future, true},
		{"scheduled window in the future", StatusScheduled, &future, ptr(now.Add(48 * time.Hour)), false},
		{"scheduled window already ended", StatusScheduled, ptr(now.Add(-48 * time.Hour)), &past, false},
		{"open-ended started in the past", StatusScheduled, &past, nil, true},
		{"no window at all counts as open", StatusScheduled, nil, nil, true},
		{"draft forces off even inside window", StatusDraft, &past, &future, false},
		{"ended forces off even inside window", StatusEnded, &past, &future, false},
		{"live forces on even past the window", StatusLive, ptr(now.Add(-48 * time.Hour)), &past, true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := IsLiveNow(tc.status, tc.start, tc.end, now); got != tc.want {
				t.Fatalf("IsLiveNow(%s) = %v, want %v", tc.status, got, tc.want)
			}
		})
	}
}

func TestStatusLabel(t *testing.T) {
	now := time.Date(2026, 7, 14, 12, 0, 0, 0, time.UTC)
	past := now.Add(-24 * time.Hour)
	future := now.Add(24 * time.Hour)

	cases := []struct {
		name       string
		status     string
		start, end *time.Time
		want       string
	}{
		{"draft stays draft", StatusDraft, &past, &future, StatusDraft},
		{"live override shows live", StatusLive, nil, nil, StatusLive},
		{"scheduled future window", StatusScheduled, &future, nil, StatusScheduled},
		{"scheduled ended window", StatusScheduled, &past, ptr(now.Add(-1 * time.Hour)), StatusEnded},
		{"scheduled active window is live", StatusScheduled, &past, &future, StatusLive},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := StatusLabel(tc.status, tc.start, tc.end, now); got != tc.want {
				t.Fatalf("StatusLabel(%s) = %q, want %q", tc.status, got, tc.want)
			}
		})
	}
}

func TestItemLiveNow(t *testing.T) {
	now := time.Date(2026, 7, 14, 12, 0, 0, 0, time.UTC)
	past := now.Add(-24 * time.Hour)
	future := now.Add(24 * time.Hour)

	if ItemLiveNow(false, &past, &future, now) {
		t.Fatal("inactive item must never be live")
	}
	if !ItemLiveNow(true, nil, nil, now) {
		t.Fatal("active item with no window must be live")
	}
	if ItemLiveNow(true, &future, nil, now) {
		t.Fatal("active item whose window has not started must not be live")
	}
}

func ptr(t time.Time) *time.Time { return &t }
