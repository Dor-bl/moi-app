# Account and hosting audit: accounts, credentials and regions

**Status:** current — records the results of the [#92](https://github.com/Dor-bl/moi-app/issues/92) audit, 13 September 2026
**Date:** 13 September 2026
**Issue:** [#92](https://github.com/Dor-bl/moi-app/issues/92) (related: [#32](https://github.com/Dor-bl/moi-app/issues/32) international transfers, [#103](https://github.com/Dor-bl/moi-app/pull/103) contact backend, [#121](https://github.com/Dor-bl/moi-app/pull/121) Vercel region)

## What this is, and what it is not

#92 grouped three checks that only the account owner can perform, in provider dashboards:
MFA across the account chain, confirmation that no `service_role` key is deployed, and a
recorded decision on the function processing region. Its fourth item asks that each result
be written down "so the next review doesn't have to re-ask." This is that record.

**One of those three is not closed.** The MFA chain is complete and the region decision is
recorded, but a credential capable of bypassing row-level security — the project's JWT
signing secret — is still configured in Vercel. Section 2 has the detail and the follow-ups
carry the action. Read this file as "here is where things stand", not "everything is
settled".

It is **not** an Article 30 record of processing activities. It does not enumerate
processing purposes, legal bases, categories of data subject, or retention periods across
the app. That document is tracked separately in
[#87](https://github.com/Dor-bl/moi-app/issues/87), under the
[#94](https://github.com/Dor-bl/moi-app/issues/94) umbrella and adjacent to
[#86](https://github.com/Dor-bl/moi-app/issues/86) on the privacy-policy side.

**On the filename:** #87 designates `docs/compliance/processing-register.md` for that
Article 30 record. This file deliberately does not take that name, so nobody later mistakes
a narrow account-and-region audit for the register itself. If you came here looking for
"what personal data do we hold, why, and for how long" — that is #87, and it is still
unwritten.

What follows is narrow: the state of the accounts, the credentials and the regions, as
verified on 13 September 2026, with the provenance of each claim noted so a later reviewer
can tell what was seen first-hand and what was read in documentation.

## 1. The account chain

These accounts *are* the security boundary of this project, as #92 put it: row-level
security is irrelevant to anyone holding the Supabase dashboard password. All six now
require a second factor.

| Account | Why it is in the chain | MFA | When |
| --- | --- | --- | --- |
| Supabase | Database, auth, and the contact Edge Function | **Enabled** | During this audit |
| Vercel | Hosting and deployment of the site | **Enabled** | Pre-existing |
| GitHub | Source of truth; deploys flow from it | **Enabled** | Pre-existing |
| Resend | Delivers contact-form mail and magic links | **Enabled** | During this audit |
| Google (behind `hallo@moicheck.nl`) | The mailbox itself; receives password-reset mail for the others | **Enabled** | Pre-existing |
| Cloudflare | Runs Email Routing for the domain | **Enabled** | Pre-existing |

### Cloudflare was missing from #92's list

#92 named five accounts. The chain is six. Cloudflare runs Email Routing for
`moicheck.nl` and forwards mail addressed to `hallo@moicheck.nl` on to the Gmail mailbox
(`privacy.html` §2, "Who processes your data"). Whoever holds that account can redirect the
domain's mail — including the password-reset mail that #92 flagged the mailbox as important
for. Adding MFA to the mailbox while leaving the router unprotected would have left the
same path open one hop earlier.

### A plan note, so the dashboard banner does not mislead the next reviewer

Supabase offers **org-wide MFA enforcement** on the Pro plan; this organization is on Free,
so enforcement is unavailable. What was enabled is **per-account MFA**, which is
plan-independent. These are two different things, and the dashboard banner is about
enforcement. The absence of the enforcement toggle does not mean the account is
unprotected.

## 2. Vercel environment variables

#92 asked for confirmation that no `service_role` key is deployed anywhere. **Two**
RLS-bypassing keys were, in Production, alongside a full set of direct database
credentials. A third credential with the same capability by a different route is **still
there** — see "Still present and RLS-capable" below, which is why this item of #92 is not
closed.

### Found and removed

| Variable | Capability |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses row-level security entirely |
| `SUPABASE_SECRET_KEY` | New-style equivalent of the above; same RLS-bypass capability |
| `POSTGRES_URL` | Direct database connection |
| `POSTGRES_PRISMA_URL` | Direct database connection |
| `POSTGRES_URL_NON_POOLING` | Direct database connection |
| `POSTGRES_USER` | Database credential |
| `POSTGRES_HOST` | Database credential |
| `POSTGRES_PASSWORD` | Database credential |
| `POSTGRES_DATABASE` | Database credential |

All nine were found in **Production**, and removal was verified in the dashboard. Whether
Preview or Development also carried any of them was not separately recorded during the
audit, so that half of #92's "all environments, including preview" is unverified rather
than clear. It is in the follow-ups.

#92 also asks about any local `.env`. On the repository side that is clear and checkable:
`.env` and its variants are ignored (`.gitignore:1-5`), the only tracked file of that shape
is `.env.example`, and #92's own scan of git history found placeholders rather than
credentials. An untracked `.env` sitting on a developer machine is outside what this record
can establish either way — it is in the follow-ups rather than quietly counted as clean.

### Still present and RLS-capable — open

| Variable | Environment | Why it matters |
| --- | --- | --- |
| `SUPABASE_JWT_SECRET` | Production | The project's HS256 signing secret. Whoever holds it can mint a JWT asserting any `sub` and any role — `service_role` included — and PostgREST will honour it. That is an RLS bypass by a different route than the two keys above. |

This was first written down here as harmless, which was wrong: a signing secret is not a
public identifier. #92's acceptance criterion — "no key capable of bypassing RLS is
deployed anywhere" — is therefore **not met yet**, and the remedy is the same as for the
two removed keys: delete it from every Vercel environment that has it. The three checks
under "Why removing them was safe" below apply to it unchanged; nothing in this repository
reads it.

One caveat the dashboard can settle and this file cannot: if the project has moved to
asymmetric JWT signing keys and legacy HS256 verification is switched off, a forged token
would no longer verify. The presence of both `SUPABASE_JWT_SECRET` and
`SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY` suggests both key models exist here.
Treat the secret as live until someone confirms otherwise in the dashboard — that is the
cheaper assumption to be wrong about.

### Retained, none able to bypass RLS

| Variable | Environments |
| --- | --- |
| `SUPABASE_ANON_KEY` | Production, Preview |
| `SUPABASE_URL` | Production, Preview |
| `SUPABASE_PUBLISHABLE_KEY` | Production |
| `NEXT_PUBLIC_SUPABASE_URL` | Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Production |

The anon and publishable keys are public by design and safe to ship; the browser only ever
needs those. The `NEXT_PUBLIC_*` names are vestigial — this is not a Next.js app.

### Where they came from

The Vercel–Supabase marketplace integration injects the entire credential set when the
projects are linked, regardless of whether the project uses any of it. Nothing in this
repository ever asked for a `service_role` key; the integration supplied one anyway. Worth
knowing, because re-linking the integration would presumably put them back.

### Why removing them was safe — verified, not assumed

Three things had to be true, and each was checked rather than reasoned about. They hold for
`SUPABASE_JWT_SECRET` too, which is why removing it costs nothing:

1. **Nothing on Vercel can read them.** The project has no Vercel Function and no build
   step. Vercel environment variables are readable only by build processes and functions,
   and this deployment has neither — it is static files served as they sit in the repo.
2. **The contact function does not use them.** `supabase/functions/contact/index.ts` reads
   exactly one secret, `Deno.env.get('RESEND_API_KEY')`, and that value comes from
   Supabase's own secret store (`supabase secrets set`), not from Vercel.
3. **Supabase's runtime cannot reach them.** Edge Functions execute on Supabase
   infrastructure. Vercel environment variables are not present in that process environment
   under any name.

### Operational note

Vercel environment variable changes apply only to **new** deployments — never
retroactively to existing ones (Vercel documentation). A deployment built while a secret
was still configured keeps whatever it captured. This matters if the question is ever "when
did the key stop being reachable", as opposed to "is it configured now".

## 3. Processing regions

| Layer | Region | How it is set |
| --- | --- | --- |
| Supabase project `moi-app` | AWS `eu-west-1` (Ireland) | Project setting, fixed at creation |
| Supabase Edge Functions | **Nearest the requesting user** | Platform default; not the project region |
| Vercel Functions | `fra1` (Frankfurt) | `vercel.json`, merged in [#121](https://github.com/Dor-bl/moi-app/pull/121) |
| Static assets | All PoPs | Vercel CDN; not region-pinnable, by design |

**If you follow the #121 link, read this first.** That pull request's description states that
the contact Edge Function's region "is governed by the Supabase project region, tracked
separately in #32". The first half of that is **wrong and superseded by this record**: the
project region governs the database, not where Edge Functions execute. The second half
still holds — the contact function's processing region is a #32 question. #121 itself did
exactly what it says on the tin (it set `regions` for Vercel Functions); only that one
sentence of its description misdescribes Supabase.

### The project region does not constrain where contact data is processed

This is the part most likely to be misread, so it is stated plainly: Supabase Edge
Functions execute in the region nearest the requesting user, not in the project's region
(Supabase documentation on regional invocation). The `moi-app` project living in
`eu-west-1` therefore says where the *database* is; it says nothing about where a contact
submission is processed. Where any given submission is processed follows the runtime region
selected for that request, so a request arriving from outside the EU/EEA will generally be
processed outside the EU/EEA. That is the Chapter V transfer question itself, not a
geographic aside — and the EU/EEA, not "Europe", is the boundary that decides it.

Pinning is possible — via the `x-region` header or the `forceFunctionRegion` query
parameter — with the caveat that a pinned region is **not** automatically re-routed during a
regional outage, so pinning trades availability for locality. Whether to do that is the
transfer question tracked in [#32](https://github.com/Dor-bl/moi-app/issues/32), where a
comment is already posted. It is deliberately **not** decided here; this record describes
the current state rather than making a new decision.

### `ams1` is not a Vercel region

Amsterdam is a Vercel CDN point of presence, not one of the twenty compute regions. An
initial attempt to set it failed the deployment outright:

```
Invalid region selector: "ams1"
```

`fra1` (Frankfurt) is the nearest valid EU compute region and is what `vercel.json`
carries. Recorded because the mistake is an easy one to repeat — #92 itself suggested
`ams1`, reasonably, since Amsterdam is the obvious choice geographically.

Two limits on what that setting buys, both worth keeping straight:

- It overrides the Project Settings default of `iad1` (Washington DC) for **Vercel Functions
  only**. There are none today; this is forward cover so the first one added does not
  silently land in the US.
- It cannot affect the Supabase Edge Function, which is where contact data is actually
  processed. That is the #32 question above, not this one.

## 4. Contact data flow, after #103

[#103](https://github.com/Dor-bl/moi-app/pull/103) replaced FormSubmit with a Supabase Edge
Function — see [`docs/decisions/formsubmit-gdpr-basis.md`](../decisions/formsubmit-gdpr-basis.md)
for why. The path a message takes today:

```
visitor
  -> Supabase Edge Function   (supabase/functions/contact/index.ts)
  -> Resend
  -> hallo@moicheck.nl        (Gmail, via Cloudflare Email Routing)
```

What the function retains: **no copy of the message.** It keeps the caller's IP address in
memory for rate limiting only, and nothing else. Stated precisely, because the 60-second
figure is easy to over-read: timestamps older than `WINDOW_MS = 60_000` stop counting
toward the limit, and stale entries leave the map via a **periodic** sweep
(`sweepExpired`, `supabase/functions/contact/index.ts:33-39`). That sweep is both
request-driven and throttled — it returns early unless a full window has passed since the
last one — so an expired entry can sit in `recent` past its 60 seconds, and an instance
that goes idle keeps its entries until it is torn down.

Sixty seconds is therefore when an address stops being *used*, not a deadline by which it
is gone. `privacy.html` §1 currently tells visitors it is "held in memory for that minute",
which is tighter than the code guarantees. That wording belongs to #86; it is noted here
rather than changed.

Any stale checkout or cached view showing `app.js` posting to `formsubmit.co` is wrong:
`app.js:1459` posts to `${SUPABASE_URL}/functions/v1/contact`. No request anywhere in the
app goes to FormSubmit. The name itself still appears in four places, so a repository search
will return hits that do not contradict that:

| Where | What it is |
| --- | --- |
| `supabase/functions/contact/index.ts:3` | Header comment — "Replaces FormSubmit", pointing at the decision record. A comment in a code file, not an executable reference |
| `README.md:169` | Contact-form section; explains the replacement and links the decision record by path |
| `docs/decisions/formsubmit-gdpr-basis.md` | The decision record itself |
| This file | The sentence you are reading |

## A note on sourcing

| Claim | How it was established |
| --- | --- |
| MFA status of all six accounts | Seen in each provider's dashboard during this audit |
| Supabase org-wide enforcement needs Pro | Supabase dashboard and plan documentation |
| Environment variables present, and their removal | Seen in the Vercel dashboard, before and after |
| `SUPABASE_JWT_SECRET` can bypass RLS | Reasoned from how Supabase signs and verifies project JWTs, not from a dashboard reading. Its continued presence is from the dashboard; whether legacy HS256 verification is still enabled is **not** settled here |
| Vercel env changes apply only to new deployments | Vercel documentation |
| Supabase project region `eu-west-1` | Supabase dashboard |
| Edge Functions run nearest the user; `x-region` pinning | Supabase documentation (regional invocation) |
| `ams1` invalid; `fra1` set | Failed deployment error, then `vercel.json` in this repository |
| Contact flow, retention, IP window | Read from `supabase/functions/contact/index.ts` and `app.js` at commit `bdff6e1` |
| Cloudflare Email Routing forwards the mailbox | `privacy.html` §2 |

The dashboard observations are the ones a later reviewer cannot re-derive from the
repository. If any of them is load-bearing for a decision, re-check it in the dashboard
rather than trusting this file — account state drifts, and this file does not.

## Follow-up

- [ ] **Remove `SUPABASE_JWT_SECRET` from Vercel** — owner action, in every environment
      that carries it. Until then #92's "no key capable of bypassing RLS is deployed
      anywhere" is not satisfied, whatever the rest of this record says. While checking,
      confirm in the dashboard whether legacy HS256 JWT verification is still enabled for
      the project, and note the answer here.
- [ ] **Confirm Preview and Development** for the nine credentials removed from
      Production. The audit established Production only; #92 asks for every environment.
- [ ] **Confirm no local `.env` holds a privileged key.** The repository side is clean
      (ignored, only `.env.example` tracked, nothing in git history), but an untracked file
      on a developer machine is the one location #92 names that this record cannot reach.
- [ ] **`privacy.html` §1 on the rate-limit IP** — it says the address is held in memory
      "for that minute", while the sweep that would make that true runs only on a later
      request to the same instance. A wording question for
      [#86](https://github.com/Dor-bl/moi-app/issues/86), not a code change.
- [ ] **Edge Function region** — whether to pin the contact function to an EU region, and
      accept the loss of outage re-routing, is open in
      [#32](https://github.com/Dor-bl/moi-app/issues/32). Not decided here.
- [ ] **Article 30 record of processing** — still unwritten, tracked in
      [#87](https://github.com/Dor-bl/moi-app/issues/87), which designates
      `docs/compliance/processing-register.md`. This file is not a substitute and should not
      be cited as one.
- [ ] **If the Vercel–Supabase integration is ever re-linked** — re-check the environment
      variables. It injects the full credential set, including a `service_role` key, without
      being asked.
- [ ] **Keep the six-account list current.** Adding a provider to the stack adds a row here;
      Cloudflare was missed once because it routes mail rather than serving traffic.
