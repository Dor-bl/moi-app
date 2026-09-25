// Events Module - Shared Global Exports: todayInGroningen, resolveOccurrence,
// getUpcomingEvents, isHappeningNow, isOngoing, formatEventDate, formatEventEnd,
// formatEventsCoverageEnd
// timeInGroningen is internal only - nothing outside this file needs the clock.
// Dependencies: none. Pure date logic, so tests can drive it without a DOM.

// "Today" is Groningen's calendar day, not the device's. Everything here ships to
// one city, so a phone left on another timezone should not drop an event a few
// hours early or late around midnight.
//
// Built from formatToParts rather than format(): every comparison and slice below
// treats this as ISO YYYY-MM-DD, and a locale's output *order* is a formatting
// convention rather than a guarantee. Reading the parts out by name cannot drift
// with the engine's CLDR data, and a wrong shape here would break filtering
// silently rather than loudly.
function todayInGroningen(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Amsterdam',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(now);

    const part = type => parts.find(candidate => candidate.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
}

// Same idea as todayInGroningen, but the clock: an event's startTime/endTime are
// written as Groningen wall-clock hours, so this is what a comparison against
// them needs, regardless of which timezone the visitor's device is set to.
function timeInGroningen(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Amsterdam',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    }).formatToParts(now);

    const part = type => parts.find(candidate => candidate.type === type).value;
    return `${part('hour')}:${part('minute')}`;
}

function spanEnd(event) {
    return event.endDate || event.date;
}

// A day's opening hours as [start, end]. `hours` lists them per day for events
// whose hours change across the run; any day it leaves out falls back to the
// flat startTime/endTime, and to all day when those are missing too.
function hoursOn(event, day) {
    return event.hours?.[day] || [event.startTime, event.endTime];
}

// Day-granularity by default, but a timed event's endTime cuts its last day
// short: once the clock passes it, the event is spent for the rest of that day
// too, rather than lingering in the list until midnight.
function hasEnded(event, today, now = new Date()) {
    const end = spanEnd(event);
    if (end < today) return true;
    if (end > today) return false;
    const [, endTime] = hoursOn(event, today);
    return Boolean(endTime) && timeInGroningen(now) > endTime;
}

function withYear(isoDate, year) {
    return `${year}${isoDate.slice(4)}`;
}

function isSunday(isoDate) {
    return new Date(`${isoDate}T00:00:00Z`).getUTCDay() === 0;
}

function dayBefore(isoDate) {
    const date = new Date(`${isoDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - 1);
    return date.toISOString().slice(0, 10);
}

// An annual entry stores any one occurrence; which year it lands in is computed.
// Both ends move together and keep their offset, so a span that runs 31 Dec - 1 Jan
// still ends the day after it starts.
function occurrenceFor(event, startYear) {
    const occurrence = { ...event, date: withYear(event.date, startYear) };
    if (event.endDate) {
        const yearsSpanned = Number(event.endDate.slice(0, 4)) - Number(event.date.slice(0, 4));
        occurrence.endDate = withYear(event.endDate, startYear + yearsSpanned);
    }

    // Koningsdag is held on Saturday the 26th whenever 27 April falls on a Sunday
    // — next in 2031 and 2036, and last in 2014. The rule is deterministic, so the
    // entry still rolls like any other fixed date; it is just observed a day
    // earlier in those years. Only single-day events carry this (see the tests),
    // so there is no span to keep in step.
    if (event.notOnSunday && isSunday(occurrence.date)) {
        occurrence.date = dayBefore(occurrence.date);
    }

    return occurrence;
}

// Only `annual: true` entries roll. They must be events on a genuinely fixed
// calendar date - a festival whose dates float (Noorderzon, Eurosonic) would drift
// onto the wrong weekdays, so those carry explicit dates and are refreshed by hand.
function resolveOccurrence(event, today, now = new Date()) {
    if (!event.annual) return event;

    const thisYear = Number(today.slice(0, 4));

    // Last year's start comes first: a span crossing New Year can still be running.
    const carriedOver = occurrenceFor(event, thisYear - 1);
    if (!hasEnded(carriedOver, today, now)) return carriedOver;

    // It is the END of the span that decides whether this year's occurrence is
    // spent. Judging by the start would fling a festival into next year on its
    // own day two.
    const current = occurrenceFor(event, thisYear);
    return hasEnded(current, today, now) ? occurrenceFor(event, thisYear + 1) : current;
}

function getUpcomingEvents(events, today = todayInGroningen(), now = new Date()) {
    return events
        .map(event => resolveOccurrence(event, today, now))
        .filter(event => !hasEnded(event, today, now))
        // Full ISO strings, so an event rolled into next year sorts after this
        // December. Comparing month-day would quietly reverse that.
        .sort((a, b) => a.date.localeCompare(b.date));
}

// Day-granularity by default: an event is "happening now" for its whole span.
// startTime/endTime are daily opening hours and narrow that on every day of the
// span, and `hours` narrows specific days when the hours vary — most entries
// carry none of these and keep the old all-day behaviour, which is correct for
// something like Sint Maarten that has no fixed start.
function isHappeningNow(event, today, now = new Date()) {
    if (!(event.date <= today && !hasEnded(event, today, now))) return false;

    const [startTime, endTime] = hoursOn(event, today);
    const clock = timeInGroningen(now);
    if (startTime && clock < startTime) return false;
    if (endTime && clock > endTime) return false;

    return true;
}

// A run longer than this many days is an exhibition-style event: once it has
// opened you can go any week, so it is not news the way a weekend festival is.
const ONGOING_MIN_DAYS = 15;

function daysInSpan(event) {
    const start = new Date(`${event.date}T00:00:00Z`);
    const end = new Date(`${spanEnd(event)}T00:00:00Z`);
    return Math.round((end - start) / 86400000) + 1;
}

// Ongoing events are listed apart from the dated ones. Sorted by start date, a
// months-long exhibition would otherwise sit first with a "happening now" badge
// for its whole run and bury what is actually coming up. Before it opens it is
// still a dated event, since the opening itself is worth knowing about.
function isOngoing(event, today, now = new Date()) {
    return event.date <= today
        && !hasEnded(event, today, now)
        && daysInSpan(event) >= ONGOING_MIN_DAYS;
}

// Intl handles the range shapes per locale ("20-30 August", "28 December - 2
// January"), so there is no hand-rolled range logic to get wrong. The dates are
// parsed as UTC and formatted as UTC: they are calendar days, not moments, and
// letting the device's timezone shift them is the bug this avoids.
function formatEventDate(event, lang, today = todayInGroningen()) {
    const options = { day: 'numeric', month: 'long', timeZone: 'UTC' };
    if (event.date.slice(0, 4) !== today.slice(0, 4)) {
        options.year = 'numeric';
    }

    const formatter = new Intl.DateTimeFormat(lang === 'nl' ? 'nl-NL' : 'en-GB', options);
    const start = new Date(`${event.date}T00:00:00Z`);

    return event.endDate
        ? formatter.formatRange(start, new Date(`${event.endDate}T00:00:00Z`))
        : formatter.format(start);
}

// The end of the run on its own, for ongoing events: the start is already past,
// so "until" is the only date that helps anyone plan.
function formatEventEnd(event, lang, today = todayInGroningen()) {
    const end = spanEnd(event);
    const options = { day: 'numeric', month: 'long', timeZone: 'UTC' };
    if (end.slice(0, 4) !== today.slice(0, 4)) {
        options.year = 'numeric';
    }

    return new Intl.DateTimeFormat(lang === 'nl' ? 'nl-NL' : 'en-GB', options)
        .format(new Date(`${end}T00:00:00Z`));
}

// Freshness signal for the Events view: there is no per-user "as of" timestamp
// to show, so the honest thing to state is what date range the list currently
// covers. That way a quiet stretch reads as "nothing until {through}" instead
// of leaving visitors to guess whether the page is stale.
function formatEventsCoverageEnd(upcomingEvents, lang) {
    const lastEnd = upcomingEvents.reduce(
        (latest, event) => (spanEnd(event) > latest ? spanEnd(event) : latest),
        upcomingEvents[0].date
    );

    const formatter = new Intl.DateTimeFormat(lang === 'nl' ? 'nl-NL' : 'en-GB', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC'
    });

    return formatter.format(new Date(`${lastEnd}T00:00:00Z`));
}
