# FormSubmit.co: GDPR basis and data processing agreement

**Status:** interim decision recorded — keep FormSubmit with accurate disclosure; replacement recommended, awaiting owner sign-off
**Date:** 9 September 2026
**Issue:** [#79](https://github.com/Dor-bl/moi-app/issues/79) (split out of #28; related: #32 international transfers, #27 third-party requests)

## Why this was investigated

`app.js` POSTs the visitor's name, email, subject and message to
`https://formsubmit.co/ajax/hallo@moicheck.nl`. That is personal data processed on
MoiCheck's behalf, so FormSubmit is a processor under GDPR Article 28, and Article 28(3)
requires a written contract with each processor. `privacy.html` named FormSubmit and
described what it receives (#28), but nothing in the repo established *what governs* the
transfer.

## Findings

| Question | Answer |
| --- | --- |
| Is there a DPA or GDPR addendum? | **No.** None published, none discoverable. |
| Who is the controller's counterparty? | **Not disclosed.** No legal entity or address is named; the domain is registered behind Cloudflare with WHOIS privacy. The only contact point is `support@formsubmit.co`. |
| Where is data stored and processed? | **Not disclosed.** No region, hosting provider or data-centre location is stated. |
| Are sub-processors named? | **No list published.** |
| Is a retention period stated? | FormSubmit's documentation states submissions are **retained 30 days** and are retrievable from a submissions API (rate-limited to 5 requests/day). Their privacy policy does not mention this. |
| What legal terms exist at all? | A short, general privacy statement (`formsubmit.co/privacy.pdf`), dated **17 January 2019**. It asserts FormSubmit "doesn't collect personally identifiable information", says the form owner is "responsible and the rightful owner" of what the form collects, and contains no Article 28 processor terms. |

### Assessment

Three problems, in descending order of seriousness:

1. **No Article 28 contract.** There is no written agreement binding FormSubmit on
   purpose limitation, confidentiality, security, sub-processing, assistance with data
   subject rights, or deletion. This is a straightforward compliance gap, not a
   theoretical one — unlike Supabase and Vercel, which publish standard DPAs accepted
   through their terms.
2. **No transfer basis can be established.** Because the processing location is
   undisclosed, we cannot say whether Chapter V applies, let alone point to adequacy or
   SCCs. This is unresolvable from the outside — it is not a matter of looking harder.
3. **The published policy is inaccurate about our use case and contradicts their own
   docs.** It claims no PII is collected, while the service exists to relay names,
   email addresses and free-text messages, and it is silent on the 30-day retention their
   documentation describes. A policy that does not describe the service is not something
   we can rely on.

The exposure is small in volume — a low-traffic contact form on a hobby app — but the
data is not trivial: a name, an email address, and whatever the visitor chooses to write.

### A note on sourcing

`formsubmit.co` is unreachable from the environment this research ran in (blocked by the
network egress proxy), so their privacy policy, terms and documentation were read through
search-engine extracts rather than fetched directly. The findings above are consistent
across independent queries and the retention figure traces to FormSubmit's own
documentation page, but **none of it was verified against the live pages first-hand.**
Before acting on the "accept the risk" option below, someone should open
`formsubmit.co/privacy.pdf` and `formsubmit.co/documentation` in a browser and confirm.
The absence of a DPA is the claim most worth re-checking, and the easiest to settle
definitively: email `support@formsubmit.co` and ask.

## Options considered

1. **Accept the risk, disclose it accurately.** No engineering work. The Article 28 gap
   remains, and the privacy policy has to say plainly that we cannot evidence a
   processing agreement or a transfer safeguard for this step.
2. **Replace with a Supabase Edge Function** writing to a table or calling Supabase's
   mail transport. Data stays under agreements already in place (#32 covers the Supabase
   transfer question either way), no new processor is added, and the form's client-side
   code changes by roughly the URL and the payload shape. Costs an Edge Function to
   write, deploy and keep working.
3. **Replace with an email provider that offers a DPA** (Postmark, Resend, Mailgun and
   similar all publish one). Solves the contract problem but adds a processor and an
   account to maintain, where option 2 adds neither.

## Decision

**Interim: keep FormSubmit, and disclose the gap honestly.** `privacy.html` now states
that FormSubmit publishes no processing agreement, does not disclose its operator,
processing location or sub-processors, and retains submissions for 30 days — and offers
visitors a direct `mailto:` as a way to reach the same inbox without passing through
FormSubmit at all. Being unable to evidence a processing agreement is not fixed by
describing it, but an accurate policy is strictly better than a policy that implies a
relationship we do not have, and the `mailto:` gives a privacy-conscious visitor a real
alternative today.

**Recommended: move to option 2 (Supabase Edge Function).** It closes the Article 28 gap
by removing the processor rather than papering over it, keeps the contact form's data
under agreements the project already relies on, and is a contained change — the
alternative to the current `fetch` is a different endpoint, not a new architecture. This
recommendation is recorded, not executed: swapping the contact backend is the owner's
call, and it should be a separate, reviewable PR.

If option 1 is chosen deliberately instead, that is defensible for an app of this size —
but record it here as a considered acceptance, with the disclosure kept accurate, rather
than leaving it undecided.

## Follow-up

- [ ] Owner to confirm: replace FormSubmit (option 2), or record acceptance of the risk (option 1).
- [ ] Verify the findings against the live FormSubmit pages, and email `support@formsubmit.co` to ask directly whether a DPA exists.
- [ ] If replacing: open a separate PR for the Edge Function, then simplify the FormSubmit bullet in `privacy.html` back down.
