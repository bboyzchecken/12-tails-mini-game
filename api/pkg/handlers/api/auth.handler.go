package api

import (
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"

	"github.com/mac-checken/12tails-api/pkg/auth"
	"github.com/mac-checken/12tails-api/pkg/handlers/api/request"
	"github.com/mac-checken/12tails-api/pkg/models"
)

type registerRequest struct {
	Email      string  `json:"email" validate:"required,email"`
	Password   string  `json:"password" validate:"required,min=6"`
	FamilyName string  `json:"family_name" validate:"required,min=2,max=24"`
	Username   *string `json:"username"`
}

// Register creates a standalone account (email + password + permanent family
// name). No social link required — Google/Apple/Line can be linked later.
func (s *Server) Register(c echo.Context) error {
	var body registerRequest
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid body"})
	}
	if err := c.Validate(&body); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "email, password (>=6), and family_name (2-24) are required"})
	}

	email := strings.ToLower(strings.TrimSpace(body.Email))
	family := strings.TrimSpace(body.FamilyName)

	if _, err := s.UserStore.FindByEmail(email); err == nil {
		return c.JSON(http.StatusConflict, echo.Map{"error": "email already registered"})
	}
	if _, err := s.UserStore.FindByFamilyName(family); err == nil {
		return c.JSON(http.StatusConflict, echo.Map{"error": "family name already taken"})
	}

	hash, err := request.HashPassword(body.Password)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "could not create account"})
	}

	u := &models.User{
		ID:           uuid.NewString(),
		Email:        email,
		FamilyName:   family,
		PasswordHash: hash,
		Role:         "user",
		Status:       "active",
	}
	if body.Username != nil {
		if un := strings.TrimSpace(*body.Username); un != "" {
			u.Username = &un
		}
	}
	if err := s.UserStore.Create(u); err != nil {
		return c.JSON(http.StatusConflict, echo.Map{"error": "could not create account (email/family name/username may be taken)"})
	}

	token, err := auth.Generate(s.Config.JwtSecret, u.ID, u.Role)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "could not issue token"})
	}
	return c.JSON(http.StatusCreated, echo.Map{"ok": true, "token": token, "user": u})
}

type loginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// Login verifies credentials and returns a JWT.
func (s *Server) Login(c echo.Context) error {
	var body loginRequest
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid body"})
	}
	if err := c.Validate(&body); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "email and password are required"})
	}

	email := strings.ToLower(strings.TrimSpace(body.Email))
	u, err := s.UserStore.FindByEmail(email)
	if err != nil || !request.CheckPassword(u.PasswordHash, body.Password) {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "invalid email or password"})
	}
	if u.Status != "active" {
		return c.JSON(http.StatusForbidden, echo.Map{"error": "account is deactivated"})
	}

	token, err := auth.Generate(s.Config.JwtSecret, u.ID, u.Role)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "could not issue token"})
	}
	return c.JSON(http.StatusOK, echo.Map{"ok": true, "token": token, "user": u})
}
