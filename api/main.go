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
	eventstore "github.com/mac-checken/12tails-api/pkg/store/event"
	topupstore "github.com/mac-checken/12tails-api/pkg/store/topup"
	userstore "github.com/mac-checken/12tails-api/pkg/store/user"
	waitliststore "github.com/mac-checken/12tails-api/pkg/store/waitlist"
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
			api.NewServer,
		),
		fx.Invoke(seedAdmin),
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
