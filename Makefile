.PHONY: run api web install db stop-db reset-db

# sobe api e web em paralelo, ctrl+c encerra os dois
run:
	$(MAKE) -j2 api web

api:
ifeq ($(wildcard api/.env),)
	$(error api/.env não encontrado: copie api/.env.example para api/.env e defina DB_PASSWORD)
endif
	cd api && go run ./cmd

web: web/node_modules
	cd web && npm start

web/node_modules: web/package-lock.json
	cd web && npm ci

install: web/node_modules
	cd api && go mod download

# postgresql via docker com as credenciais do api/.env
db:
ifeq ($(wildcard api/.env),)
	$(error api/.env não encontrado: copie api/.env.example para api/.env e defina DB_PASSWORD)
endif
	docker compose --env-file api/.env up -d --wait

# mantem os dados; recriar do zero
stop-db:
	docker compose --env-file api/.env down

# apaga o volume e recria o banco rodando de novo os scripts de api/sql
reset-db:
	docker compose --env-file api/.env down -v
	$(MAKE) db
