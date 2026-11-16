<!--
Agent note: fill this in from your own diff. Delete sections that do not apply,
and delete every comment block (like this one) before opening the PR.
Repo rules live in CLAUDE.md, GEMINI.md, .jules/bolt.md and
.claude/skills/moi-review/SKILL.md — read those, not just this file.
-->

## What & why

<!-- One or two sentences: the behaviour change and the reason for it. Link the issue if there is one. -->

## Changes

<!-- Bullet per file or per logical change. Keep it to what a reviewer needs to follow the diff. -->

-

## How this was verified

<!-- Say what you actually ran and what you actually clicked. "Should work" is not verification. -->

- [ ] `npm run lint` passes (this is what CI runs)
- [ ] `npm test` passes
- [ ] Loaded `index.html` in a browser and exercised the changed flow
- [ ] Checked both EN and NL
- [ ] Checked light and dark theme / mobile width (only if UI changed)

Manual steps:

1.

## Repo-specific checks

<!-- Tick what applies; delete the rest. Each line maps to a rule that has broken this repo before. -->

**Scope discipline** (see [PR #50 post-mortem](docs/postmortems/pr-50-account-deletion.md))
- [ ] The diff is proportional to the behaviour delivered — no `localStorage` mutexes, storage-adapter
      wrappers, tombstones, or cross-tab consensus protocols
- [ ] In-flight races after an auth change are handled with the existing `authGeneration` counter +
      `stale()` check, not a new mechanism

**Globals & load order**
- [ ] Any new cross-file global is declared in `eslint.config.js` (`readonly` for functions/constants,
      `writable` for mutable state)
- [ ] No `import` / `export` / top-level `await` (scripts are `sourceType: "script"`)
- [ ] No top-level call into a global defined by a later-loaded file
- [ ] The header comment at the top of each touched `js/*.js` still lists the right exports/deps

**Auth & Supabase** (only if auth or sync changed)
- [ ] Reacts via `onAuthStateChange`; no direct reads/writes of `sb-*` keys, tokens, or refresh timers
- [ ] Every `await` in a flow that can outlive an auth change is followed by a staleness check
- [ ] No token, session, or user object logged; magic-link tokens still cleared from the URL
- [ ] New tables/columns come with RLS policies and a README SQL update

**XSS**
- [ ] Nothing user-controlled (memory notes, `user_progress` values, emails, URL/hash values) is
      interpolated into `innerHTML` — those go through `textContent`
- [ ] New external links keep `target="_blank" rel="noopener noreferrer"`

**Content (EN/NL)** (only if strings or bucket-list items changed)
- [ ] Every new user-visible string has `en` + `nl` in `UI_TRANSLATIONS` and renders via
      `UI_TRANSLATIONS[currentLang]`
- [ ] New `BUCKET_LIST` items have a unique `id`, `coords`, `category`, and bilingual `title`/`tip`
      (plus `urlLabel` if there is a `url`)
- [ ] No existing item `id` was renamed (that orphans saved progress), or a migration is included
- [ ] `CATEGORY_BADGES` / `MILESTONES` thresholds still make sense after a count change

**Config & secrets**
- [ ] No real keys in the diff; new config values added to `config.template.js` and documented in the README
- [ ] No `service_role` key anywhere in client code

**Accessibility & rendering**
- [ ] Modals/toggles keep `inert`, `aria-expanded`, `aria-hidden` in sync; decorative SVGs are `aria-hidden="true"`
- [ ] No event listeners attached inside per-item render loops — delegate from the container

## Risk & follow-ups

<!-- What could break, what you deliberately left out, anything a reviewer should push back on. Write "none" if none. -->
