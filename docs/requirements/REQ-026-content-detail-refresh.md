# REQ-026: Refresh Edited Question Details

## Problem and user value

After an administrator saves a question override, the practice workspace can keep
showing the old public detail or replace the current detail with an authenticated
list placeholder. Users then see stale content or "暂无解析" even though the
database update succeeded. The current question must converge to the latest
detail without requiring manual navigation.

## In scope

- Refresh the current question detail after an administrator successfully saves
  an override.
- When authentication replaces the public Math1 bank with the authenticated full
  bank, automatically load the currently selected question detail if the list
  record is not detail-complete.
- Render a loading message for `not_loaded` answer/explanation fields instead of
  presenting them as missing content.
- Add focused regression tests for all three behaviors.

## Out of scope

- Changes to question, answer, explanation, animation, or source content.
- Database schema or production data changes.
- Authentication policy changes or anonymous access expansion.
- Changes to the public Math1 year boundary.

## Acceptance criteria

1. A successful admin save updates the matching question in the active practice
   bank with a freshly fetched detail payload.
2. A delayed authenticated bank replacement reloads the selected question detail
   when its list item has `detailLoaded: false`.
3. `answerStatus: "not_loaded"` and `explanationStatus: "not_loaded"` display
   explicit loading text, while genuine `missing` states retain missing-content
   messaging.
4. Existing public/authenticated visibility rules remain unchanged.
5. Targeted web tests, web typecheck, the repository verification command, and
   `git diff --check` pass.

## Constraints

- **Data:** do not mutate the database or content payloads; only refresh client
  state from existing APIs.
- **Authentication:** do not weaken `requireUser` or public Math1 restrictions.
- **Performance:** fetch at most one current detail for each relevant bank or
  admin-save transition; avoid refresh loops and duplicate stale writes.
- **Compatibility:** preserve current React/Vite APIs and existing navigation,
  answer reveal, and animation behavior.

## Verification commands

```powershell
npm.cmd run test:smoke:ci --workspace @kaoyan/web
npm.cmd run typecheck --workspace @kaoyan/web
mingw32-make NPM=npm.cmd verify
git diff --check
```
