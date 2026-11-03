package service

import (
	"fmt"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

const SessionDuration = 8 * time.Hour

type SessionService struct {
	Secret []byte
}

func (sessionService *SessionService) Create(userID int64) (string, error) {
	now := time.Now()
	claims := jwt.RegisteredClaims{
		Subject:   strconv.FormatInt(userID, 10),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(SessionDuration)),
	}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(sessionService.Secret)
	if err != nil {
		return "", fmt.Errorf("assinar token: %w", err)
	}
	return token, nil
}
