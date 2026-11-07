package controller

import (
	"encoding/json"
	"net/http"
)

type response struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

func respond(writer http.ResponseWriter, status int, success bool, message string) {
	writeJSON(writer, status, response{Success: success, Message: message})
}

func writeJSON(writer http.ResponseWriter, status int, body any) {
	writer.Header().Set("Content-Type", "application/json; charset=utf-8")
	writer.WriteHeader(status)
	_ = json.NewEncoder(writer).Encode(body)
}
