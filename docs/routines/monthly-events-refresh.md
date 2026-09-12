# Monthly Events Refresh Routine

A Claude Routine fires on the **first of each month**, checks the `EVENTS` list in
[`js/data.js`](../../js/data.js) for gaps, and — only if it finds any — opens a pull
request filling them in.

The schedule is `0 8 1 * *`, and cron is evaluated in UTC while Amsterdam switches
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
non-zero when the list needs attention.

**If it exits 0, the run stops there.** Do not open a pull request, do not comment, do
not "tidy" anything. A month where nothing has lapsed is a success, not a broken run —
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

## Verifying dates

Each date added or changed must be read off the event's **own official page** — not an
aggregator, not a listings site, not a cached search snippet, and not memory.

The pull request body must cite, for every event it touches, the URL the dates came
from, so review is click-and-verify rather than re-research. An event whose dates could
not be confirmed from its official page does not go in the PR.

## Event shape

Append to `EVENTS` in `js/data.js`, keeping the existing style and the comment block
above the array:

```js
{
    id: '<slug, or slug-YYYY for a floating edition>',
    date: '2027-08-19',        // ISO, Groningen local calendar date
    endDate: '2027-08-29',     // only for multi-day runs
    // annual: true,           // ONLY for strictly fixed calendar dates
    title: { en: '...', nl: '...' },
    location: { en: '...', nl: '...' },
    tip: { en: '...', nl: '...' },
    url: 'https://...'         // the official page the dates came from
}
```

- `id` must be unique and must not be renamed once shipped.
- `title`, `location` and `tip` are bilingual. The NL is not a literal translation; it
  should read like Dutch, in the same voice as the existing `tip` fields — a local
  telling a newcomer why this is worth turning up to.
- `endDate` is the last day of the run, inclusive. Omit it for single-day events.
- Give a floating edition a year-suffixed `id` (`noorderzon-2027`), since it is a
  specific edition rather than a standing tradition.

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
