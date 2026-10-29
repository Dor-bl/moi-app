# Monthly Events Refresh Routine

A Claude Routine ("Monthly Groningen events refresh — moi-app") checks the `EVENTS`
list in [`js/data.js`](../../js/data.js) for gaps and, only if it finds any, opens a
pull request that fills them in or clears out entries that are dead.

Despite the name it runs **weekly**, on `0 7 * * 3`: Wednesdays at 07:00 UTC. Cron is
evaluated in UTC while Amsterdam switches between CEST (UTC+2) and CET (UTC+1), so the
run lands at 09:00 local in summer and 08:00 local in winter. Nothing depends on the
exact hour, so the schedule is not re-pinned across the DST changes. A quiet week
costs nothing: the gate below stops the run before any research.

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
not "tidy" anything. A week where the list is healthy is a success, not a broken run —
a routine that files something every week is a notification people learn to ignore.

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
prompted the organiser domains to be allowlisted (the `plantsoenloop.nl` row was
added on 23 September 2026):

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
| `plantsoenloop.nl` | no | 403 on both `www.` and apex |
| `www.aclosport.nl` | yes | allowlisted 5 October 2026; the apex `aclosport.nl` is still refused |
| `www.oktofest.nl` | **connects, but challenged** | allowlisted 5 October 2026; SiteGround CAPTCHA like `www.bourtange.nl` (HTTP 202, `sg-captcha: challenge`) |
| `www.em2groningen.nl` | **connects, but challenged** | allowlisted 5 October 2026 as `*.em2groningen.nl`; the root 301s to the apex, which the proxy still refuses, and every `www.` path gets the SiteGround CAPTCHA |

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

### Cleaning up entries that will never come back

"Leave it lapsed" is only right while a successor is still possible. Otherwise the entry
keeps `events:check` failing for good, and a gate that never goes quiet is one nobody
reads. For every lapsed entry the check reports, the run picks exactly one of these:

1. **Replace it.** A successor edition is confirmed on the official page, so add the
   successor and delete this entry in the same change, as above.
2. **Delete it.** Nothing will ever replace it. That holds when any of these is true:
   - It was a **one-off**. Its own `tip`, a comment beside it, or its official page
     says it was a single edition, a launch night or a one-time event. The Wine Walk
     Haren, removed in [#161](https://github.com/Dor-bl/moi-app/pull/161), is the
     model case.
   - The official page says the event was **cancelled for good or discontinued**.
   - It lapsed **more than one full cycle ago**: 12 months for a yearly event, or
     the known cycle for one that runs less often, such as 24 months for an event
     held every other year. By then its next edition should already have happened,
     so either the event has stopped or the list missed it. Either way, the old
     entry reminds nobody of anything useful. The cycle has to be known, from the
     entry or its official page, and the PR says which cycle was assumed and where
     it came from. If the cycle is unknown, for example if it may run every other
     year or may just be skipping one, the unclear-recurrence rule below applies and
     the entry is kept.
3. **Keep it.** It recurs, it lapsed within one full cycle, and no successor has
   been announced yet. That is the normal state for a floating festival between
   editions, and the entry stays so the check keeps asking.

**An entry that ever shipped a `checkIn` block is never deleted — leave it lapsed,
whatever the cases above say.** `earnedEventBadges()` draws each earned badge by
looking its event up in `EVENTS` and reading `event.badge`; an id it cannot find is
skipped, deliberately, because a card with no icon, title or description is worse than
no card. So deleting such an entry takes the badge out of every visitor's Achievement
Badges grid — including people who physically turned up and earned it — while leaving
the key sitting in their storage. That is the exact failure
[#145](https://github.com/Dor-bl/moi-app/pull/145) exists to prevent, arriving by a
different route, and nothing about it is visible from the check output or the diff.
The cost of keeping the entry is one line of data the date filter already hides.

**"Ever shipped" has to be answerable from the entry in front of you, so never silently
remove a `checkIn` block either.** A cleanup run reads the current `EVENTS` entry. If
some earlier change dropped the `checkIn` — the venue moved, or the point stopped being
a point — the entry is now indistinguishable from one that never had it, and the next
cleanup deletes it under the cases above, orphaning the badges anyway. So when a
`checkIn` genuinely has to go, leave a comment in its place saying the entry once
carried one and must not be deleted. `git log -S'checkIn' -- js/data.js` is the backstop
for anything predating this rule, but a rule that needs archaeology on every candidate
is a rule that gets skipped; the comment is what makes it hold.

**Retiring a check-in means removing `checkIn` and keeping `badge`.** The two arrive
together, so the reflex is to take them out together — and that orphans the badges just
as completely as deleting the whole entry, while leaving an entry in `EVENTS` that looks
cared for. `earnedEventBadges()` reads `event.badge` for the icon, title and description
it draws, and skips any record whose event has none: `if (!event || !event.badge) return
null;`. So `badge` is the field the earned cards actually depend on. `checkIn` is only
the offer of the button, and removing it is the whole point of retiring one — the event
stops being checkinnable, and everyone who already turned up keeps their card.

(The storage key is never cleaned up either way, so if the entry is ever restored the
badge comes back with it. That is the recovery path, not a reason to delete.)

Deleting is a data change like any other: it goes in the same refresh PR, and it
never happens on a guess. Name every deleted entry in the PR body along with the
reason (which of the cases above) and the evidence for it. For a one-off that is
the entry's own `tip` or comment, quoted, or the page that says so. For a
discontinued event it is the official page. When the only reason is the entry's
age, say that plainly. **If you can't tell whether an entry recurs, or how often,
keep it and ask in the run's final reply.** That rule overrides every delete case
above, including the age-based one.

A cleanup-only run is a valid outcome. If the list's only gap is a dead entry, open a
PR that just deletes it, titled with the usual `chore: refresh` prefix so the
one-open-PR rule still recognises it.

When adding a one-off in the first place, say so in its `tip` or in a comment beside
the entry. That one line is what lets a later run delete it without re-researching.

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

### Check-in and badge (optional, and usually skipped)

An event can also carry a `checkIn` block, which puts an **I'm here 📍** button on its
card while the event is running and awards a badge to a visitor whose device confirms
they are there. Most events should not have one. Add it only when **both** hold:

- **There is a single point a visitor can stand at.** A city-wide event has none:
  Koningsdag's vrijmarkt is the whole city, so it carries no `checkIn` and shows no
  button. A festival terrain, a garden, a square — those have a point.
- **Turning up is worth a badge.** The badge is permanent and personal. If the event is
  not the kind of thing someone would be glad to have a record of attending, skip it.

```js
// The tail of the entry, continuing the shape above. `url` carries no trailing
// comma there, because it was the last field; adding these gives it one.
    url: 'https://...',
    checkIn: { coords: [53.2026, 6.5540], radius: 600 },
    badge: {
        icon: '🕊️',
        title: { en: 'Stadspark Liberator', nl: 'Stadspark Bevrijder' },
        desc: { en: '...', nl: '...' }
    }
```

- **`coords` is the terrain, not the venue's centroid.** The Bevrijdingsfestival's point
  is the Drafbaan, where the stages are, not the middle of the Stadspark — the park is
  ~140 hectares and its far end is nowhere near the event. A geocode of the street
  address is a starting point, not an answer: it can land a few hundred metres out, and
  a centre that is wrong either refuses people standing in the event or accepts people
  who are nowhere near it. Check it against something you know — a distance to a
  landmark you can sanity-check beats trusting the geocoder.
- **`radius` covers the grounds and the normal approach**, and stops short of anywhere a
  visitor could plausibly be without attending. The test enforces 100–2000 m; 600 m has
  been cleared by a real GNSS fix at the Drafbaan. **Err on the side of generosity when the
  centre is a geocode you could not verify** — a false refusal from inside the event teaches nobody
  anything, and the badge was never proof in the first place.
- **`radius` is also the accuracy gate, which is the part that surprises people.** A fix
  vaguer than the radius is refused *before* any distance is computed, because a
  multi-kilometre error bound centred on the city would otherwise land inside the radius
  and hand the badge to someone on another continent. So tightening the radius does not
  just shrink the area — it rejects more phones. A 150 m radius refuses any device that
  only manages ±200 m, wherever it is standing.
- **`badge` names the place and the occasion**, bilingual like everything else, in the
  same voice as `tip`. `icon` is a single emoji.
- **The badge is keyed to the resolved occurrence, not the event id.** A two-day festival
  is one badge, not one per day, and an `annual: true` entry is earnable again next year.
  Nothing extra is needed for either.

What CI already checks, so a slip fails the build rather than shipping a dead button:
the test loops over *every* entry carrying a `checkIn` and asserts the radius is
plausible, the badge has a title and a description in **both** languages, and the
coordinates sit inside a coarse box — 53.0–53.6 N, 6.2–7.3 E.

Be clear about what that box is and is not. It is a rectangle, not the province: Roden
sits inside it and is in Drenthe, and so does Emden, which is in Germany. What it
reliably catches is a typo or a swapped lat/lon pair, which is what it is for. It does
not certify that a point is in Groningen.

What CI cannot check is whether the point is the *right* point. Only standing there
proves that, and a faked position never will. The way this has been done is a throwaway
branch carrying the new `checkIn`, pushed for its Vercel preview, tapped at the venue
while the event is running, and then abandoned — never merged, and nothing of it in the
events PR.

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
- Keep the diff to `js/data.js` and this file's log table. That covers deletions
  under *Cleaning up entries that will never come back*. A refresh run is not the
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
  a new PR every week.

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
| 2026-09-16 | Added `winterwelvaart-2026` (11–13 Dec 2026) and `esns-2027` (13–16 Jan 2027); Noorderzon and Bloemetjesmarkt checked but left out, no next edition announced on their official pages yet | [#133](https://github.com/Dor-bl/moi-app/pull/133) |
| 2026-09-22 | Added `hortusfestival-haren-2026` (26–27 Sep 2026). Wine Walk Haren left lapsed, no next edition on ervaarharen.nl. Noorderzon says only "augustus 2027", Bloemetjesmarkt has no 2027 date. Menzis 4 Mijl (4mijl.nl) and Wild Festival (wildfestivalgroningen.nl) could not be verified because egress policy blocked both official sites. Nacht van Kunst & Wetenschap: official domain blocked and no 2027 date found anywhere | (this PR) |
| 2026-09-23 | Added `plantsoenloop-2026` (7 Nov 2026, 09:00–16:00) by hand on request. Egress policy blocked the official site plantsoenloop.nl, so the date, hours and price came from visitgroningen.nl. The repo owner then confirmed on plantsoenloop.nl the 09:00 start and the last 8 km start at 15:15 | (this PR) |
| 2026-09-26 | Removed `wijnwandeling-haren-2026` (18 Sep 2026): the one-off opening night of a themed Friday series, so no successor will ever be announced and it would keep `events:check` failing for good. `eureka-2026` (25 Sep 2026) left lapsed for now, as it is a yearly festival with no 2027 date yet | (this PR) |
| 2026-09-28 | Removed `hortusfestival-haren-2026` (26–27 Sep 2026): its own `tip` calls it a one-off anniversary weekend ("eenmalig festivalweekend") for the Hortus's 400th birthday. `wijnfestival-groningen-2026` (25–27 Sep) and `eureka-2026` (25 Sep) kept: yearly festivals lapsed within one cycle, no successor announced yet | (this PR) |
| 2026-10-04 | Added six October events by hand, on request, from a Discover Groningen post: `aclo-vitalis-run-2026` (7 Oct), `popronde-groningen-2026` (8 Oct), `vier-mijl-2026` (11 Oct), `oktofest-groningen-2026` (16–17 Oct), `bierrun-groningen-2026` (17 Oct), `nacht-van-de-nacht-2026` (24 Oct). Egress policy blocked every organiser site (aclosport.nl, popronde.nl, 4mijl.nl, oktofest.nl, bierbattle.nl, em2groningen.nl). The 4 Mijl, Bierrun and Nacht van de Nacht dates were read off visitgroningen.nl. Popronde was partly checked there: the Vera show is listed for 8 Oct. The Suikermarkt at EM2 (25 Oct per a search snippet) was left out: www.em2groningen.nl is CAPTCHA-gated, the apex is not allowlisted, and the event page the snippet pointed to returned "Sorry, niks gevonden!" when the repo owner opened it, so the date could not be confirmed. Oktofest: www.oktofest.nl is CAPTCHA-gated, so the repo owner read it in a browser on 5 October 2026 (16 and 17 October, Friday from 19:00, Saturday from 18:00, taps close at midnight). ACLO-Vitalis was then verified on www.aclosport.nl once that host was allowlisted on 5 October 2026 (only the `www.` form is reachable): "07 October", 18:00 start, free, with the page last modified 30 September 2026 | (this PR) |
| 2026-10-08 | Added ten autumn-holiday entries by hand, on request, from a Visit Groningen Instagram post ("Tips voor de herfstvakantie"): `de-boer-op-midden-groningen-2026` (10 Oct), `star-kindermaand-2026-10-11` / `-10-14` and `star-teddyberendag-2026` (11, 14, 18 Oct), `cinekid-forum-2026` (12–16 Oct), `kwelderexcursie-pieterburen-2026-10-13` / `-10-16`, `springkussen-festival-martiniplaza-2026` (13–16 Oct), `natuur-knutselmiddag-coendersborg-2026` (14 Oct), `paddenstoelenfestival-ennemaborg-2026` (18 Oct). STAR and the kwelder trip run on separate days, not a span, so each day is its own entry: a span would show them as happening on the days off. Egress policy blocked every organiser site (stadskanaalrail.nl, cinekid.nl, groningerlandschap.nl, martiniplaza.nl, staatsbosbeheer.nl, boerderijarkema.nl; www.forum.nl 301s to the refused apex), so dates and hours came from visitgroningen.nl's schema.org `eventSchedule`, and Cinekid's run from the Forum film listings there. The post's Paddenstoelenexpeditie at Metbroekbos (14 Oct) was left out: no listing could be found, so the post was its only source, with no time or booking details. Its daily Vogelbeleefpad at Lauwersnest was left out: a permanent trail, not a dated event | (this PR) |
| 2026-10-26 | Added six Halloween-season entries by hand, on request, from Visit Groningen listings: `celtic-folk-halloween-2026` (31 Oct), `halloween-horror-marathon-2026` (31 Oct – 1 Nov, overnight, so modelled with `hours`), `ghostbusters-halloween-experience-2026` (31 Oct), `halloweenfeest-wonderwereld-2026` (31 Oct), `google-family-stem-day-2026` (31 Oct), `spooktocht-zeerijp-2026` (13–14 Nov). Egress policy blocked every organiser site (`forum.nl` — `www.forum.nl` 301s to the refused apex — tickets.spotgroningen.nl, wonderwereld.nl, spooktochtzeerijp.nl, rsvp.withgoogle.com), so dates, hours and prices came from visitgroningen.nl's page text and schema.org `eventSchedule` and are **unverified at source**, except that the owner confirmed the STEM Day's date and time at the organiser on 2026-10-27 (its `free` and age details are still the listing's). On 2026-10-29 the owner supplied a screenshot of the Horror Marathon's page on forum.nl, confirming Saturday 31 October, 18:30–02:05, €40 and the "English friendly" label (the page also showed "last tickets"); the programme and the breaks are still the listing's. On 2026-10-27, the owner supplied an organiser-page screenshot for Celtic Folk, confirming 31 October, doors open at 17:00 and tickets at €27.50; this confirms the opening time, not the programme hours. The app uses doors-open and the Visit Groningen end time (23:30); Festivalinfo lists 18:00–23:45, so the actual programme hours remain unclear. `url` is the organiser's page for the Horror Marathon (forum.nl), Ghostbusters (SPOT tickets), the STEM Day (Google RSVP) and Zeerijp (spooktochtzeerijp.nl), as linked from their Visit Groningen listings and not fetched from here (the owner has opened the RSVP page); Celtic Folk and Wonderwereld have no organiser link on their listings, so they keep the listing. Flags are only set where the listing's prose states them: `free` on the STEM Day alone (Wonderwereld is free for children only, adults pay €11), `kidFriendly` on the STEM Day and Wonderwereld. Left out: a Spooktocht Vinkhuizen (30–31 Oct) and a Halloweentocht in Haren, which appeared only in the municipal permit calendar (gemeente.groningen.nl, blocked) with no programme; and thinner or nightlife listings (Halloweenavond at the Doopsgezinde kerk, Terrasje Speciaal, Sugarspin's, Spooktocht Termunterzijl, the Vlagtwedde lantern parade, Spooktocht Middelstum, Griezelen in vanBeresteyn, the Bierum Samhain ceremony, Bowling De Rode Loper) | (this PR) |
