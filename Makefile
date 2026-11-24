.PHONY: help dev dev-api api dev-backend backend dev-web web dev-webclient webclient setup install db-migrate db-seed db-fresh test build docker-up docker-down docker-logs

BACKEND_PORT ?= 8005
WEB_PORT ?= 5175

help:
	@echo "Available shortcut commands:"
	@echo "  make dev             - Run Backend API (port $(BACKEND_PORT)) & Webclient (port $(WEB_PORT))"
	@echo "  make dev-api         - Run Laravel Backend API (port $(BACKEND_PORT))"
	@echo "  make dev-web         - Run Vite Webclient (port $(WEB_PORT))"
	@echo "  make setup           - Setup dependencies, .env files, key & migrations"
	@echo "  make install         - Install Composer & npm dependencies"
	@echo "  make db-migrate      - Run Database Migrations"
	@echo "  make db-seed         - Seed Database"
	@echo "  make db-fresh        - Fresh Migrate & Seed Database"
	@echo "  make test            - Run Backend tests & Webclient build check"
	@echo "  make build           - Build Webclient for production"
	@echo "  make docker-up       - Start Docker Containers"
	@echo "  make docker-down     - Stop Docker Containers"
	@echo "  make docker-logs     - Follow Docker Container Logs"

dev:
	@trap 'kill 0' INT TERM EXIT; \
	(cd backend && php artisan serve --host=127.0.0.1 --port=$(BACKEND_PORT)) & \
	(cd webclient && npm run dev -- --port=$(WEB_PORT)) & \
	wait

dev-api:
	cd backend && php artisan serve --host=127.0.0.1 --port=$(BACKEND_PORT)

api: dev-api

dev-backend: dev-api

backend: dev-api

dev-web:
	cd webclient && npm run dev -- --port=$(WEB_PORT)

web: dev-web

dev-webclient: dev-web

webclient: dev-web

setup: install
	@[ -f backend/.env ] || cp backend/.env.example backend/.env
	@[ -f webclient/.env ] || cp webclient/.env.example webclient/.env
	cd backend && php artisan key:generate --ansi
	cd backend && php artisan migrate

install:
	cd backend && composer install
	cd webclient && npm install

db-migrate:
	cd backend && php artisan migrate

db-seed:
	cd backend && php artisan db:seed

db-fresh:
	cd backend && php artisan migrate:fresh --seed

test:
	cd backend && php artisan test
	cd webclient && npm run build

build:
	cd webclient && npm run build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f
