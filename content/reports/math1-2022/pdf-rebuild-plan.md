# Math1 2022 PDF Structure Inspection

- Structured source: `solutions/2022年解析/content_list_v2.json`
- Pages: 26
- Explicit question starts detected: 19/22
- Missing explicit starts: [3, 4, 5]

## Page Map

| Page | Question starts | Answer markers | Analysis markers |
|---:|---|---:|---:|
| 1 | 1, 2 | 2 | 1 |
| 2 | - | 1 | 2 |
| 3 | - | 3 | 1 |
| 4 | - | 0 | 2 |
| 5 | 6, 9 | 1 | 0 |
| 6 | 7 | 1 | 2 |
| 7 | - | 0 | 1 |
| 8 | 8 | 1 | 1 |
| 9 | 9 | 1 | 1 |
| 10 | 10 | 4 | 1 |
| 11 | - | 0 | 0 |
| 12 | 11 | 1 | 1 |
| 13 | 12, 13 | 2 | 2 |
| 14 | 14 | 1 | 1 |
| 15 | 15 | 1 | 1 |
| 16 | 16, 17 | 1 | 2 |
| 17 | 18 | 0 | 1 |
| 18 | 19 | 0 | 1 |
| 19 | 20 | 0 | 1 |
| 20 | - | 0 | 0 |
| 21 | - | 1 | 0 |
| 22 | 21 | 0 | 1 |
| 23 | - | 0 | 0 |
| 24 | 22 | 1 | 1 |
| 25 | - | 0 | 0 |
| 26 | - | 1 | 0 |

## Rebuild Decision

- Do not patch the OCR-heavy 2022 paper transcription in place.
- Rebuild a separate candidate set from this clean PDF structured extraction.
- Use explicit starts for Q1-Q2 and Q6-Q22.
- Recover Q3-Q5 from the answer-delimited blocks on pages 2-5 and verify them visually.
- Keep all rebuilt questions at `needs_human_review` and retain the old staging artifact.

