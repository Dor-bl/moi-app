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

### Every run that gets past Step 1 looks ahead

Chasing successors for lapsed entries is not discovery. A run that only does that can
miss a well-known event happening days later, which is how the Sinterklaas arrival in
Haren (21 November 2026) went unlisted: the 18 November run spent its research on lapsed
entries and never looked at the coming weekends. So every run that passes the gate also:

- **Scans the next three weeks** on visitgroningen.nl **and** www.ervaarharen.nl, and
  the municipal calendar where it is reachable. Check ervaarharen.nl every time; it is
  the only source that reliably carries Haren's own events.
- **Logs the lookahead** in its row of the table below: the window scanned and what was
  added or left out. A run that scanned and found nothing new says so.

### What counts as local

The municipality of Groningen is the city **plus** its villages and former
municipalities: Haren (including Glimmen, Onnen and Noordlaren), Ten Boer and the other
villages that merged into it in 2019. Their events are local and are judged like any
other event in the city. They are **not** "village events across the province".

That matters most for the recurring set pieces a newcomer would hear about from
neighbours or their children's school, such as the Sinterklaas arrival, Sint Maarten and
the Koningsdag programme. Haren's Sinterklaas arrival goes on the list the same way the
city's does. The provincial ones (Delfzijl, Appingedam, Veendam, Winschoten and the like)
can still be left out, as they have been so far.

### Exclusions are not inherited

A "Left out" note in the table below records one run's judgement on one set of
listings. It is not a rule. A later run may not skip an event because an earlier run
skipped its *class*. It weighs each event on its own against this file, and only a
change to this file can exclude a class.

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
| `www.spooktochtzeerijp.nl` | yes | allowlisted 29 October 2026; the apex `spooktochtzeerijp.nl` is still refused; read end to end for Spooktocht Zeerijp (dates, prices, terms, sign-up form) |
| `www.wonderwereld.nl` | **connects, but redirects to the refused apex** | allowlisted 29 October 2026 as `wonderwereld.nl`; every page 301s to the apex, which the proxy still refuses, but `/wp-json/wp/v2/pages` and `/posts` (the site's public WordPress API) answer directly and return the page text |
| `www.celticfolkfestival.com` | **connects, but redirects to the refused apex** | allowlisted 29 October 2026 as `celticfolkfestival.com`; every page 301s to the apex, which the proxy still refuses, but `/wp-json/wp/v2/pages` and `/posts` (the site's public WordPress API) answer directly and return the page content (Divi shortcodes, which need stripping) |
| `www.forum.nl` | **connects, but redirects to the refused apex** | `www.forum.nl` was already reachable on 26 October 2026 and 301s to `forum.nl`, which the proxy refuses (403). The owner reported adding `forum.nl` to the allowlist on 29 October 2026, but the apex was still refused on 29 and 30 October from the session that probed it. Every path tried (`/`, `/robots.txt`, `/sitemap.xml`, `/nl/agenda`, `/wp-json/`, `/api/`) redirects, so there is no page to read directly; retest from a fresh session. Until the apex is reachable, a Forum event's dates are verified by the owner opening `forum.nl`, as the Horror Marathon's were on 29 October 2026 |
| `volksvermakengroningen.nl`, `jongeharten.nl`, `whiskyfestivalgroningen.nl`, `cinemaculinair.nl`, `survivalrungroningen.nl`, `museumnachtwesterwolde.nl` | no | probed 8 November 2026 for the November refresh, `www.` and apex alike: every one refused with the proxy's 403. Also refused that day: `discovergroningen.com`, `sinterklaas.nl`, `70microscopen.nl`, `www.groningerlandschap.nl`, `www.martiniplaza.nl`, `dotgroningen.nl`, `www.stadskanaalrail.nl`, `www.loopgroepnienoord.nl`, `www.campingdekleinewereld.nl`, `www.wandeleninwesterwolde.nl`, and the local news sites (`www.oogtv.nl`, `www.rtvnoord.nl`, `www.sikkom.nl`, `www.dvhn.nl`) |
| `www.groningerlandschap.nl` | yes | allowlisted 13 November 2026 as `*.groningerlandschap.nl`; read end to end for the Microscoopmiddag at Bezoekerscentrum Reitdiep (date, hours, prices, age, sign-up). It was refused on 8 November 2026, as listed in the row above |
| `www.hortusharen.nl` | yes | reachable 8 November 2026; its `/activiteiten/` and `/agenda/...` pages read end to end for the Microscopiedag |
| `www.jongeharten.nl` | yes | allowlisted 9 November 2026 as `*.jongeharten.nl`; the apex `jongeharten.nl` is still refused. Read end to end for Jonge Harten 2026: home, `/programma/`, `/festivalhart/`, `/info/`, `/en/info/tickets/`, `/locaties/` |
| `www.museumnachtwesterwolde.nl` | **connects, but redirects to the refused apex** | allowlisted 9 November 2026; every page 301s to `museumnachtwesterwolde.nl`, which the proxy still refuses, but `/wp-json/wp/v2/pages` (the site's public WordPress API; it has no posts) answers directly and returns the home, nachtbus and museum pages |
| `www.whiskyfestivalgroningen.nl` | yes | allowlisted 9 November 2026; the apex `whiskyfestivalgroningen.nl` is still refused. Read end to end for Whisky Festival Groningen 2026: home, `/tickets/`, `/veelgestelde-vragen/`, `/proeverij/` |
| `www.cinemaculinair.nl` | **connects, but its HTML is refused** | allowlisted 9 November 2026; the apex `cinemaculinair.nl` is refused by the proxy, and the `www.` host's pages answer HTTP 403 from Cloudflare to automated clients (do not try to defeat it), but `/wp-json/wp/v2/pages` and `/wp_theatre_prod` (the site's public WordPress API) answer directly and return the agenda pages |
| `www.survivalrungroningen.nl` | **connects, but redirects to the refused apex** | allowlisted 9 November 2026; every page 301s to `survivalrungroningen.nl`, which the proxy still refuses, but `/wp-json/wp/v2/pages` and `/posts` (the site's public WordPress API) answer directly and return the page text, as for `www.wonderwereld.nl` |

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
| 2026-10-26 | Added six Halloween-season entries by hand, on request, from Visit Groningen listings: `celtic-folk-halloween-2026` (31 Oct), `halloween-horror-marathon-2026` (31 Oct – 1 Nov, overnight, so modelled with `hours`), `ghostbusters-halloween-experience-2026` (31 Oct), `halloweenfeest-wonderwereld-2026` (31 Oct), `google-family-stem-day-2026` (31 Oct), `spooktocht-zeerijp-2026` (13–14 Nov). Egress policy blocked every organiser site (`forum.nl` — `www.forum.nl` 301s to the refused apex — tickets.spotgroningen.nl, wonderwereld.nl, rsvp.withgoogle.com), so dates, hours and prices came from visitgroningen.nl's page text and schema.org `eventSchedule` and are **unverified at source**, except that the owner confirmed the STEM Day's date and time at the organiser on 2026-10-27 (on 2026-10-29 the owner's screenshot of the same RSVP page also showed it as "volledig gratis" for pupils in groep 5 t/m 8 and their families, 31 October 10:30–16:00 GMT+1, with the registration form open; whether places remain is not shown before its second step). On 2026-10-29 the owner supplied a screenshot of the Horror Marathon's page on forum.nl, confirming Saturday 31 October, 18:30–02:05, €40 and the "English friendly" label (the page also showed "last tickets"); the programme and the breaks are still the listing's. The same day the owner supplied a screenshot of the Ghostbusters ticket page on tickets.spotgroningen.nl, confirming Saturday 31 October 2026 at 15:00 in the Schouwburgzaal and the prices: €7.50 for dance and film, €6 for the film only (the tip states both). Zeerijp was then verified on www.spooktochtzeerijp.nl once that host was allowlisted on 2026-10-29 (only the `www.` form is reachable): Friday 13 and Saturday 14 November 2026, "Bijna volgeboekt", walks in groups of 8–11 starting in the evening from the Dorpshuis, Borgweg 9, €12.50 (€10 up to 12 years) paid on arrival, everyone 12 or older (younger only with someone aged 18 or over), sign-up through the site's form with a start slot chosen on it, 48 hours' notice to cancel or change; the tip and location now say so. Wonderwereld was checked on 2026-10-29: the owner re-read its Visit Groningen listing and found the park's ticket shop (wonderwereld.blue.nl) listing Saturdays 10:00–17:00 for September and October. Once `wonderwereld.nl` was allowlisted that day, `www.wonderwereld.nl` 301ed to the apex, which the proxy still refuses, but its public `/wp-json/` answered directly: the park's own pages confirm those Saturday hours and the €11 entry from 2 years, and contain no Halloween page, post or event. The party itself is on the Oktober Kindermaand programme (www.kindermaand.nl/activiteiten/halloweenfeest, reachable): Saturday 31 October 2026, 13.00–16.00, ages 4–12, adults €11 (free if dressed as a creepy figure), no booking needed, the Halloween contest at 15.30, Ruiten A Kanaal Noord 1, Ter Apel. That programme page now supplies the tip, the address and the `url`; the party is confirmed there and not on wonderwereld.nl itself. On 2026-10-27, the owner supplied an organiser-page screenshot for Celtic Folk, confirming 31 October, doors open at 17:00 and tickets at €27.50; this confirms the opening time, not the programme. Once `celticfolkfestival.com` was allowlisted on 2026-10-29 (`www.` 301s to the refused apex, but the site's public WordPress API answers), the organiser's own Halloween Edition page (last edited 2026-10-13) gave the programme: 17:00 doors and dinner (not included), Baked Beans 19:00, Rapalje 20:30, Scrum 22:15, a spook tunnel at the entrance, "Vol = Vol"; it gives no end time. That settles the conflict on the start (Visit Groningen's 19:00 was the music, Festivalinfo's 18:00 is not on the organiser's page); the card keeps 17:00 doors as `startTime` and Visit Groningen's 23:30 as `endTime`, which the organiser does not confirm. The page is a Divi page whose link the API reports as the site root, which is now the entry's `url`; it was not opened from here. `url` is the organiser's page for the Horror Marathon (forum.nl), Ghostbusters (SPOT tickets), the STEM Day (Google RSVP) and Zeerijp (spooktochtzeerijp.nl), as linked from their Visit Groningen listings and not fetched from here (the owner has since opened the Forum, SPOT and RSVP pages); Wonderwereld links to its page on the Oktober Kindermaand programme (www.kindermaand.nl/activiteiten/halloweenfeest), because the park's own site has no page for the party; Celtic Folk's listing has no organiser link, but its own site does (see below), so it links there. Flags are only set where the listing's prose states them: `free` on the STEM Day alone (Wonderwereld is free for children only, adults pay €11), `kidFriendly` on the STEM Day and Wonderwereld. Left out: a Spooktocht Vinkhuizen (30–31 Oct) and a Halloweentocht in Haren, which appeared only in the municipal permit calendar (gemeente.groningen.nl, blocked) with no programme; and thinner or nightlife listings (Halloweenavond at the Doopsgezinde kerk, Terrasje Speciaal, Sugarspin's, Spooktocht Termunterzijl, the Vlagtwedde lantern parade, Spooktocht Middelstum, Griezelen in vanBeresteyn, the Bierum Samhain ceremony, Bowling De Rode Loper) | (this PR) |
| 2026-11-07 | Added two events for the weekend by hand, on request, from Visit Groningen listings: `sint-martinusoptocht-2026` (7 Nov, 16:00–18:00, free, kid-friendly) and `sunnemeerten-parade-2026` (7 Nov, 18:00–19:30). Both are **unverified at source**: the dates, hours and programme come from visitgroningen.nl's page text and schema.org `eventSchedule`, and `url` is that listing. `www.sunnemeerten.nl` is refused by the egress proxy (403); the Martinusoptocht listing links no organiser page. `free` and `kidFriendly` are set only on the Martinusoptocht, whose listing says "Gratis" and is aimed at children with lanterns; the Sunnemeerten listing gives no price, so it carries neither flag. Left out: Taptoe Groningen (Martiniplaza, ticketed concert, no description) and the Sunday listings, which were exhibitions and guided walks | (this PR) |
| 2026-11-08 | Added seven entries for the rest of November by hand, on request ("New events to add this month?"), discovered on visitgroningen.nl's agenda (every listing page sorted by date, plus the Festival, Markt, Kinderen, Culinair, Tocht, Beurs, Sport, Actief and Excursie keyword filters; the site's date-range filter returns "Bad Request" from here, so the pages were paged through instead): `microscopiedag-hortus-haren-2026` (14 Nov, 12:00–15:30, kid-friendly), `sinterklaasintocht-groningen-2026` (14 Nov, 13:00–15:30, free, kid-friendly), `museumnacht-westerwolde-2026` (14 Nov, 19:00–24:00; the tip names the seven museums, the prices and the night bus, two oldtimer buses on their own routes leaving 19:00 from the Vesting Bourtange car park, all per the organiser's site), `jonge-harten-2026` (14–21 Nov, hub 15:00–23:59 daily per the organiser, with `hours` for the two days whose programme starts earlier), `cinema-culinair-groningen-2026` (19–22 Nov) and `cinema-culinair-groningen-2026-11-26` (26–29 Nov), the two blocks of show days, with no daily hours because brunch, early-dinner and dinner shows start at different times, `whisky-festival-groningen-2026` (27–28 Nov, modelled with `hours`: Friday 18:00–22:30 and Saturday 12:00–22:30, from the first pre-session tasting to the last session's end, per the organiser), `survivalrun-groningen-2026` (29 Nov, 09:00–16:00). **Verified at source:** the Microscopiedag, on www.hortusharen.nl (14 November 2026, 12.00–15.30 in the Plantage, adults pay the regular entry, children up to 17 free); and, once the owner allowlisted their hosts on 9 November 2026, Jonge Harten on www.jongeharten.nl (14–21 November 2026, Festivalhart Bloemstraat 38 open 15:00–01:00 Fri/Sat and 15:00–00:00 other days with free entry, box office 17:00–23:00, programme from 14:30 on the 14th and 14:00 on the 21st, shows at the Stadsschouwburg, Grand Theatre, De Kunstwerf and Studio X with youth prices up to 29 and a passe-partout; the entry's `startTime`/`endTime`/`hours` and location were corrected to match, after the first run had placed the hub at De Kunstwerf) and Survivalrun Groningen through the public WordPress API of www.survivalrungroningen.nl (Sunday 29 November 2026, 13th edition, start/finish on the south side of the ACLO, Blauwborgje 16, starts from the kids run at 9:00 to the parent-and-child run at 13:20, Dutch student championship included, spectators welcome; `startTime` moved to 09:00 accordingly, the 16:00 `endTime` and the €27.50 fee remain the listing's, as the organiser pages read give neither). Museumnacht Westerwolde was verified the same day through the public WordPress API of www.museumnachtwesterwolde.nl once the owner allowlisted it: Saturday 14 November 2026, second edition, seven museums (Vesting Bourtange, Kamp de Beetse, Museum Klooster Ter Apel, Vestingmuseum Oudeschans, Het Dinosaurium, Burcht Wedde, Het MOW) open 19.00–24.00, passe-partout €12.50 online with a wristband at the first museum, single tickets at the door (Bourtange €8, children to 11 €5), Nachtbus €22.50 with two buses on their own routes both leaving 19.00 from the Vesting Bourtange car park (which confirms CodeRabbit's earlier finding, now in the tip), night mayor Wim van der Kuip. Cinema Culinair was partly confirmed on 9 November 2026 by an owner screenshot of cinemaculinair.nl's ticket grid (the host is refused from here): Groningen, Mediacentrale, Ratatouille Film & Brunch 28 Nov 11:30, Film & Diner 28 Nov 18:00 ("Nog 2 tickets"), Film & (Early) Diner 29 Nov 17:00, which confirms the venue and the three formats with their start times; the 19 November start, the other films and the prices remain the listing's. The Whisky Festival was verified on www.whiskyfestivalgroningen.nl once the owner allowlisted it the same day: 27 & 28 November 2026, Akerk, Friday evening session 19:00–22:30, Saturday afternoon 13:00–16:30 and evening 19:00–22:30, more than 30 stands, over 2,000 whiskies, 18+, festival tokens €1.25, paid cloakroom €1, separately ticketed tastings in the sacristy an hour before each session (18:00, 12:00, 18:00) and an hour after it starts (20:00, 14:00, 20:00), organised by Slijterij Frans Muthert and Dramtime; the `hours` now run from each day's first tasting (Friday 18:00, Saturday 12:00) to its last session's end, and the tip carries the tokens, tastings, age limit and cloakroom. Ticket prices are in the external ticket shop and were not read. Cinema Culinair was then verified in full the same day through the public WordPress API of www.cinemaculinair.nl once the owner allowlisted it (its HTML is Cloudflare-gated): the Agenda Groningen page lists ten shows at the Mediacentrale, 19, 20 and 21 Nov Chef 18:00, 21 Nov Chocolat brunch 11:30, 22 Nov Julie & Julia 17:00, 26 Nov Grease 18:00, 27 Nov The Menu 18:00, 28 Nov Ratatouille brunch 11:30 and dinner 18:00, 29 Nov Ratatouille early dinner 17:00, with no shows on 23–25 Nov, so the entry was split into `cinema-culinair-groningen-2026` (19–22 Nov) and `cinema-culinair-groningen-2026-11-26` (26–29 Nov) on the STAR-days precedent, each tip listing its block's shows; the FAQ gave the €1.50 service fee, the online-only sale, the no-allergy-changes rule with vegetarian/vegan menus at checkout and the one free rebooking up to three days before; `url` is now the organiser's Groningen agenda. Still the listing's: the prices, which the organiser keeps in its ticket shop. Four of the ten shows were sold out when read (page text and schema.org `eventSchedule`), and the Sinterklaasintocht has no Visit Groningen listing at all: its date, times, route and "Gratis" first came from search-engine snippets of the organiser's own page (volksvermakengroningen.nl: 14 November 2026, 13:00–15:30, boat on the Reitdiep at 13:00, Zuiderhaven about 13:30, parade from the Praediniussingel 14:10, Grote Markt 15:00, children's programme 14:30–15:30), which agree with sinterklaas.nl and the municipal calendar on the day (those two give a 12:45 start, presumably the wider window); one aggregator (sinterklaasfeest.org) says Sunday 15 November, which no other source supports. On 9 November 2026 the owner opened the organiser's page in a browser (the host is still refused from here) and its header confirmed Saturday 14 November 2026, 13:00–15:30, "Gratis" and the full parade route (Praediniussingel → Museumbrug → Westerkade → Westerhaven → Astraat → Abrug → Brugstraat → Munnekeholm → Gedempte Zuiderdiep → Oosterstraat → Grote Markt → Kwinkenplein → Oude Ebbingestraat → Rode Weeshuisstraat → Oude Boteringestraat → Broerstraat → Oude Kijk in Het Jatstraat → Zwanestraat → Grote Markt), which the tip and location now carry; the intermediate times in the tip remain the snippets'. `url` is the organiser's page in every case (as linked from the listing, not fetched from here) except the Microscopiedag, whose Hortus page was read. Flags: `free` only on the intocht (organiser snippet "Gratis"); `kidFriendly` on the intocht (children's programme) and the Microscopiedag (children free, "mini-expeditie"); not on Jonge Harten, whose two listings disagree on price (one says "Gratis", the other lists none), so the tip says the hub is free to walk into and shows are ticketed, and no flag is set. Left out: Let's Gro (6–8 Nov, already ending), Stadjersmarkt and Gronings Mooiste (8 Nov, today), the village Sinterklaas arrivals across the province (Delfzijl, Appingedam, Veendam, Winschoten and others, each its own listing), the Sinterklaas Express at Museumspoorlijn STAR (22, 28, 29 Nov, booking required), the village winter fairs (Adorp 21 Nov; Biessum, Onnen, Sellingen, Veendam 28–29 Nov), Tech To The Future (25 Nov, aimed at school pupils), the Nienoord crossloop (28 Nov, Leek), DOT's Garage Sale (15 Nov), Noordelijke Spoor- en Modelbouwdagen (21–22 Nov, Veendam) and the Mysterieuze lichtjesroute Sellingen (14 Nov) — all real, but either outside the city with no Groningen-specific pull, or too small to carry a card. Concerts, theatre, exhibitions and workshops were skipped as a class | (this PR) |
| 2026-11-13 | Added one event for the weekend by hand, on request ("Got events this weekend to add?"), after a discovery pass over the first eight date-sorted pages of visitgroningen.nl's listings (~190 entries) for 14–15 Nov: `microscoopmiddag-reitdiep-2026` (14 Nov, 14:00–16:00, free, kid-friendly), Het Groninger Landschap's microscope afternoon at Bezoekerscentrum Reitdiep, Wolddijk 103. Discovered on the Visit Groningen listing; `www.groningerlandschap.nl` was refused by the egress proxy at first, and once the owner allowlisted `*.groningerlandschap.nl` the same day the entry was **verified at source** on the organiser's page: Saturday 14 November 2026, 14:00–16:00, Bezoekerscentrum Reitdiep, Wolddijk 103, "Gratis" for adults and children up to 12 (members and non-members alike), sign-up through the page's form, "vanaf 8 jaar", "Honden niet toegestaan"; the tip now carries the sign-up, the age and the no-dogs rule. `kidFriendly` follows the page's "Jeugdactiviteiten" category. Left out: the Lycurgus – Nimidia VC Limax Eredivisie volleyball match (15 Nov, an ordinary league home game), the Delfzijl Herfstfair, Microscoopdag Grootegast and the Single Meet Single Party, plus the classes the 8 November run already skipped (concerts, exhibitions, workshops, village Sinterklaas arrivals, DOT's Garage Sale, the Sellingen lichtjesroute) | (this PR) |
| 2026-11-18 | Weekly run: added `aigrunn-2027` (28 May 2027) and `aigrunn-hackathon-2027` (26–27 May 2027, Niemeyer), both verified on www.aigrunn.org (`/2027`, `/hackathon`); removed `aigrunn-hackathon-2026`, replaced by its successor. `aigrunn-2026` kept lapsed beside its successor because it carries a `checkIn`/badge. The other 35 lapsed entries were kept: none is marked one-off and all lapsed within one cycle. Noorderzon's site still says only "augustus 2027"; Eureka, Wijnfestival, Popronde, Groninger Marktendag, ESNS, Bloemetjesmarkt and Nacht van Kunst & Wetenschap guesses were unreachable; 4mijl.nl, plantsoenloop.nl and winterwelvaart.nl 301 from `www.` to the refused apex | (this PR) |
| 2026-11-22 | Weekly run. Lookahead 23 Nov – 13 Dec 2026: paged through 60 date-sorted listing pages of visitgroningen.nl (`/nl/doen/uitgaan?page=N`, 404 events with a schedule day in the window) and read www.ervaarharen.nl's `/events/` page. Added `sinterklaasfestival-haren-2026` (28 Nov, 10:00–16:00, free, kid-friendly), verified on www.ervaarharen.nl/event/sinterklaas-festival-haren, and `kerstmarkt-bourtange-2026-12-05` / `-12-12` / `-12-19` (three weekends, Sat 11:00–21:00, Sun 11:00–18:00), verified on www.bourtange.nl/events/kerstmarkt, which answered HTTP 200 with the full page on 22 November 2026 (no SiteGround challenge this time). Visit Groningen lists the Bourtange Saturdays as 11:00–18:00; the organiser's 21:00 is used. Left out because the organiser host is refused by the egress proxy (403), so the dates could not be verified at source: Stadspark Nightrun (11 Dec, stadsparknightrun.nl), Zweedse Kerstmarkt (12–13 Dec, Oude Suikerfabriek, zweedsekerstmarkt.nl), Christmas City Walk (12–13 Dec, christmascitywalk.nl), Mirakel light art at Fraeylemaborg (11–20 Dec, fraeylemaborg.nl), Platenbeurs XXL (5 Dec, martiniplaza.nl). Also left out: the Hoornse Meer neighbourhood Sinterklaas arrival (25 Nov), the Piccardthof Christmas market (12 Dec, no organiser page), Holiday on Ice (touring show), and concerts, theatre, exhibitions and workshops. Cleanup: all 37 lapsed entries kept; none is marked one-off, all lapsed within one cycle (the oldest on 25 Sep 2026), and none has an announced successor that could be read | (this PR) |
