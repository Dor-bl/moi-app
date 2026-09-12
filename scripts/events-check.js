// Reports the health of the EVENTS list: how much is still ahead, and which
// non-recurring entries have lapsed and need fresh dates from their official page.
//
// This is the deterministic first step of the monthly refresh — no judgement, no
// research, nothing to get wrong. When it reports no gaps there is nothing to do,
// and a refresh run should stop here rather than open a pull request.
//
// Exits non-zero when something needs attention, so it can gate a routine.

import { loadEventsModule } from '../tests/helpers/load-events.js';

const { EVENTS, getUpcomingEvents, todayInGroningen, isHappeningNow } = loadEventsModule();

const today = todayInGroningen();
const upcoming = getUpcomingEvents(EVENTS, today);
const lapsed = EVENTS.filter(event => !event.annual && (event.endDate || event.date) < today);

console.log(`Today in Groningen: ${today}`);
console.log(`Upcoming: ${upcoming.length} of ${EVENTS.length} events\n`);

for (const event of upcoming) {
    const span = event.endDate ? `${event.date} → ${event.endDate}` : event.date;
    const tags = [event.annual ? 'annual' : 'fixed dates', isHappeningNow(event, today) ? 'happening now' : null]
        .filter(Boolean)
        .join(', ');
    console.log(`  ${span.padEnd(25)} ${event.title.en}  (${tags})`);
}

if (lapsed.length > 0) {
    console.log(`\n${lapsed.length} lapsed, needs dates confirmed against the official page:`);
    for (const event of lapsed) {
        console.log(`  ${event.title.en} — last known ${event.endDate || event.date}${event.url ? ` — ${event.url}` : ''}`);
    }
}

// One upcoming event is a page not worth opening, so treat a nearly empty list as
// needing attention in its own right rather than only flagging lapsed entries.
if (upcoming.length < 2) {
    console.log(`\nOnly ${upcoming.length} event(s) ahead — the page needs restocking.`);
}

process.exit(lapsed.length > 0 || upcoming.length < 2 ? 1 : 0);
