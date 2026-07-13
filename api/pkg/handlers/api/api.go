package api

import (
	"context"
	"net/http"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/sirupsen/logrus"

	"github.com/mac-checken/12tails-api/pkg/core"
	"github.com/mac-checken/12tails-api/pkg/logger"
	"github.com/mac-checken/12tails-api/pkg/models"
)

// Server holds the Echo instance and its injected dependencies (one field per
// store, mirroring the team's Go template).
type Server struct {
	Config         core.Config
	Log            *logrus.Logger
	EventStore     models.EventStore
	WaitlistStore  models.WaitlistStore
	UserStore      models.UserStore
	CharacterStore models.CharacterStore
	TopUpStore     models.TopUpStore

	echo *echo.Echo
}

// NewServer wires dependencies and builds the Echo router. Injected by Uber FX.
func NewServer(
	cfg core.Config,
	log *logrus.Logger,
	es models.EventStore,
	ws models.WaitlistStore,
	us models.UserStore,
	cs models.CharacterStore,
	ts models.TopUpStore,
) *Server {
	s := &Server{
		Config: cfg, Log: log,
		EventStore: es, WaitlistStore: ws,
		UserStore: us, CharacterStore: cs, TopUpStore: ts,
	}
	s.echo = s.build()
	return s
}

type customValidator struct{ v *validator.Validate }

func (cv *customValidator) Validate(i any) error { return cv.v.Struct(i) }

func (s *Server) build() *echo.Echo {
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true
	e.Validator = &customValidator{v: validator.New()}

	e.Use(middleware.Recover())
	e.Use(middleware.Secure())
	e.Use(s.cors())
	e.Use(logger.Middleware(s.Log))

	// Public ingestion routes (called cross-origin by the game + landing).
	e.GET("/health", s.Health)
	e.POST("/track", s.Track)
	e.POST("/waitlist", s.Waitlist)

	// Public auth (standalone register + login). Social linking comes later.
	e.POST("/auth/register", s.Register)
	e.POST("/auth/login", s.Login)

	// Protected account routes (Bearer JWT).
	me := e.Group("/me", s.JwtMiddleware())
	me.GET("", s.GetMe)
	me.GET("/characters", s.ListCharacters)
	me.POST("/characters", s.CreateCharacter)
	me.POST("/topup", s.TopUp)
	me.GET("/topups", s.ListTopups)

	return e
}

func (s *Server) cors() echo.MiddlewareFunc {
	origins := make([]string, 0)
	for _, o := range strings.Split(s.Config.ClientOrigin, ",") {
		if t := strings.TrimSpace(o); t != "" {
			origins = append(origins, t)
		}
	}
	if len(origins) == 0 {
		origins = []string{"*"}
	}
	return middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: origins,
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodOptions},
		AllowHeaders: []string{echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization, "X-Session-Id"},
	})
}

// Start blocks serving HTTP. Shutdown stops it gracefully (wired to FX lifecycle).
func (s *Server) Start() error                       { return s.echo.Start(":" + s.Config.Port) }
func (s *Server) Shutdown(ctx context.Context) error { return s.echo.Shutdown(ctx) }

func (s *Server) Health(c echo.Context) error {
	return c.JSON(http.StatusOK, echo.Map{"ok": true, "service": "12tails-api"})
}
