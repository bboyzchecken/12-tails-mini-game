package main

import (
	"context"
	"net/http"
	"os"
	"time"

	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"go.uber.org/fx"
	"go.uber.org/fx/fxevent"

	"github.com/mac-checken/12tails-api/pkg/core"
	"github.com/mac-checken/12tails-api/pkg/db"
	"github.com/mac-checken/12tails-api/pkg/handlers/api"
	"github.com/mac-checken/12tails-api/pkg/logger"
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
		fx.Invoke(registerServer),
		fx.WithLogger(func() fxevent.Logger { return fxevent.NopLogger }),
	).Run()
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
