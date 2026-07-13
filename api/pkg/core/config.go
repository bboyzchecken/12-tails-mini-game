package core

import (
	"fmt"

	"github.com/spf13/viper"
)

// Config is the single source of runtime configuration. Every value comes from
// an environment variable (via Viper + godotenv), matching the team's Go template.
type Config struct {
	Environment  string
	Port         string
	ClientOrigin string // comma-separated allowed CORS origins (game client + landing)
	JwtSecret    string // unused in Phase 1; reserved for player/admin auth (Phase P)
	Postgres     PostgresConfig
}

type PostgresConfig struct {
	URL      string // optional DATABASE_URL; when set it wins over the parts below
	Host     string
	Port     string
	Username string
	Password string
	Database string
	SSLMode  string
}

// DSN builds a GORM postgres connection string, preferring DATABASE_URL if given.
func (p PostgresConfig) DSN() string {
	if p.URL != "" {
		return p.URL
	}
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s TimeZone=Asia/Bangkok",
		p.Host, p.Port, p.Username, p.Password, p.Database, p.SSLMode,
	)
}

// Load reads the config from the environment. Call viper.AutomaticEnv() first.
func Load() Config {
	return Config{
		Environment:  env("ENV", "development"),
		Port:         port(),
		ClientOrigin: env("CLIENT_ORIGIN", "*"),
		JwtSecret:    env("JWT_SECRET_KEY", ""),
		Postgres: PostgresConfig{
			URL:      env("DATABASE_URL", ""),
			Host:     env("POSTGRES_HOST", "localhost"),
			Port:     env("POSTGRES_PORT", "5432"),
			Username: env("POSTGRES_USER", "postgres"),
			Password: env("POSTGRES_PASSWORD", "postgres"),
			Database: env("POSTGRES_DB", "twelvetails"),
			SSLMode:  env("POSTGRES_SSLMODE", "disable"),
		},
	}
}

func env(key, fallback string) string {
	if v := viper.GetString(key); v != "" {
		return v
	}
	return fallback
}

// port reads the shared root .env, where API_PORT is the service's port
// (PORT is accepted as a fallback for standalone use).
func port() string {
	if p := viper.GetString("API_PORT"); p != "" {
		return p
	}
	return env("PORT", "5000")
}
