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

// A lapsed-entries check on its own is a dead gate: every shipped entry is
// annual, so nothing ever lapses, this would exit 0 forever, and the refresh
// routine — told to stop on 0 — could never do the job it exists for, which is
// adding the floating festivals the list is still missing.
//
// So thinness is a gap in its own right. Eight is the low end of the launch
// target in docs/routines/monthly-events-refresh.md; below it the page reads as
// sparse and a refresh run has something worth doing.
const TARGET_UPCOMING = 8;

if (upcoming.length < TARGET_UPCOMING) {
    console.log(`\nOnly ${upcoming.length} upcoming, below the target of ${TARGET_UPCOMING} — the page needs restocking.`);
}

// exitCode rather than exit(): process.exit() can cut the process off before
// buffered stdout has drained, and Node's writes to a pipe are asynchronous on
// macOS (they are synchronous on Linux, so CI would never have shown it). This
// script exists to be read, and a routine will be capturing it, so a truncated
// report is the one failure worth avoiding. There is nothing to abort here —
// the script simply ends.
process.exitCode = lapsed.length > 0 || upcoming.length < TARGET_UPCOMING ? 1 : 0;
