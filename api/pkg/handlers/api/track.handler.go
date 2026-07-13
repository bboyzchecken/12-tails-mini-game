package api

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/datatypes"

	"github.com/mac-checken/12tails-api/pkg/handlers/api/request"
	"github.com/mac-checken/12tails-api/pkg/models"
)

type trackRequest struct {
	Type      string          `json:"type" validate:"required"`
	SessionID string          `json:"session_id"`
	AccountID *string         `json:"account_id"`
	ItemID    *string         `json:"item_id"`
	Meta      json.RawMessage `json:"meta"`
	Referrer  *string         `json:"referrer"`
}

// Track records one analytics event. Public + cross-origin (game + landing).
func (s *Server) Track(c echo.Context) error {
	var body trackRequest
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid body"})
	}
	if err := c.Validate(&body); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "type is required"})
	}

	referrer := body.Referrer
	if referrer == nil {
		if r := c.Request().Header.Get("Referer"); r != "" {
			referrer = &r
		}
	}

	ev := &models.Event{
		ID:        uuid.NewString(),
		SessionID: request.SessionID(c, body.SessionID),
		AccountID: body.AccountID,
		Type:      body.Type,
		ItemID:    body.ItemID,
		Referrer:  referrer,
	}
	if len(body.Meta) > 0 {
		ev.Meta = datatypes.JSON(body.Meta)
	}

	if err := s.EventStore.Create(ev); err != nil {
		s.Log.WithError(err).Error("track: failed to record event")
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "could not record event"})
	}
	return c.JSON(http.StatusCreated, echo.Map{"ok": true, "id": ev.ID, "session_id": ev.SessionID})
}
