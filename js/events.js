// Events Module - Shared Global Exports: todayInGroningen, resolveOccurrence,
// getUpcomingEvents, isHappeningNow, formatEventDate
// Dependencies: none. Pure date logic, so tests can drive it without a DOM.

// "Today" is Groningen's calendar day, not the device's. Everything here ships to
// one city, so a phone left on another timezone should not drop an event a few
// hours early or late around midnight. en-CA formats as YYYY-MM-DD, which is what
// keeps every comparison below a plain string compare against the stored dates.
function todayInGroningen(now = new Date()) {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(now);
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

// An annual entry stores any one occurrence; which year it lands in is computed.
// Both ends move together and keep their offset, so a span that runs 31 Dec - 1 Jan
// still ends the day after it starts.
function occurrenceFor(event, startYear) {
    const occurrence = { ...event, date: withYear(event.date, startYear) };
    if (event.endDate) {
        const yearsSpanned = Number(event.endDate.slice(0, 4)) - Number(event.date.slice(0, 4));
        occurrence.endDate = withYear(event.endDate, startYear + yearsSpanned);
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
