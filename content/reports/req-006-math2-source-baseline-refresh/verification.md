# REQ-006 Verification

## Commands

```powershell
node -e "JSON.parse(require('fs').readFileSync('content/queues/math2-markdown-import-template.json','utf8')); JSON.parse(require('fs').readFileSync('content/reports/req-006-math2-source-baseline-refresh/source-inventory.json','utf8')); console.log('json ok')"
```

Result: passed. Both JSON files parsed successfully.

```powershell
git -C D:\work\Kaoyan-Math2-Papers status --short --branch
```

Result: passed. Output remained `## main...origin/main`; no source repo changes were reported.

```powershell
mingw32-make NPM=npm.cmd verify
```

Result: failed at `math2-pilot`.

Observed failure:

```text
python scripts/inventory_math2_markdown.py "D:/work/Kaoyan-Math2-Papers" "content/reports/req-002-math2-markdown-import/source-inventory.json"
Math2 inventory: 770 files, 6 Markdown sources
python scripts/transform_math2_2020.py "D:/work/Kaoyan-Math2-Papers" "content/staging/math2/2020"
FileNotFoundError: audited Math2 2020 Markdown inputs are missing
mingw32-make: *** [Makefile:64: math2-pilot] Error 1
```

Interpretation: this failure confirms the REQ-006 source-state finding. The full verify target still depends on the missing REQ-002 2020 MinerU primary Markdown input. REQ-006 documents this as a source-baseline and queue-blocking condition rather than editing the Makefile or regenerating the Math2 pilot.

## Partial-Run Cleanup

The failed verify run rewrote `content/reports/req-002-math2-markdown-import/source-inventory.json` before failing. That generated change was restored so REQ-002 remains a historical frozen baseline and REQ-006 carries the current source-state evidence.
