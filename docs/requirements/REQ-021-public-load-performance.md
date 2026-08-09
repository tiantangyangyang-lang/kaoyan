# REQ-021: Public Math1 load performance

## Problem and user value

The public Math1 experience waits for the login-state request before it starts loading
public subject metadata and public Math1 content. On a sleeping API instance this turns an
otherwise static public page into a slow serial request waterfall. Hashed frontend assets
also revalidate on every visit instead of using immutable browser caching.

The change should make public Math1 content appear independently of authentication latency
and make repeat visits reuse versioned assets safely.

## In scope

- Start the public subject metadata and Math1 data requests without waiting for the
  authentication request to finish.
- Preserve the existing authenticated transition to the full API-backed question bank.
- Prevent a late anonymous/authenticated response from overwriting newer application state.
- Configure long-lived immutable caching only for content-hashed frontend assets.
- Add targeted automated coverage for anonymous loading order and authenticated behavior.

## Out of scope

- Changing which Math1 years are public.
- Making Math2 or Math3 anonymous.
- Changing question, answer, option, explanation, animation, or database content.
- Changing the Render plan, adding a keep-warm service, or changing deployment providers.
- Adding long-lived caching to mutable HTML or JSON data files.

## Acceptance criteria

1. An anonymous visit starts public subject and Math1 data loading before `/api/auth/me`
   resolves.
2. Public Math1 renders when authentication is slow or returns `401`.
3. A logged-in user still receives the full API-backed bank after authentication resolves.
4. The 179-question public bank remains usable while the authenticated bank loads in the
   background; the upgrade does not return to a full-screen loading state.
5. A stale startup authentication response cannot overwrite a newer manual login/logout.
6. Existing public-year and login-only access rules remain unchanged.
7. Hashed `/assets/*` files are served with `Cache-Control: public, max-age=31536000,
   immutable`; HTML and mutable `/data/*.json` are not given immutable caching.
8. Tests cover slow authentication, anonymous fallback, authenticated replacement, manual
   login races, background bank replacement, and relevant cache configuration.

## Constraints

- **Data:** no canonical, staged, promoted, or database content changes.
- **Authentication:** public bootstrapping must not expose login-only subjects or payloads.
- **Performance:** remove the authentication gate from public static data; avoid duplicate
  or stale state writes.
- **Compatibility:** preserve the current React/Vite build and Render deployment model.
- **Security:** do not cache authenticated API responses as public assets.

## Verification commands

```powershell
mingw32-make NPM=npm.cmd test
mingw32-make NPM=npm.cmd typecheck
mingw32-make NPM=npm.cmd build
mingw32-make NPM=npm.cmd verify
git diff --check
```

Rendered QA must cover the anonymous public Math1 entry flow and confirm no relevant
console errors.
