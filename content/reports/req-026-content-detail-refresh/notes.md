# Notes: Content detail refresh

## Confirmed production symptom

- The same Math1 2023 question first appeared in the 179-item public bank with
  stale detail, then in the 852-item authenticated bank with unloaded detail
  placeholders.
- Navigating away and back fetched the detail and displayed the active database
  override, proving the persisted content and detail API were correct.

## Code findings

- `App.tsx` replaces the current bank after authentication but does not request
  the selected list item's detail.
- Authenticated list items intentionally use `detailLoaded: false` and
  `answerStatus` / `explanationStatus: "not_loaded"`.
- `QuestionWorkspace.tsx` currently renders those unloaded states as if content
  were absent.
- `useAdminContentEditor.ts` refreshes only its local admin snapshot after a
  commit; `AdminContentView` has no callback to invalidate the active bank.
- A single App-level detail refresh function can serve both transitions. Per-ID
  request generations will prevent an older response from overwriting a later
  admin-triggered refresh.

## Regression coverage design

- Hold authentication and detail responses independently, open a public Math1
  question, then release the authenticated list. Assert loading labels before
  releasing the detail and revised detail afterward.
- Open an authenticated question, commit an admin override, return to practice,
  and assert the refreshed explanation without navigating away and back.

## Implementation

- `App.tsx` now owns a reusable single-question refresh function. A per-question
  generation counter discards stale responses when a newer refresh starts.
- The refresh also captures the authenticated user ID and discards a response
  after logout or account replacement, so authenticated detail cannot merge into
  a later public bank.
- A React effect reloads the selected authenticated list item whenever its
  `detailLoaded` flag is false. It follows the question actually rendered in the
  practice view, including the first-question fallback when `selectedId` is null.
- The admin editor treats the database commit as the irreversible success
  boundary. Management-snapshot and practice-detail refresh failures are caught
  separately and reported as partial success without suggesting another save.
- A failed current-generation practice refresh marks the cached detail as
  unloaded. Reopening the question therefore performs a real retry; stale,
  logged-out, and prior-account responses cannot invalidate the current bank.
- Practice and paper solution panels distinguish `not_loaded` from `missing`.

## Targeted verification

- Web typecheck passed.
- Web content-access and browser smoke tests passed. New result flags include
  `authenticatedSelectionDetailRefreshed`, `newestDetailResponseWon`,
  `detailResponseDiscardedAfterLogout`,
  `detailResponseDiscardedAfterAccountSwitch`,
  `unloadedDetailUsesLoadingLabels`, `missingDetailUsesMissingLabels`,
  `adminCommitRefreshedActiveQuestion`, `adminCommitPartialSuccessReported`,
  and `failedAdminDetailRefreshRetriedOnOpen`.
- Full `make verify` is externally blocked by Math2 source inventory drift
  (expected 775 files, observed 792), before reaching the code verification
  targets.
