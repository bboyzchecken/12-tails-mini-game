package db

import (
	"github.com/go-gormigrate/gormigrate/v2"
	"github.com/sirupsen/logrus"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"

	"github.com/mac-checken/12tails-api/pkg/core"
	"github.com/mac-checken/12tails-api/pkg/models"
)

// New opens the Postgres connection and runs migrations on first start.
func New(cfg core.Config, log *logrus.Logger) (*gorm.DB, error) {
	gdb, err := gorm.Open(postgres.Open(cfg.Postgres.DSN()), &gorm.Config{
		Logger: gormlogger.Default.LogMode(gormlogger.Warn),
	})
	if err != nil {
		return nil, err
	}
	if err := migrate(gdb); err != nil {
		return nil, err
	}
	log.Info("postgres connected + migrated")
	return gdb, nil
}

// migrate runs versioned migrations via gormigrate. Add a new entry per change;
// never edit a shipped migration.
func migrate(gdb *gorm.DB) error {
	m := gormigrate.New(gdb, gormigrate.DefaultOptions, []*gormigrate.Migration{
		{
			ID: "20260713_initial",
			Migrate: func(tx *gorm.DB) error {
				return tx.AutoMigrate(&models.Event{}, &models.Waitlist{})
			},
			Rollback: func(tx *gorm.DB) error {
				return tx.Migrator().DropTable("events", "waitlists")
			},
		},
	})
	return m.Migrate()
}
