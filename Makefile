PYTHON ?= python
NPM ?= npm
MATH2_SOURCE ?= D:/work/Kaoyan-Math2-Papers
MATH2_OUTPUT := content/staging/math2/2020
MATH2_2023_OUTPUT := content/staging/math2/2023
MATH2_2023_REVIEW := content/reports/math2-2023/human-review-checklist.md
MATH2_REPORT := content/reports/req-002-math2-markdown-import
MATH2_INVENTORY := $(MATH2_REPORT)/source-inventory.json

.PHONY: help install sync dev dev-api typecheck typecheck-web typecheck-api test test-api test-smoke build build-web build-api math2-inventory math2-pilot math2-katex math2-validate math2-2023-staging math2-2023-katex math2-2023-validate math2-import-dry-run test-math2 test-python-all verify

help:
	@echo "Available targets:"
	@echo "  make install                  Install dependencies"
	@echo "  make sync                     Sync canonical Math1 content"
	@echo "  make dev                      Start the web app"
	@echo "  make dev-api                  Start the API"
	@echo "  make typecheck                Type-check web and API"
	@echo "  make test                     Run API and web smoke tests"
	@echo "  make build                    Build web and API"
	@echo "  make math2-inventory          Audit read-only Math2 Markdown sources"
	@echo "  make math2-validate           Regenerate and validate the Math2 pilot"
	@echo "  make math2-2023-validate      Regenerate and validate Math2 2023 staging"
	@echo "  make math2-import-dry-run     Exercise MySQL import and roll it back"
	@echo "  make verify                   Run the full PR verification gate"

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

math2-inventory:
	$(PYTHON) scripts/inventory_math2_markdown.py "$(MATH2_SOURCE)" "$(MATH2_INVENTORY)"

math2-pilot:
	$(PYTHON) scripts/transform_math2_2020.py "$(MATH2_SOURCE)" "$(MATH2_OUTPUT)"

math2-katex: math2-pilot
	node scripts/validate_math2_katex.mjs "$(MATH2_OUTPUT)/questions.json" "$(MATH2_OUTPUT)/katex-validation.json"

test-math2:
	set MATH2_SOURCE_DIR=$(MATH2_SOURCE)&& $(PYTHON) -m unittest tests.test_inventory_math2_markdown tests.test_transform_math2_2020 -v

math2-validate: math2-inventory math2-katex test-math2

math2-2023-staging:
	$(PYTHON) scripts/transform_math2_2023.py "$(MATH2_SOURCE)" "$(MATH2_2023_OUTPUT)" --review-checklist "$(MATH2_2023_REVIEW)"

math2-2023-katex: math2-2023-staging
	node scripts/validate_math2_katex.mjs "$(MATH2_2023_OUTPUT)/questions.json" "$(MATH2_2023_OUTPUT)/katex-validation.json"

math2-2023-validate: math2-2023-katex
	set MATH2_SOURCE_DIR=$(MATH2_SOURCE)&& $(PYTHON) -m unittest tests.test_transform_math2_2023 -v

math2-import-dry-run: math2-validate
	$(NPM) run import:math2 --workspace @kaoyan/api -- --input "$(MATH2_OUTPUT)/questions.json"

test-python-all:
	$(PYTHON) -m unittest discover -s tests -p "test_*.py"

verify: math2-validate math2-2023-validate typecheck test build
	$(PYTHON) -m compileall -q scripts tests
