.PHONY: run api web install db stop-db reset-db

# sobe api e web em paralelo, ctrl+c encerra os dois
run:
	$(MAKE) -j2 api web

api:
ifeq ($(wildcard .env),)
	$(error .env não encontrado: copie .env.example para .env e defina DB_PASSWORD)
endif
	cd api && go run ./cmd

web: web/node_modules
	cd web && npm start

web/node_modules: web/package-lock.json
	cd web && npm ci

install: web/node_modules
	cd api && go mod download

# postgresql via docker com as credenciais do .env
db:
ifeq ($(wildcard .env),)
	$(error .env não encontrado: copie .env.example para .env e defina DB_PASSWORD)
endif
	docker compose -f db/docker-compose.yaml --env-file .env up -d --wait

# mantem os dados; recriar do zero
stop-db:
	docker compose -f db/docker-compose.yaml --env-file .env down

# apaga o volume e recria o banco rodando de novo os scripts de db/
reset-db:
	docker compose -f db/docker-compose.yaml --env-file .env down -v
	$(MAKE) db
