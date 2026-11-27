---
name: moi-review
description: "Review a MoiCheck change (working diff, branch, or PR) against this repo's conventions — vanilla-JS globals and script load order, Supabase auth ownership rules, XSS-safe DOM rendering, EN/NL i18n completeness, and the PR #50 anti-over-engineering rules. Use when asked to review a diff or PR, to check a change before opening or merging a PR, or when responding to Copilot/bot review comments on this repo."
---

# MoiCheck Code Review

## What this codebase is

A no-build static web app: `index.html` loads classic (non-module) scripts in a **fixed order** —
`js/analytics.js` → `config.js` → `js/error-reporter.js` → `js/data.js` → `js/events.js` →
`js/theme.js` → `js/auth.js` → `js/utils.js` → `js/checkin.js` → `app.js` (the `<script>`
tags at the bottom of `index.html` are the source of truth; check them when a diff adds a
script) — and they share state through **global variables**, not imports. Supabase (auth +
`user_progress` table) is a vendored script in `assets/vendor/`. There is no bundler and no
framework. CI runs `npm run lint` (ESLint) and `npm test` (Node's built-in test runner plus
Playwright visual checks in `tests/`).

Review accordingly: most correctness still has to be argued from reading the code, and "add a build
step" is not a useful review finding here.

## How to run the review

```bash
git fetch origin main
git diff origin/main...HEAD                    # branch: committed work only
git diff $(git merge-base origin/main HEAD)    # working tree: commits + staged + unstaged
git ls-files --others --exclude-standard       # working tree: untracked files to read in full
```

Then, always (the first two lines bootstrap a fresh checkout the same way CI does — `npm test`
launches Playwright's Chromium, which `npm ci` alone does not install):

```bash
npm ci
npx playwright install --with-deps chromium
npm run lint
npm test
```

For a PR target, use `gh pr diff <number>`, and read the PR description for intent and its
conversation with `gh pr view <number> --comments` (see "Reporting findings"). Read the full
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
- A call can stop part-way, and the next call starts from what it left. For every write to
  stored state (`SYNCED_USER_KEY`, `moiCheckState`) made before an `await` or an early `return`,
  trace what the *next* call sees when this one errors, throws or goes stale right after the
  write. A rule like "guest entries are handled by the guest path" has to hold on that next call
  too, not only on a run that succeeds. (PR #277: the marker was written before the cloud read,
  so after a failed read the retry treated guest entries as the account's own edits.)
- The other direction matters too: a value read *before* an `await` and used *after* it. Trace
  what the user (a tick, a note edit) or another tab can change while the `await` is pending, and
  what the stale value then decides. (PR #277: `ownPendingEdits` was read from the marker before
  the first sign-in's cloud read, so a note edited during that read was still treated as guest
  progress and lost to the cloud row when its upload failed.)
- Client-side checks are UX, not security. Anything that must actually be enforced belongs in RLS
  policies or the `delete_user` RPC — if a diff adds a new table or column, the SQL in docs/setup/supabase.md and
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

Those must go through `textContent` (or `createElement` + `textContent`, as `renderMemoryList` does
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
  be added to [`config.template.js`](../../../config.template.js) and documented in docs/setup/supabase.md.
- The Supabase **anon** key in client code is expected and fine. A `service_role` key anywhere in
  the browser bundle is blocking.

### 7. Rendering cost and listeners

Per [`.jules/bolt.md`](../../../.jules/bolt.md): do not attach event listeners inside per-item render
loops — delegate from the container. But do not flag a linear scan over the static `BUCKET_LIST`
(tens of items) as a performance problem; at this size it is a readability question at most.

### 8. Accessibility

Modals use `inert` and `aria-expanded`/`aria-hidden`; keep those in sync when a diff adds a
dialog, a toggle, or a new interactive control. Decorative SVGs get `aria-hidden="true"`.

### 9. Docs

[`docs/setup/supabase.md`](../../../docs/setup/supabase.md) is load-bearing. If a diff changes the auth flow, check whether
steps 5 (Redirect URLs) and 7 (email templates) still hold — in particular that the templates use
`{{ .RedirectTo }}/?token_hash={{ .TokenHash }}&amp;type=email` and that `ConfirmationURL` appears
**nowhere** in them, including as visible link text.

## Reporting findings

- Order by severity: **blocking** (correctness, security, data loss, CI failure) → **should fix** →
  **nit**. Label each one.
- A path that can erase a user's ticks or notes is never a nit. Verified, it is blocking;
  suspected, it is at least should fix. CLAUDE.md's "push back on micro-edge-cases" is about
  cross-tab races that need new machinery to fix, not about data loss on an ordinary sequence
  such as a failed network request.
- A cross-tab path that loses data and can be fixed with what the code already has (a snapshot
  it has already read, an existing flag) is not that kind of race: report it as at least should
  fix. If `main` already loses data in the same sequence, label it **pre-existing** instead of
  leaving it out, so the owner can decide. (PR #277: a stale tab's sync overwrote another tab's
  pending note edit, and the `stored` snapshot it needed was already read.)
- Cite `file.js:line` and state the concrete failure: inputs or sequence of events → wrong result.
  If you cannot describe how it breaks, it is a nit or it is not a finding.
- Mark each finding **verified** (you reproduced it, or traced the code path to the failure) or
  **suspected** (it looks wrong, but you did not prove it). Do not mark a finding verified to make
  it sound stronger.
- End with a **Not checked** line naming what the review did not verify (for example, "did not
  load it in a browser" or "NL strings not read"), or "nothing" if that is true. This line is how
  much a GO can be trusted, so do not leave it out to make a review look cleaner.
- On a PR, a point may already have been answered in its conversation with evidence: a quoted
  source, a commit, a test. Don't raise it again as a new suspected finding. Say it was answered,
  link the comment, and say whether the evidence holds up from what you can see. Those answers
  are usually written by the agent that opened the PR, so weigh them as claims, not proof. On
  PR #262 both reviews flagged the Bourtange closing time as unchecked after a status comment
  had quoted the organiser's page for it.
- Keep it short. A clean change deserves "looks good, here's what I checked", not manufactured
  findings. Give each finding a one-line headline (label, `file.js:line`, what breaks) and at most
  three bullets under it; give each area you checked one line. In a PR comment, put the nits and
  the checked list in collapsed `<details>` blocks so the findings that need action come first.
- If a bot comment prompted the review, evaluate it on its merits and say so when it is wrong —
  an unrealistic edge case that costs hundreds of lines to satisfy should be declined with the
  trade-off explained, not patched.

## Do not flag

- Missing tests for pure UI/content changes (new events, copy, styling). Do ask for a test when a
  diff changes logic that `tests/` already covers (auth sync, check-ins, events, contrast).
- Absence of a bundler, TypeScript, or a framework.
- `innerHTML` with static repo-authored strings.
- `var`-free global function declarations, or the shared-globals architecture itself.
- Linear scans over the small static arrays.

## Keeping this checklist current

This file is the reviewer's only memory, and it is edited by hand. When a bug reaches `main` that
a review should have caught, add one line to the checklist above in the same PR as the fix, naming
the concrete failure it guards against. Do not add rules for edge cases nobody has hit: a list
that only grows gets stricter every round, which is how PR #50 happened.

Misses caught before `main` count too. When a PR merges, [`moi-review-learn.yml`](../../../.github/workflows/moi-review-learn.yml)
looks for commits this review passed that Copilot then reviewed with an open high-severity issue.
For each such PR it judges whether Copilot was right and, only for a real gap in this list,
proposes one small edit as an issue with a link to open the PR. Merging that PR is how this file
learns; closing the issue declines it.
