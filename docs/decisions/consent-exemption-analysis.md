# Why MoiCheck shows no cookie banner

**Status:** resolved — no consent notice; reasoning recorded instead
**Date:** 18 September 2026
**Issue:** [#31](https://github.com/Dor-bl/moi-app/issues/31) (related: [#87](https://github.com/Dor-bl/moi-app/issues/87) Art. 30 record, [#94](https://github.com/Dor-bl/moi-app/issues/94) tracking review)

## Why this exists

#31 originally asked for a consent banner. The review in #94 concluded one is probably not
required, which is a fine conclusion but a bad thing to leave only in a closed issue: the
difference between a reasoned decision and an oversight is whether the reasoning was
written down. If the Autoriteit Persoonsgegevens ever asks why there is no notice, this is
the answer.

`privacy.html` section 5 is the visitor-facing version of the same conclusion, in plain
language (#137). This document is the internal record: the enumeration method, the
citations, the things deliberately not built, and the conditions that would invalidate it.

## The rule

Article 5(3) ePrivacy — article 11.7a Telecommunicatiewet in the Netherlands — requires
consent to store information on, or read information from, a user's terminal equipment,
**unless** it is strictly necessary to provide the service the user explicitly requested.

Two things follow that are easy to get wrong:

- The rule is about **device storage**, not about personal data. It covers a theme
  preference (not personal data) and not a server-side IP log (personal data, but nothing
  stored on the device).
- It covers **reading** as well as writing. A key the app only reads and deletes is still
  in scope.

Anything that is not device storage — an outbound request carrying an IP, for instance —
is an Article 6 GDPR legal-basis question, which a consent banner does not address. Those
are handled in `privacy.html` sections 1 and 2, not here.

## What the app actually stores

Enumerated from source rather than from memory, by grepping shipping code for
`localStorage`, `sessionStorage`, `indexedDB` and `document.cookie` (excluding tests and
`assets/vendor/`):

| Key | Written at | Purpose | Exemption |
| --- | --- | --- | --- |
| `moiCheckState` | `js/utils.js:41` | Completed items and memory notes | **Is the service.** The app's entire function is remembering which items you ticked. |
| `moiCheckLang` | `app.js:286` | Language choice | User's own explicit choice |
| `moiCheckTheme` | `js/theme.js:43` | Theme choice | User's own explicit choice |
| `theme` | read and removed at `js/theme.js:29-32` | Legacy name for the theme choice, migrated to `moiCheckTheme` on first visit | User's own explicit choice; in scope because reading counts, exempt for the same reason |
| `moiCheckCompletedCollapsed` | `app.js:659` | Whether the completed section is collapsed | User's own explicit choice |
| Supabase session token | vendored client, `assets/vendor/supabase-js-*.js` | Keeps a signed-in user signed in | **Strictly necessary** for a service the user explicitly requested by signing in |
| `moiCheckSyncedUser` | `js/auth.js:263` | Account ID the saved progress belongs to | Written only after sign-in; prevents progress uploading under the wrong account |

No non-exempt storage remains, so there is nothing to ask consent for.

### Vercel Web Analytics

Not in the table, because Article 5(3) is never triggered: it sets no cookies and writes
nothing to device storage. Our own loader (`js/analytics.js`) touches no storage either —
it injects `/_vercel/insights/script.js`, which is same-origin, served by Vercel's edge,
and skipped entirely on localhost.

Two caveats worth stating rather than glossing:

- The "stores nothing on the device" claim is about Vercel's script, which we load but do
  not control. It is sourced from Vercel's own documentation for Web Analytics, not from
  reading the delivered script, and it is worth re-checking if that product changes.
- The script does process the visitor's IP to build aggregates. That needs an Article 6
  basis (legitimate interest) and is disclosed in `privacy.html` sections 1 and 2. It is
  not a consent question, and a banner would not address it.

## Deliberately not done

**A consent notice.** Nothing stored is non-exempt. A banner for storage that is genuinely
exempt has a real cost: it trains people to dismiss consent prompts, and adds a maintenance
surface for no legal gain.

**Gating Supabase auth initialisation behind consent** (task 3 of #31's original
description). The Supabase client only writes to storage once a session exists, which only
happens after a deliberate sign-in. There is nothing to gate, and gating it would break
sign-in to solve a problem that does not exist.

## Corrections to the original issue

Both third-party concerns in #31's original description have since been fixed, and neither
was a consent question to begin with — a network request carrying an IP is Article 6 GDPR,
not Article 5(3) ePrivacy.

- **Web fonts.** `styles.css` self-hosts Plus Jakarta Sans from `assets/fonts/`. The
  leftover Google Fonts tags on `privacy.html` were removed in #96. The repo now contains
  no reference to `fonts.googleapis.com` or `fonts.gstatic.com`.
- **Unconditional CDN loads.** Supabase is vendored under `assets/vendor/` (#95) and
  Leaflet loads from unpkg only on the first switch to Map view (#96). A visitor who stays
  on the list reaches no third-party host.

## What would change this

Re-run the enumeration above and revisit this document if any of the following happens:

- A new `localStorage` / `sessionStorage` / cookie key is added that is not the service
  itself and not a preference the user set.
- Analytics is replaced with a product that stores anything on the device.
- An embedded third party (a video player, a map provider with its own storage, a chat
  widget) is added to a page.

## Where this belongs long-term

#87 will produce an Article 30 record of processing. This analysis is a natural section of
it, and should be folded in there rather than duplicated when that document exists. Until
then it stands alone, because #87 has not started and this reasoning should not wait on it.

## Notes

Not a lawyer; article references are pointers for verification, not advice.
