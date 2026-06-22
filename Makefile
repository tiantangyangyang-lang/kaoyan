NPM ?= npm

.PHONY: help install sync dev dev-api typecheck typecheck-web typecheck-api test test-api test-smoke build build-web build-api verify

help:
	@echo "Available targets:"
	@echo "  make install       Install dependencies"
	@echo "  make sync          Sync canonical question content"
	@echo "  make dev           Start the web app"
	@echo "  make dev-api       Start the API"
	@echo "  make typecheck     Type-check web and API"
	@echo "  make test          Run API and web smoke tests"
	@echo "  make build         Build web and API"
	@echo "  make verify        Run the full PR verification gate"

install:
	$(NPM) install

sync:
	$(NPM) run sync:content

dev:
	$(NPM) run dev

dev-api:
	$(NPM) run dev:api

typecheck: typecheck-web typecheck-api

typecheck-web:
	$(NPM) run typecheck:web

typecheck-api:
	$(NPM) run typecheck:api

test: test-api test-smoke

test-api:
	$(NPM) run test:api

test-smoke:
	$(NPM) run test:smoke:ci --workspace @kaoyan/web

build: build-web build-api

build-web:
	$(NPM) run build:web

build-api:
	$(NPM) run build:api

verify: typecheck test build
