# Personal data breach runbook (GDPR Articles 33 and 34)

**Status:** draft for owner review. Written in advance, while nothing is on fire.
**Date:** 4 October 2026
**Issue:** [#88](https://github.com/Dor-bl/moi-app/issues/88) (depends on [#87](https://github.com/Dor-bl/moi-app/issues/87) processing register; builds on [`account-hosting-audit.md`](account-hosting-audit.md))

## How to use this file

Open it the moment you think something may have happened, and work top to bottom. Don't
skip ahead to the decision tree: the first hour's preserve-and-contain steps are what make
the decision tree answerable at all.

The clock: Article 33(1) gives **72 hours from becoming aware** of a personal data breach
to notify the Autoriteit Persoonsgegevens (AP). "Aware" means reasonably certain that a
security incident has compromised personal data. It does not mean the investigation is
finished. A short look to establish whether anything happened is allowed before the clock
starts; days of not looking are not. Write down the moment you became aware (section 1,
step 1), because every later deadline is measured from it.

MoiCheck has one controller and one operator, the owner. "Who is contacted" below is
therefore mostly about processors and the regulator, not an internal escalation chain.

---

## 1. The first 60 minutes

Do these in order. Steps 2 and 3 are deliberately before step 4: Supabase's logs on the
Free plan cover only the last day (section 7), so evidence vanishes faster than you can
investigate it. The one exception: if unauthorized access is likely still going on *right
now* (the table is readable without signing in, a stolen session or account is in active
use, an attacker is still inside a provider account), contain first, and preserve
immediately after. Exporting logs takes minutes; an attacker still inside reads or changes
data every second. Before a containment action that itself destroys evidence, take the
one-minute snapshot of what it destroys: before ending sessions, save the affected
`auth.sessions` rows ([Appendix B](#appendix-b-sql-for-scoping)), because deleting them
removes the session IPs, user agents and timestamps. Logs, policies and dashboard history
survive containment, so they can wait until after.

### Step 1: Open an incident record (2 minutes)

Copy the template in [Appendix A](#appendix-a-incident-record-template) into a private
note **outside** any account you suspect is affected. Record:

- the time you became aware, in UTC, and how (alert, user email, provider notice, own discovery);
- what you know and what you only suspect, kept in separate lists.

Everything you do from here gets a timestamped line in that record. The AP can ask for it,
and Article 33(5) requires it whether or not you end up notifying.

### Step 2: Preserve before changing anything (15 minutes)

| Source | What to save | Why it is urgent |
| --- | --- | --- |
| Supabase → Logs Explorer: **API Gateway** and **PostgREST** | Export every request touching `user_progress`, `rpc/delete_user` and `auth/v1` for the full available window | 1-day retention on Free. The closest thing to an access record there is: request paths, query filters, status codes, caller IP and, where logged, the JWT's `sub`/role. These are **request logs, not a row-level audit**: they don't record which rows came back, so they bound scope but never prove a row *wasn't* read. The Logs Explorer returns at most 1,000 rows per query (Supabase docs, *Query logs with SQL*): split the window into time slices and confirm each slice came back under 1,000 rows, or the export is silently truncated |
| Supabase → **Auth** logs | Export the full window. Also run `select count(*) from auth.audit_log_entries;`: if Auth's "write audit logs to the database" option is on, that table holds older Auth events beyond the 1-day log window, so export it too (it was empty on 8 October 2026, so the option is off here) | Sign-ins, magic-link requests, token refreshes |
| Supabase → organization audit log | **Not available on Free.** Platform audit logs are Team and Enterprise only (Supabase docs, *Platform Audit Logs*), so there is no record of who did what in the dashboard. Record that gap in the incident record rather than looking for an export | — |
| Supabase → **Postgres** logs | Export, and record `show log_statement;` | Errors, and DDL (for example a dropped policy) only because this project has `log_statement = ddl` (checked 8 October 2026). Other statements need pgAudit configured in advance, which this project doesn't have. If the setting was changed before the incident, a missing DDL entry proves nothing |
| Supabase → **Edge Functions** → `contact` → logs | Export | Contact relay invocations |
| Supabase → SQL: RLS state **and the affected set** | Run the [snapshot queries](#appendix-b-sql-for-scoping) and save the output as CSV in the incident record | Proves which policies existed *before* you changed them, and freezes the full `user_progress` rows plus the user-id-to-email mapping as they are now. Users keep unticking items, clearing notes and deleting accounts, so a later query loses rows, notes and email addresses. These exports are the most sensitive copy of the data there is: keep them encrypted, outside any account that might be compromised, and delete them when the incident and any AP case are closed |
| Vercel → Deployments | Screenshot the list with commit SHAs and timestamps | Shows whether unexpected code was ever served |
| GitHub → repository and account security log | Screenshot | Pushes, new deploy keys, new OAuth apps |
| Resend → Logs / Emails | Screenshot the window | Who was sent magic links, and when |
| Google account → Security → Recent activity, Your devices | Screenshot | Mailbox access (contact-form messages) |
| Cloudflare → Audit log; Email Routing rules | Screenshot | A changed routing rule silently redirects `hallo@moicheck.nl` |

Save exports with the export time in the filename. Don't edit them. Hash them
(`sha256sum`) and note the hashes in the incident record.

You don't need all of these for every incident. Work out which entry point is plausible
(section 2) and preserve that source first, then the Supabase logs, which age out fastest.

### Step 3: Freeze the evidence you control (5 minutes)

- Don't delete user rows, rotate keys, drop policies or redeploy *before* step 2 is done
  for the affected source (unless access is likely ongoing, as above).
- If the entry point is the repository or a deployment, note the current `main` SHA and the
  live deployment ID. Don't force-push or delete branches.

### Step 4: Contain (20–30 minutes)

Pick the row matching the suspected entry point. Each action breaks something for real
users; that's accepted. Write down what you changed and when.

| Suspected entry point | Containment | What it breaks |
| --- | --- | --- |
| **RLS misconfiguration**: `user_progress` readable or writable beyond the owner | `revoke all on public.user_progress from public, anon, authenticated;`, plus every other grantee in the step 2 snapshot's `role_table_grants` output except `postgres` and `service_role` (an unexpected grantee is itself a finding). The restore statement is in Appendix B | Cloud sync stops for everyone; guest mode keeps working from `localStorage` |
| **Leaked signing secret or privileged key** (`SUPABASE_JWT_SECRET`, a `service_role` / secret key; see [`account-hosting-audit.md`](account-hosting-audit.md) §2) | Supabase → Project Settings → JWT Keys / API Keys. Which step depends on the key model (Supabase docs, *JWT Signing Keys*). **Legacy JWT secret:** it can no longer be rotated in place (Supabase docs, *Rotating Anon, Service, and JWT Secrets*). Use the migrate → rotate → revoke flow on the JWT Keys page: *Migrate JWT secret* (imports the legacy secret and creates a standby key), then *Rotate keys*, then **revoke** the imported legacy secret under *Previously used* straight away rather than waiting out the token lifetime. Supabase only allows that revoke once the legacy `anon` and `service_role` API keys are deactivated, because both are JWTs signed with that secret. So first, if `config.js` still ships the legacy `anon` key, switch it to the publishable key and redeploy; then deactivate both legacy keys under API Keys. Key state changes are throttled for about 5 minutes each, so allow 15–20 minutes. **New signing keys:** *Rotate keys* alone signs nobody out and leaves the old key trusted; you must then **revoke** the previously used key. **Leaked API key:** deactivate a legacy `service_role` key under API Keys; revoke a leaked secret key (`sb_secret_...`) and issue a new one. **Database password:** if any direct database credential could have been exposed (the `POSTGRES_*` variables the Vercel–Supabase integration injects, see the audit §2; or a leaked connection string), reset it in Supabase → Database settings, and update anything that legitimately uses it (nothing in this repo does). Then **end sessions** as in the next row, because neither rotation ends a refresh-token session | Legacy: users holding a token signed with the legacy secret may be signed out at the revoke, and the site breaks if it still ships the legacy `anon` key when that is deactivated (switch first). New keys: no visible effect until sessions are ended |
| **Stolen user sessions** (for example via injected script) | Key rotation does **not** end a stolen session: the refresh token keeps working and gets new access tokens under the new key. End the sessions themselves, after saving the affected `auth.sessions` rows (Appendix B, *Session snapshot*; the delete destroys them): in the SQL editor, `delete from auth.sessions where user_id in (...)` for the affected users, or without a `where` clause for everyone. That is what sign-out does (Supabase docs, *User sessions*), and in this project the refresh tokens are deleted with their session (`refresh_tokens_session_id_fkey ... ON DELETE CASCADE`, checked 7 October 2026). Access tokens already issued stay valid until they expire (default 1 hour) unless the key that signed them is revoked as in the row above | Affected users are signed out and must sign in again |
| **Supabase dashboard account** | Change password, revoke other sessions, re-check MFA. Then **remove what an attacker could have left behind**, because rotating keys doesn't touch it: unknown organization members, unknown personal access tokens (Account → Access Tokens), and changes to project settings. Check Auth (providers, redirect URLs, SMTP settings, email templates), the database (RLS policies, functions such as `delete_user()`, roles and grants; compare against the step 2 snapshot and `README.md`), Edge Functions and their secrets, and any new projects or branches. Only then treat it as "leaked privileged key" | As above |
| **GitHub or Vercel account; malicious deploy** | **Secure both accounts first**, because an attacker still inside can redeploy or read the replacement secrets: change passwords, sign out all sessions, re-check MFA, and remove anything unknown. On GitHub that means collaborators, deploy keys, personal access tokens, authorized OAuth and GitHub Apps, webhooks, and changes to Actions workflows, secrets or branch protection. On Vercel it means team members, tokens, integrations, Git connection and deploy hooks. Then roll back to a known-good deployment in Vercel (Instant Rollback) and treat it as a **leaked privileged key** (row above), because both accounts hold credentials that reach Supabase. GitHub Actions holds `SUPABASE_ACCESS_TOKEN` (a Supabase management token, used by `.github/workflows/deploy-functions.yml`), which an attacker with write access can exfiltrate by editing and running a workflow. Vercel no longer holds `SUPABASE_JWT_SECRET` (removed 7 October 2026, audit §2), but check its environment variables anyway: re-linking the Vercel–Supabase integration puts it back, and a malicious build can read whatever is there. So: revoke the Supabase access token in Supabase → Account → Access Tokens, create a new one, update the GitHub Actions secret, and review the repository's Actions run history for runs you didn't start. Rotate or revoke the signing key and **end sessions** (the two rows above), because a malicious script could have read users' session tokens. If any `POSTGRES_*` variable was in any Vercel environment during the window (Preview and Development were never confirmed clean, audit §2), also reset the database password as in the leaked-key row | The rollback itself, plus the effects of the two rows above: everyone signed out, and on the legacy key model the site broken if it still ships the legacy `anon` key when that is deactivated |
| **Contact relay** (`supabase/functions/contact`) | Supabase → Edge Functions: delete or disable `contact`; rotate `RESEND_API_KEY` with `supabase secrets set` | Contact form fails; users can still email `hallo@moicheck.nl` |
| **Resend account** | **Secure the account first**: change password, sign out all sessions, re-check MFA, remove unknown team members. Only then rotate the API key and SMTP credentials (rotating first lets an attacker still inside mint new ones), and check sending domains and logs for unknown sends | Magic-link sign-in and the contact form stop until new credentials are in Supabase |
| **Google mailbox** (`hallo@moicheck.nl`'s destination) | **Secure the account first**: change password, sign out all sessions, re-check MFA. Then remove persistence: forwarding rules, filters, delegates, app passwords, third-party app access, and the account's recovery email and phone | None |
| **Cloudflare** | **Secure the account first**: change password, revoke sessions and API tokens, remove unknown members, re-check MFA. Then restore Email Routing rules and the `moicheck.nl` DNS records to their known state. **If the DNS was repointed** at any point in the window, attacker content may have run on `moicheck.nl` and read visitors' session tokens, and restoring DNS doesn't revoke them: also rotate or revoke the signing key and **end sessions** (the leaked-key and stolen-sessions rows), as for a malicious deploy | None, unless the DNS was repointed: then everyone is signed out, plus the leaked-key row's effects |
| **Processor-side breach** (a provider tells you) | Follow their instructions; you're still the controller and the 72 hours run from *your* awareness (Art. 33(2) obliges them to tell you without undue delay) | Depends |

To stop all sign-ins while investigating: Supabase → Authentication → Providers, disable
Email and Google.

### Step 5: Contact (10 minutes)

| Who | When | How |
| --- | --- | --- |
| The affected processor's security or support team | Whenever the incident touches their platform | Their dashboard support channel. Ask for logs beyond your plan's retention: they may hold more than you can see |
| Autoriteit Persoonsgegevens | Per section 4, within 72 hours | Section 6 |
| Affected users | Per section 5 | Appendix C |
| Police (cybercrime report) | Optional, when a criminal act is evident (extortion, intrusion) | Politie aangifte. Not a substitute for the AP notification |

Then breathe, and go to section 2.

---

## 2. Scoping checklist: what could be involved

> **Interim.** This table is derived from the code at commit `ffd7995` because the
> Article 30 register ([#87](https://github.com/Dor-bl/moi-app/issues/87),
> `docs/compliance/processing-register.md`) isn't written yet. When it lands, the register
> wins and this section should link to it rather than restate it.

### Data stores

| Store | Contents | Whose | Evidence of access | Retention of that evidence (current plan) |
| --- | --- | --- | --- | --- |
| Supabase `auth.users` | Email address; for Google sign-ins, name and avatar URL from the Google profile; `created_at`, `last_sign_in_at`; provider metadata | Every account holder | Auth logs, API Gateway logs | 1 day |
| Supabase `public.user_progress` | `user_id`, `item_id`, `date` (when the item was ticked off), `note` (free text) | Every account holder who synced anything | API Gateway / PostgREST logs | 1 day |
| Supabase Auth internals (`auth.sessions`, `auth.refresh_tokens`, `auth.identities`, MFA factors) | Live sessions and refresh tokens (usable to sign in as the user until ended), linked Google identities with their profile data, session IP and user agent | Every account holder with a session or identity | Auth logs | 1 day |
| Supabase logs themselves (Auth, API Gateway) | Per request: IP address, user agent, path, and for Auth events the email address. These are personal data too (#86 tracks disclosing them) | Everyone who used the API or signed in during the retention window | — | 1 day on Free |
| Supabase automated backups | A full copy of the whole database, including every table above and the Auth internals, not just `user_progress` and `auth.users` | As above | None on Free: the platform audit log that would show restores is Team and Enterprise only. After a dashboard compromise, look for new projects or branches that a backup could have been restored into | — |
| Contact relay (Edge Function) | Nothing at rest. Caller IP in memory for rate limiting only ([`account-hosting-audit.md`](account-hosting-audit.md) §4) | Contact-form users | Edge Function logs | 1 day |
| Resend | Recipient address of every magic-link email and contact relay, with a one-time sign-in token; the contact message content | Magic-link users; contact-form users | Resend logs | Resend's own (stated 30 days; unverified, see `privacy.html` §4) |
| Gmail mailbox behind `hallo@moicheck.nl` | Every contact-form message and direct email: name, address, free text | Anyone who wrote in | Google account activity | Google's |
| Users' browsers (`localStorage`) | Progress, notes, event badges, preferences; and, for signed-in users, the **Supabase-managed session tokens** (access and refresh token) | Each user, on their own device | n/a for our servers; but a malicious deploy or injected script runs in this context and can read all of it, tokens included | n/a |
| Vercel hosting (request handling) | For every visitor, signed in or not: IP address, browser details, the page requested and the referring site (`privacy.html` §1–§2) | Every visitor | Vercel's own logs; ask Vercel, as processor | Vercel's |
| Cloudflare Email Routing | Every email to `hallo@moicheck.nl` in transit (contact messages, direct mail), forwarded rather than stored (`privacy.html` §2) | Anyone who writes in | Cloudflare audit log, Email Routing settings | Cloudflare's |
| unpkg (map scripts) and OpenStreetMap (map tiles) | Each map visitor's IP address and request details, fetched directly by the browser; no agreement with either (`privacy.html` §2–§3) | Visitors who open Map view | None on our side; ask the provider | Theirs |
| Vercel Web Analytics | What reaches us is aggregates only. Vercel builds them from the request data in the row above, so a Vercel-side breach is scoped by that row, not this one | n/a | n/a | n/a |

No dedicated field for: passwords (sign-in is magic link or Google only), payment data,
government IDs or special-category data; and no raw device coordinates (the "I'm here"
check runs on the device and stores nothing; see `privacy.html` §1). Memory notes and
contact messages are free text, though, so a user may have written any of these into them.
When notes or messages are in scope, review the affected text (from the frozen export)
before ruling a category out.
That is **not** the same as "no location data". `user_progress` rows pair a place (each
`item_id` maps to a known location) with a date, which is location-related history; see
section 5. When filling in the AP form's data categories, include it.

### Entry points, and what each one could reach

| Entry point | Reaches |
| --- | --- |
| RLS policy dropped or mis-edited | Depends on the effective state, read from the step 2 snapshot: **RLS disabled**, or a permissive policy such as `using (true)`, exposes all `user_progress` rows to the roles that hold grants. A **dropped policy with RLS still enabled** denies everything (an outage, not exposure). A mis-edit may widen only one operation (`select`, `insert`, `update`, `delete`) or a subset of rows. Scope to what the policies and grants actually allowed. Not `auth.users` (anon/authenticated roles can't read it) |
| `SUPABASE_JWT_SECRET` / `service_role` / secret key | Everything in the database, including `auth.users`. The JWT secret was removed from Vercel on 7 October 2026 (audit §2), which made this row much less likely. It was not rotated, so it is unrevoked. Whether Supabase still accepts tokens signed with it depends on the legacy HS256 verification setting, which is unconfirmed (audit §2), so treat it as live until the dashboard shows otherwise |
| Supabase dashboard account | Everything in Supabase, including backups and logs |
| GitHub or Vercel account (malicious deploy) | **Potentially everything in Supabase**, until the credentials these accounts hold are shown to be untouched and have been rotated: `SUPABASE_ACCESS_TOKEN` in GitHub Actions (management access to the project), plus any Supabase key found in Vercel's environment variables. `SUPABASE_JWT_SECRET` was removed on 7 October 2026, but check for it: re-linking the integration restores it. Separately, a malicious deploy reaches anything a signed-in user's browser can see: their session, progress and notes. Vercel's deployment list bounds only that browser-side exposure, to users who loaded the site while the deployment was live |
| Resend account | Recipient addresses, contact messages, and live magic-link tokens for links not yet used (account takeover while they're valid) |
| Google mailbox | All contact correspondence, plus password-reset mail for the other accounts, which makes this the top of the chain |
| Cloudflare | Future mail to `hallo@moicheck.nl` (redirect), not past mail. Email Routing needs the domain's DNS on Cloudflare, so this account can also repoint `moicheck.nl` itself: an attacker could serve their own site under the real domain. Treat that like a **malicious deploy**: a page on the same origin can read what visitors' browsers already hold (progress, notes and Supabase session tokens in `localStorage`), as well as phish new sign-ins. Bound the window from Cloudflare's audit log and DNS history, presume every visitor in it exposed, and end sessions as in step 4 |

### Answering the AP form's scoping questions

1. **Which data?** Match the entry point to the rows above.
2. **How many people?** Run the counts in [Appendix B](#appendix-b-sql-for-scoping). For a
   malicious-deploy or session-theft window there is **no query that gives the affected
   set**: `last_sign_in_at` misses users whose session started before the window and kept
   refreshing through it, and it moves when someone signs in again afterwards. Use the
   API Gateway logs for authenticated requests during the window (by JWT `sub` where
   logged) if they cover it; otherwise the affected set is every account that could have
   had a live session, which in practice means all accounts. Say which one you used. The
   form accepts a minimum and a maximum (section 6), so give both rather than a guess.
3. **Which categories?** Contact data (email, name); app usage records (progress with
   dates); free-text notes; for the mailbox, Resend or Cloudflare, correspondence; for
   Vercel, unpkg or OpenStreetMap, visitors' IP addresses and request metadata; for a
   Supabase-side compromise, also session and identity data (`auth.sessions`,
   `auth.identities`) and the IP addresses and user agents in Supabase's own logs.
4. **Over what time window?** The earliest evidence of access to the containment time. If
   the logs don't reach back to the start, **say so explicitly** and give the window as
   "from at least [log start], possibly earlier". Don't narrow it to what the logs happen
   to cover.

---

## 3. Is it a personal data breach at all?

A personal data breach is a security incident that leads to accidental or unlawful
**destruction, loss, alteration, unauthorised disclosure of, or access to** personal data
(Art. 4(12)). Three useful tests:

- *A vulnerability nobody used* (for example, a too-wide RLS policy found in review) is
  not a breach. But request logs can't show which rows came back (section 1, step 2), so
  "nobody used it" has to rest on the absence of **requests that could have exploited
  it**, never on a judgement about what a request returned. The bar: logs covering the
  **whole** exposure window show no request to the affected path outside the app's own
  shape. For `user_progress` the app sends exactly three shapes (`js/auth.js`), all from
  the `authenticated` role:
  - **read** (`GET`): filtered on `user_id=eq.<id>`;
  - **tick or note** (`POST`, an upsert): no query filter at all; `user_id` travels in
    the request body;
  - **untick** (`DELETE`): filtered on `user_id=eq.<id>` and `item_id=eq.<id>`.

  A `GET` or `DELETE` with no `user_id` filter, or with one that doesn't match the
  caller's JWT `sub`, is out of shape. So is any request from the `anon` role, any other
  method (`PATCH`, `PUT`), and unusual volume. Out of shape means you treat it as a breach
  with unknown rows, not as a near miss.

  **If the logs don't record the caller's `sub`,** a filtered request can't be shown to
  be the caller's own: an attacker can filter on someone else's `user_id`. Treat that as
  unknown scope, the same as logs that don't cover the whole window.

  **What the logs can't show:** request bodies aren't logged, so for a `POST` you can't
  tell whose `user_id` it wrote. If the hole allowed writes, the logs can only bound
  *how many* writes happened and from which callers, not prove they stayed in their own
  rows. In that case treat integrity as unknown for the window. If the logs **don't reach back** to the
  start of the exposure, you can't conclude "not used" either: same treatment. Only when
  the bar is met, record it as a security incident in Appendix A and fix it.
- *Availability counts.* Losing data with no backup to restore it is a breach even if
  nobody else saw it.
- *A misdirected email* (for example, replying to the wrong contact-form sender) is a
  breach. Usually a small one, but it still goes in the record.

Whatever the answer, **record it**. Article 33(5) requires a record of every personal data
breach, including those you decide not to notify; an incident you conclude was *not* a
breach isn't covered by 33(5), but record it anyway, with the reasoning. That record is the
first thing the AP asks for if the incident later surfaces.

---

## 4. Article 33: notify the AP?

```
Personal data breach confirmed (section 3)?
├─ No  → record as a security incident, fix, done
└─ Yes → record it (always)
         │
         Is it UNLIKELY to result in a risk to people's rights and freedoms?
         ├─ Yes → do not notify the AP. Write down WHY in the record (section 5's
         │        assessment). Example: the only data exposed was already public
         │        bucket-list content with no user attached.
         └─ No, or unsure → NOTIFY the AP within 72 hours of awareness
                  │
                  Do you have the full picture by hour ~60?
                  ├─ Yes → one complete notification
                  └─ No  → notify with what you have, mark it INCOMPLETE,
                           state what you're still investigating and when you
                           expect to add to it (Art. 33(4)), then supplement
```

The default is **notify**, and the AP's own guidance agrees: when in doubt, report. The exemption is "unlikely to result in a risk", which is a
low bar to fail: an exposed list of email addresses tied to a named app is usually a risk
(phishing). Late notification has to come with reasons for the delay (Art. 33(1)), and
"we were still investigating" is weaker than a partial notification on time.

**Partial notification route.** Article 33(4) allows information to be provided in
phases. Use it: an on-time notification that says "scope still under investigation; we
will supplement by [date]" is what the article envisages. Don't wait for the logs
analysis to finish.

---

## 5. Article 34: tell the users? (pre-drafted risk assessment)

### The legal threshold and the decision rule

Individuals must be notified "without undue delay" when the breach is likely to result in
a **high** risk to their rights and freedoms (Art. 34(1)). The test is whether the breach
is likely to result in a **high risk to the rights and freedoms of the affected
individuals**. Assess both the likelihood and the severity of potential harm to those
individuals, not the impact of the breach on MoiCheck itself. The primary guidance behind
this section is the EDPB's
[Guidelines 9/2022 on personal data breach notification](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-92022-personal-data-breach-notification-under_en),
chapter IV in particular. Statements attributed to the AP below cite the specific AP page
they come from (see the sourcing table).

> **Article 34 decision rule.** Notify affected individuals when, after considering the
> nature and sensitivity of the exposed data, the circumstances and scope of the breach,
> the likelihood of misuse, and the potential consequences, the breach is likely to
> result in a high risk to their rights and freedoms.
>
> The pre-assessed outcomes below are starting points, not automatic legal conclusions.
> On the day, update the assessment using the actual facts of the incident.
>
> If the available facts don't let you reasonably exclude high risk, escalate: the owner
> is the incident lead, so that means getting a legal adviser's view if one can be
> reached in time. Don't treat uncertainty as evidence of low risk.

This assessment was written in advance for this dataset, so that on the day you start
from it rather than from a blank page.

### Factors that generally reduce risk

These characteristics generally reduce the likelihood or severity of harm, but they must
still be weighed against the actual circumstances and scope of the breach. None of them
on its own establishes that a breach is low risk. An email address, for example, may be
low risk by itself but becomes much more significant when combined with behavioural or
location information.

- **No passwords.** There is nothing to reuse on other sites. Magic-link tokens are
  one-time and short-lived. Signed-in browsers do hold Supabase session tokens (access and
  refresh), which a malicious deploy or injected script could steal. Their reach is the
  user's own account. Key rotation alone does **not** end them: the sessions themselves
  have to be ended (section 1, step 4, "Stolen user sessions"; and the token row in the
  outcomes table).
- **No dedicated fields for financial data, government IDs or special-category data.**
  Counts only once the affected notes and contact messages have been reviewed: free text
  can contain any of these.
- **No raw device location.** The location check for event badges never leaves the
  device. (Progress rows are still location-related history; see below.)
- **Narrow audience and purpose.** A bucket list for one city. The data is designed to
  record what someone did for fun, not their health, finances or beliefs.
- **Account and progress data stored in the EU** (Supabase `eu-west-1`, under a
  processor contract). This applies to the Supabase-hosted dataset only. Mail is
  different: magic-link emails and contact messages pass through Resend and Cloudflare
  in the US and rest in a US Gmail mailbox with no processor contract (`privacy.html`
  §3). Don't count this factor for a mail-side incident.

### Factors that increase risk

- **Memory notes are free text.** A user can write anything: who they were with, how they
  were feeling, a health detail, a name. Special-category data or information about other
  people can't be ruled out without reviewing the notes.
- **Progress rows are dated location history.** Every `item_id` maps to a public place
  with coordinates in `BUCKET_LIST`. A row of `item_id` + `date` reads as "this person was
  probably at this place around this date". That is the tick-off time, not proof of
  presence, but a reader can't tell the difference.
- **Location data is an important risk factor.** A leaked set of dated places associated
  with an email address could allow an attacker to infer aspects of a person's
  movements, habits or activities. This may materially increase the likelihood or
  severity of harm, particularly where the dataset covers a long period, contains many
  locations, or can be combined with other information. The fact that the information
  could be used for behavioural or location profiling should therefore weigh against
  treating the breach as low risk. The AP lists profiling based on "behaviour and
  location" among the types of data to treat as high risk ("Reporting or not reporting a
  data breach"). However, it does not by itself establish that Article 34 notification is
  mandatory; the overall likelihood and severity of harm still need to be assessed for
  the particular breach.
- **Email addresses are identifying.** Joined with the rows above, there is no
  pseudonymisation to fall back on. The AP names email addresses as data that look
  harmless but enable targeted phishing (same AP page).
- **Contact-form messages are free text too**, and the mailbox holding them has no
  processor contract (`privacy.html` §3).

### Pre-assessed outcomes

Starting points under the decision rule above, not conclusions.

| What was exposed | Starting assessment | Art. 33 (AP) | Art. 34 (users) |
| --- | --- | --- | --- |
| Email addresses only (no progress) | Risk (phishing, confirmation of use of the app) | Notify | Usually not required. Consider a short transparency/security notice where this would help users protect themselves from phishing or understand what happened |
| Progress rows **without** notes, with or without emails | Risk; the location-history reading weighs towards high risk when rows are tied to emails, cover a long period or many places | Notify | Assess on the facts. Lean towards notifying if emails were included and the window is long |
| Notes (with or without emails) | **Presume high risk unless review establishes otherwise**: free text may contain health information, information about other individuals, intimate information, identifying information or other sensitive material | Notify | Normally notify if high risk can't reasonably be excluded |
| Contact-form messages (mailbox, Resend) | Depends on content: review the affected messages | Notify | Notify affected senders if the assessment concludes the breach is likely to result in high risk, with particular attention to messages containing sensitive, intimate, identifying or third-party information |
| Live session tokens or magic-link tokens | **Token exposed, no evidence of use:** assess what the token could have accessed, and end the affected sessions immediately (section 1, step 4: delete them from `auth.sessions`; key rotation alone doesn't do it). **Token demonstrably used:** assess on the data actually accessed or actions performed | Notify | Follows the risk of the data or actions the token made accessible, not the mere existence of a compromised token |
| Data altered or deleted without exposure (for example, a write-open RLS policy abused to vandalise rows) | Risk (integrity/availability) | Notify where required | Assess whether the alteration or deletion is likely to result in high risk, for example loss of personal records, material consequences for users, or inability to recover notes or progress (section 7: no restorable backups on Free, and never an in-place restore). Notify affected users where that threshold is met, or where notification is otherwise appropriate as part of remediation |

### Exceptions to Article 34 (Art. 34(3))

Individual notification is not required if: (a) the data was unintelligible to the
attacker (for example, encrypted with a key that wasn't compromised; not the case for
anything here); (b) measures taken subsequently ensure that the high risk to individuals
is no longer likely to materialise; or (c) it would involve disproportionate effort, in
which case a public communication (such as a notice on moicheck.nl) is required instead.

**Operational assumption:** don't rely on the disproportionate-effort exception without
explicit approval from the incident lead and a legal adviser. The service has a
manageable number of affected users and their contact details are available, so
individual notification should normally be feasible.

### Document the decision

Whether or not users are notified, document the Article 34 assessment in the incident
record (Appendix A). Record:

- what personal data was affected;
- how many individuals were affected or potentially affected;
- the duration and scope of the exposure;
- whether the data was accessed, copied, altered or merely potentially accessible;
- the likely consequences for individuals;
- the factors increasing or reducing likelihood and severity;
- the mitigation measures taken;
- the final Article 34 decision and the reasoning behind it.

If users are not notified, record specifically why the breach was assessed as not likely
to result in high risk. This is the audit trail for the decision, not just a note that
an email was or wasn't sent.

### Sending the notice

There is no mailing tool.

1. **Build the list** from the affected-set snapshot (Appendix B), not the live table.
2. **Verify it before sending:** check the list against the incident scope and remove
   addresses that weren't affected.
3. **Send individual messages wherever practical.** The default channel is the existing
   Resend account. If a batch mechanism is unavoidable, use one that doesn't expose
   recipient addresses to other affected users; never put recipients in To or CC.
4. **If the normal mail provider is compromised** (Resend, or the domain's mail routing),
   the incident lead explicitly chooses an alternative trusted channel and records why.
   Don't default to the Gmail mailbox: it's a personal account under consumer terms with
   no processor contract (`privacy.html` §3), so it has to be a deliberate choice, not a
   fallback.
5. **Keep a record** of the notification date, method and population notified
   (Appendix A).

---

## 6. The AP's notification route

> Verified against the AP's own pages on 5 October 2026: "This is how you report a data
> breach" (last edited 22 July 2026), "Reporting or not reporting a data breach", "This is
> how you inform victims about a data breach", and the AP's *Questionnaire personal data
> breach notification form* (v1.0, September 2022). Links are in the sourcing table. The
> AP changes these pages; re-read them during the dry run (see follow-ups).

- **Where:** only through the online **Meldformulier datalekken**,
  `https://datalekken.autoriteitpersoonsgegevens.nl/` (Dutch only). The AP accepts no
  notification by phone, post or email.
- **Login:** none. An earlier draft of this file said DigiD was required, from secondary
  sources. That is wrong: the AP's pages mention no DigiD or eHerkenning, and the form's own
  configuration enables its `no-login` plugin. It's unauthenticated, not anonymous: you
  give the controller's name and address and a contact person inside it (see the form
  sections below).
- **Browser:** a current Chrome, Firefox, Edge or desktop Safari, with JavaScript on. The
  form says Safari on iOS is **not supported yet**, so don't plan to file from an iPhone.
- **Prepare with the questionnaire.** The AP publishes every question of the form as a
  Word document so you can collect the answers first. Its sections: international aspects
  (does the breach affect people in several countries?), the notifying organisation, a
  timeline, the breach itself, the personal data involved, the affected people, measures
  taken before, consequences and risk, and measures taken after. The answers this file
  already gives you:
  - **Organisation (3.1):** name and address are required; the Chamber of Commerce and
    DPO numbers are optional. MoiCheck has no legal entity, so give the owner's name and
    address and say that MoiCheck is a private, non-commercial project.
  - **Contact person (3.2):** must be reachable on a direct number during office hours on
    the day after the notification. That is the owner.
  - **Timeline (4):** the form asks separately when the incident was *discovered* and
    when you *became aware* that it was a breach. Appendix A records both. If it's past 72
    hours, it asks why (4.5).
  - **Investigation (5.2.3):** for a hack it asks whether a (forensic) investigation was
    done, with an upload for the report or a field to explain why not. The AP expects the
    investigation to address whether data were accessed or copied, and whether the logs
    can rule that out. Section 2 and section 7 give the honest answer to the last part.
  - **Scope:** the number of data records (6.3.1), and the number of people as an exact
    figure **or a minimum and maximum** (7.3). That fits the "from at least" scoping in
    section 2.
  - **Encryption before the breach (8.1):** in practice "no". Supabase encrypts storage
    at rest, but that doesn't make data unintelligible to someone reading through the API.
  - **Informing the people affected (10):** whether, when, how and with what content;
    paste the Appendix C text.
  - Have the Article 30 record (#87) and the Appendix A record to hand: the questionnaire
    lists both as information you'll need.
- **Submitting:** a confirmation with a **notification number** appears on screen. Save or
  print it **straight away**, because the notification can't be opened online after you
  leave. If you see an error or a blank screen after sending, it may not have arrived:
  submit again.
- **Partial notification:** for a complex breach, send a preliminary notification within
  72 hours and supplement it as you learn more. Supplements, corrections and withdrawals
  go through the same form, using the notification number. A lost number can be requested
  on 070-8888 500.
- **Late:** a notification after 72 hours needs a reason, and the AP accepts one only in
  exceptional cases. Weekend, holiday, illness and being busy are listed as **not** valid.
- **Afterwards:** the AP usually doesn't reply. If it has questions, it contacts you
  within two weeks.
- **Questions about the procedure:** 088-1805 255, for organisations only.
- **Processor-side breach:** you, as controller, still file unless you've given the
  processor written authorisation to file for you. MoiCheck hasn't given any, so you file.

---

## 7. Log retention: can a breach be investigated at all?

**Short answer: only if it is noticed within about a day.** That is the weakest point of
this setup, as #88 said, and nothing in this file can fix it. It's recorded here so the
decision is a conscious one.

Supabase retention by plan, from supabase.com/pricing (checked 4 October 2026):

| Plan | Logs (API, Auth, Postgres, Functions) | Organization audit log | Backups |
| --- | --- | --- | --- |
| **Free (current)** | **1 day** | **None** (Team and Enterprise only) | None you can restore. Supabase quietly keeps up to 7 daily backups, usable only after upgrading; see below |
| Pro (from $25/month) | 7 days | None (Team and Enterprise only) | Daily, kept 7 days; point-in-time recovery as a paid add-on |
| Team | 28 days | 28 days | Daily, kept 14 days |
| Enterprise | 90 days | Included | Custom |

What that means in practice:

- **Free:** a breach found a week later can't be scoped from Supabase's side at all. The
  honest answer to "how many people, over what window" would be "everyone who had an
  account, over an unknown window". That answer is also what decides Art. 34 in the
  worst direction: you can't show that the notes weren't read.
- **Pro:** a week covers the realistic case of a user reporting something odd a few days
  later. It doesn't cover a quiet exfiltration found a month later.
- **Team:** 28 days covers most cases, at a price this project's income doesn't support
  ([#152](https://github.com/Dor-bl/moi-app/issues/152) records the same constraint for
  the mailbox).

**Backups.** Settled on 7 October 2026. The Supabase organisation is confirmed on the
**Free** plan (via the Supabase connector). Supabase's own documentation says two things
that together explain the earlier contradiction:

- *Database Backups* guide: daily backups are a feature of Pro, Team and Enterprise only.
  Free projects are told to take their own exports with `supabase db dump`.
- Troubleshooting note *"Will backups be accessible from the dashboard immediately after
  upgrading to a paid plan?"*: Supabase is "currently taking up to 7 daily backups" of
  free projects, which become available once you upgrade, and "might no longer make
  daily backups for free projects in the future".

So `privacy.html` is right that backups exist, for now, and the pricing page is right that
Free gets none you can use. Two consequences:

- **Availability side of a breach:** on Free, a deleted or overwritten `user_progress`
  can't be restored from the dashboard. The only way back is to upgrade to Pro inside
  the 7-day window and use one of those backups, if they still exist, and the clock is
  7 days. **Never restore in place.** A dashboard restore rolls back the *whole*
  database: it would bring back accounts deleted since the backup, which `privacy.html`
  §5 promises never happens, and overwrite every legitimate change made since. Restore
  the backup into a **new, separate project** instead (Supabase docs, *Database Backups*
  → "Restore to a new project"), and copy back only the affected users' vandalised
  `user_progress` rows. Skip any user whose account no longer exists in the live
  project. Delete the temporary project afterwards, since it holds a full copy of the
  data.
- **Erasure side:** a deleted account can live on in those backups for up to 7 days.
  That's the backup position [#87](https://github.com/Dor-bl/moi-app/issues/87) has to
  write down. `privacy.html` already says backups age out on their own schedule, which
  stays accurate. It doesn't say how long, which is a wording question for
  [#86](https://github.com/Dor-bl/moi-app/issues/86).

**Options, for the owner to decide:**

1. **Stay on Free and accept it.** Record that a late-discovered breach will be notified
   as maximum scope (all accounts, unknown window, notes assumed read).
2. **Move to Pro.** Seven days of logs and restorable backups. Still no platform audit
   log, which needs Team or above. Recurring
   cost, the same objection as #152.
3. **Reduce the blast radius instead of extending visibility.** Done in part: the
   `SUPABASE_JWT_SECRET` was removed from Vercel on 7 October 2026, which took out the
   most damaging entry point at no cost. What remains is checking whether legacy HS256
   verification is still on (audit follow-up).
4. **Look at the logs routinely.** Review the Supabase API logs for `user_progress`
   requests outside the app's shape as defined in section 3 (per method: a `GET` or
   `DELETE` without the caller's own `user_id` filter, any `anon` request, `PATCH`/`PUT`,
   unusual volume; a `POST` upsert has no filter by design). These are suspicious *requests*, not proven reads: the logs don't
   show returned rows. The cadence has to match retention: on Free (1 day) only a
   **daily** look gives continuous coverage; a weekly one samples a single day and
   leaves the other six unseen. On Pro (7 days) weekly is enough. Either way it's only as
   good as the habit, which is the argument for option 2 if this is to be relied on.

Option 3 should happen regardless. Between 1 and 2, this file takes no position.

---

## Appendix A: incident record template

```
Incident ID:          YYYY-MM-DD-short-name
Discovered (UTC):     ____  How: ____
Became aware (UTC):   ____  (the AP form asks for both; the 72 hours run from this one)
Suspected entry point: ____

Known:
-
Suspected:
-

Timeline (UTC):
- hh:mm  action / finding

Evidence saved (file, sha256):
-

Scope:   data ____ | records ____ | people exact ____ or min ____ / max ____
         categories ____ | window ____ (log coverage: from ____)
Breach under Art. 4(12)?            yes / no, because ____
Art. 33 notify AP?                  yes / no, because ____
  AP notification number: ____   submitted (UTC): ____   complete / partial (next update by ____)
  Confirmation saved as: ____   (it can't be retrieved online later)
Art. 34 notify users?               yes / no, because ____  (full reasoning: section 5, "Document the decision")
  sent (UTC): ____   to how many: ____   via: ____
Containment actions and what they broke:
-
Restored service (UTC): ____
Follow-ups:
-
```

Keep the completed record privately for at least as long as any resulting AP case is
open. Records of breaches that weren't notified are kept too.

## Appendix B: SQL for scoping

Run in the Supabase SQL editor (it runs as a privileged role, so RLS doesn't apply to it).

```sql
-- RLS state snapshot: run BEFORE changing anything, save the output
select schemaname, tablename, rowsecurity
  from pg_tables where schemaname = 'public';
select * from pg_policies where schemaname = 'public';
select grantee, privilege_type
  from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'user_progress';

-- Affected-set snapshot: run during step 2 and save BOTH exports as CSV with the
-- incident record (encrypted; see step 2). Scoping and notices are derived from
-- these frozen files, not from the live tables, because users untick items,
-- clear notes and delete accounts after the fact.

-- (1) Full progress rows as they are now
select user_id, item_id, date, note
  from public.user_progress;

-- (2) User id to email mapping as it is now (a deleted account loses its email)
select id as user_id, email, created_at, last_sign_in_at,
       raw_user_meta_data   -- Google profile name and avatar URL, where present
  from auth.users;

-- (3) Session snapshot: run BEFORE ending sessions (step 4), because the delete
--     removes these rows. Add "where user_id in (...)" when only some users are
--     affected. Shows where and from what each session was used.
select id, user_id, created_at, updated_at, refreshed_at, not_after,
       aal, ip, user_agent
  from auth.sessions;
-- ...and the refresh-token metadata that the delete cascades away. Leave out
-- the token and parent columns: those are live credentials.
select id, session_id, user_id, created_at, updated_at, revoked
  from auth.refresh_tokens;

-- Per-user counts, for the AP form, computed from (1):
--   progress rows per user_id, and rows where note is non-empty

-- How many people, and how many with each category of data.
-- For the AP form, compute these from the frozen exports (1) and (2), not
-- from these live-table queries: containment comes after the snapshot, and
-- users keep unticking, clearing notes and deleting accounts in between. The
-- live queries below are only for when no snapshot was taken, or for comparing
-- against it (a drop shows how much changed since).
select count(*) as accounts from auth.users;
select count(distinct user_id) as users_with_progress from public.user_progress;
select count(distinct user_id) as users_with_notes
  from public.user_progress where coalesce(note, '') <> '';
select count(*) as progress_rows,
       count(*) filter (where coalesce(note, '') <> '') as rows_with_notes
  from public.user_progress;

-- Recipient list for an Art. 34 notice (export as CSV; handle as confidential).
-- Pick the variant matching the scope you established in section 2. Don't
-- reuse one across incidents: each answers a different question.
--
-- Build (b), (c) and (d) from the frozen exports saved in step 2: pick the
-- affected user_ids from export (1) (or from the logs), then take their emails
-- from export (2). The live tables have lost every row, note and account
-- deleted since then, and (d) below only works for accounts that still exist. The snapshot has a blind spot too: rows deleted between
-- the start of the exposure and the snapshot are gone on Free (no restorable
-- backups, section 7). If the exposure started well before the snapshot,
-- prefer (a), or widen the set from the logs.

-- (a) Everyone: auth.users exposed, signing key leaked, malicious deploy or
--     session theft without logs that narrow it.
--     Use EVERY email in export (2). Don't query the live table: an affected user
--     who deleted their account after the snapshot would be missed.

-- (b) Only accounts whose progress was exposed: distinct user_ids in export (1)
-- (c) Only accounts whose notes were exposed: user_ids in export (1) with a non-empty note
--     For both, look the emails up in export (2).

-- (d) Live lookup for an explicit affected set, if export (2) wasn't taken; misses
--     accounts deleted since the incident
select email from auth.users
 where id = any (array['<uuid>', '<uuid>']::uuid[]);
```

Restore grants after an RLS containment (step 4), once the corrected policy has been
validated. Don't restore the snapshot as it stands: it was taken *during* the incident, so
it is evidence, not a trusted baseline, and an attacker-added grant would be in it. Nor is
there a written baseline to copy: the setup SQL in `README.md` adds no grants of its own.
Restore only what the app needs, `grant select, insert, update, delete on
public.user_progress to authenticated;`, and nothing for `anon`. Then compare with the
snapshot: anything else in it (a grant to `anon`, another role, another privilege) is a
finding to investigate, not something to restore.

## Appendix C: user notification email (Art. 34(2))

Article 34(2) requires plain language and at least: the nature of the breach, a contact
point, the likely consequences, and the measures taken or proposed. The AP's guidance on
warning messages adds what it checks for, and the template follows it: an alarming subject
line, short sentences, the specific data items (not "data such as"), concrete advice rather
than a general "be alert to phishing", and a separate message per group if different
people lost different data. If you don't know everything yet, send a preliminary message
now and a follow-up later; the AP recommends that over waiting.

Fill the brackets; delete the bracketed alternatives that don't apply. Send each user the
language they used in the app if you know it, otherwise both, Dutch first.

### English

> **Subject:** Important: data breach involving your MoiCheck data
>
> Hi,
>
> We're writing because a security incident at MoiCheck affected data linked to your
> account, and you have a right to know what happened.
>
> **What happened.** On [date], [plain description, e.g. "a configuration error made it
> possible for someone outside MoiCheck to read the bucket-list progress stored in our
> database"]. We discovered this on [date] and closed it on [date].
>
> **What data was involved.** [Your email address] [and] [the bucket-list items you ticked
> off, with the dates you ticked them off] [and the memory notes you wrote]. MoiCheck
> doesn't ask for passwords, payment details or ID documents. [Only if the affected notes
> were reviewed and contain none: So none of those were involved.]
>
> **What this could mean for you.** [Someone could learn which places in Groningen you
> visited and roughly when.] [Anything you wrote in a memory note may have been read.]
> [You may receive emails pretending to be from MoiCheck. We will never ask you for a
> password or payment.]
>
> **What we have done.** [e.g. "We fixed the configuration, signed everyone out, replaced
> our access keys, and reported the incident to the Dutch Data Protection Authority
> (Autoriteit Persoonsgegevens)."]
>
> **What you can do.** [If your notes contained anything you consider sensitive, you can
> edit or delete them in the app, or delete your account and all its data from your
> profile.] Be wary of unexpected emails mentioning MoiCheck.
>
> **Questions.** Write to [hallo@moicheck.nl, or, if Resend, Cloudflare or the mailbox is
> affected, the trusted address you're sending this from]. You also have the
> right to complain to the Autoriteit Persoonsgegevens.
>
> We're sorry this happened.
>
> MoiCheck

### Nederlands

> **Onderwerp:** Belangrijk: datalek met jouw gegevens bij MoiCheck
>
> Hoi,
>
> We mailen je omdat er bij MoiCheck een beveiligingsincident is geweest waarbij gegevens
> van jouw account betrokken waren. Je hebt het recht te weten wat er is gebeurd.
>
> **Wat er is gebeurd.** Op [datum] [beschrijving in gewone taal, bijv. "kon door een
> configuratiefout iemand buiten MoiCheck de voortgang van bucketlijsten in onze database
> inzien"]. We hebben dit op [datum] ontdekt en op [datum] verholpen.
>
> **Om welke gegevens het gaat.** [Je e-mailadres] [en] [de onderdelen van de bucketlijst
> die je hebt afgevinkt, met de datum waarop je ze afvinkte] [en de herinneringen die je
> erbij hebt geschreven]. MoiCheck vraagt niet om wachtwoorden, betaalgegevens of
> identiteitsbewijzen. [Alleen als de betrokken herinneringen zijn nagekeken en daar geen
> van deze gegevens in stonden: Zulke gegevens zijn dus niet betrokken.]
>
> **Wat dit voor jou kan betekenen.** [Iemand kan te weten komen welke plekken in
> Groningen je hebt bezocht en ongeveer wanneer.] [Wat je in een herinnering hebt
> geschreven, kan zijn gelezen.] [Je kunt e-mails krijgen die zich voordoen als MoiCheck.
> Wij vragen je nooit om een wachtwoord of betaling.]
>
> **Wat wij hebben gedaan.** [bijv. "We hebben de configuratie hersteld, iedereen
> uitgelogd, onze toegangssleutels vervangen en het incident gemeld bij de Autoriteit
> Persoonsgegevens."]
>
> **Wat je zelf kunt doen.** [Stond er in je herinneringen iets wat je gevoelig vindt? Dan
> kun je die in de app aanpassen of verwijderen, of je account met alle gegevens
> verwijderen via je profiel.] Wees alert op onverwachte e-mails waarin MoiCheck wordt
> genoemd.
>
> **Vragen?** Schrijf naar [hallo@moicheck.nl, of, als Resend, Cloudflare of de mailbox
> getroffen is, het vertrouwde adres waarvandaan je dit verstuurt]. Je hebt ook het
> recht een klacht in te dienen bij de Autoriteit Persoonsgegevens.
>
> Het spijt ons dat dit is gebeurd.
>
> MoiCheck

---

## Sourcing

| Claim | How it was established |
| --- | --- |
| Tables, columns, RLS policy, `delete_user()` | `README.md` setup SQL and `js/auth.js` at commit `ffd7995`. The live database may differ; the Appendix B snapshot is the check |
| Data categories, processors, Google profile name | `privacy.html` §1–§4 (last updated 24 September 2026) |
| Account chain, regions | [`account-hosting-audit.md`](account-hosting-audit.md), 13 September 2026 |
| `SUPABASE_JWT_SECRET` removed from Vercel, not rotated | Owner, 7 October 2026; recorded in the audit §2 (owner-reported, not independently verified) |
| Supabase retention and backups per plan | supabase.com/pricing, read 4 October 2026 |
| Platform (organization) audit logs are Team and Enterprise only | Supabase docs, *Platform Audit Logs*, read 7 October 2026. This overrides the pricing page's audit-log figures for Free and Pro recorded on 4 October |
| Key rotation vs. ending sessions | Supabase docs, *JWT Signing Keys* and *User sessions*, read 7 October 2026; the legacy secret can no longer be rotated in place (*Rotating Anon, Service, and JWT Secrets*, read 8 October 2026). The refresh-token cascade on `auth.sessions` was checked against this project's schema the same day |
| Plan is Free; Free projects' backups (up to 7 daily, restorable only after upgrading) | Supabase connector (organisation plan `free`), and Supabase docs *Database Backups* and the troubleshooting note on backups after upgrading, read 7 October 2026 |
| AP form route, no login, submission, partial and late notifications, contact numbers | AP, [This is how you report a data breach](https://www.autoriteitpersoonsgegevens.nl/en/themes/security/data-breaches/this-is-how-you-report-a-data-breach) (last edited 22 July 2026), read 5 October 2026; "no login" also from the form's own configuration (`no-login` plugin) and its browser notice |
| Form questions | AP, [Questionnaire personal data breach notification form](https://www.autoriteitpersoonsgegevens.nl/en/documents/questionnaire-personal-data-breach-notification-form) (v1.0, September 2022), read 5 October 2026 |
| Art. 34 threshold and risk assessment approach | EDPB [Guidelines 9/2022 on personal data breach notification](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-92022-personal-data-breach-notification-under_en) (28 March 2023), chapter IV |
| "When in doubt, report"; email and location profiling as risk factors | AP, [Reporting or not reporting a data breach](https://www.autoriteitpersoonsgegevens.nl/en/themes/security/data-breaches/reporting-or-not-reporting-a-data-breach) (last edited 9 April 2025) |
| Warning-message recommendations | AP, [This is how you inform victims about a data breach](https://www.autoriteitpersoonsgegevens.nl/en/themes/security/data-breaches/this-is-how-you-inform-victims-about-a-data-breach) |
| Articles 4(12), 33, 34 | GDPR text |

## Follow-ups

- [x] **Owner review of section 5**: done 7 October 2026; the section 5 rework applies it.
- [ ] **Owner review** of section 6 and the Dutch email. This is a draft, not legal advice.
- [x] **Verify section 6 on the AP website**: done 5 October 2026. The DigiD claim was
      wrong and is removed; the form has no login.
- [ ] **Download the AP questionnaire** and fill in the parts that don't depend on an
      incident (organisation, contact person, sector), so they're ready.
- [ ] **Decide on log retention** (section 7, options 1–2) and record the decision here.
- [x] **Remove `SUPABASE_JWT_SECRET` from Vercel**: done by the owner on 7 October 2026;
      not rotated, by decision (audit §2).
- [x] **Settle the backups question**: done 7 October 2026 (section 7). The backup and
      erasure position itself still needs writing down under
      [#87](https://github.com/Dor-bl/moi-app/issues/87).
- [ ] **When #87 lands**, replace section 2's store table with a link to the register.
- [ ] **Dry run once**: walk the first-60-minutes steps against the real dashboards to
      check every screen named here exists and every export works.
