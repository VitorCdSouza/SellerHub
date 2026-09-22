package main

import (
	"bufio"
	"fmt"
	"log"
	"os"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	// Ferramenta local de preparação, sem endpoint de cadastro.
	leitor := bufio.NewScanner(os.Stdin)
	if !leitor.Scan() || len(leitor.Bytes()) == 0 {
		log.Fatal("Informe uma senha pela entrada padrão")
	}
	hash, err := bcrypt.GenerateFromPassword(leitor.Bytes(), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal("Não foi possível gerar o hash; use uma senha de até 72 bytes")
	}
	fmt.Println(string(hash))
}
