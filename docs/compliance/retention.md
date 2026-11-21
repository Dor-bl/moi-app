# Retention policy

**Status:** draft for owner review.
**Date:** 30 October 2026; §2 rewritten 1 November 2026 for
[#90](https://github.com/Dor-bl/moi-app/issues/90)
**Issue:** [#87](https://github.com/Dor-bl/moi-app/issues/87) (companion:
[`processing-register.md`](processing-register.md))

## Why this exists

Article 5(1)(e) says personal data may be kept no longer than necessary for the purpose. That
is a decision someone has to make, not a property the code has on its own — and an undecided
retention period defaults to forever, which is the one answer the article rules out.

It also shrinks incidents. Data no longer held cannot leak, and a smaller table is a smaller
notification.

The categories here match the activities in
[`processing-register.md`](processing-register.md); read that first if you want to know *why*
something is held at all.

---

## 1. At a glance

| Category | Kept for | Enforced by |
| --- | --- | --- |
| Account record (email, name, provider metadata) | Until the user deletes it, or **24 months after it was last used** | `pg_cron`, nightly at 03:23. See §2 |
| Progress and memory notes | Same as the account | `on delete cascade` from the account record |
| Profile mirror in `public.profiles` (email, name, avatar URL) | Same as the account | `on delete cascade` from the account record |
| Live sessions and refresh tokens | Supabase's own session lifetime; ended immediately on sign-out or deletion | Supabase |
| Browser error reports | **30-day cutoff, swept nightly at 03:17** — so up to ~31 days in practice | `pg_cron` |
| Contact messages (our mailbox) | As long as needed to answer | Judgement, applied by hand |
| Contact messages (Resend) | 30 days, *their stated figure* | Resend. Unverified — §3 |
| Sign-in emails (Resend) | As above | As above |
| Supabase platform logs (auth, API gateway) | **1 day** on the current Free plan | Supabase |
| Aggregate usage statistics | Indefinitely — not personal data | n/a |
| Vercel request logs | Vercel's own | Vercel |
| On-device guest progress and notes | Until site data is cleared — but on sign-in they become account data, above | The user, then the account rules |
| On-device account progress and the account marker | Cleared on sign-out and on account deletion | The app (`onUserLoggedOut()`) |
| On-device preferences and event badges | Until the user clears their site data | The user |
| On-device session token | The SDK's own lifetime; removed on sign-out | The Supabase SDK |
| Automated database backups | Supabase's schedule for the plan | Supabase. See §4 |

Two of these deserve more than a row.

---

## 2. Account data: 24 months after last use

**An account is deleted, with its progress and notes, once it has gone 24 months without
being used.** Deleting it sooner is up to the user, from the profile. `privacy.html` §4 says
the same thing to users. The job and its SQL are in [`data-handling.md`](data-handling.md) under "Dormant accounts are
deleted after 24 months".

Before this, account data had no retention period at all: "until you ask us to delete it" put
the whole burden on someone who had forgotten the app exists, which Article 5(1)(e) does not
allow, and every dormant account was breach exposure with nobody behind it.

**Why 24 months.** MoiCheck is a list of things to do in Groningen, and people use it in
bursts: a first year in the city, a visit, a summer. A year would delete someone who simply
skipped one. Two years is long enough for that, and short enough that an account nobody has
used for that long can fairly be called abandoned. Change it in `privacy.html` §4 and in the
job together.

**What counts as use.** The latest of:

- `auth.users.last_sign_in_at` (or `created_at`, for an account that never signed in again);
- the newest `updated_at` or `refreshed_at` on any of the account's `auth.sessions`, as
  recorded each hour in `public.account_last_seen`.

The session timestamps cannot be read straight from `auth.sessions` at deletion time, because
signing out deletes the session row and its refresh tokens with it. Someone who signed in once
more than two years ago, kept using the app through refreshes, and then signed out would look
untouched since that first sign-in, and be deleted that night. So a job every hour copies each
live session's latest timestamp into `account_last_seen` (one row per account: `user_id`,
`seen_at`, no other data; row-level security on, no grants to `anon` or `authenticated`), and
the deletion at 03:23 reads that. A sign-out only loses the refreshes since the last hourly
copy, and that is a real gap, not just a timing detail. A visit that resumes an existing
session and ends in a sign-out before the next copy is never recorded. The 24 months then run
from the use recorded before that visit, so the account can be deleted earlier than 24 months
after the visit, by however long the gap before it was. Someone who comes back after 20
months, looks for a few minutes, signs out and never returns would be deleted about 4 months
later instead of 24. It needs all three: a resumed session rather than a fresh sign-in (which
`last_sign_in_at` always records), a sign-out within the hour, and no visit afterwards.
Closing it would mean a trigger on Supabase's own `auth.sessions` table. It would run inside
every sign-out and inside the cascade when an account is deleted, so a fault in it would break
both, in a schema Supabase owns. **Accepted for now, as the owner's call**: revisit if it
matters more than that risk. Refresh tokens are not a separate signal: they move with their session, and
when this was built none was newer than its session.

`last_sign_in_at` alone would be wrong, and dangerously so. The SDK refreshes a session
without signing in again, so someone can use the app for years while that timestamp stays at
their first visit; [`breach-runbook.md`](breach-runbook.md) §2 notes the same gap. When this
was built, 2 of the 8 accounts had session activity more than a day newer than their
`last_sign_in_at`. Every app open more than an hour after the last one refreshes the session,
so the session timestamps catch real use. Progress rows are not a measure either: someone can
use the app for a year without ticking anything new.

**How it deletes.** The job deletes the `auth.users` row, nothing else. Every table that
references it cascades: `user_progress`, `account_last_seen`, the `public.profiles` mirror,
and Supabase's own sessions, refresh tokens, identities and MFA tables. That was checked in
the database catalogue (`pg_constraint`), not assumed. `delete_user()` is unchanged. It still acts only on `auth.uid()`, and the job does
not call it: both jobs run as `postgres` inside `pg_cron`, the same way the `client_errors`
sweep does, so no new function is exposed through the API. The deletion also checks live
sessions directly, so a failed copy cannot delete an account in use.

**No warning email, decided.** A warning would need another scheduled job, an email template,
a record of who was warned and when, and a way to undo it when someone comes back. That is a
feature several times the size of this one, sending mail to addresses we otherwise only use
for sign-in links. Article 5(1)(e) asks for a limit, not for a reminder. The period is stated
up front in `privacy.html` §4, which also points to the download, so users can keep a copy.
Revisit this if the user base grows enough that people lose accounts they meant to keep.

A deleted dormant account is treated like any other erasure for backups (§4), and it has the
same gap there: it is not recorded outside the database (§5).

---

## 3. What we hold versus what a processor holds

Our own retention is only half the answer, and the weaker half for anything involving email.

**Resend** documents 30 days for email data on its standard plans. We have not been able to
confirm that against its live documentation, so it is carried as *their stated figure*, not one
we verified — in `privacy.html` §4, in the register, and here. It matters twice over: contact
messages pass through it, and so does every magic-link email, which means **a sign-in token and
an address sit in a US processor's logs for that window**.

**Supabase platform logs retain one day** on the Free plan. That is a retention fact and an
investigative one: a breach noticed a week later cannot be reconstructed from logs that no
longer exist. [`breach-runbook.md`](breach-runbook.md) §7 is the place that reasoning lives,
and its step 2 exists because of this — preserve before you change anything, because the
evidence expires faster than the investigation.

**The mailbox** is a personal Google account under consumer terms with no processor contract
behind it ([#152](https://github.com/Dor-bl/moi-app/issues/152)). Retention there is "as long
as needed to answer", applied by hand. There is no automation and, at this volume, no case for
building any.

---

## 4. Backups and erasure — the written position

This is the question an auditor asks and an undocumented project cannot answer.

Supabase takes automated backups of the whole project database. A row deleted today persists in
backups taken before the deletion until they age out on their own schedule.

Backups are **within** the scope of the erasure right — the comfortable reading, that Article 17
simply stops at the live database, is wrong. What is accepted is narrower: a controller is not
expected to surgically rewrite backup sets, **provided** it keeps a record of what must be
erased and applies those erasures to anything restored from one. Ageing out covers the first
half of that; the record covers the second.

So the position below is the normal one, and it is **not yet complete**: we do the ageing out,
and we do not yet keep the record (point 5, and §5). Until that record exists, point 4 is an
intention rather than a capability, and this section should not be read as saying the backup
question is settled. Half of what makes the standard position lawful is missing.

**The position:**

1. **Backups are not edited on an erasure request.** Deleting one user's rows out of a backup
   set is not technically available to us, and attempting it would risk the integrity of the
   backup for everyone else.
2. **Backups age out on the provider's schedule**, and the erasure is permanent once they have.
3. **We do not restore a backup to bring an account back.** Not on request, not as a favour.
4. **If a backup is ever restored for any other reason** — a corruption incident, an operational
   mistake — **every erasure made since that backup was taken is re-applied before the restore
   is treated as complete.** That step is part of the restore, not a follow-up task.
5. Point 4 needs a list of what to re-delete, which needs erasures to be recorded somewhere
   outside the database being restored. **We do not currently keep such a record** — see §5.

`privacy.html` §5 already tells users the first three points in plain language: copies in
backups taken before deletion are not edited, they age out, and we do not restore from one to
bring an account back. This section is the internal counterpart, and points 4 and 5 are the
part a user does not need but an auditor does.

---

## 5. Known gaps

1. **No record of erasures outside the database.** §4 point 4 is currently unexecutable: after a
   restore we could not enumerate which accounts had been erased since the backup. A minimal
   fix is a line per erasure — timestamp and user id — written somewhere outside the project
   database. Deliberately *not* filed as an issue yet: a log of who deleted their account is
   itself personal data, retained after they asked to be forgotten, so it needs a decision about
   what it may contain and how long it lives before it is built. Worth raising with the owner
   rather than implementing on a hunch.
2. **Resend's figure is unverified** (§3).
3. **No stated retention for provider-side logs beyond what the plan gives.** Upgrading the
   Supabase plan would lengthen log retention, which cuts both ways: better forensics, more
   personal data held longer. Currently undecided, and fine as such.

## Keeping this current

Revisit when a retention period changes anywhere — ours or a provider's — when a new category of
data appears, when the Supabase plan changes (log retention and backup schedule both move), or
when a gap above is resolved. `privacy.html` §4 is the public statement of the same facts:
change one, check the other.

Not a lawyer; article references are pointers for verification, not advice.
