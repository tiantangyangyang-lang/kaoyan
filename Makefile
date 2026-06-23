PYTHON ?= python
NPM ?= npm
MATH2_SOURCE ?= D:/work/Kaoyan-Math2-Papers
MATH2_OUTPUT := content/staging/math2/2020
MATH2_REPORT := content/reports/req-002-math2-markdown-import
MATH2_INVENTORY := $(MATH2_REPORT)/source-inventory.json

.PHONY: math2-inventory math2-pilot math2-katex math2-validate math2-import-dry-run test-math2 test-python-all verify

math2-inventory:
	$(PYTHON) scripts/inventory_math2_markdown.py "$(MATH2_SOURCE)" "$(MATH2_INVENTORY)"

math2-pilot:
	$(PYTHON) scripts/transform_math2_2020.py "$(MATH2_SOURCE)" "$(MATH2_OUTPUT)"

math2-katex: math2-pilot
	node scripts/validate_math2_katex.mjs "$(MATH2_OUTPUT)/questions.json" "$(MATH2_OUTPUT)/katex-validation.json"

test-math2:
	set MATH2_SOURCE_DIR=$(MATH2_SOURCE)&& $(PYTHON) -m unittest tests.test_inventory_math2_markdown tests.test_transform_math2_2020 -v

math2-validate: math2-inventory math2-katex test-math2

math2-import-dry-run: math2-validate
	$(NPM) run import:math2 --workspace @kaoyan/api -- --input "$(MATH2_OUTPUT)/questions.json"

test-python-all:
	$(PYTHON) -m unittest discover -s tests -p "test_*.py"

verify: math2-validate
	$(PYTHON) -m compileall -q scripts tests
	$(NPM) run typecheck
	$(NPM) run test:api
	$(NPM) run build
