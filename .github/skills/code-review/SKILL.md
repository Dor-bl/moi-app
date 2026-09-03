---
name: code-review
description: Review a MoiCheck change (working diff, branch, or PR) against this repo's conventions — vanilla-JS globals and script load order, Supabase auth ownership rules, XSS-safe DOM rendering, EN/NL i18n completeness, and the PR #50 anti-over-engineering rules. Use when asked to review a diff or PR, to check a change before opening or merging a PR, or when responding to Copilot/bot review comments on this repo.
---

# MoiCheck Code Review

## What this codebase is

A no-build static web app: `index.html` loads classic (non-module) scripts in a **fixed order** —
`config.js` → `js/data.js` → `js/theme.js` → `js/auth.js` → `js/utils.js` → `app.js` — and they
share state through **global variables**, not imports. Supabase (auth + `user_progress` table) is
loaded from a CDN. There is no bundler, no framework, and **no test suite**. CI runs one thing:
`npm run lint` (ESLint).

Review accordingly: correctness has to be argued from reading the code, and "add a build step" or
"add tests for this" are not useful review findings here.

## How to run the review

```bash
git fetch origin main && git diff origin/main...HEAD
```

Then, always:

```bash
npm run lint
```

For a PR target, use `gh pr diff <number>` and read the PR description for intent. Read the full
body of every function the diff touches, not just the changed lines — this codebase leans on
globals, so a change's blast radius is usually wider than its diff.

## Review checklist

### 1. Scope and complexity discipline (highest priority)

Read [`CLAUDE.md`](../../../CLAUDE.md) and [`docs/postmortems/pr-50-account-deletion.md`](../../../docs/postmortems/pr-50-account-deletion.md)
before reviewing anything auth- or state-related. Flag as **blocking**:

- A distributed mutex, Web Locks emulator, tombstone record, two-phase commit, or cross-tab
  consensus protocol built on `localStorage` or `BroadcastChannel`.
- A wrapper around the Supabase storage adapter that intercepts or swallows `setItem` /
  `removeItem`.
- A feature whose diff is several times larger than the behaviour it delivers (the PR #50 rule:
  ~70 lines of feature arriving as 500+ lines is an architecture signal, not a patch signal).

The sanctioned pattern for "don't let an in-flight response clobber state after sign-out or
deletion" is the generation counter already in [`js/auth.js`](../../../js/auth.js) — `authGeneration++`
on every auth transition, capture it, and `stale()`-check after each `await`. If a diff solves that
problem some other way, ask why the counter was not enough.

Conversely: if the change under review exists only to satisfy a speculative multi-tab race raised by
a review bot, say so plainly and recommend reverting to the simple version rather than adding
guards.

### 2. Globals and script load order

- Any new cross-file global (function or `let`) must be added to the `globals` block in
  [`eslint.config.js`](../../../eslint.config.js) — `readonly` for functions and constants,
  `writable` for mutable state — or CI fails on `no-undef`.
- The scripts are `sourceType: "script"`. `import` / `export` / top-level `await` will not work.
- A global defined in a later file cannot be *called* at load time by an earlier one. Calls made
  from event handlers or `init*()` are fine; calls at module top level are not.
- Each `js/*.js` file starts with a header comment listing its exports and dependencies. Keep it
  accurate when the diff adds or removes one.

### 3. Supabase and auth

- Session lifecycle belongs to the SDK. React through `onAuthStateChange`; never poke at
  `sb-*` storage keys, tokens, or refresh timers directly.
- Every `await` on a Supabase call inside a flow that can outlive an auth change needs a staleness
  check after it (see `syncCloudProgress`).
- Client-side checks are UX, not security. Anything that must actually be enforced belongs in RLS
  policies or the `delete_user` RPC — if a diff adds a new table or column, the README's SQL and
  policy section must be updated too.
- Access tokens must not linger in the address bar; `clearMagicLinkFromUrl()` /
  `history.replaceState` exists for that reason. Flag any code that logs a token, session object,
  or full magic-link URL.
- Never `console.log` the session or user object wholesale in new code (existing debug lines aside).

### 4. DOM rendering and XSS

`innerHTML` is used with template literals in [`app.js`](../../../app.js), and that is acceptable
**only** for static strings from `BUCKET_LIST` / `UI_TRANSLATIONS`. Flag as blocking when a diff
interpolates into `innerHTML` any of:

- a user-entered memory `note`, or anything read back from `user_progress`;
- `currentUser.email` or other profile data;
- URL/query/hash values.

Those must go through `textContent` (or `createElement` + `textContent`, as `openProfileModal` does
for notes). For `href` interpolation, keep `target="_blank" rel="noopener noreferrer"` and check the
value is a repo-authored `item.url`, not user input.

### 5. Bilingual content (EN/NL)

- Every new user-visible string needs both `en` and `nl` in `UI_TRANSLATIONS`
  ([`js/data.js`](../../../js/data.js)) and must be rendered via `UI_TRANSLATIONS[currentLang]` —
  no hardcoded English in `app.js`.
- New `BUCKET_LIST` items need a unique string `id`, `coords`, and `category` / `title` / `tip` in
  both languages; `url` requires a matching bilingual `urlLabel`.
- Changing an existing item's `id` orphans users' saved progress in `localStorage` and
  `user_progress`. Treat as blocking unless the diff includes a migration.
- Adding an item changes category totals — check `CATEGORY_BADGES` and `MILESTONES` thresholds still
  make sense.

### 6. Secrets and config

- `config.js` is gitignored; real keys must never appear in the diff. Any new config value must also
  be added to [`config.template.js`](../../../config.template.js) and documented in the README.
- The Supabase **anon** key in client code is expected and fine. A `service_role` key anywhere in
  the browser bundle is blocking.

### 7. Rendering cost and listeners

Per [`.jules/bolt.md`](../../../.jules/bolt.md): do not attach event listeners inside per-item render
loops — delegate from the container. But do not flag a linear scan over the ~31-item `BUCKET_LIST`
as a performance problem; at this size it is a readability question at most.

### 8. Accessibility

Modals use `inert` and `aria-expanded`/`aria-hidden`; keep those in sync when a diff adds a
dialog, a toggle, or a new interactive control. Decorative SVGs get `aria-hidden="true"`.

### 9. Docs

The README's Supabase setup section is load-bearing. If a diff changes the auth flow, check whether
steps 5 (Redirect URLs) and 7 (email templates) still hold — in particular that the templates use
`{{ .RedirectTo }}/?token_hash={{ .TokenHash }}&amp;type=email` and that `ConfirmationURL` appears
**nowhere** in them, including as visible link text.

## Reporting findings

- Order by severity: **blocking** (correctness, security, data loss, CI failure) → **should fix** →
  **nit**. Label each one.
- Cite `file.js:line` and state the concrete failure: inputs or sequence of events → wrong result.
  If you cannot describe how it breaks, it is a nit or it is not a finding.
- Keep it short. A clean change deserves "looks good, here's what I checked", not manufactured
  findings.
- If a bot comment prompted the review, evaluate it on its merits and say so when it is wrong —
  an unrealistic edge case that costs hundreds of lines to satisfy should be declined with the
  trade-off explained, not patched.

## Do not flag

- Missing tests or test framework — the repo has none by design.
- Absence of a bundler, TypeScript, or a framework.
- `innerHTML` with static repo-authored strings.
- `var`-free global function declarations, or the shared-globals architecture itself.
- Linear scans over the small static arrays.
