package user

import (
	"gorm.io/gorm"

	"github.com/mac-checken/12tails-api/pkg/models"
)

type userStore struct{ db *gorm.DB }

func New(db *gorm.DB) models.UserStore { return &userStore{db: db} }

func (s *userStore) Create(u *models.User) error { return s.db.Create(u).Error }

func (s *userStore) FindByID(id string) (*models.User, error) {
	var u models.User
	if err := s.db.First(&u, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (s *userStore) FindByEmail(email string) (*models.User, error) {
	var u models.User
	if err := s.db.First(&u, "email = ?", email).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (s *userStore) FindByFamilyName(name string) (*models.User, error) {
	var u models.User
	if err := s.db.First(&u, "family_name = ?", name).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (s *userStore) CountRegistered() (int64, error) {
	var n int64
	err := s.db.Model(&models.User{}).Count(&n).Error
	return n, err
}
