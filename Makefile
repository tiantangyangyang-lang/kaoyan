PYTHON ?= python
NPM ?= npm
MATH2_SOURCE ?= D:/work/Kaoyan-Math2-Papers
MATH2_OUTPUT := content/staging/math2/2020
MATH2_2020_INPUT := content/staging/math2/2020/questions.json
MATH2_2023_OUTPUT := content/staging/math2/2023
MATH2_2023_INPUT := content/staging/math2/2023/questions.json
MATH2_2023_REVIEW := content/reports/math2-2023/human-review-checklist.md
MATH2_2024_OUTPUT := content/staging/math2/2024
MATH2_2024_INPUT := content/staging/math2/2024/questions.json
MATH2_2024_REVIEW := content/reports/math2-2024/human-review-checklist.md
MATH2_2021_2022_REPORT := content/reports/req-011-math2-2021-2022-staging-readiness
MATH2_1997_2019_OUTPUT := content/staging/math2
MATH2_1997_2019_REPORT := content/reports/req-017-math2-1997-2019-staging-readiness
MATH2_1997_2019_YEARS := 1997 1998 1999 2000 2001 2002 2003 2004 2005 2006 2007 2008 2009 2010 2011 2012 2013 2014 2015 2016 2017 2018 2019
MATH2_REPORT := content/reports/req-002-math2-markdown-import
MATH2_INVENTORY := $(MATH2_REPORT)/source-inventory.json
MATH3_1987_1996_OUTPUT := content/staging/math3
MATH3_1987_1996_REPORT := content/reports/req-016-math3-1987-1996-staging-db-readiness

.PHONY: help install sync dev dev-api typecheck typecheck-web typecheck-api test test-api test-smoke build build-web build-api math2-inventory math2-pilot math2-katex math2-validate math2-2021-2022-audit math2-1997-2019-staging math2-1997-2019-katex-report math2-1997-2019-validate math2-db-1997-2019-import-dry-run math2-db-1997-2019-import-commit math2-2023-staging math2-2023-katex math2-2023-validate math2-2024-staging math2-2024-katex math2-2024-validate math3-1987-1996-staging math3-1987-1996-katex-report math3-1987-1996-validate math3-1987-import-dry-run math3-1988-import-dry-run math3-1989-import-dry-run math3-1990-import-dry-run math3-1991-import-dry-run math3-1992-import-dry-run math3-1993-import-dry-run math3-1994-import-dry-run math3-1995-import-dry-run math3-1996-import-dry-run math3-db-1987-1996-import-dry-run math3-1987-import-commit math3-1988-import-commit math3-1989-import-commit math3-1990-import-commit math3-1991-import-commit math3-1992-import-commit math3-1993-import-commit math3-1994-import-commit math3-1995-import-commit math3-1996-import-commit math3-db-1987-1996-import-commit math2-2020-import-dry-run math2-2023-import-dry-run math2-2024-import-dry-run math2-db-preview-import-dry-run math2-2020-import-commit math2-2023-import-commit math2-2024-import-commit math2-db-preview-import-commit math2-import-dry-run test-math2 test-python-all verify

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
	@echo "  make math2-2021-2022-audit    Audit Math2 2021/2022 source readiness"
	@echo "  make math2-1997-2019-validate Regenerate and validate Math2 1997-2019 aggregate staging"
	@echo "  make math2-db-1997-2019-import-dry-run"
	@echo "                                Dry-run DB imports for Math2 1997-2019"
	@echo "  make math2-db-1997-2019-import-commit"
	@echo "                                Commit DB staging imports for Math2 1997-2019"
	@echo "  make math2-2023-validate      Regenerate and validate Math2 2023 staging"
	@echo "  make math2-2024-validate      Regenerate and validate Math2 2024 staging"
	@echo "  make math3-1987-1996-validate Regenerate and validate Math3 1987-1996 staging"
	@echo "  make math2-import-dry-run     Exercise Math2 2020 MySQL import and roll it back"
	@echo "  make math2-db-preview-import-dry-run"
	@echo "                                Dry-run DB imports for Math2 2020/2023/2024"
	@echo "  make math2-db-preview-import-commit"
	@echo "                                Commit DB staging imports for Math2 2020/2023/2024"
	@echo "  make math3-db-1987-1996-import-dry-run"
	@echo "                                Dry-run DB imports for Math3 1987-1996"
	@echo "  make math3-db-1987-1996-import-commit"
	@echo "                                Commit DB staging imports for Math3 1987-1996"
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

math2-2021-2022-audit:
	$(PYTHON) scripts/audit_math2_2021_2022.py "$(MATH2_SOURCE)" "$(MATH2_2021_2022_REPORT)"
	set MATH2_SOURCE_DIR=$(MATH2_SOURCE)&& $(PYTHON) -m unittest tests.test_audit_math2_2021_2022 -v


math2-1997-2019-staging:
	$(PYTHON) scripts/transform_math2_1997_2019.py "$(MATH2_SOURCE)" "$(MATH2_1997_2019_OUTPUT)" "$(MATH2_1997_2019_REPORT)"

math2-1997-2019-katex-report: math2-1997-2019-staging
	-node scripts/validate_math2_katex.mjs "$(MATH2_1997_2019_OUTPUT)/1997/questions.json" "$(MATH2_1997_2019_OUTPUT)/1997/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH2_1997_2019_OUTPUT)/1998/questions.json" "$(MATH2_1997_2019_OUTPUT)/1998/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH2_1997_2019_OUTPUT)/1999/questions.json" "$(MATH2_1997_2019_OUTPUT)/1999/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH2_1997_2019_OUTPUT)/2000/questions.json" "$(MATH2_1997_2019_OUTPUT)/2000/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH2_1997_2019_OUTPUT)/2001/questions.json" "$(MATH2_1997_2019_OUTPUT)/2001/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH2_1997_2019_OUTPUT)/2002/questions.json" "$(MATH2_1997_2019_OUTPUT)/2002/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH2_1997_2019_OUTPUT)/2003/questions.json" "$(MATH2_1997_2019_OUTPUT)/2003/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH2_1997_2019_OUTPUT)/2004/questions.json" "$(MATH2_1997_2019_OUTPUT)/2004/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH2_1997_2019_OUTPUT)/2005/questions.json" "$(MATH2_1997_2019_OUTPUT)/2005/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH2_1997_2019_OUTPUT)/2006/questions.json" "$(MATH2_1997_2019_OUTPUT)/2006/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH2_1997_2019_OUTPUT)/2007/questions.json" "$(MATH2_1997_2019_OUTPUT)/2007/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH2_1997_2019_OUTPUT)/2008/questions.json" "$(MATH2_1997_2019_OUTPUT)/2008/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH2_1997_2019_OUTPUT)/2009/questions.json" "$(MATH2_1997_2019_OUTPUT)/2009/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH2_1997_2019_OUTPUT)/2010/questions.json" "$(MATH2_1997_2019_OUTPUT)/2010/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH2_1997_2019_OUTPUT)/2011/questions.json" "$(MATH2_1997_2019_OUTPUT)/2011/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH2_1997_2019_OUTPUT)/2012/questions.json" "$(MATH2_1997_2019_OUTPUT)/2012/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH2_1997_2019_OUTPUT)/2013/questions.json" "$(MATH2_1997_2019_OUTPUT)/2013/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH2_1997_2019_OUTPUT)/2014/questions.json" "$(MATH2_1997_2019_OUTPUT)/2014/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH2_1997_2019_OUTPUT)/2015/questions.json" "$(MATH2_1997_2019_OUTPUT)/2015/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH2_1997_2019_OUTPUT)/2016/questions.json" "$(MATH2_1997_2019_OUTPUT)/2016/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH2_1997_2019_OUTPUT)/2017/questions.json" "$(MATH2_1997_2019_OUTPUT)/2017/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH2_1997_2019_OUTPUT)/2018/questions.json" "$(MATH2_1997_2019_OUTPUT)/2018/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH2_1997_2019_OUTPUT)/2019/questions.json" "$(MATH2_1997_2019_OUTPUT)/2019/katex-validation.json"

math2-1997-2019-validate: math2-1997-2019-katex-report
	set MATH2_SOURCE_DIR=$(MATH2_SOURCE)&& $(PYTHON) -m unittest tests.test_transform_math2_1997_2019 -v

math2-db-1997-2019-import-dry-run: math2-1997-2019-validate
	@for %%Y in ($(MATH2_1997_2019_YEARS)) do $(NPM) run import:math2 --workspace @kaoyan/api -- --input "$(MATH2_1997_2019_OUTPUT)/%%Y/questions.json" || exit /b 1

math2-db-1997-2019-import-commit: math2-1997-2019-validate
	@for %%Y in ($(MATH2_1997_2019_YEARS)) do $(NPM) run import:math2 --workspace @kaoyan/api -- --input "$(MATH2_1997_2019_OUTPUT)/%%Y/questions.json" --commit || exit /b 1
math2-2023-staging:
	$(PYTHON) scripts/transform_math2_2023.py "$(MATH2_SOURCE)" "$(MATH2_2023_OUTPUT)" --review-checklist "$(MATH2_2023_REVIEW)"

math2-2023-katex: math2-2023-staging
	node scripts/validate_math2_katex.mjs "$(MATH2_2023_OUTPUT)/questions.json" "$(MATH2_2023_OUTPUT)/katex-validation.json"

math2-2023-validate: math2-2023-katex
	set MATH2_SOURCE_DIR=$(MATH2_SOURCE)&& $(PYTHON) -m unittest tests.test_transform_math2_2023 -v

math2-2024-staging:
	$(PYTHON) scripts/transform_math2_2024.py "$(MATH2_SOURCE)" "$(MATH2_2024_OUTPUT)" --review-checklist "$(MATH2_2024_REVIEW)"

math2-2024-katex: math2-2024-staging
	node scripts/validate_math2_katex.mjs "$(MATH2_2024_OUTPUT)/questions.json" "$(MATH2_2024_OUTPUT)/katex-validation.json"

math2-2024-validate: math2-2024-katex
	set MATH2_SOURCE_DIR=$(MATH2_SOURCE)&& $(PYTHON) -m unittest tests.test_transform_math2_2024 -v

math3-1987-1996-staging:
	$(PYTHON) scripts/transform_math3_1987_1996.py "$(MATH2_SOURCE)" "$(MATH3_1987_1996_OUTPUT)" "$(MATH3_1987_1996_REPORT)"

math3-1987-1996-katex-report: math3-1987-1996-staging
	-node scripts/validate_math2_katex.mjs "$(MATH3_1987_1996_OUTPUT)/1987/questions.json" "$(MATH3_1987_1996_OUTPUT)/1987/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH3_1987_1996_OUTPUT)/1988/questions.json" "$(MATH3_1987_1996_OUTPUT)/1988/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH3_1987_1996_OUTPUT)/1989/questions.json" "$(MATH3_1987_1996_OUTPUT)/1989/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH3_1987_1996_OUTPUT)/1990/questions.json" "$(MATH3_1987_1996_OUTPUT)/1990/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH3_1987_1996_OUTPUT)/1991/questions.json" "$(MATH3_1987_1996_OUTPUT)/1991/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH3_1987_1996_OUTPUT)/1992/questions.json" "$(MATH3_1987_1996_OUTPUT)/1992/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH3_1987_1996_OUTPUT)/1993/questions.json" "$(MATH3_1987_1996_OUTPUT)/1993/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH3_1987_1996_OUTPUT)/1994/questions.json" "$(MATH3_1987_1996_OUTPUT)/1994/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH3_1987_1996_OUTPUT)/1995/questions.json" "$(MATH3_1987_1996_OUTPUT)/1995/katex-validation.json"
	-node scripts/validate_math2_katex.mjs "$(MATH3_1987_1996_OUTPUT)/1996/questions.json" "$(MATH3_1987_1996_OUTPUT)/1996/katex-validation.json"

math3-1987-1996-validate: math3-1987-1996-katex-report
	set MATH2_SOURCE_DIR=$(MATH2_SOURCE)&& $(PYTHON) -m unittest tests.test_transform_math3_1987_1996 -v

math2-2020-import-dry-run: math2-validate
	$(NPM) run import:math2 --workspace @kaoyan/api -- --input "$(MATH2_2020_INPUT)"

math2-2023-import-dry-run: math2-2023-validate
	$(NPM) run import:math2 --workspace @kaoyan/api -- --input "$(MATH2_2023_INPUT)"

math2-2024-import-dry-run: math2-2024-validate
	$(NPM) run import:math2 --workspace @kaoyan/api -- --input "$(MATH2_2024_INPUT)"

math2-db-preview-import-dry-run: math2-2020-import-dry-run math2-2023-import-dry-run math2-2024-import-dry-run

math2-2020-import-commit: math2-validate
	$(NPM) run import:math2 --workspace @kaoyan/api -- --input "$(MATH2_2020_INPUT)" --commit

math2-2023-import-commit: math2-2023-validate
	$(NPM) run import:math2 --workspace @kaoyan/api -- --input "$(MATH2_2023_INPUT)" --commit

math2-2024-import-commit: math2-2024-validate
	$(NPM) run import:math2 --workspace @kaoyan/api -- --input "$(MATH2_2024_INPUT)" --commit

math2-db-preview-import-commit: math2-2020-import-commit math2-2023-import-commit math2-2024-import-commit

math3-1987-import-dry-run: math3-1987-1996-validate
	$(NPM) run import:math3 --workspace @kaoyan/api -- --input "$(MATH3_1987_1996_OUTPUT)/1987/questions.json"

math3-1988-import-dry-run: math3-1987-1996-validate
	$(NPM) run import:math3 --workspace @kaoyan/api -- --input "$(MATH3_1987_1996_OUTPUT)/1988/questions.json"

math3-1989-import-dry-run: math3-1987-1996-validate
	$(NPM) run import:math3 --workspace @kaoyan/api -- --input "$(MATH3_1987_1996_OUTPUT)/1989/questions.json"

math3-1990-import-dry-run: math3-1987-1996-validate
	$(NPM) run import:math3 --workspace @kaoyan/api -- --input "$(MATH3_1987_1996_OUTPUT)/1990/questions.json"

math3-1991-import-dry-run: math3-1987-1996-validate
	$(NPM) run import:math3 --workspace @kaoyan/api -- --input "$(MATH3_1987_1996_OUTPUT)/1991/questions.json"

math3-1992-import-dry-run: math3-1987-1996-validate
	$(NPM) run import:math3 --workspace @kaoyan/api -- --input "$(MATH3_1987_1996_OUTPUT)/1992/questions.json"

math3-1993-import-dry-run: math3-1987-1996-validate
	$(NPM) run import:math3 --workspace @kaoyan/api -- --input "$(MATH3_1987_1996_OUTPUT)/1993/questions.json"

math3-1994-import-dry-run: math3-1987-1996-validate
	$(NPM) run import:math3 --workspace @kaoyan/api -- --input "$(MATH3_1987_1996_OUTPUT)/1994/questions.json"

math3-1995-import-dry-run: math3-1987-1996-validate
	$(NPM) run import:math3 --workspace @kaoyan/api -- --input "$(MATH3_1987_1996_OUTPUT)/1995/questions.json"

math3-1996-import-dry-run: math3-1987-1996-validate
	$(NPM) run import:math3 --workspace @kaoyan/api -- --input "$(MATH3_1987_1996_OUTPUT)/1996/questions.json"

math3-db-1987-1996-import-dry-run: math3-1987-import-dry-run math3-1988-import-dry-run math3-1989-import-dry-run math3-1990-import-dry-run math3-1991-import-dry-run math3-1992-import-dry-run math3-1993-import-dry-run math3-1994-import-dry-run math3-1995-import-dry-run math3-1996-import-dry-run

math3-1987-import-commit: math3-1987-1996-validate
	$(NPM) run import:math3 --workspace @kaoyan/api -- --input "$(MATH3_1987_1996_OUTPUT)/1987/questions.json" --commit

math3-1988-import-commit: math3-1987-1996-validate
	$(NPM) run import:math3 --workspace @kaoyan/api -- --input "$(MATH3_1987_1996_OUTPUT)/1988/questions.json" --commit

math3-1989-import-commit: math3-1987-1996-validate
	$(NPM) run import:math3 --workspace @kaoyan/api -- --input "$(MATH3_1987_1996_OUTPUT)/1989/questions.json" --commit

math3-1990-import-commit: math3-1987-1996-validate
	$(NPM) run import:math3 --workspace @kaoyan/api -- --input "$(MATH3_1987_1996_OUTPUT)/1990/questions.json" --commit

math3-1991-import-commit: math3-1987-1996-validate
	$(NPM) run import:math3 --workspace @kaoyan/api -- --input "$(MATH3_1987_1996_OUTPUT)/1991/questions.json" --commit

math3-1992-import-commit: math3-1987-1996-validate
	$(NPM) run import:math3 --workspace @kaoyan/api -- --input "$(MATH3_1987_1996_OUTPUT)/1992/questions.json" --commit

math3-1993-import-commit: math3-1987-1996-validate
	$(NPM) run import:math3 --workspace @kaoyan/api -- --input "$(MATH3_1987_1996_OUTPUT)/1993/questions.json" --commit

math3-1994-import-commit: math3-1987-1996-validate
	$(NPM) run import:math3 --workspace @kaoyan/api -- --input "$(MATH3_1987_1996_OUTPUT)/1994/questions.json" --commit

math3-1995-import-commit: math3-1987-1996-validate
	$(NPM) run import:math3 --workspace @kaoyan/api -- --input "$(MATH3_1987_1996_OUTPUT)/1995/questions.json" --commit

math3-1996-import-commit: math3-1987-1996-validate
	$(NPM) run import:math3 --workspace @kaoyan/api -- --input "$(MATH3_1987_1996_OUTPUT)/1996/questions.json" --commit

math3-db-1987-1996-import-commit: math3-1987-import-commit math3-1988-import-commit math3-1989-import-commit math3-1990-import-commit math3-1991-import-commit math3-1992-import-commit math3-1993-import-commit math3-1994-import-commit math3-1995-import-commit math3-1996-import-commit

math2-import-dry-run: math2-2020-import-dry-run

test-python-all:
	$(PYTHON) -m unittest discover -s tests -p "test_*.py"

verify: math2-validate math2-2021-2022-audit math2-1997-2019-validate math2-2023-validate math2-2024-validate math3-1987-1996-validate typecheck test build
	$(PYTHON) -m compileall -q scripts tests
