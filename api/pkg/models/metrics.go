package models

// Phase 4 admin analytics — read-side aggregate shapes (12tails-web-BUILD-PLAN.md).
// buy_intent is an INTEREST signal, never a sale; revenue fields are "would-be"
// estimates for the pitch, not real money.

// FunnelStage is the count of distinct sessions that fired one event type.
type FunnelStage struct {
	Key      string `json:"key"`
	Sessions int64  `json:"sessions"`
}

// DemandRow ranks one cosmetic by buy_intent — the "ชุดที่คนอยากซื้อสุด" chart.
type DemandRow struct {
	ItemID         string `json:"item_id"`
	ItemType       string `json:"item_type"`
	Intents        int64  `json:"intents"`
	WouldBeRevenue int64  `json:"would_be_revenue"` // Σ price_jil across those intents
}

// DailyPoint is one day on the activity time series (Asia/Bangkok).
type DailyPoint struct {
	Day       string `json:"day"` // YYYY-MM-DD
	Total     int64  `json:"total"`
	BuyIntent int64  `json:"buy_intent"`
	Sessions  int64  `json:"sessions"`
}

// CountRow is a generic key→count bucket (e.g. referrers).
type CountRow struct {
	Key   string `json:"key"`
	Count int64  `json:"count"`
}

// CollectionDemandRow ranks buy_intent per season (Phase 5) — the "ดีมานด์ต่อ
// ซีซัน" chart that proves the rotation model to Bigbug. Interest, not sales.
type CollectionDemandRow struct {
	CollectionID   string `json:"collection_id"`
	Name           string `json:"name"`  // joined from collections (may be empty if deleted)
	Theme          string `json:"theme"` // from the event meta at buy time
	Intents        int64  `json:"intents"`
	WouldBeRevenue int64  `json:"would_be_revenue"` // Σ price_jil across those intents
}

// TopUpTotal is demo top-up history aggregated per account (attribution is real
// even though the payment is mock).
type TopUpTotal struct {
	UserID     string `json:"user_id"`
	FamilyName string `json:"family_name"`
	Email      string `json:"email"`
	TotalJil   int64  `json:"total_jil"`
	Count      int64  `json:"count"`
}
