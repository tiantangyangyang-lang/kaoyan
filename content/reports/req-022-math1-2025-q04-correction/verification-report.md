# REQ-022 Verification Report

## Changed files

- Canonical/review content: Q04 C/D and resolved anomaly metadata only.
- Evidence/report: REQ-022 requirement, plan, notes, source evidence, and this report.
- API workflow: guarded Q04 correction, verification command, tests, package scripts, Make targets, and the authorized 2025 batch version pointer.

## Untouched files

- Root checkout user file `.claude/` was not touched.
- Math1 Q04's mathematical question text, A/B, answer A, explanation, and animation were not changed; only the duplicated option/answer suffix was removed from the stem.
- The other 851 Math1 questions and all Math2/Math3 content were not changed.
- The two unrelated generated Math2 files created by the failed full gate were restored.

## Commands and results

- `node --import tsx --test ...`: 4 focused Q04 correction/import tests passed, including old stem and old option rejection guards.
- `mingw32-make NPM=npm.cmd typecheck test build`: passed; 27 API tests, Web smoke/content-access tests, API/Web type checks, and production builds all passed.
- Public content sync: 179 Math1 questions for 2018–2025; Math2/Math3 legacy files remain denial payloads.
- Semantic comparison against `origin/main`: 852 canonical questions, 851 unrelated questions unchanged, answer A unchanged, zero duplicate stable IDs; Q04 stem is structurally cleaned without changing the mathematical question text.
- Q04 option C/D KaTeX rendering: passed.
- `git diff --check`: passed.
- `mingw32-make NPM=npm.cmd verify`: stopped at the unrelated Math2 inventory fixture (`792 != 775`) before the remaining gates; the equivalent task-relevant type/test/build gates were run separately and passed.

## Database result

- Preflight read-only verification passed for 1552 published questions and access policy.
- Production correction dry-run passed and rolled back: 22-row v2 batch, Math1 total 852, old/new options and stem hashes matched the audit evidence.
- Production correction committed through the guarded transaction: `math1-final-2025-v1` is `superseded`, `math1-final-2025-v2` is `published`, and the published Math1 total remains 38 batches / 852 unique questions.
- Q04 now has four structured options, zero active anomalies, `reviewStatus: approved`, and `finalizationStatus: approved_with_known_risks`.
- Post-commit access verification passed: anonymous Math1 returns 179 public 2018–2025 questions; authenticated Math1 returns 852; anonymous Math2/Math3 return 401 while authenticated reads return 522/178.
- All 1552 promoted questions remain approved with known-risk audit records; duplicate stable IDs and staging batches are both zero.

## Known limits

- The original image is a conversation attachment outside the repository. Its SHA-256 and exact transcription are preserved in `source-evidence.json`; the binary is not duplicated.
- Full `make verify` remains blocked by external Math2 source fixture drift unrelated to REQ-022.
