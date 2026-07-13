package api

import (
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/mac-checken/12tails-api/pkg/models"
)

type waitlistRequest struct {
	Email  string  `json:"email" validate:"required,email"`
	Source *string `json:"source"`
}

// Waitlist stores a consented email signup, deduped on email.
func (s *Server) Waitlist(c echo.Context) error {
	var body waitlistRequest
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid body"})
	}
	if err := c.Validate(&body); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "a valid email is required"})
	}

	w := &models.Waitlist{
		ID:     uuid.NewString(),
		Email:  strings.ToLower(strings.TrimSpace(body.Email)),
		Source: body.Source,
	}
	created, err := s.WaitlistStore.Create(w)
	if err != nil {
		s.Log.WithError(err).Error("waitlist: failed to save")
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "could not save signup"})
	}
	return c.JSON(http.StatusOK, echo.Map{"ok": true, "created": created})
}
