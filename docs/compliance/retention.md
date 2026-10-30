# Retention policy

**Status:** draft for owner review. Section 2 records a gap rather than a period.
**Date:** 30 October 2026
**Issue:** [#87](https://github.com/Dor-bl/moi-app/issues/87) (companion:
[`processing-register.md`](processing-register.md); the gap in §2 is
[#90](https://github.com/Dor-bl/moi-app/issues/90))

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
| Account record (email, name, provider metadata) | **Until the user deletes it — indefinite** | Nothing. See §2 |
| Progress and memory notes | Same as the account | `on delete cascade` on erasure |
| Live sessions and refresh tokens | Supabase's own session lifetime; ended immediately on sign-out or deletion | Supabase |
| Browser error reports | **30 days** | `pg_cron`, nightly at 03:17 |
| Contact messages (our mailbox) | As long as needed to answer | Judgement, applied by hand |
| Contact messages (Resend) | 30 days, *their stated figure* | Resend. Unverified — §3 |
| Sign-in emails (Resend) | As above | As above |
| Supabase platform logs (auth, API gateway) | **1 day** on the current Free plan | Supabase |
| Aggregate usage statistics | Indefinitely — not personal data | n/a |
| Vercel request logs | Vercel's own | Vercel |
| On-device storage (progress, preferences, event badges, session token) | Until the user clears their site data | The user, entirely |
| Automated database backups | Supabase's schedule for the plan | Supabase. See §4 |

Two of these deserve more than a row.

---

## 2. Account data: the gap

**Account data has no retention period, and that is a real finding rather than an oversight in
this document.** `privacy.html` §4 says it is kept "for as long as your account exists, until
you ask us to delete it". In practice: someone who signed in once in 2026, ticked three items
and never came back still has an email address, a dated location-related history, and free-text
notes in the database in 2036.

Two things make this worth fixing rather than living with:

- Article 5(1)(e) expects a limit, and "until the user asks" is not one — it puts the whole
  burden on someone who has forgotten the app exists.
- It is also the cheapest reduction in breach exposure available. Every dormant account is
  blast radius with no user behind it.

**The fix is [#90](https://github.com/Dor-bl/moi-app/issues/90)**, and the mechanism is already
proven in this codebase: `client_errors` is purged nightly by `pg_cron`, so the extension is
installed and scheduling works. A dormant-account job would reuse the same machinery and the
existing `delete_user()` erasure path rather than introducing a second way to delete a user.

Two details that issue needs to get right, recorded here so they are not rediscovered:

- Dormancy must key off `auth.users.last_sign_in_at`, **not** off progress rows. Someone can
  use the app for a year without ticking anything new, and deleting them would be a bug with a
  compliance justification attached.
- The `on delete cascade` on `user_progress.user_id` should make this a single delete against
  `auth.users`. Verify that against a test account rather than trusting it.

Until #90 lands, this section is the honest statement: **we have not set a retention period for
account data.** When it lands, this section states the period and `privacy.html` §4 changes in
the same pass.

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
backups taken before the deletion until they age out on their own schedule. That is **normal
and lawful**: the GDPR does not require editing backups, and regulators accept that erasure
applies to live systems while backups age out, provided the position is deliberate and written
down. What is not acceptable is having never thought about it.

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

1. **No retention period for account data** (§2). Tracked as
   [#90](https://github.com/Dor-bl/moi-app/issues/90).
2. **No record of erasures outside the database.** §4 point 4 is currently unexecutable: after a
   restore we could not enumerate which accounts had been erased since the backup. A minimal
   fix is a line per erasure — timestamp and user id — written somewhere outside the project
   database. Deliberately *not* filed as an issue yet: a log of who deleted their account is
   itself personal data, retained after they asked to be forgotten, so it needs a decision about
   what it may contain and how long it lives before it is built. Worth raising with the owner
   rather than implementing on a hunch.
3. **Resend's figure is unverified** (§3).
4. **No stated retention for provider-side logs beyond what the plan gives.** Upgrading the
   Supabase plan would lengthen log retention, which cuts both ways: better forensics, more
   personal data held longer. Currently undecided, and fine as such.

## Keeping this current

Revisit when a retention period changes anywhere — ours or a provider's — when a new category of
data appears, when the Supabase plan changes (log retention and backup schedule both move), or
when a gap above is resolved. `privacy.html` §4 is the public statement of the same facts:
change one, check the other.

Not a lawyer; article references are pointers for verification, not advice.
