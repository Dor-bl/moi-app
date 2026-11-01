# Record of processing activities (GDPR Article 30)

**Status:** draft for owner review. One item needs the owner to supply a fact — see
[Open points](#open-points).
**Date:** 30 October 2026
**Issue:** [#87](https://github.com/Dor-bl/moi-app/issues/87) (feeds
[#86](https://github.com/Dor-bl/moi-app/issues/86) the legal-basis disclosure, and closes the
last item of [#92](https://github.com/Dor-bl/moi-app/issues/92); companion:
[`retention.md`](retention.md))

## What this is

Article 30(1) asks a controller to keep one record of what it processes, why, who receives
it, where it goes, how long it is kept, and what protects it. The facts were already in the
repository — spread across `README.md`, `privacy.html`, and the decision records — but no
single document answered the question, which meant answering it took an afternoon of reading.
During an incident you do not have an afternoon.

The exemption in Article 30(5) for organisations under 250 people does not apply here: it
falls away when processing is not occasional, and MoiCheck's runs on every sign-in and every
ticked item.

**This is a record, not a policy.** It describes what the code does today, at commit
`aaca88a`. Where something ought to change, it says so and points at the issue; it does not
quietly describe the intended state as if it were the current one.

### Who should read what

| You want | Read |
| --- | --- |
| What we hold and why, in the regulator's categories | this file |
| How long each category lives, and what that means for backups | [`retention.md`](retention.md) |
| What to do when something has leaked | [`breach-runbook.md`](breach-runbook.md) |
| Which accounts hold which credentials, and the regions | [`account-hosting-audit.md`](account-hosting-audit.md) |
| What a visitor is told, in plain language | `privacy.html` |

`privacy.html` is the public statement and this is the internal record. They describe the same
system and must not drift apart: **change one, check the other.** Where this file says
something a visitor should also know and the policy doesn't say it yet, that is a #86 task and
is flagged inline.

---

## The controller

| Field | Value |
| --- | --- |
| Name | D. Blayzer, an individual, who runs MoiCheck as a personal side project. Published in `privacy.html` as initial plus surname, which identifies the controller; no postal address is published or required (Art. 13(1)(a) asks for contact details, below). That changes if MoiCheck becomes paid or ad-supported: Dutch e-commerce law (BW 3:15d) then requires a geographic address |
| Contact | `hallo@moicheck.nl` |
| Representative (Art. 27) | Not applicable — the controller is established in the EU (Netherlands) |
| DPO (Art. 37) | **None, and none required.** No public-authority processing, no large-scale monitoring, no large-scale special-category data |
| Joint controllers | None. Google acts as a separate controller for its own sign-in processing (activity 4); it is not a joint controller with us |

A DPIA under Article 35 is not triggered: there is no systematic monitoring of a publicly
accessible area, no large-scale special-category processing, and no automated decision-making
(activity 10). The location check in activity 9 is the nearest thing to monitoring, and it
never leaves the device.

---

## Processing activities

Ten activities. The first eight are processing we carry out or commission; 9 and 10 are
recorded deliberately to mark the boundary — they are the things people most often assume we
do, and we don't.

Each is given in Article 30(1) order: purpose, data subjects, data categories, recipients,
transfers, retention, measures. The **basis** line is *not* an Article 30 field. It records
the legal basis per purpose, which `privacy.html` §1 has stated publicly since 31 October 2026
([#86](https://github.com/Dor-bl/moi-app/issues/86)). The two must agree: change one, change
the other.

### 1. Accounts and cross-device sync

| | |
| --- | --- |
| **Purpose** | Identify a returning user and keep their bucket-list progress and memory notes in step across their devices |
| **Basis** | Art. 6(1)(b), performance of a contract — syncing is the service the user asked for. Not consent: refusing would mean the feature cannot work at all |
| **Data subjects** | Account holders (people who chose to sign in) |
| **Where the rows come from** | Ticks and notes made while signed in, **plus anything made while signed out in the same browser**, which `syncCloudProgress()` merges in on sign-in (activity 9) |
| **Data categories** | Email address; display name and avatar URL where Google supplied them; `user_id`; per ticked item an `item_id`, a `date`, and a free-text `note`; `created_at` and `last_sign_in_at`; provider metadata; `account_last_seen.seen_at`, the latest session activity, kept to apply the retention period. Also, in Supabase's auth internals, live sessions and refresh tokens, linked identities, and the IP address and user agent recorded against a session |
| **Recipients** | Supabase (processor, DPA). Nobody else: the app copies this into no other store |
| **Transfers** | Stored in the EU — AWS `eu-west-1`, Ireland. Supabase is a US company whose staff can reach that infrastructure to operate it, covered by its DPA and SCCs. See [`account-hosting-audit.md`](account-hosting-audit.md) §3 |
| **Retention** | Until the user deletes it, or 24 months after the account was last used, measured by sign-ins and session refreshes (copied nightly into `account_last_seen`, since sign-out deletes the session). A nightly `pg_cron` job deletes the account record and everything cascades from it. No warning email, by decision. See [`retention.md`](retention.md) §2 |
| **Measures** | Row-level security on `user_progress` scoped to `auth.uid() = user_id`; no password exists to steal (magic link and Google only); `on delete cascade` so erasing a user erases their rows; erasure via a `security definer` `delete_user()` that can only delete its own caller; TLS throughout |

**Access and portability (Arts. 15, 20).** A signed-in user can download this activity's
data themselves from the profile: `buildAccountExport()` in `js/auth.js` reads their
`user_progress` rows at click time, under the same row-level security, and adds the account
fields the client already holds (email, id, Google name and avatar URL, every linked sign-in
provider,
`created_at`, `last_sign_in_at`). It exports what is stored, not what is pending: a tick or note
whose `syncItemToCloud()` write failed lives only in that browser and is not in the file;
`privacy.html` §5 tells users so. It also omits Supabase's server-side auth records (the
sessions and refresh-token tables with their IP and user agent, Auth's audit log, the
identities row linking a Google account, and `account_last_seen`; the browser can reach none of them except the identities row), and anything held
outside this activity, such as contact correspondence (activity 2); those are answered by email,
as `privacy.html` §5 says. If a column is added to `user_progress` or a field to the account,
add it to the export too, or the file stops being complete.

Two notes a reader will otherwise trip over. **Memory notes are free text**, so a user may
have typed anything into them, including the categories we say we don't collect; the field no
longer invites them to name other people ([#204](https://github.com/Dor-bl/moi-app/pull/204))
and is capped at 1000 characters, but nothing stops them. And **`user_progress` is
location-related history**: each `item_id` maps to a known place, so a row pairs a place with
a date. "We hold no location data" would be false, and the breach runbook is right to tell you
to declare it on the AP form.

### 2. Contact form and correspondence

| | |
| --- | --- |
| **Purpose** | Receive and answer feedback, bug reports and item suggestions |
| **Basis** | Art. 6(1)(f), legitimate interest — answering someone who wrote to us asking for an answer. Rate-limiting on IP rests on the same basis: the interest is keeping the inbox usable |
| **Data subjects** | Anyone who writes in, whether through the form or directly by email |
| **Data categories** | Name, email address, subject (one of four fixed values), message body — free text. Separately and transiently, the sender's IP address |
| **Recipients** | Supabase (processor, DPA) runs the relay function; Resend (processor, DPA) delivers; Cloudflare Email Routing (processor, DPA) forwards; Google holds the resting copy in a **personal Gmail account under consumer terms, with no processor contract** — a known and disclosed gap, [#152](https://github.com/Dor-bl/moi-app/issues/152) |
| **Transfers** | Relay pinned to `eu-west-1`, Ireland, so submission is handled in the EU wherever it was sent from ([`edge-function-region.md`](../decisions/edge-function-region.md)). Everything after that leaves: Resend, Cloudflare and Google are US companies. The first three are covered by DPAs with SCCs, and for those certified under it the EU–U.S. Data Privacy Framework; **the final hop into the mailbox is not covered by any** |
| **Retention** | In the mailbox, as long as needed to deal with what was written. The relay keeps nothing at rest. Resend states 30 days for email data — *their* figure, not one we verified. See [`retention.md`](retention.md) §3 |
| **Measures** | Server-side validation and length caps (name 100, email 254, message 5000); subject must match the form's fixed set; CR/LF stripped from the subject; sender's address goes in `reply_to`, never `from`; honeypot field; best-effort in-memory rate limit, deliberately not a shared-state limiter; the IP is used to throttle and is never written down or attached to the message |

### 3. Magic-link sign-in email

Recorded separately from activity 1 because its transfer position differs: this is the one
piece of account data that leaves the EU as a matter of course rather than incidentally.

| | |
| --- | --- |
| **Purpose** | Deliver the one-time link that signs a user in without a password |
| **Basis** | Art. 6(1)(b) — the user asked to sign in this way |
| **Data subjects** | Users choosing magic-link sign-in |
| **Data categories** | Email address, plus a one-time sign-in token |
| **Recipients** | Supabase (issues the token), Resend (delivers) — both processors under DPA |
| **Transfers** | **To the US, by design.** Resend sends the mail; the address is on it. DPA with SCCs, DPF where certified |
| **Retention** | The token is single-use and short-lived. The sent message sits in Resend's logs on their retention — stated 30 days, unverified |
| **Measures** | The link points at our own origin carrying a token hash, not at Supabase's verify endpoint, so a mail scanner prefetching links cannot burn the token; nothing is verified until the user presses the button; the token is taken out of the address bar immediately so it is not left to be bookmarked or sent as a `Referer` |

Choosing Google sign-in instead avoids this activity entirely.

### 4. Google sign-in

| | |
| --- | --- |
| **Purpose** | Let a user sign in with an existing Google account instead of waiting for an email |
| **Basis** | Two parts. **The pre-choice fetch** — the visitor's request to Google when the dialog opens, which happens whether or not they go on to choose Google — is Art. 6(1)(f), legitimate interest in offering Google sign-in; 6(1)(b) cannot cover it, since a visitor who signs in by email never needed it. The balancing rests on it happening only for visitors who opened the sign-in dialog, never on an ordinary visit, and on its being disclosed in `privacy.html` §2. **Once the visitor chooses Google**, receiving their email, name and avatar is Art. 6(1)(b). Google's own processing is Google's to justify — it acts as a separate controller there, not our processor |
| **Data subjects** | Users who open the sign-in dialog — note: **opening it is enough**, choosing Google is not required |
| **Data categories** | From Google to us, via Supabase: email address, name, avatar URL. From the visitor to Google, before any choice is made: IP address, request metadata, and whatever Google's own cookies let it read |
| **Recipients** | Google; Supabase as the broker |
| **Transfers** | To the US, under Google's own terms |
| **Retention** | What we keep is activity 1's account record. Google's retention is Google's |
| **Measures** | The Google script and button are fetched only when the sign-in dialog is opened, never on an ordinary visit, so a visitor who never tries to sign in is never exposed to Google. This is a deliberate narrowing, not the default |

The pre-choice fetch is disclosed in `privacy.html` §2 and is the honest part of this row: the
visitor reaches Google by opening a dialog, before deciding anything.

### 5. Browser error reports

| | |
| --- | --- |
| **Purpose** | Find bugs that happen only in a visitor's browser and would otherwise never surface, since the site is static and has no server log |
| **Basis** | Art. 6(1)(f), legitimate interest in a working app. The balancing rests on the reports carrying no user id, session or IP by design, and on their 30-day expiry for anything the scrubber misses — not on a promise of perfect anonymity |
| **Data subjects** | Visitors whose browser hit an error — **not identifiable to us**, by design |
| **Data categories** | Error message, source location, line and column, stack, page path with query and fragment stripped, user-agent string. **No** user id, **no** session, **no** IP address |
| **Recipients** | Supabase (processor, DPA) |
| **Transfers** | Stored in the EU, `eu-west-1`. No transfer beyond activity 1's |
| **Retention** | A 30-day cutoff, enforced by a nightly `pg_cron` sweep rather than by intention. The sweep deletes rows already older than 30 days, so a report can persist for almost 31 days before its turn comes — the ceiling to use when scoping, not 30 |
| **Measures** | Email addresses and tokens scrubbed from the text before sending; per-column length caps; at most five distinct messages per page load; nothing sent from `localhost`; `anon` holds `insert` only on named columns, so a visitor can report but cannot read anyone's reports — including their own |

Honest limit, and the reason the 30 days matters: a scrubber is a filter, and a filter can
miss an unusual form. A stack or message is close enough to free text that a stray identifier
could ride along. Treating these as *designed to be* anonymous rather than *guaranteed*
anonymous is why they expire rather than accumulate. `privacy.html` §1 says this to visitors
in the same terms.

### 6. Aggregate usage statistics

| | |
| --- | --- |
| **Purpose** | Count visits, referring sites, and how often each view (list, map, events) is opened, to tell whether the app is useful and which parts get used |
| **Basis** | Art. 6(1)(f). Note this is Art. 6 only: no ePrivacy consent is engaged because nothing is stored on or read from the device — see [`consent-exemption-analysis.md`](../decisions/consent-exemption-analysis.md) |
| **Data subjects** | Visitors to the main page |
| **Data categories** | What reaches us: counts, with no record of who opened what. What Vercel processes to build them: the request metadata in activity 7 |
| **Recipients** | Vercel (processor, DPA, DPF-certified) |
| **Transfers** | Vercel does not confine processing to the EU; DPA with SCCs, and DPF certification |
| **Retention** | We hold aggregates, which are not personal data. The underlying requests are on Vercel's retention |
| **Measures** | No cookies; no cross-site tracking; no device storage, which is why this is outside ePrivacy Art. 5(3) |

A Vercel-side breach is scoped by activity 7, not by this row — there is nothing here to
breach.

### 7. Site hosting and request metadata

| | |
| --- | --- |
| **Purpose** | Serve the site at all |
| **Basis** | Art. 6(1)(f) — unavoidable in serving a web page to someone who requested it |
| **Data subjects** | Every visitor, signed in or not |
| **Data categories** | IP address, browser details, page requested, referring site |
| **Recipients** | Vercel (processor, DPA, DPF-certified) |
| **Transfers** | As activity 6. Serverless functions are pinned to `fra1` (Frankfurt) in `vercel.json`, though no function currently runs there — the contact relay moved to Supabase |
| **Retention** | Vercel's own |
| **Measures** | CSP and supporting headers on every response (`vercel.json`); the Supabase client is vendored and served from our own origin, so loading the app reaches no CDN |

### 8. Map view: Leaflet from unpkg, tiles from OpenStreetMap

Recorded because it is the one place where personal data reaches a party **we have no
contract with**, which makes it categorically different from 1–7.

| | |
| --- | --- |
| **Purpose** | Draw the map |
| **Basis** | Art. 6(1)(f), and weaker than the others precisely because no safeguards back it. Mitigated by it being opt-in in practice: nothing is fetched unless the visitor switches to Map view |
| **Data subjects** | Visitors who open Map view |
| **Data categories** | IP address and request metadata, fetched by the browser directly |
| **Recipients** | unpkg and the OpenStreetMap Foundation — **not processors.** No DPA, no instructions from us |
| **Transfers** | Served from whichever of their locations is nearest, not necessarily the EU. **No safeguard we can claim on the visitor's behalf, and `privacy.html` §3 says exactly that rather than rounding it up** |
| **Retention** | Theirs |
| **Measures** | Not loaded until Map view is opened ([#96](https://github.com/Dor-bl/moi-app/pull/96)); Leaflet pinned to an exact version with an SRI hash; CSP bounds what the loaded script may do. [#99](https://github.com/Dor-bl/moi-app/issues/99) adds a browser test so the "nothing before Map view" promise cannot silently regress |

Vendoring Leaflet the way the Supabase client was vendored would remove unpkg from this row
entirely. Tiles cannot be vendored, so OpenStreetMap stays either way.

### 9. On the device only — not processing by us

Recorded to mark the boundary, because these are what people assume we collect. The boundary
is not quite clean, and the first row is where it leaks: guest progress crosses into activity 1
the moment its owner signs in.

| What | Where it lives | What reaches us |
| --- | --- | --- |
| Progress and notes made while signed out (`moiCheckState`) | `localStorage`, that browser | **Nothing while signed out.** But on sign-in `syncCloudProgress()` merges them into `user_progress`, at which point they are account data under activity 1 and follow its retention and erasure rules. Answering a subject access request has to include them |
| Theme, language, completed-list layout, event badges (`moiCheckTheme`, `moiCheckLang`, `moiCheckCompletedCollapsed`, `moiCheckEvents`) | `localStorage`, that browser only | **Nothing.** Event badges we never receive at all, so there is nothing on our side to keep, delete, or restore |
| The Supabase session token and the account marker (`moiCheckSyncedUser`) | `localStorage`, managed by the SDK | Nothing beyond the token being presented back to Supabase, which is what signing in means |
| **Location, for an event check-in** | Read inside the tap, compared to the event's coordinates on the device, then discarded | **Nothing. No coordinate is sent, stored, or logged.** We never learn where the user was, or whether they were anywhere at all. The only result is their own device's note that they earned a badge |

All of it is ePrivacy-exempt on one of three grounds — it is the service itself, a preference
the visitor set, or strictly necessary for a sign-in they asked for — which is why there is no
cookie banner. Key-by-key reasoning:
[`consent-exemption-analysis.md`](../decisions/consent-exemption-analysis.md). **Adding a
storage key that fits none of those grounds invalidates that analysis**, so it needs
revisiting at the same time.

### 10. Automated decision-making and profiling

**None.** No profiling, no automated decision with legal or similarly significant effect, so
Article 22 is not engaged and the Article 13(2)(f) disclosure is a short negative statement,
which `privacy.html` §5 carries. It is scoped to Article 22 deliberately: the app *does*
decide two things automatically, and a flat "no automated decisions" would be false.

Why neither is profiling (Art. 4(4)) — the two badges rest on different reasons, and the
weaker-sounding one is the event badge, because it evaluates the user's location:

- **Event badge: not our processing at all.** The location is read, compared and discarded on
  the user's device, and the resulting badge stays in `moiCheckEvents` in that browser
  (activity 9). Neither the coordinates nor the badge is ever sent to us, so there is no
  evaluation by the controller to be profiling, and nothing on our side for Article 22 to
  attach to. The code shows this: `js/checkin.js` writes only to `localStorage`, and the only
  table the app writes to is `user_progress`. If event badges ever sync to the account, this
  reasoning stops holding and the row needs redoing.
- **Milestone badges: no evaluation of a personal aspect.** They are a count of items the user
  ticked themselves, computed in the browser from progress we do hold (activity 1). Nothing
  about the user is assessed, inferred or predicted beyond what they recorded.

The Article 22 conclusion is separate and holds for both: neither has any legal or similarly
significant effect, since a badge changes nothing outside the app.

---

## Technical and organisational measures (Art. 30(1)(g))

A general description, as the article asks. Per-activity specifics are in the rows above.

**Access control.** Row-level security on `user_progress` keyed to `auth.uid() = user_id`;
`client_errors` grants `anon` insert on named columns only, with no read; `auth.users`
unreachable by the `anon` and `authenticated` roles; erasure through a `security definer`
function with `set search_path = ''` that can only act on its caller.

**Credentials.** The [#92](https://github.com/Dor-bl/moi-app/issues/92) audit is the record,
and this is the register entry that issue's last item asked for. In summary:

- Two-factor authentication on all six accounts in the chain — Supabase, Vercel, GitHub,
  Resend, Cloudflare, and the Google mailbox. Cloudflare was not in the original list of five;
  it was added because it can repoint the domain, which makes it equivalent to a deploy
  credential.
- **Two RLS-capable credentials were found deployed in Vercel and removed** (7 October 2026),
  and the legacy JWT signing secret was revoked (12 October 2026). Tokens forged with it no
  longer verify, and the legacy `anon` and `service_role` keys are disabled.
- No credential capable of bypassing RLS is deployed to the browser. The client carries a
  publishable key only.
- Nothing secret is committed: `config.js` and `.env*` are git-ignored, and a history scan
  found only placeholders.

**Data protection by design.** No password is ever stored, so there is none to leak. The
Supabase client is vendored and served from our own origin; Leaflet is pinned to an exact
version with an SRI hash. **One third-party script is neither:** Google's sign-in client
(`accounts.google.com/gsi/client`, activity 4) is fetched directly from Google with no
integrity hash, and cannot carry one — Google serves a rolling build, so any hash we pinned
would break the button on their next release. What bounds it instead is that it loads only
when the sign-in dialog is opened, plus the CSP. The CSP limits which sources may serve
scripts and which destinations a page may connect to; it does **not** sandbox a script that is
allowed to run, which can still read the DOM and `localStorage`, session token included. So the
on-demand loading is a mitigation in its own right, not a backstop to the CSP. The sign-in link
cannot be consumed by a mail scanner.
Error reports carry no user id, session or IP, are scrubbed, and expire. The event check-in computes on the
device so that no coordinate exists to protect.

**Data minimisation.** No payment data, no government identifiers, no special-category field,
no stored coordinates. The free-text fields are the exception that minimisation cannot reach,
and are treated as such: the note field no longer prompts for other people's names and is
length-capped.

**Encryption.** TLS in transit everywhere. At rest, the platform defaults of Supabase and
Vercel; we have not independently verified these and do not claim more than the providers
document.

**Resilience and restoration.** Supabase automated backups, on the project's plan. Erasure
interacts with them — see [`retention.md`](retention.md) §4, which is the written position
rather than an open question.

**Testing.** ESLint and a Node test suite in CI; tests cover the auth sign-out and sync
behaviour, the error reporter's scrubbing and limits, and map popup contrast. The contact
relay's deploy step asserts the function answers from `eu-west-1` and fails the deploy
otherwise, so the region claim in this register is enforced rather than asserted.

---

## Open points

Each of these is a thing this record cannot state because nobody has decided or supplied it
yet. None is a blocker for the rest of the file.

1. **Resend's 30-day retention is their stated figure**, unverified against live
   documentation. Carried as such in `privacy.html` §4 and in [`retention.md`](retention.md).
2. **At-rest encryption is asserted by the providers**, not verified by us.
3. **The pre-choice Google fetch could be removed** (activity 4). Drawing our own button and
   loading Google's script only after the visitor picks it would take that request out of
   the dialog entirely, at the cost of a code change to the sign-in flow. Until the owner
   decides, it is documented and justified rather than eliminated.

## Keeping this current

It is a record, so it is wrong the moment the system changes without it. Revisit when:

- a new table, column, or `localStorage` key appears — a new key also means revisiting the
  consent-exemption analysis;
- a processor is added, removed, or changes region;
- a retention period changes, in our code or in a provider's terms;
- a new third party is contacted from the browser;
- an item in Open points is resolved.

The quickest check that it has not drifted: `grep` the code for table names and
`moiCheck` storage keys, and compare against activities 1, 5 and 9.

## Provenance

| Claim | Where it came from |
| --- | --- |
| Schema, RLS policies, grants, `delete_user()`, `client_errors`, its `pg_cron` job | `README.md` |
| Purposes, recipients, transfers, retention as stated publicly | `privacy.html` §§1–4 |
| Project region `eu-west-1`, contact relay pinned and **observed** answering from it | [`edge-function-region.md`](../decisions/edge-function-region.md) |
| MFA chain, the two removed credentials, the revoked JWT secret, `fra1` | [`account-hosting-audit.md`](account-hosting-audit.md) |
| ePrivacy exemption reasoning | [`consent-exemption-analysis.md`](../decisions/consent-exemption-analysis.md) |
| Mailbox's missing processor contract | [#152](https://github.com/Dor-bl/moi-app/issues/152), `privacy.html` §3 |
| `localStorage` keys, tables actually queried | `grep` over `app.js` and `js/*.js` at `aaca88a` |
| Note field capped and reworded | [#204](https://github.com/Dor-bl/moi-app/pull/204), `index.html:165` |

Not a lawyer; article references are pointers for verification, not advice.
