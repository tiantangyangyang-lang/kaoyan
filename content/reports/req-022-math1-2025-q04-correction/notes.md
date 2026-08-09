# REQ-022 Notes

## Evidence

- User-supplied image path (outside repository): `C:\Users\60549\AppData\Local\Temp\codex-clipboard-0318a5ed-a76c-4595-82c6-db75f469e629.png`
- Image SHA-256: `C1477487B3B3F6C790BECCFA9E718B534D526B774F24F17512CF942D190F1B50`.
- Durable transcription and preservation note: `source-evidence.json` in this report directory.
- Option C intentionally retains the source-image direction from lower bound `2` to upper bound `sqrt(4-y)`.

## Findings

- Canonical and reviewed Q04 held OCR placeholders for C/D; A/B and answer A were intact.
- The ordinary Math1 importer correctly refuses to replace a published batch.
- The correction workflow therefore creates `math1-final-2025-v2`, copies the 22 approved rows, changes only Q04 `options_json` and its now-resolved anomaly, supersedes v1, and publishes v2 in one transaction.
- The v2 batch records hashes of the canonical bank and REQ-022 evidence JSON in `source_files`; v1 remains intact as the database audit history.
- Public policy is unchanged: Math1 2018–2025 remains anonymous, older Math1 plus all Math2/Math3 remain authenticated.

## Database audit

- Read-only preflight: Math1 38/852, Math2 26/522, Math3 10/178; zero published duplicate stable IDs; zero staging batches.
- API preflight: anonymous Math1 200/179 questions; anonymous Math2 and Math3 401; authenticated totals 852/522/178.
- Correction dry-run: v1 → v2, 22 questions, resulting published Math1 852; transaction rolled back.
- Before options hash: `4c941fab4a62d3e6c23367fe2de585f11304ca243e1418a5db425107ee4f2f49`.
- After options hash: `fb938591aa5320a0f362da8c98d31ba2f155d38bfb58fb5e0a2d8552b7259c74`.
