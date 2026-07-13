package request

import (
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

// SessionID resolves an anonymous analytics session id, in priority order:
// explicit body value > X-Session-Id header > a freshly generated UUID.
// The client is expected to persist its own UUID (localStorage); the fallbacks
// keep ingestion robust if it does not.
func SessionID(c echo.Context, explicit string) string {
	if s := strings.TrimSpace(explicit); s != "" {
		return s
	}
	if h := strings.TrimSpace(c.Request().Header.Get("X-Session-Id")); h != "" {
		return h
	}
	return uuid.NewString()
}
