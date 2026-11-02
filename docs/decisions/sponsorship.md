# Sponsorship: one-time contributions

**Status:** built, not live. The page and footer links exist, but the donate button has no
destination until a Stripe Payment Link is pasted into `sponsor.html`. See
[Flipping it on](#flipping-it-on).

## Why this shape

The question that started this was "will I need to pay for Supabase Pro as users arrive, and
should a sponsor page cover it?" Two separate things, and the first one is worth checking before
acting on the second.

### The cost pressure is smaller than it looks

Supabase free gives 500 MB database, 50k monthly active users and 5 GB egress; Pro is $25/month.
MoiCheck stores ~33 booleans plus short free-text notes per user — on the order of a couple of KB
each — and serves its map tiles from OpenStreetMap and its assets from Vercel, so Supabase egress
is JSON only. Neither storage nor egress is a realistic ceiling. What could actually force the
upgrade:

- **50k MAU** — a long way off.
- **Auth email rate limits.** Supabase's built-in mailer is throttled hard, and this is what
  usually bites small apps first. Configuring Resend as custom SMTP fixes it and stays on free.
- **Daily backups / PITR.** Free has none. This is the honest reason to pay $25 — peace of mind,
  not scale.

So sponsorship is not urgent infrastructure funding. It is a slow-building buffer, and the app
should not depend on it.

### The economics

Donation conversion on a free consumer app runs roughly 0.1–1% of active users at €3–10 each.
Covering $300/year means ~50–60 contributions, which needs thousands of engaged users. There is
also a structural mismatch: one-time income is lumpy, hosting bills are monthly. Treat the pot as
a top-up, not a subscription payer.

### Why one-time, and why no perks

A plain unconditional gift is the lowest-friction and lowest-risk form. The moment a contribution
buys something back — a supporter badge, name in credits, early access — it stops being a gift and
becomes a supply, which pulls in VAT questions and moves it closer to being treated as income. In
the Netherlands, small one-off gifts from non-relatives sit well under the annual gift-tax
exemption, but a structural, organised income stream can be viewed as a source of income (Box 1)
and can raise KVK/VAT registration questions. Keeping it a pure thank-you keeps all of that far
away — and happens to be the simplest possible code.

**This is not tax advice.** If contributions ever amount to more than pocket change, talk to an
accountant.

### Payments

Stripe Payment Links, with **iDEAL enabled alongside card**. iDEAL is not optional for a Dutch
audience; a card-only button converts badly here. Fees are ~€0.29 flat for iDEAL and ~1.5% + €0.25
for cards, which is roughly 10% of a €3 contribution — accepted, because the alternative
(Buy Me a Coffee at 5% plus processor fees, or GitHub Sponsors at 0% but aimed at developers
sponsoring developers) either costs more or points at the wrong audience. MoiCheck's audience is
expats in Groningen, not people with GitHub accounts.

### Trust

A bare "Donate" button on an anonymous side project reads as a scam. The page therefore leads with
who runs the app, what it actually costs, and what a contribution explicitly does *not* buy.
Transparency about the real bill is the conversion lever; the button is not.

## What was deliberately not built

Per [the PR #50 post-mortem](../postmortems/pr-50-account-deletion.md) and `CLAUDE.md`:

- **No Stripe webhooks, no serverless functions.** MoiCheck is a static site; adding a backend for
  a donate button is a large step for no user-visible gain.
- **No `donations` table, no supporter flag in Supabase, no donor state synced to accounts.** This
  is precisely the "60 lines becomes 2,000" trap. Contributions are deliberately anonymous to the
  app: Stripe's dashboard is the record.
- **No feature flag for the link.** A config toggle to decide whether an `<a>` tag renders is more
  machinery than the feature. Staging is done by leaving the branch unmerged instead.
- **No inline script on the page.** The CSP in `vercel.json` carries no `'unsafe-inline'` in
  `script-src`, so the pages use the shared `js/page-theme.js` the same way `privacy.html` does
  rather than carrying a `<script>` block of their own.
- **No recurring/membership tier.** Subscriptions mean churn, refunds and support load, and the
  perks that usually come with them are the thing to avoid (see above).
- **No in-page language switcher.** See below.

## Bilingual: two files, not one page that toggles

The app switches language in place, so mirroring that on the sponsor page was the obvious first
instinct. It is the wrong shape here, for three reasons:

- The CSP in `vercel.json` has no `'unsafe-inline'` in `script-src`, so a toggle means a new
  `js/` file that exists only to hide and show `<div>`s. The donate page should not need a script
  to render its own text.
- Two URLs are indexable in two languages; one URL with hidden Dutch markup is indexable in one.
  `sponsor.html` and `sponsor-nl.html` declare each other with `hreflang`, so Google can serve a
  Dutch speaker the Dutch page.
- Without JavaScript, a toggled page shows one language or both; two files always show exactly one.

The prose is duplicated either way — in two files or in two `<div>`s on one — so the maintenance
cost is the same, and the failure modes are fewer. `app.js` points the footer link at the file
matching the current language; anyone landing on the wrong one has a link at the top and in the
footer.

The Dutch page links to the English privacy policy and says so. Translating that document is a
much bigger job than translating this one, and promising a Dutch version by linking to it without
the label would be worse than the honest note.

## Placement

Footer link only, next to Privacy Policy and Contact, pointing at the page in the reader's
current language. If a second surface is ever wanted, the
highest-intent moment is just after a category badge or the *Groningen Legend* milestone unlocks —
but it must be dismissable, shown once, and must never gate anything.

## Flipping it on

1. Create a Stripe Payment Link with **iDEAL and card** enabled; replace
   `REPLACE_WITH_STRIPE_PAYMENT_LINK` in **both** `sponsor.html` and `sponsor-nl.html`.
2. Bump the "Last updated" date in `privacy.html`. The Stripe entries themselves are already
   written: the contribution row and payment sentence in §1, the processor bullet in §2, the
   transfer paragraph in §3, the seven-year retention line in §4, and the note in §5 that erasure
   does not reach a bookkeeping record.
3. Refresh the two `sponsor*.html` `lastmod` dates in `sitemap.xml` to the ship date.
4. Confirm the Stripe entity and safeguards in
   [`../compliance/processing-register.md`](../compliance/processing-register.md) activity 11
   against the account that now exists, and drop the not-in-operation markers there and in
   [`../compliance/retention.md`](../compliance/retention.md).
5. Re-check the running-cost figures in the "Where the money goes" section of both pages — they
   should be true on the day it ships.
6. Merge.

## Alternatives considered

- **Local business sponsorship.** Real money and a natural fit for a Groningen list, but paid
  placement corrodes the "handpicked by someone who lives here" value that makes the app worth
  using, and requires disclosure. A neutral "hosting supported by X" footer is the only version
  worth revisiting.
- **Grants.** Gemeente Groningen and expat-community funds occasionally back small community
  projects. Low odds, no downside in asking.
- **Waiting.** Shipping the page only once hosting genuinely costs money makes the ask more
  credible: "this now costs me €25/month" beats a pre-emptive request. That is essentially the
  position this branch holds.
