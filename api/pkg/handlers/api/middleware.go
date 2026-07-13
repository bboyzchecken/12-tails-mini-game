package api

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"

	"github.com/mac-checken/12tails-api/pkg/auth"
)

// JwtMiddleware requires a valid Bearer token and loads the user, blocking
// deactivated accounts mid-session. It sets "user_id" and "role" on the context.
func (s *Server) JwtMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			raw := c.Request().Header.Get(echo.HeaderAuthorization)
			if !strings.HasPrefix(raw, "Bearer ") {
				return c.JSON(http.StatusUnauthorized, echo.Map{"error": "unauthorized"})
			}
			claims, err := auth.Parse(s.Config.JwtSecret, strings.TrimPrefix(raw, "Bearer "))
			if err != nil {
				return c.JSON(http.StatusUnauthorized, echo.Map{"error": "unauthorized"})
			}
			u, err := s.UserStore.FindByID(claims.UserID)
			if err != nil || u.Status != "active" {
				return c.JSON(http.StatusUnauthorized, echo.Map{"error": "unauthorized"})
			}
			c.Set("user_id", u.ID)
			c.Set("role", u.Role)
			return next(c)
		}
	}
}

// IsAdmin gates a route to role=admin. Chain after JwtMiddleware. Used by the
// admin dashboard routes (Phase 4).
func (s *Server) IsAdmin() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			if role, _ := c.Get("role").(string); role != "admin" {
				return c.JSON(http.StatusForbidden, echo.Map{"error": "forbidden"})
			}
			return next(c)
		}
	}
}
