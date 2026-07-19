# Notes: Login-required content approval and promotion

## Confirmed repository state

- Branch: `codex/complete-db-content` tracking `origin/codex/complete-db-content`.
- PR 20 is open against `main`; its current contract says published content APIs are public and no content has been promoted.
- Existing untracked reports under `content/reports/review-queue/` and REQ-011 are user-owned and must remain untouched.
- Before REQ-018, content routes omitted `requireUser` and set public cache headers.
- Current promotion code rejects any question whose `review_status` is not `approved` or whose `finalization_status` is `blocked`.
- No existing controlled approval command was found in the initial search.

## Authorized target

- Math1: 38 batches, 852 questions.
- Math2: 26 batches, 522 questions.
- Math3: 10 batches, 178 questions.
- Total: 74 batches, 1552 questions.

## Known risks to preserve

- Authorization explicitly includes existing `needs_human_review` and blocked records.
- Math2 2021 is wrong-subject source material and was not imported.
- Math2 2022 was not imported; source Q10 has an option/analysis conflict.
- Approval must not imply that missing or uncertain content was repaired.

## Source repository baseline

- Commit before and after: `fd42c56eed412cce0cb97d6bd688f314c78e542e`.
- Dirty state: present before this task (read-only repository; exact status preserved in command evidence).

## Final live state after maintainer-requested rollback

- Approval remains committed for exactly 74 authorized batch IDs and 1552 questions.
- The earlier promotion was transactionally rolled back by changing only the 74 target batch lifecycle rows from `published` to `staging` and clearing `published_at`.
- Staging counts: Math1 38/852, Math2 26/522, Math3 10/178.
- Published target batches/questions: 0/0.
- Approved questions: 1552; `approved_with_known_risks`: 1552.
- Duplicate stable IDs in the authorized scope: 0.
- Anonymous list requests: 401 for all three subjects.
- Valid-session list requests: 200 with 0 published questions for all three subjects.
