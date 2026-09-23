# Monthly Events Refresh Routine

> **Not scheduled yet.** This spec describes how the routine is meant to run; no
> Routine has been configured, so nothing fires on its own today. Standing it up needs
> the claude.ai Routines UI — see *Push authorization* below. Until then this is the
> plan, not a description of something already happening.

A Claude Routine is to fire on the **first of each month**, check the `EVENTS` list in
[`js/data.js`](../../js/data.js) for gaps, and — only if it finds any — open a pull
request filling them in.

The intended schedule is `0 8 1 * *`, and cron is evaluated in UTC while Amsterdam switches
between CEST (UTC+2) and CET (UTC+1). So the run lands at **10:00 local during summer
time and 09:00 local during winter time**. Nothing depends on the exact hour, so the
schedule is left alone across the DST changes rather than being re-pinned twice a year.

This file is the authoritative spec for what a good refresh looks like. Edit it here
rather than editing the Routine prompt — each run reads this file first and follows it.

## What this routine is for

An event that has finished disappears from the page by itself: `getUpcomingEvents` in
[`js/events.js`](../../js/events.js) filters against the current calendar day in
`Europe/Amsterdam`, so nothing here is protecting against *wrong* dates being shown.
What it protects against is **thinning** — the page slowly emptying out as festivals
lapse one by one and nobody refills them.

The corollary is the thing to keep in mind all the way through: the only real
wrong-date risk in this design **comes from this routine**. A speculative date,
researched off a stale page and merged unverified, is the one way the page starts
lying. Everything below follows from that.

## Step 1: check before researching anything

```bash
npm ci && npm run events:check
```

It prints what is still ahead and which non-recurring entries have lapsed, and exits
non-zero when the list needs attention. Two things count as needing attention:

- **Something lapsed** — a non-recurring entry whose dates are in the past.
- **The list is thin** — fewer than eight upcoming events, the low end of the launch
  target below. Thinness has to count on its own: every entry shipped so far is annual,
  so nothing ever lapses, and a lapsed-only check would exit 0 forever and leave this
  routine unable to do the job it was created for.

**If it exits 0, the run stops there.** Do not open a pull request, do not comment, do
not "tidy" anything. A month where the list is healthy is a success, not a broken run —
a routine that files something every month is a notification people learn to ignore.

## The rule that matters most: fixed dates vs floating ones

`annual: true` means **this event falls on the same calendar date every year**, and
`js/events.js` rewrites the year to find its next occurrence. That is correct for:

- **Koningsdag** — 27 April, but see the observed-date note below
- **Bevrijdingsdag** — always 5 May
- **Bommen Berend (Gronings Ontzet)** — always 28 August
- **Sint Maarten** — always 11 November
- **Carbidschieten** — always 31 December

### Observed-date exceptions

A fixed date can still carry a **deterministic** shift, and that is not the same thing
as floating. Koningsdag is held on Saturday the 26th whenever 27 April falls on a Sunday
— next in 2031 and 2036, last in 2014 — so its entry carries `notOnSunday: true` and
`js/events.js` applies the shift when it rolls. The date is computed, never researched.

If another entry turns out to have a rule like this, model the rule; do not convert the
entry to floating and start chasing it by hand. Conversely, do not invent a rule to avoid
chasing a genuinely floating festival — only a documented, legally or traditionally fixed
shift qualifies. `notOnSunday` applies to single-day events only; a test enforces that.

### Floating dates

`annual: true` is **wrong** for any festival whose dates move year to year:

- **Noorderzon** — eleven days hanging off a late-August weekend
- **Eurosonic Noorderslag (ESNS)** — Wednesday to Saturday in mid-January
- **Winterwelvaart** — a December weekend around Christmas
- **Nacht van Kunst & Wetenschap** — a Saturday in early June
- **Bloemetjesmarkt** — Good Friday, so it moves with Easter

Marking one of those `annual: true` would rewrite the year and drift it onto the wrong
weekdays: a festival that runs Thursday to Sunday would land mid-week, and the page
would advertise dates that were never real. **Never add `annual: true` to a floating
event**, however tempting it is to make the list self-maintaining. Those carry explicit
dates and are what this routine exists to chase.

Two related rules, for the same reason:

- **Never guess a date.** If the official page has not announced next year's dates yet,
  leave the entry lapsed and say so in the run's final reply. An absent event is fine;
  a wrong one is not.
- **Never invent an event.** Every entry must be a real, verifiable thing happening in
  the city or province of Groningen.

## Finding events: discovery and verification are different jobs

They have different rules, and conflating them is how this goes wrong in either
direction — either the list never grows, or it grows with dates nobody checked.

### Discovery — which events exist and are worth listing

Use listings and tourism sites freely here. They are the right tool for the job: a
curated calendar knows that a small Wine Walk in Haren is happening at all, while the
event's own site only exists if someone built one. Good starting points:

- [visitgroningen.nl](https://www.visitgroningen.nl) — the city and province tourism site
- [ervaarharen.nl](https://www.ervaarharen.nl) — Haren, part of the municipality of
  Groningen; a real source of local events (the Wine Walk in [#127](https://github.com/Dor-bl/moi-app/pull/127)
  came from there)
- [gemeente.groningen.nl/evenementenkalender](https://gemeente.groningen.nl/evenementenkalender)
  — the municipal events calendar

The floating festivals under *Floating dates* above are known to be missing and are the
obvious place to start, but they are not a closed list. If discovery turns up something
else genuinely worth a newcomer's time in the city or province, propose it — prefer what
is distinctly Groningen over what could be anywhere.

### Verification — the exact dates

Here the rule is strict, and it does **not** relax for an event that was discovered on a
listings site. Each date added or changed must be read off the event's **own official
page** — not an aggregator, not a listings site, not a cached search snippet, and not
memory.

This is not pedantry. A check in September 2026 found WinterWelVaart listed as both
11–13 and 19–21 December by different third-party sites; taking the first hit would have
put a wrong date on the live page.

Where an event has no official page of its own — small local happenings often don't —
**still include it**. Skipping it would undo the discovery rule above: the routine would
find the small local events and then throw them away again for want of a page nobody
built. Put the best source you have in `url`, and state plainly in the PR that there is
no official page and which source the dates came from. Whether that is good enough to
merge is the reviewer's call, not the run's. What is never acceptable is quietly
presenting an unofficial source as if it were verified.

The pull request body must cite, for every event it touches, the URL the dates came
from, so review is click-and-verify rather than re-research. Where discovery and
verification used different sources, name both.

### What this environment can actually reach

Outbound HTTPS goes through a policy-enforcing egress proxy, so "the official page"
is only verifiable when that host is on the environment's allowlist. A blocked host
fails the CONNECT with a 403 (`curl` reports `CONNECT tunnel failed, response 403`)
rather than returning a page. Report such a denial; never retry it as if it were
flaky, and never route around it.

Checked 21–22 September 2026, after [#143](https://github.com/Dor-bl/moi-app/pull/143)
prompted the organiser domains to be allowlisted:

| Host | Reachable | Note |
|---|---|---|
| `www.visitgroningen.nl` | yes | the province's tourism platform; carries schema.org `eventSchedule` data |
| `www.ervaarharen.nl` | yes | Haren listings |
| `www.nieuwlandseakker.nl` | yes | |
| `www.pompoenplukdagengroningen.nl` | yes | Pompoen Plukdagen, verified end to end |
| `www.kindermaand.nl` | yes | Oktober Kindermaand programme |
| `www.bourtange.nl` | **connects, but challenged** | see below |
| `gemeente.groningen.nl` | no | still 403; named as a discovery source above |
| `wijnfestival-groningen.nl` | no | still 403 on both `www.` and apex; the domain [#142](https://github.com/Dor-bl/moi-app/pull/142) was blocked on |

**Always use the `www.` form.** The allowlist entries are wildcards over subdomains
and do not cover the bare apex: `https://www.nieuwlandseakker.nl/` returns 200 while
`https://nieuwlandseakker.nl/` is refused by the proxy. The same holds for
`pompoenplukdagengroningen.nl`, `kindermaand.nl` and `bourtange.nl`. Probe the apex
and you get the proxy's 403, not the site — a run that reads that as "no official
page is reachable" takes the unverified path below for a page it could simply have
fetched. Before concluding any organiser page is out of reach, try the `www.` form.

**`www.bourtange.nl` is CAPTCHA-gated, which the allowlist cannot fix.** The proxy
lets the connection through and the site itself answers `HTTP 202` with a
`sg-captcha: challenge` header and a 169-byte meta-refresh to
`/.well-known/sgcaptcha/`. That is SiteGround gating automated clients; a browser
solves it invisibly and `curl` cannot. **Do not try to defeat it.**

A challenge-protected page is **not** the "no official page of its own" case above,
and must not be treated as one. That carve-out exists for events nobody built a site
for, where no better source is obtainable by anyone. Here the page exists, carries
the dates, and a person can read it in a browser — as happened in
[#143](https://github.com/Dor-bl/moi-app/pull/143), where the Samhain dates were
confirmed that way after this routine could not fetch them. So a run may **not**
substitute a listing on its own authority and call the dates verified; that would
reopen precisely the wrong-date risk the section above exists to close.

What a run does instead, in order:

1. **Ask.** Say the organiser page is challenge-protected, name the URL, and ask for
   the dates to be read from it. A one-click human check beats a weaker source.
2. **If proposing the entry anyway**, mark it `UNVERIFIED` in the PR body, state that
   the listing is the only source read, and say so per event rather than once in
   passing. It is then the reviewer's decision to merge, exactly as for an event with
   no official page — but taken knowingly, not inherited from a run's own judgement.
3. **Never present a listing as verification** when the organiser page exists. Where
   the two disagree, say so and stop rather than picking one.

Leaving the event out is always acceptable. An absent event costs the page nothing; a
wrong date on a live site is the one failure this whole design is built to prevent.

This table is a snapshot, not a guarantee: the policy is environment configuration
and can change between runs. Probe the host you actually need rather than trusting a
row here, and correct the row if it is wrong.

## Event shape

Add to `EVENTS` in `js/data.js`, keeping the existing style and the comment block above
the array.

**Replacing a lapsed edition, rather than appending beside it, matters.** When you add a
confirmed successor to a floating festival — `noorderzon-2027` for `noorderzon-2026` —
**delete the edition it replaces in the same change**. `events:check` counts any
non-recurring entry with past dates as a gap, so an old edition left sitting next to its
successor keeps the check failing forever, and a gate that never goes quiet is a gate
nobody reads.

When a floating edition has lapsed and **no** successor has been announced yet, leave it
where it is. It costs the page nothing — the date filter drops it, so visitors never see
it — and it is what keeps the check reporting the gap until someone can fill it.

```js
{
    id: '<slug, or slug-YYYY for a floating edition>',
    date: '2027-08-19',        // ISO, Groningen local calendar date
    endDate: '2027-08-29',     // only for multi-day runs
    // annual: true,           // ONLY for strictly fixed calendar dates
    // kidFriendly: true,      // ONLY when the event/attraction is genuinely aimed at kids
    // free: true,             // ONLY when attending costs nothing (paid extras, e.g. a
                                // drink token, don't disqualify — the event itself must be free)
    // publicHoliday: true,    // ONLY for events tied to an official Dutch public holiday
    title: { en: '...', nl: '...' },
    location: { en: '...', nl: '...' },
    tip: { en: '...', nl: '...' },
    url: 'https://...'         // official page when there is one — see below
}
```

- `kidFriendly: true`, `free: true` and `publicHoliday: true` each render as a filter pill in
  the Events view (`eventsFilterKids`/`eventsFilterFree`/`eventsFilterHoliday` in
  `UI_TRANSLATIONS`); `kidFriendly` also renders its own "Kid-friendly" badge on the card
  (`eventsKidFriendly`). Set any of them only when the event's own page (or, for `publicHoliday`,
  well-known fact — Koningsdag needs no citation) says so, the same way dates are verified — do
  not infer `kidFriendly` from a venue's general reputation, or `free` from an event merely
  lacking a listed ticket price.

- `id` must be unique and must not be renamed once shipped.
- `title`, `location` and `tip` are bilingual. The NL is not a literal translation; it
  should read like Dutch, in the same voice as the existing `tip` fields — a local
  telling a newcomer why this is worth turning up to.
- `endDate` is the last day of the run, inclusive. Omit it for single-day events.
- Give a floating edition a year-suffixed `id` (`noorderzon-2027`), since it is a
  specific edition rather than a standing tradition.
- `url` is optional, and it is where a **visitor** goes to read more — not a record of
  how the dates were checked. Use the event's official page when it has one, which is
  normally the same page the dates were verified against. When it has none, the best
  listings page belongs there rather than an empty field; the PR is where you say that
  is what it is.

## What else the change has to touch

- **Nothing hardcodes an event count.** Unlike `BUCKET_LIST`, the README does not state
  how many events there are, and `MILESTONES` / `CATEGORY_BADGES` are unrelated to
  `EVENTS`. There is no count to bump.
- Run `npm run lint` (ESLint is the CI gate) and `npm test` before pushing.
- Run `npm run events:check` again afterwards and paste its output into the PR body, so
  a reviewer can see the resulting state of the list without checking it out.

## Run discipline

- **One open refresh PR at a time.** Before doing anything, check for an open refresh
  PR. If one exists, the routine stops and reports it, rather than stacking a second.
- Recognise a previous refresh by its head branch **prefix** — never an exact string
  match; see the push authorization section below for why. As a secondary signal, the
  PR title starts with `chore: refresh`.
- Also skim recently closed refresh PRs: dates that were proposed and rejected should
  not come back unchanged.
- Keep the diff to `js/data.js` and this file's log table. A refresh run is not the
  place to change `js/events.js`, the rendering, or the tests — if the date logic looks
  wrong, report it instead of fixing it here.

## Push authorization (the thing that breaks routines)

A routine run happens in a throwaway container that is destroyed when the run ends, so a
commit that only exists locally is lost. Two settings decide whether it can push:

- the routine must have the repo attached as a **source**, and
- it must have an **outcome branch** authorizing the push.

Neither can be set through the `create_trigger` MCP tool — they come from the routine's
configuration in the claude.ai Routines UI. Without them the run does all the work and
then fails at `git push` with HTTP 403. This is exactly what happened on the first test
run of the [weekly bucket list routine](weekly-bucket-list-suggestion.md), and there is
no reason to learn it twice.

Setting the source in the UI creates the outcome branch automatically, with an arbitrary
generated name. Do **not** rename it to something tidier — the authorization is what
makes the push work.

### The branch name is a prefix, not a literal

On push the platform appends a per-session suffix, so a run lands on something like
`claude/<generated-name>-a1b2c3`. Two consequences:

- The run still branches off `origin/main` as usual; it is the **branch name** that must
  start with the authorized prefix. Do not base the work on the outcome branch itself.
  The suffix that appears on push is expected, not an error.
- Anything looking for previous refresh PRs must **match the prefix**. An exact-string
  comparison silently matches nothing, which would defeat the one-open-PR rule and stack
  a new PR every month.

### Backstop

A run that still cannot push must paste the complete `EVENTS` entries it produced, with
their source URLs, into its final reply. The reply outlives the container, so the work
can be applied by hand instead of being lost.

## Refreshed so far

Kept here so a later run can see what has already been chased, and what was left out
because dates were not yet announced.

| Date | Events touched | PR |
| --- | --- | --- |
| — | Initial fixed-date list shipped by hand | [#116](https://github.com/Dor-bl/moi-app/pull/116) |
| 2026-09-16 | Added `winterwelvaart-2026` (11–13 Dec 2026) and `esns-2027` (13–16 Jan 2027); Noorderzon and Bloemetjesmarkt checked but left out, no next edition announced on their official pages yet | (this PR) |
