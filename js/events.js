// Events Module - Shared Global Exports: todayInGroningen, resolveOccurrence,
// getUpcomingEvents, isHappeningNow, formatEventDate
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
// ⚡ Bolt Performance Optimization:
// Cache Intl.DateTimeFormat instances. toLocaleDateString and formatToParts recreate
// these internally on every call, which is slow.
const groningenFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
});

function todayInGroningen(now = new Date()) {
    const parts = groningenFormatter.formatToParts(now);

    // ⚡ Bolt Performance Optimization:
    // Single loop over parts array instead of three O(N) .find() calls with new closures.
    // Impact: Avoids multiple object/closure allocations and redundant traversals.
    let year, month, day;
    for (let i = 0; i < parts.length; i++) {
        const { type, value } = parts[i];
        if (type === 'year') year = value;
        else if (type === 'month') month = value;
        else if (type === 'day') day = value;
    }
    return `${year}-${month}-${day}`;
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

// ⚡ Bolt Performance Optimization:
// Cache Intl.DateTimeFormat instances.
const eventDateFormatters = {
    'en': {
        noYear: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' }),
        withYear: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    },
    'nl': {
        noYear: new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', timeZone: 'UTC' }),
        withYear: new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    }
};

// Intl handles the range shapes per locale ("20-30 August", "28 December - 2
// January"), so there is no hand-rolled range logic to get wrong. The dates are
// parsed as UTC and formatted as UTC: they are calendar days, not moments, and
// letting the device's timezone shift them is the bug this avoids.
function formatEventDate(event, lang, today = todayInGroningen()) {
    const includeYear = event.date.slice(0, 4) !== today.slice(0, 4);

    const langKey = lang === 'nl' ? 'nl' : 'en';
    const formatter = includeYear ? eventDateFormatters[langKey].withYear : eventDateFormatters[langKey].noYear;

    const start = new Date(`${event.date}T00:00:00Z`);

    return event.endDate
        ? formatter.formatRange(start, new Date(`${event.endDate}T00:00:00Z`))
        : formatter.format(start);
}
