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
investigate it. The one exception: if data is visibly leaking *right now* (for example,
the table is readable without signing in), do the containment in step 4 first and preserve
immediately after. Exporting logs takes minutes; an open table loses data every second.

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
| Supabase → Logs Explorer: **API Gateway** and **PostgREST** | Export every request touching `user_progress`, `rpc/delete_user` and `auth/v1` for the full available window | 1-day retention on Free. This is the only record of *who read which rows* |
| Supabase → **Auth** logs | Export the full window | Sign-ins, magic-link requests, token refreshes |
| Supabase → organization **audit log** | Screenshot or export | Retained for **1 hour** on Free. Shows dashboard actions such as key rotation and policy changes |
| Supabase → **Postgres** logs | Export | Errors, DDL (for example a dropped policy) |
| Supabase → **Edge Functions** → `contact` → logs | Export | Contact relay invocations |
| Supabase → SQL: RLS state | Run the [snapshot query](#appendix-b-sql-for-scoping) and save the output | Proves which policies existed *before* you changed them |
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
  for the affected source (unless the leak is live, as above).
- If the entry point is the repository or a deployment, note the current `main` SHA and the
  live deployment ID. Don't force-push or delete branches.

### Step 4: Contain (20–30 minutes)

Pick the row matching the suspected entry point. Each action breaks something for real
users; that's accepted. Write down what you changed and when.

| Suspected entry point | Containment | What it breaks |
| --- | --- | --- |
| **RLS misconfiguration**: `user_progress` readable or writable beyond the owner | `revoke all on public.user_progress from anon, authenticated;` (the restore statement is in Appendix B) | Cloud sync stops for everyone; guest mode keeps working from `localStorage` |
| **Leaked signing secret or privileged key** (`SUPABASE_JWT_SECRET`, a `service_role` / secret key; see the open item in [`account-hosting-audit.md`](account-hosting-audit.md) §2) | Supabase → Project Settings → API / JWT Keys: roll the secret and revoke the leaked key. If the anon key changes, update `config.js` and redeploy | Every session is invalidated, so everyone is signed out. The site errors until the new anon key is deployed |
| **Stolen user sessions** (for example via injected script) | Same rotation as above: rotating the signing key is what invalidates issued tokens | As above |
| **Supabase dashboard account** | Change password, revoke other sessions, re-check MFA, then treat as "leaked privileged key" | As above |
| **GitHub or Vercel account; malicious deploy** | Roll back to a known-good deployment in Vercel (Instant Rollback), revoke tokens/deploy keys, change password, re-check MFA. Then rotate Supabase keys, because a malicious script could have read sessions | Nothing user-visible beyond the rollback |
| **Contact relay** (`supabase/functions/contact`) | Supabase → Edge Functions: delete or disable `contact`; rotate `RESEND_API_KEY` with `supabase secrets set` | Contact form fails; users can still email `hallo@moicheck.nl` |
| **Resend account** | Rotate the API key and SMTP credentials; check sending domains and logs for unknown sends | Magic-link sign-in and the contact form stop until new credentials are in Supabase |
| **Google mailbox** (`hallo@moicheck.nl`'s destination) | Change password, sign out all sessions, review forwarding rules, filters and third-party app access | None |
| **Cloudflare** | Change password, re-check MFA, restore Email Routing rules to the documented state | None |
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
| Supabase automated backups | Copies of both tables above | As above | Supabase audit log for restores/downloads | 1 hour (audit log) |
| Contact relay (Edge Function) | Nothing at rest. Caller IP in memory for rate limiting only ([`account-hosting-audit.md`](account-hosting-audit.md) §4) | Contact-form users | Edge Function logs | 1 day |
| Resend | Recipient address of every magic-link email and contact relay, with a one-time sign-in token; the contact message content | Magic-link users; contact-form users | Resend logs | Resend's own (stated 30 days; unverified, see `privacy.html` §4) |
| Gmail mailbox behind `hallo@moicheck.nl` | Every contact-form message and direct email: name, address, free text | Anyone who wrote in | Google account activity | Google's |
| Users' browsers (`localStorage`) | Progress, notes, event badges, preferences | Each user, on their own device | n/a: we hold none of it | n/a |
| Vercel Web Analytics | Aggregates only; no per-visitor data reaches us | n/a | n/a | n/a |

Not in the system at all: passwords (sign-in is magic link or Google only), payment data,
government IDs, any field designed for special-category data, and location (the "I'm here"
check runs on the device and stores nothing; see `privacy.html` §1).

### Entry points, and what each one could reach

| Entry point | Reaches |
| --- | --- |
| RLS policy dropped or mis-edited | `user_progress`: all rows, read and write. Not `auth.users` (anon/authenticated roles can't read it) |
| `SUPABASE_JWT_SECRET` / `service_role` / secret key | Everything in the database, including `auth.users`. The JWT secret is **still deployed in Vercel** at the time of writing (open item in the audit). Close it and this row gets much less likely |
| Supabase dashboard account | Everything in Supabase, including backups and logs |
| GitHub or Vercel account (malicious deploy) | Anything a signed-in user's browser can see: their session, progress and notes. Only users who loaded the site during the malicious deployment's lifetime; Vercel's deployment list gives that window exactly |
| Resend account | Recipient addresses, contact messages, and live magic-link tokens for links not yet used (account takeover while they're valid) |
| Google mailbox | All contact correspondence, plus password-reset mail for the other accounts, which makes this the top of the chain |
| Cloudflare | Future mail to `hallo@moicheck.nl` (redirect), not past mail |

### Answering the four questions the AP form asks

1. **Which data?** Match the entry point to the rows above.
2. **How many people?** Run the counts in [Appendix B](#appendix-b-sql-for-scoping). For a
   malicious-deploy window, use `last_sign_in_at` within the window as an upper bound and
   say that it is one.
3. **Which categories?** Contact data (email, name); app usage records (progress with
   dates); free-text notes; for the mailbox, correspondence.
4. **Over what time window?** The earliest evidence of access to the containment time. If
   the logs don't reach back to the start, **say so explicitly** and give the window as
   "from at least [log start], possibly earlier". Don't narrow it to what the logs happen
   to cover.

---

## 3. Is it a personal data breach at all?

A personal data breach is a security incident that leads to accidental or unlawful
**destruction, loss, alteration, unauthorised disclosure of, or access to** personal data
(Art. 4(12)). Three useful tests:

- *A vulnerability with no evidence of access* (for example, a too-wide RLS policy found
  in review, with logs showing no foreign reads) is not a breach. Record it as a security
  incident in Appendix A and fix it. If the logs **don't reach back** far enough to show
  that, you can't conclude "no access". Treat it as a breach with unknown scope.
- *Availability counts.* Losing data with no backup to restore it is a breach even if
  nobody else saw it.
- *A misdirected email* (for example, replying to the wrong contact-form sender) is a
  breach. Usually a small one, but it still goes in the record.

Whatever the answer, **record it** (Art. 33(5)). The record of breaches you decided not to
notify is the first thing the AP asks for if one later surfaces.

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

The default is **notify**. The exemption is "unlikely to result in a risk", which is a
low bar to fail: an exposed list of email addresses tied to a named app is usually a risk
(phishing). Late notification has to come with reasons for the delay (Art. 33(1)), and
"we were still investigating" is weaker than a partial notification on time.

**Partial notification route.** Article 33(4) allows information to be provided in
phases. Use it: an on-time notification that says "scope still under investigation; we
will supplement by [date]" is what the article envisages. Don't wait for the logs
analysis to finish.

---

## 5. Article 34: tell the users? (pre-drafted risk assessment)

Individuals must be notified "without undue delay" when the breach is likely to result in
a **high** risk to their rights and freedoms (Art. 34(1)). The test is likelihood ×
severity of harm to the *people*, not harm to MoiCheck.

This assessment was written in advance for this dataset. On the day, start from it and
adjust for the facts; don't start from a blank page.

### What lowers the risk (true of this system in general)

- **No credentials.** There are no passwords to reuse elsewhere. Magic-link tokens are
  one-time and short-lived; sessions die when the signing key is rotated.
- **No financial data, government IDs, or special-category fields.**
- **No location tracking.** The location check for event badges never leaves the device.
- **Narrow audience and purpose.** A bucket list for one city. The data says what someone
  did for fun, not their health, finances or beliefs.
- **Data stored in the EU** (Supabase `eu-west-1`), with processor contracts for
  Supabase, Resend, Cloudflare and Vercel.

### What raises it (the honest counterweight)

- **Memory notes are free text.** A user can write anything: who they were with, how they
  were feeling, a health detail, a name. We can't rule out special-category data or
  third-party data in a note, and we don't know what is there without reading it. If notes
  were exposed, assume some contain sensitive content.
- **Progress rows are dated location history.** Every `item_id` maps to a public place
  with coordinates in `BUCKET_LIST`. A row of `item_id` + `date` reads as "this person was
  probably at this place around this date". That is the tick-off time, not proof of
  presence, but a reader can't tell the difference. Tied to an email address, a set of
  rows sketches someone's movements and habits around Groningen.
- **Email addresses are identifying.** Joined with the rows above, there is no
  pseudonymisation to fall back on.
- **Contact-form messages are free text too**, and the mailbox holding them has no
  processor contract (`privacy.html` §3).

### Pre-assessed outcomes

| What was exposed | Likely risk level | Art. 33 (AP) | Art. 34 (users) |
| --- | --- | --- | --- |
| Email addresses only (no progress) | Risk (phishing, confirmation of use of the app) | Notify | Usually not required. Consider a short courtesy notice |
| Progress rows **without** notes, with or without emails | Risk; leans high when tied to emails, because of the location-history reading | Notify | Decide on the facts. Lean towards notifying if emails were included and the window is long |
| Notes (with or without emails) | **High**: free text, sensitive content can't be excluded | Notify | **Notify** |
| Contact-form messages (mailbox, Resend) | Depends on content: review the affected messages | Notify | Notify the affected senders if any message holds sensitive content |
| Live session tokens or magic-link tokens, with access used | Same as whatever the accounts could read: own progress and notes | Notify | Notify affected users |
| Data altered or deleted without exposure (for example, a write-open RLS policy abused to vandalise rows) | Risk (integrity and availability) | Notify | Notify affected users if progress or notes can't be restored |

### Exceptions to Article 34 (Art. 34(3))

Individual notification is not required if: (a) the data was unintelligible to the
attacker (for example, encrypted with a key that wasn't compromised; not the case for
anything here); (b) measures taken since mean the high risk is no longer likely to
materialise; or (c) it would take disproportionate effort. In case (c), use a public
communication instead, such as a banner on moicheck.nl. With a few hundred accounts and
every address on file, (c) won't realistically apply.

### Sending the notice

There is no mailing tool. Export the affected addresses (Appendix B) and send through the
existing Resend account in individually addressed messages, or **not** through Resend if
Resend is the compromised party; use the Gmail account in batches with BCC in that case.
Never put recipients in To/CC.

---

## 6. The AP's notification route

> Recorded from secondary sources on 4 October 2026: the AP's own site was not reachable
> from the environment this was drafted in. **Re-check on the AP website
> (autoriteitpersoonsgegevens.nl → "Datalek melden") before relying on it, and update this
> section.**

- **Where:** the AP's online data breach notification form ("meldloket datalekken") on
  autoriteitpersoonsgegevens.nl. There is no email or phone route for the formal
  notification.
- **Login:** the form requires DigiD (as a natural person) or eHerkenning (as an
  organisation). MoiCheck has no legal entity, so this is the owner's **DigiD**. Check
  now that the DigiD login works and the app is installed. Discovering at hour 70 that
  it doesn't is the scenario this file exists to prevent.
- **What it asks** (the Art. 33(3) minimum, which the form follows):
  - the nature of the breach: what happened, when, when discovered, how;
  - categories and approximate number of people affected;
  - categories and approximate number of records affected;
  - a contact point: `hallo@moicheck.nl`;
  - the likely consequences (section 5);
  - measures taken or proposed, including mitigation (section 1, step 4);
  - whether and how individuals have been or will be notified.
- **Incomplete notifications** can be submitted and supplemented later (Art. 33(4)).
  Keep the reference number the form gives you; supplements and withdrawals are made
  against it.
- **Save** a copy (PDF or screenshots) of everything submitted into the incident record.

---

## 7. Log retention: can a breach be investigated at all?

**Short answer: only if it is noticed within about a day.** That is the weakest point of
this setup, as #88 said, and nothing in this file can fix it. It's recorded here so the
decision is a conscious one.

Supabase retention by plan, from supabase.com/pricing (checked 4 October 2026):

| Plan | Logs (API, Auth, Postgres, Functions) | Organization audit log | Backups |
| --- | --- | --- | --- |
| **Free (current)** | **1 day** | **1 hour** | Listed as "not included" on the pricing page; see note below |
| Pro (from $25/month) | 7 days | 7 days | Daily, kept 7 days; point-in-time recovery as a paid add-on |
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

**Backups.** `privacy.html` §3 and §5 say Supabase takes automated backups of the
project. The pricing page lists backups as "not included" on Free. It is possible both are
true (internal backups the customer can't download versus customer-facing backups), but
this isn't settled. Check the dashboard (Database → Backups) and correct whichever is
wrong. That wording belongs to [#86](https://github.com/Dor-bl/moi-app/issues/86). It also
matters for the availability side of a breach: without a restorable backup, any deletion
of `user_progress` is permanent.

**Options, for the owner to decide:**

1. **Stay on Free and accept it.** Record that a late-discovered breach will be notified
   as maximum scope (all accounts, unknown window, notes assumed read).
2. **Move to Pro.** Seven days of logs and audit trail, restorable backups. Recurring
   cost, the same objection as #152.
3. **Reduce the blast radius instead of extending visibility.** Closing the
   `SUPABASE_JWT_SECRET` item in the audit removes the most damaging entry point outright.
   That costs nothing, and it is the best risk reduction available.
4. **Look at the logs routinely.** A weekly glance at the Supabase API logs for unusual
   `user_progress` reads (volume, foreign `user_id`s) turns "found a month later" into
   "found within the window". It's cheap, but only as good as the habit.

Option 3 should happen regardless. Between 1 and 2, this file takes no position.

---

## Appendix A: incident record template

```
Incident ID:          YYYY-MM-DD-short-name
Became aware (UTC):   ____  How: ____
Suspected entry point: ____

Known:
-
Suspected:
-

Timeline (UTC):
- hh:mm  action / finding

Evidence saved (file, sha256):
-

Scope:   data ____ | people ____ | categories ____ | window ____ (log coverage: from ____)
Breach under Art. 4(12)?            yes / no, because ____
Art. 33 notify AP?                  yes / no, because ____
  AP reference: ____   submitted (UTC): ____   complete / partial (next update by ____)
Art. 34 notify users?               yes / no, because ____
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

-- How many people, and how many with each category of data
select count(*) as accounts from auth.users;
select count(distinct user_id) as users_with_progress from public.user_progress;
select count(distinct user_id) as users_with_notes
  from public.user_progress where coalesce(note, '') <> '';
select count(*) as progress_rows,
       count(*) filter (where coalesce(note, '') <> '') as rows_with_notes
  from public.user_progress;

-- Accounts active in a suspected window (malicious-deploy / session-theft scoping)
select count(*) from auth.users
 where last_sign_in_at between '<start>' and '<end>';

-- Recipient list for an Art. 34 notice (export as CSV; handle as confidential)
select email from auth.users where id in (
  select distinct user_id from public.user_progress   -- narrow to the affected set
);
```

Restore grants after an RLS containment (step 4), once the policy is confirmed correct.
These are Supabase's default grants on `public` tables:

```sql
grant select, insert, update, delete on public.user_progress to authenticated;
grant select, insert, update, delete on public.user_progress to anon;  -- RLS still applies
```

## Appendix C: user notification email (Art. 34(2))

Article 34(2) requires plain language and at least: the nature of the breach, a contact
point, the likely consequences, and the measures taken or proposed. Fill the brackets;
delete the bracketed alternatives that don't apply. Send each user the language they used
in the app if you know it, otherwise both, Dutch first.

### English

> **Subject:** Security incident affecting your MoiCheck account
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
> off, with the dates you ticked them off] [and the memory notes you wrote]. MoiCheck has
> no passwords, payment details or ID documents, so none of those were involved.
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
> **Questions.** Reply to this email or write to hallo@moicheck.nl. You also have the
> right to complain to the Autoriteit Persoonsgegevens.
>
> We're sorry this happened.
>
> MoiCheck

### Nederlands

> **Onderwerp:** Beveiligingsincident met gevolgen voor je MoiCheck-account
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
> erbij hebt geschreven]. MoiCheck heeft geen wachtwoorden, betaalgegevens of
> identiteitsbewijzen, dus die zijn niet betrokken.
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
> **Vragen?** Beantwoord deze e-mail of schrijf naar hallo@moicheck.nl. Je hebt ook het
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
| Account chain, regions, `SUPABASE_JWT_SECRET` still deployed | [`account-hosting-audit.md`](account-hosting-audit.md), 13 September 2026 |
| Supabase retention and backups per plan | supabase.com/pricing, read 4 October 2026 |
| AP form, DigiD/eHerkenning, partial notifications | Secondary Dutch sources; the AP site was unreachable while drafting. **Unverified: see section 6** |
| Articles 4(12), 33, 34 | GDPR text |

## Follow-ups

- [ ] **Owner review** of sections 5 and 6 and the Dutch email. This is a draft, not legal advice.
- [ ] **Verify section 6 on the AP website** and test the DigiD login now.
- [ ] **Decide on log retention** (section 7, options 1–2) and record the decision here.
- [ ] **Remove `SUPABASE_JWT_SECRET` from Vercel**: already open in the audit; the
      cheapest way to shrink this runbook's worst case.
- [ ] **Settle the backups question** (section 7) and correct `privacy.html` or this file.
- [ ] **When #87 lands**, replace section 2's store table with a link to the register.
- [ ] **Dry run once**: walk the first-60-minutes steps against the real dashboards to
      check every screen named here exists and every export works.
