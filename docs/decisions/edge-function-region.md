# Where the contact Edge Function runs

**Status:** resolved — pinned to `eu-west-1`, disclosed in `privacy.html` section 3
**Date:** 21 September 2026
**Issue:** [#32](https://github.com/Dor-bl/moi-app/issues/32) (related: [`docs/compliance/account-hosting-audit.md`](../compliance/account-hosting-audit.md) §3 regions, [#103](https://github.com/Dor-bl/moi-app/pull/103) contact backend, [#87](https://github.com/Dor-bl/moi-app/issues/87) Art. 30 record)

## The question #32 actually asked, and the one it had to grow

#32 asked whether the Supabase project sits in an EU region, and said that if it does not,
`privacy.html` needs a transfer disclosure and a reference to the Standard Contractual
Clauses.

The first half answered itself: the `moi-app` project is on AWS `eu-west-1` (Ireland),
confirmed in the Supabase dashboard and recorded in the account and hosting audit. Accounts,
`user_progress` and notes are stored in the EU. On the storage question there is nothing to
disclose.

That answer is also narrower than it looks, and the gap is the reason this record exists.
**Supabase Edge Functions do not run in the project's region.** They execute in the region
nearest the requesting user (Supabase's regional-invocation documentation). The project
region says where the database lives and nothing whatsoever about where a function runs.

Since #103 that distinction is load-bearing, because the contact form is an Edge Function.
`supabase/functions/contact/index.ts` receives a visitor's name, email, subject and message,
and reads the caller's IP address for rate limiting. Under default routing, a submission
sent from outside the EU/EEA was processed outside the EU/EEA — a Chapter V transfer that
nobody had decided to make and that `privacy.html` did not mention, because the policy
stated no processing location at all.

So #32's own two options applied, just one layer up from where it put them: pin the region,
or disclose the transfer.

## The decision

**Pin it.** `app.js` posts to
`${SUPABASE_URL}/functions/v1/contact?forceFunctionRegion=eu-west-1`. Every contact
submission is now processed in Ireland regardless of where it was sent from, which puts the
function in the same jurisdiction as the database it sits beside.

Pinning was preferred to disclosing because the alternative is worse on both counts that
matter. A disclosure would have to say that a visitor's message is processed in whichever
country they happen to be in — a sentence that is accurate, unhelpful, and true of no
particular place, which is a poor thing to put in a privacy policy. And the transfer it
discloses buys nothing: the latency of a contact form is not a consideration, so default
routing was never earning its keep.

### Why the query parameter and not `x-region`

`x-region` is the documented default and is what the audit record names. The query
parameter is what shipped, for a deployment reason rather than a functional one.

A custom request header has to appear in the function's own `Access-Control-Allow-Headers`
or the browser's preflight fails and the POST never leaves. Those two sides deploy
separately: `app.js` goes out with the Vercel build on merge, the function goes out from
`.github/workflows/deploy-functions.yml` when `supabase/functions/` changes. Ship them in
the wrong order — or have one fail — and the contact form is broken for everyone until the
other catches up. That is a real failure mode traded for nothing; #103 started with a CORS
mismatch of exactly this shape.

`forceFunctionRegion` asks nothing of the function. It is Supabase's documented answer for
callers that cannot set headers — CORS requests and webhooks are the two cases named — and
it needed no change to the function, no redeploy, and no change to the preflight probe in
the deploy workflow.

### What pinning costs

**A pinned region is not re-routed during a regional outage.** Supabase's guidance for an
outage is to change the region deliberately. So if `eu-west-1` is down, the contact form
fails rather than quietly running somewhere else.

Accepted, and cheap here: `privacy.html` section 3 and the contact modal both name
`hallo@moicheck.nl`, which reaches the same inbox without touching the function at all. The
fallback for "the form is down" was always "send an email", and it does not depend on this.

The failure is also not silent — `app.js` surfaces the error to the visitor — but nothing
alerts *us*. If that ever matters, the fix is an alert on the function's error rate, not
unpinning.

## What it does not fix

Pinning settles where the message is *handled*. It does not follow the message.

```
visitor
  -> Supabase Edge Function   eu-west-1 (Ireland), pinned here
  -> Resend                   United States
  -> Cloudflare Email Routing United States company, global network. Forwards, never stores:
                              hallo@moicheck.nl is a routing address, not a mailbox
  -> a Google mailbox         United States. Where the message comes to rest
```

Past the first hop the message leaves the EU, and it comes to rest in a US-hosted mailbox.
The same is true of paths that have nothing to do with the contact form: Vercel serves the
site and the analytics, unpkg serves Leaflet, OpenStreetMap serves the tiles.

That is why the disclosure #32 asked for went into `privacy.html` section 3 **as well as**
the pin, rather than instead of it. The section states where data is stored (Ireland), where
contact submissions are processed (Ireland, by this decision), and what leaves the EU anyway.
It draws two lines the first draft did not, and they are the honest part.

Supabase, Resend, Cloudflare and Vercel process on our behalf under contract, so their
published DPAs — the Commission's Standard Contractual Clauses, plus the EU–U.S. Data
Privacy Framework where the provider is certified — are what covers those transfers.

unpkg and OpenStreetMap are not ours. The browser fetches from them directly, we hold no
contract with either, and the policy says so rather than implying safeguards we are in no
position to promise.

**Google is deliberately in neither group**, and now for a settled reason rather than an
open one. The owner confirmed on 22 September that the destination is a **personal Gmail
account**, held under Google's consumer terms — so there is no Article 28 processor
contract behind that hop, and none of Google's business DPA or DPF coverage reaches it. The
policy says exactly that instead of implying otherwise.

Note the address is not the account: `hallo@moicheck.nl` is a Cloudflare routing address, so
a claim about Google's terms has to be aimed at the destination it forwards into, never at
the address itself. **Do not fold Google into the SCC/DPF sentence** unless the mailbox
actually moves to a provider that gives one; the fact that Google publishes a DPA for
Workspace does not make it apply to a consumer account.

#32's acceptance criteria wanted both halves; a pinned function alone would have satisfied
neither.

## Provenance

| Claim | How it was established |
| --- | --- |
| Project region `eu-west-1` | Supabase dashboard, during the [#92](https://github.com/Dor-bl/moi-app/issues/92) audit |
| Edge Functions run nearest the requesting user | Supabase documentation, regional invocation |
| `forceFunctionRegion` query parameter, and that it exists for callers that cannot set headers | Supabase documentation and the [changelog entry](https://github.com/orgs/supabase/discussions/36850) that introduced it |
| A pinned region is not re-routed during an outage | Supabase documentation, regional invocation |
| `x-sb-edge-region` reports the region an invocation ran in | Supabase documentation, regional invocation |
| Resend processes in the United States; EEA transfers under the SCCs, plus DPF participation | Resend's published DPA and GDPR page |
| Google's SCCs and its adoption of the EU–U.S. DPF | Google's published data-transfer frameworks page. Note what this row does **not** establish: those terms attach to Google's business services, and the destination mailbox is **not** one of them — the owner confirmed a personal account under consumer terms on 22 September. `privacy.html` claims nothing from this row, and must not be edited to claim anything from it while the destination stays a consumer account |
| **The pin is honoured in production** | **Observed, not inferred.** On 23 September 2026 the owner invoked the live function with `?forceFunctionRegion=eu-west-1` from outside CI and it answered `HTTP/2 415` with `x-sb-edge-region: eu-west-1` — the 415 being the media-type refusal, so the observation cost no mail and no visitor's rate-limit allowance. This is the row the rest of the table could not supply: every region claim above it is documentation |
| The mail path itself | `supabase/functions/contact/index.ts` and `privacy.html` §2 |

The region claims started as documentation rather than observation, and that gap mattered
more than it looks: a pin to a region name Supabase does not recognise is reported to
re-route rather than fail
([supabase/supabase#34526](https://github.com/supabase/supabase/issues/34526)), so a typo
would degrade silently back to nearest-user routing and look exactly like success from our
side.

Two checks close it from opposite ends. `tests/contact-region.test.js` catches an edit that
drops the parameter or points it outside the EU/EEA, but it only reads our own source — it
cannot know what the platform did with the value. The `Verify the pinned region is the
region that runs` step in `.github/workflows/deploy-functions.yml` asks the live function
and fails the deploy unless `x-sb-edge-region` comes back `eu-west-1`. It invokes with a
`text/plain` body, which the function refuses with a 415 at its first check — before any
body is read, any rate-limit bucket is touched, or Resend is called — so the probe sends no
mail and costs no visitor their allowance.

## Follow-up

- [x] **Confirm the pin against the live function.** Done twice over. By hand on 23
      September 2026, before this change merged: a pinned invocation answered `415` with
      `x-sb-edge-region: eu-west-1`, which is the first direct observation that the platform
      honours the parameter rather than silently re-routing. And by CI from here on: the
      deploy workflow invokes the live function with the parameter and fails unless
      `x-sb-edge-region` reports `eu-west-1`. Merging the change that added that step runs
      it, because the workflow triggers on edits to itself — so the merge re-confirms by
      machine what the hand check above established once. Know its limit: it runs when `supabase/functions/contact/` or
      the workflow changes, so it re-confirms the platform's behaviour on every function
      deploy, not on every front-end change. `tests/contact-region.test.js` covers that
      side.
- [x] **The mailbox's own terms** — settled, and the answer is the uncomfortable one. It is a
      personal Gmail account under consumer terms, confirmed by the owner on 22 September.
      `privacy.html` §2 and section 3 now say so plainly. The remaining question is not what
      the terms are but whether to keep them; see the next item.
- [x] **Whether to move the mailbox somewhere with a DPA** — decided on 23 September 2026:
      **keep the personal Gmail account, disclosed as it is.** Google Workspace charges a
      monthly subscription and MoiCheck has no income, so the owner chose disclosure over a
      recurring cost. That is a proportionate answer for a contact form carrying a name, an
      address and a message, and the policy already describes the arrangement accurately
      rather than implying a safeguard that does not exist.
      [#152](https://github.com/Dor-bl/moi-app/issues/152) holds the reasoning, the options
      priced against each other, and the conditions that should reopen it — the first being
      the project earning anything at all, since cost is the whole basis of the decision.
      What does not change with it: this is still the least protected hop in the contact
      path, which is a strange place to end up in the same change that pinned the processing
      to Ireland, and saying so is the point of the disclosure. This account is also the
      recovery address for the other five in the account chain
      (`docs/compliance/account-hosting-audit.md` §1), so a future move is not only a privacy
      question. Whichever way it goes later, `privacy.html` §2 and section 3 describe the
      arrangement as it stands today, so changing the destination means rewriting both and
      bumping the policy's date.
- [ ] **Per-provider transfer bases.** Section 3 cites the SCCs and the DPF generically. The
      Article 30 record in [#87](https://github.com/Dor-bl/moi-app/issues/87) is the right
      place to name, per provider, which mechanism applies and where its terms are published.
