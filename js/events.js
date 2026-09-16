// Events Module - Shared Global Exports: todayInGroningen, resolveOccurrence,
// getUpcomingEvents, isHappeningNow, formatEventDate, formatEventsCoverageEnd
// Dependencies: none. Pure date logic, so tests can drive it without a DOM.

// "Today" is Groningen's calendar day, not the device's. Everything here ships to
// one city, so a phone left on another timezone should not drop an event a few
// hours early or late around midnight.
//
// ⚡ Bolt Performance Optimization:
// Cache Intl.DateTimeFormat instances to prevent repeated reallocation inside functions
// Impact: Reduces formatting overhead significantly (from O(N) allocation per render to O(1)).
const _todayFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});

const _eventFormatters = {
    en: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' }),
    nl: new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', timeZone: 'UTC' }),
    enYear: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
    nlYear: new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
};

const _coverageFormatters = {
    en: new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    nl: new Intl.DateTimeFormat('nl-NL', { month: 'long', year: 'numeric', timeZone: 'UTC' })
};

// Built from formatToParts rather than format(): every comparison and slice below
// treats this as ISO YYYY-MM-DD, and a locale's output *order* is a formatting
// convention rather than a guarantee. Reading the parts out by name cannot drift
// with the engine's CLDR data, and a wrong shape here would break filtering
// silently rather than loudly.
function todayInGroningen(now = new Date()) {
    const parts = _todayFormatter.formatToParts(now);

    const part = type => parts.find(candidate => candidate.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
}

function spanEnd(event) {
    return event.endDate || event.date;
}

function hasEnded(event, today) {
    return spanEnd(event) < today;
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
function resolveOccurrence(event, today) {
    if (!event.annual) return event;

    const thisYear = Number(today.slice(0, 4));

    // Last year's start comes first: a span crossing New Year can still be running.
    const carriedOver = occurrenceFor(event, thisYear - 1);
    if (!hasEnded(carriedOver, today)) return carriedOver;

    // It is the END of the span that decides whether this year's occurrence is
    // spent. Judging by the start would fling a festival into next year on its
    // own day two.
    const current = occurrenceFor(event, thisYear);
    return hasEnded(current, today) ? occurrenceFor(event, thisYear + 1) : current;
}

function getUpcomingEvents(events, today = todayInGroningen()) {
    return events
        .map(event => resolveOccurrence(event, today))
        .filter(event => !hasEnded(event, today))
        // Full ISO strings, so an event rolled into next year sorts after this
        // December. Comparing month-day would quietly reverse that.
        .sort((a, b) => a.date.localeCompare(b.date));
}

function isHappeningNow(event, today) {
    return event.date <= today && !hasEnded(event, today);
}

// Intl handles the range shapes per locale ("20-30 August", "28 December - 2
// January"), so there is no hand-rolled range logic to get wrong. The dates are
// parsed as UTC and formatted as UTC: they are calendar days, not moments, and
// letting the device's timezone shift them is the bug this avoids.
function formatEventDate(event, lang, today = todayInGroningen()) {
    const withYear = event.date.slice(0, 4) !== today.slice(0, 4);
    const isNl = lang === 'nl';

    let formatter;
    if (withYear) {
        formatter = isNl ? _eventFormatters.nlYear : _eventFormatters.enYear;
    } else {
        formatter = isNl ? _eventFormatters.nl : _eventFormatters.en;
    }

    const start = new Date(`${event.date}T00:00:00Z`);

    return event.endDate
        ? formatter.formatRange(start, new Date(`${event.endDate}T00:00:00Z`))
        : formatter.format(start);
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

    const formatter = lang === 'nl' ? _coverageFormatters.nl : _coverageFormatters.en;

    return formatter.format(new Date(`${lastEnd}T00:00:00Z`));
}
