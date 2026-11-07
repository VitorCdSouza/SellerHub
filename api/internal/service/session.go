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

func (sessionService *SessionService) Create(userID int32) (string, error) {
	now := time.Now()
	claims := jwt.RegisteredClaims{
		Subject:   strconv.FormatInt(int64(userID), 10),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(SessionDuration)),
	}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(sessionService.Secret)
	if err != nil {
		return "", fmt.Errorf("assinar token: %w", err)
	}
	return token, nil
}

func (sessionService *SessionService) Validate(token string) (int32, error) {
	claims := &jwt.RegisteredClaims{}
	_, err := jwt.ParseWithClaims(token, claims,
		func(*jwt.Token) (any, error) { return sessionService.Secret, nil },
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithExpirationRequired(),
	)
	if err != nil {
		return 0, fmt.Errorf("validar token: %w", err)
	}
	userID, err := strconv.ParseInt(claims.Subject, 10, 32)
	if err != nil {
		return 0, fmt.Errorf("ler usuario do token: %w", err)
	}
	return int32(userID), nil
}
