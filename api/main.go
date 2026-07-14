package main

import (
	"context"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"go.uber.org/fx"
	"go.uber.org/fx/fxevent"
	"golang.org/x/crypto/bcrypt"

	"github.com/mac-checken/12tails-api/pkg/core"
	"github.com/mac-checken/12tails-api/pkg/db"
	"github.com/mac-checken/12tails-api/pkg/handlers/api"
	"github.com/mac-checken/12tails-api/pkg/logger"
	"github.com/mac-checken/12tails-api/pkg/models"
	characterstore "github.com/mac-checken/12tails-api/pkg/store/character"
	collectionstore "github.com/mac-checken/12tails-api/pkg/store/collection"
	eventstore "github.com/mac-checken/12tails-api/pkg/store/event"
	topupstore "github.com/mac-checken/12tails-api/pkg/store/topup"
	userstore "github.com/mac-checken/12tails-api/pkg/store/user"
	waitliststore "github.com/mac-checken/12tails-api/pkg/store/waitlist"
	"github.com/mac-checken/12tails-api/pkg/utils/liveness"
)

func main() {
	// Single root .env for the whole monorepo. Try the repo root first (when run
	// from ./api), then a local .env; real env vars (e.g. in Docker) always win.
	_ = godotenv.Load("../.env")
	_ = godotenv.Load(".env")
	viper.AutomaticEnv()
	if loc, err := time.LoadLocation("Asia/Bangkok"); err == nil {
		time.Local = loc
	}

	cfg := core.Load()

	// CLI: `go run . up` runs migrations then exits (no server).
	if len(os.Args) > 1 && os.Args[1] == "up" {
		log := logger.New()
		if _, err := db.New(cfg, log); err != nil {
			log.WithError(err).Fatal("migration failed")
		}
		log.Info("migrations applied")
		return
	}

	fx.New(
		fx.Supply(cfg),
		fx.Provide(
			logger.New,
			db.New,
			eventstore.New,
			waitliststore.New,
			userstore.New,
			characterstore.New,
			topupstore.New,
			collectionstore.New,
			api.NewServer,
		),
		fx.Invoke(seedAdmin),
		fx.Invoke(seedCollections),
		fx.Invoke(registerServer),
		fx.WithLogger(func() fxevent.Logger { return fxevent.NopLogger }),
	).Run()
}

// seedAdmin creates the dashboard admin account on startup when ADMIN_EMAIL +
// ADMIN_PASSWORD are set and it does not already exist. There is no public admin
// register — this is the only way an admin (role=admin) is created.
func seedAdmin(cfg core.Config, log *logrus.Logger, us models.UserStore) {
	if cfg.AdminEmail == "" || cfg.AdminPassword == "" {
		return
	}
	email := strings.ToLower(strings.TrimSpace(cfg.AdminEmail))
	if _, err := us.FindByEmail(email); err == nil {
		return // already seeded
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(cfg.AdminPassword), bcrypt.DefaultCost)
	if err != nil {
		log.WithError(err).Error("admin seed: could not hash password")
		return
	}
	family := strings.TrimSpace(cfg.AdminFamilyName)
	if family == "" {
		family = "Admin"
	}
	u := &models.User{
		ID:           uuid.NewString(),
		Email:        email,
		FamilyName:   family,
		PasswordHash: string(hash),
		Role:         "admin",
		Status:       "active",
	}
	if err := us.Create(u); err != nil {
		log.WithError(err).Warn("admin seed: create failed (email/family name may be taken)")
		return
	}
	log.Infof("seeded admin account %s", email)
}

// seedCollections plants demo seasons on first start (when the table is empty)
// so the admin timeline + demo store have something to show: one live season,
// one already ended, and one scheduled for the future — enough to demonstrate
// "items appear/disappear on schedule" and the rotation/timeline UI. It never
// overwrites operator data (only runs when Count()==0). Windows are relative to
// startup time, so the demo is always live/past/future regardless of the date.
func seedCollections(log *logrus.Logger, cs models.CollectionStore) {
	n, err := cs.Count()
	if err != nil {
		log.WithError(err).Warn("season seed: count failed")
		return
	}
	if n > 0 {
		return // already seeded or operator-managed
	}
	now := time.Now()
	at := func(t time.Time) *time.Time { return &t }
	str := func(s string) *string { return &s }

	type item struct {
		name, typ, rarity string
		price             int
	}
	seasons := []struct {
		name, theme string
		start, end  time.Time
		items       []item
	}{
		{
			name: "ชุดฤดูร้อน 2026", theme: "summer",
			start: now.AddDate(0, 0, -2), end: now.AddDate(0, 0, 12), // LIVE now
			items: []item{
				{"สกินชายหาด", "skin", "epic", 1200},
				{"สีฟ้าทะเล", "color", "rare", 400},
				{"อีโมทกระโดดน้ำ", "emote", "rare", 350},
				{"กรอบแชทเปลือกหอย", "chat_frame", "common", 180},
			},
		},
		{
			name: "ชุดสงกรานต์ 2026", theme: "songkran",
			start: now.AddDate(0, 0, -45), end: now.AddDate(0, 0, -20), // ENDED (past)
			items: []item{
				{"สกินปืนฉีดน้ำ", "skin", "epic", 900},
				{"อีโมทสาดน้ำ", "emote", "rare", 320},
				{"กรอบแชทดอกไม้", "chat_frame", "common", 150},
			},
		},
		{
			name: "ชุดฮาโลวีน 2026", theme: "halloween",
			start: now.AddDate(0, 0, 25), end: now.AddDate(0, 0, 40), // SCHEDULED (future)
			items: []item{
				{"สกินแวมไพร์", "skin", "epic", 1400},
				{"สีม่วงรัตติกาล", "color", "rare", 500},
				{"อีโมทหลอน", "emote", "common", 280},
			},
		},
	}

	seeded := 0
	for _, sc := range seasons {
		col := &models.Collection{
			ID:        uuid.NewString(),
			Name:      sc.name,
			Theme:     str(sc.theme),
			SaleStart: at(sc.start),
			SaleEnd:   at(sc.end),
			Status:    liveness.StatusScheduled,
		}
		if err := cs.Create(col); err != nil {
			log.WithError(err).Warn("season seed: create collection failed")
			continue
		}
		for _, si := range sc.items {
			it := &models.CosmeticItem{
				ID:           uuid.NewString(),
				CollectionID: col.ID,
				Name:         si.name,
				Type:         si.typ,
				PriceJil:     si.price,
				Rarity:       si.rarity,
				Preview:      "placeholder",
				Active:       true,
			}
			if err := cs.CreateItem(it); err != nil {
				log.WithError(err).Warn("season seed: create item failed")
			}
		}
		seeded++
	}
	log.Infof("seeded %d demo season collections", seeded)
}

// registerServer starts/stops the Echo server on the FX lifecycle.
func registerServer(lc fx.Lifecycle, s *api.Server, log *logrus.Logger, cfg core.Config) {
	lc.Append(fx.Hook{
		OnStart: func(context.Context) error {
			go func() {
				if err := s.Start(); err != nil && err != http.ErrServerClosed {
					log.WithError(err).Fatal("server stopped unexpectedly")
				}
			}()
			log.Infof("12tails-api listening on :%s (env=%s)", cfg.Port, cfg.Environment)
			return nil
		},
		OnStop: func(ctx context.Context) error {
			log.Info("shutting down")
			return s.Shutdown(ctx)
		},
	})
}
