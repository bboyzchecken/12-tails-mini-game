package api

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"gorm.io/datatypes"

	"github.com/mac-checken/12tails-api/pkg/models"
)

// maxCharacterSlots is the starter slot count; extra slots are a Jil purchase later.
const maxCharacterSlots = 3

func userID(c echo.Context) string {
	id, _ := c.Get("user_id").(string)
	return id
}

// GetMe returns the account, its characters, and the slot limit.
func (s *Server) GetMe(c echo.Context) error {
	uid := userID(c)
	u, err := s.UserStore.FindByID(uid)
	if err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "user not found"})
	}
	chars, _ := s.CharacterStore.ListByUser(uid)
	return c.JSON(http.StatusOK, echo.Map{"user": u, "characters": chars, "max_slots": maxCharacterSlots})
}

// ListCharacters returns the account's characters.
func (s *Server) ListCharacters(c echo.Context) error {
	chars, err := s.CharacterStore.ListByUser(userID(c))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "could not load characters"})
	}
	return c.JSON(http.StatusOK, echo.Map{"characters": chars, "max_slots": maxCharacterSlots})
}

type createCharacterRequest struct {
	Name        string          `json:"name" validate:"required,min=1,max=24"`
	CharacterID string          `json:"character_id" validate:"required"`
	Appearance  json.RawMessage `json:"appearance"`
	SlotIndex   *int            `json:"slot_index"`
}

// CreateCharacter adds a character in a free slot. Its name is permanent.
func (s *Server) CreateCharacter(c echo.Context) error {
	uid := userID(c)
	var body createCharacterRequest
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid body"})
	}
	if err := c.Validate(&body); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "name (1-24) and character_id are required"})
	}

	count, err := s.CharacterStore.CountByUser(uid)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "could not read slots"})
	}
	if count >= maxCharacterSlots {
		return c.JSON(http.StatusConflict, echo.Map{"error": "all character slots are full"})
	}

	slot := int(count) // next free slot by default
	if body.SlotIndex != nil {
		slot = *body.SlotIndex
	}
	if slot < 0 || slot >= maxCharacterSlots {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "invalid slot_index"})
	}
	if taken, _ := s.CharacterStore.SlotTaken(uid, slot); taken {
		return c.JSON(http.StatusConflict, echo.Map{"error": "slot already in use"})
	}

	ch := &models.Character{
		ID:          uuid.NewString(),
		UserID:      uid,
		Name:        strings.TrimSpace(body.Name),
		CharacterID: body.CharacterID,
		SlotIndex:   slot,
	}
	if len(body.Appearance) > 0 {
		ch.Appearance = datatypes.JSON(body.Appearance)
	}
	if err := s.CharacterStore.Create(ch); err != nil {
		return c.JSON(http.StatusConflict, echo.Map{"error": "could not create character"})
	}
	return c.JSON(http.StatusCreated, echo.Map{"ok": true, "character": ch})
}

type topUpRequest struct {
	AmountJil int     `json:"amount_jil" validate:"required,gt=0"`
	Note      *string `json:"note"`
}

// TopUp records a DEMO top-up (no real payment) for pitch/attribution.
func (s *Server) TopUp(c echo.Context) error {
	uid := userID(c)
	var body topUpRequest
	if err := c.Bind(&body); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid body"})
	}
	if err := c.Validate(&body); err != nil {
		return c.JSON(http.StatusUnprocessableEntity, echo.Map{"error": "amount_jil must be > 0"})
	}
	t := &models.TopUp{
		ID:        uuid.NewString(),
		UserID:    uid,
		AmountJil: body.AmountJil,
		Note:      body.Note,
	}
	if err := s.TopUpStore.Create(t); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "could not record top-up"})
	}
	return c.JSON(http.StatusCreated, echo.Map{"ok": true, "topup": t, "demo": true})
}

// ListTopups returns the account's demo top-up history + total.
func (s *Server) ListTopups(c echo.Context) error {
	ts, err := s.TopUpStore.ListByUser(userID(c))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "could not load top-ups"})
	}
	total := 0
	for _, t := range ts {
		total += t.AmountJil
	}
	return c.JSON(http.StatusOK, echo.Map{"topups": ts, "total_jil": total, "demo": true})
}
