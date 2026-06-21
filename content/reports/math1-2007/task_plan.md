# Task Plan: Math1 2007 Semantic Review

## Goal
Execute DeepSeek/Claude semantic review of math1-2007 staging content, producing reviewed questions, anomalies, human review checklist, and conflict report.

## Phases
- [x] Phase 1: Read all source and staging documents
- [ ] Phase 2: Analyze and identify all issues (type mismatches, OCR, option extraction, missing answers)
- [ ] Phase 3: Generate questions-reviewed.json with full candidate preservation
- [ ] Phase 4: Generate anomalies-reviewed.json
- [ ] Phase 5: Generate human-review-checklist.md
- [ ] Phase 6: Generate conflicts-and-uncertainties.md
- [ ] Phase 7: Create agent-result.json and agent-report.md
- [ ] Phase 8: Verify JSON validity and file completeness

## Key Issues Found
1. **Q9-Q10 misclassified as fill_in_blank** - should be multiple_choice per source paper
2. **Q15-Q16 misclassified as solution** - should be fill_in_blank per source paper
3. **Q03 incomplete_options** - only B label extracted, A/C/D text mixed in B
4. **Q09-Q10 options array empty** - options shown inline in stem text only
5. **Q10, Q16 stem contamination** - section header text leaked into stems
6. **Q17-Q24 missing answerCandidate** (null)
7. **sourceDirty: true** on all questions
8. **Expected counts mismatch**: staging has 8/6/10 but source paper has 10/6/8

## Status
Currently in Phase 2 - Analysis complete, generating outputs
