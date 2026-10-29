import test from 'node:test';
import assert from 'node:assert/strict';
import { loadEventsModule } from './helpers/load-events.js';

const {
    EVENTS,
    ALLOWED_LANGS,
    UI_TRANSLATIONS,
    todayInGroningen,
    resolveOccurrence,
    getUpcomingEvents,
    isHappeningNow,
    isOngoing,
    formatEventDate,
    formatEventEnd,
    formatEventsCoverageEnd
} = loadEventsModule();

const singleDay = { id: 'single', date: '2026-09-18', title: { en: 'Single', nl: 'Single' } };
const festival = { id: 'festival', date: '2026-08-20', endDate: '2026-08-30', title: { en: 'Fest', nl: 'Fest' } };
const annual = { id: 'annual', date: '2026-08-28', annual: true, title: { en: 'Annual', nl: 'Annual' } };

test('a one-day event is upcoming on its own day and gone the next', () => {
    assert.equal(getUpcomingEvents([singleDay], '2026-09-17').length, 1);
    assert.equal(getUpcomingEvents([singleDay], '2026-09-18').length, 1, 'still on today');
    assert.equal(getUpcomingEvents([singleDay], '2026-09-19').length, 0, 'gone the day after');
});

test('a multi-day festival stays listed part-way through its run', () => {
    assert.equal(getUpcomingEvents([festival], '2026-08-25').length, 1);
    assert.equal(getUpcomingEvents([festival], '2026-08-30').length, 1, 'still on its final day');
    assert.equal(getUpcomingEvents([festival], '2026-08-31').length, 0);
});

test('a non-recurring event that has lapsed never comes back', () => {
    assert.deepEqual(getUpcomingEvents([singleDay, festival], '2027-01-01'), []);
});

test('an annual event rolls to next year once this year is spent', () => {
    assert.equal(resolveOccurrence(annual, '2026-08-01').date, '2026-08-28');
    assert.equal(resolveOccurrence(annual, '2026-08-28').date, '2026-08-28', 'not on the day itself');
    assert.equal(resolveOccurrence(annual, '2026-08-29').date, '2027-08-28');
    assert.equal(resolveOccurrence(annual, '2030-01-01').date, '2030-08-28', 'years later, still correct');
});

// The regression this whole design is most likely to grow back: judging rollover
// by the start date sends a running festival into next year on its own day two.
test('an annual festival does not roll while it is still running', () => {
    const annualFestival = { ...festival, annual: true };

    const midRun = resolveOccurrence(annualFestival, '2026-08-25');
    assert.equal(midRun.date, '2026-08-20', 'start stays put');
    assert.equal(midRun.endDate, '2026-08-30');
    assert.ok(isHappeningNow(midRun, '2026-08-25'));

    const afterRun = resolveOccurrence(annualFestival, '2026-08-31');
    assert.equal(afterRun.date, '2027-08-20');
    assert.equal(afterRun.endDate, '2027-08-30', 'both ends move together');
});

test('an annual span crossing New Year keeps its length and stays running', () => {
    const newYear = { id: 'ny', date: '2026-12-31', endDate: '2027-01-01', annual: true, title: { en: 'NY', nl: 'NY' } };

    const during = resolveOccurrence(newYear, '2027-01-01');
    assert.equal(during.date, '2026-12-31', 'still the occurrence that is running');
    assert.equal(during.endDate, '2027-01-01');

    const after = resolveOccurrence(newYear, '2027-01-02');
    assert.equal(after.date, '2027-12-31');
    assert.equal(after.endDate, '2028-01-01', 'span still one day long');
});

test('sorting survives a year boundary', () => {
    const december = { id: 'dec', date: '2026-12-05', title: { en: 'Dec', nl: 'Dec' } };
    // Already past on this date, so it resolves into next August — which must sort
    // after December, the way full-ISO comparison gives for free and a month-day
    // comparison would silently reverse.
    const order = getUpcomingEvents([annual, december], '2026-09-12').map(event => event.id);
    assert.deepEqual(order, ['dec', 'annual']);
});

// Koningsdag moves to Saturday the 26th when 27 April is a Sunday — the law, not a
// local variation. 2031 and 2036 are the next two; 2014 was the last.
test('a fixed date with an observed-date rule shifts off Sunday', () => {
    const koningsdag = { id: 'k', date: '2026-04-27', annual: true, notOnSunday: true, title: { en: 'K', nl: 'K' } };

    assert.equal(resolveOccurrence(koningsdag, '2026-01-01').date, '2026-04-27', 'a Monday, unshifted');
    assert.equal(resolveOccurrence(koningsdag, '2031-01-01').date, '2031-04-26', 'Sunday year, observed Saturday');
    assert.equal(resolveOccurrence(koningsdag, '2036-01-01').date, '2036-04-26', 'and the year after that');

    // The shifted date is what the filter sees, so the entry is spent on the 27th
    // of a Sunday year rather than lingering a day.
    assert.equal(getUpcomingEvents([koningsdag], '2031-04-26').length, 1);
    assert.equal(getUpcomingEvents([koningsdag], '2031-04-27')[0].date, '2032-04-27', 'rolled on, not lingering');
});

test('no shifted event carries a span to keep in step', () => {
    for (const event of EVENTS.filter(e => e.notOnSunday)) {
        assert.equal(event.endDate, undefined, `${event.id} must be single-day to shift safely`);
    }
});

test('today is built as ISO regardless of locale output order', () => {
    // The whole module compares and slices these as YYYY-MM-DD, so the shape is
    // load-bearing rather than cosmetic.
    assert.match(todayInGroningen(), /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(todayInGroningen(new Date('2026-09-12T10:00:00Z')), '2026-09-12');
    // Zero-padding, not single digits, or string comparison silently breaks.
    assert.equal(todayInGroningen(new Date('2026-01-05T10:00:00Z')), '2026-01-05');
});

test('today is Groningen\'s calendar day, not the device\'s', () => {
    // 22:30 UTC on 18 September is already the 19th in Amsterdam (CEST, UTC+2).
    assert.equal(todayInGroningen(new Date('2026-09-18T22:30:00Z')), '2026-09-19');
    // And the reverse: just before midnight UTC in January is still the 19th there.
    assert.equal(todayInGroningen(new Date('2026-01-18T23:30:00Z')), '2026-01-19');
});

test('happening-now covers the whole run and nothing outside it', () => {
    assert.equal(isHappeningNow(festival, '2026-08-19'), false);
    assert.equal(isHappeningNow(festival, '2026-08-20'), true, 'its first day');
    assert.equal(isHappeningNow(festival, '2026-08-30'), true, 'its last day');
    assert.equal(isHappeningNow(festival, '2026-08-31'), false);
    assert.equal(isHappeningNow(singleDay, '2026-09-18'), true);
});

// The regression from the screenshot: a date-only check flagged a timed event
// as "happening now" from midnight, hours before its actual start.
test('a timed event only happens now within its published hours', () => {
    const timed = { ...singleDay, startTime: '18:00', endTime: '21:00' };

    assert.equal(isHappeningNow(timed, '2026-09-18', new Date('2026-09-18T06:00:00Z')), false, 'before it opens (08:00 Amsterdam)');
    assert.equal(isHappeningNow(timed, '2026-09-18', new Date('2026-09-18T17:00:00Z')), true, 'mid-run (19:00 Amsterdam)');
    assert.equal(isHappeningNow(timed, '2026-09-18', new Date('2026-09-18T19:30:00Z')), false, 'after it closes (21:30 Amsterdam)');
    assert.equal(isHappeningNow(timed, '2026-09-18', new Date('2026-09-18T16:00:00Z')), true, 'right at opening (18:00 Amsterdam)');
    assert.equal(isHappeningNow(timed, '2026-09-18', new Date('2026-09-18T19:00:00Z')), true, 'right at closing (21:00 Amsterdam)');
});

test('a multi-day timed event keeps its hours on every day, not just the ends', () => {
    const weekend = { id: 'weekend', date: '2026-09-26', endDate: '2026-09-27', startTime: '10:00', endTime: '17:00', title: { en: 'W', nl: 'W' } };

    assert.equal(isHappeningNow(weekend, '2026-09-26', new Date('2026-09-26T09:00:00Z')), true, 'first day, 11:00 Amsterdam');
    assert.equal(isHappeningNow(weekend, '2026-09-26', new Date('2026-09-26T17:00:00Z')), false, 'first evening, 19:00 Amsterdam');
    assert.equal(isHappeningNow(weekend, '2026-09-27', new Date('2026-09-27T06:00:00Z')), false, 'second morning, 08:00 Amsterdam');
    assert.equal(isHappeningNow(weekend, '2026-09-27', new Date('2026-09-27T12:00:00Z')), true, 'second day, 14:00 Amsterdam');
    assert.equal(getUpcomingEvents([weekend], '2026-09-26', new Date('2026-09-26T17:00:00Z')).length, 1, 'still listed between the days');
});

test('per-day hours override the flat times, day by day', () => {
    const wine = {
        id: 'wine', date: '2026-09-25', endDate: '2026-09-27', startTime: '12:00',
        hours: { '2026-09-25': ['17:00', '23:30'], '2026-09-27': ['15:00', '20:00'] },
        title: { en: 'W', nl: 'W' }
    };

    assert.equal(isHappeningNow(wine, '2026-09-25', new Date('2026-09-25T13:00:00Z')), false, 'first day, 15:00 Amsterdam, before it opens');
    assert.equal(isHappeningNow(wine, '2026-09-25', new Date('2026-09-25T15:00:00Z')), true, 'first day, 17:00 Amsterdam, right at opening');
    assert.equal(isHappeningNow(wine, '2026-09-26', new Date('2026-09-26T10:30:00Z')), true, 'unlisted day falls back to startTime, 12:30 Amsterdam');
    assert.equal(isHappeningNow(wine, '2026-09-27', new Date('2026-09-27T14:00:00Z')), true, 'last day, 16:00 Amsterdam');
    assert.equal(isHappeningNow(wine, '2026-09-27', new Date('2026-09-27T18:30:00Z')), false, 'last day, 20:30 Amsterdam');
    assert.equal(getUpcomingEvents([wine], '2026-09-27', new Date('2026-09-27T18:30:00Z')).length, 0, 'gone once the last day closes');
    assert.equal(getUpcomingEvents([wine], '2026-09-25', new Date('2026-09-25T22:00:00Z')).length, 1, 'first-day closing does not end the run');
});

test('a closed day and a closing-time-only day inside a run', () => {
    const market = {
        id: 'market', date: '2026-12-20', endDate: '2027-01-03',
        hours: { '2026-12-24': [null, '18:00'], '2026-12-25': null },
        title: { en: 'M', nl: 'M' }
    };

    assert.equal(isHappeningNow(market, '2026-12-24', new Date('2026-12-24T09:00:00Z')), true, 'Christmas Eve, 10:00 Amsterdam');
    assert.equal(isHappeningNow(market, '2026-12-24', new Date('2026-12-24T17:30:00Z')), false, 'Christmas Eve, 18:30 Amsterdam, after closing');
    assert.equal(isHappeningNow(market, '2026-12-25', new Date('2026-12-25T12:00:00Z')), false, 'closed on Christmas Day');
    assert.equal(getUpcomingEvents([market], '2026-12-25', new Date('2026-12-25T12:00:00Z')).length, 1, 'still listed on its closed day');
    assert.equal(isHappeningNow(market, '2026-12-26', new Date('2026-12-26T12:00:00Z')), true, 'back to all day after');
});

test('a timed event with no endTime stays happening for the rest of its day', () => {
    const openEnded = { ...singleDay, startTime: '18:00' };

    assert.equal(isHappeningNow(openEnded, '2026-09-18', new Date('2026-09-18T06:00:00Z')), false, 'before it starts');
    assert.equal(isHappeningNow(openEnded, '2026-09-18', new Date('2026-09-18T21:30:00Z')), true, 'late but still that day (23:30 Amsterdam)');
});

test('an event without a startTime still happens now all day, unaffected', () => {
    assert.equal(isHappeningNow(singleDay, '2026-09-18', new Date('2026-09-18T00:30:00Z')), true, 'early morning, 02:30 Amsterdam (CEST)');
});

test('dates render as calendar days in both languages', () => {
    assert.equal(formatEventDate(singleDay, 'en', '2026-01-01'), '18 September');
    assert.equal(formatEventDate(singleDay, 'nl', '2026-01-01'), '18 september');
    // A day either side of a UTC midnight must not shift: these are days, not moments.
    assert.equal(formatEventDate({ date: '2026-03-01' }, 'en', '2026-01-01'), '1 March');
    // A different year has to say so, or a January event reads as this month's.
    assert.match(formatEventDate(annual, 'en', '2025-12-31'), /2026/);
});

test('a date range renders as one span', () => {
    const range = formatEventDate(festival, 'en', '2026-01-01');
    assert.match(range, /20/);
    assert.match(range, /30/);
    assert.match(range, /August/);
});

// A span crossing New Year must name both years, or "31 December - 1 January"
// leaves the reader guessing which January. formatEventDate sets options.year
// only when the START year differs from today, so this case is carried by
// formatRange itself, which is required to include the largest differing field
// between the two dates. That is platform behaviour rather than ours, which is
// exactly why it is pinned here: if it ever stopped holding, the fix is to set
// the year explicitly for cross-year spans, and this test is what would say so.
test('a span crossing New Year names both years', () => {
    const newYear = { id: 'ny', date: '2026-12-31', endDate: '2027-01-01', title: { en: 'NY', nl: 'NY' } };

    for (const lang of ALLOWED_LANGS) {
        // Viewed from within the start year, which is the case that could have
        // omitted the year entirely.
        const rendered = formatEventDate(newYear, lang, '2026-12-30');
        assert.match(rendered, /2026/, `${lang} span names its start year`);
        assert.match(rendered, /2027/, `${lang} span names its end year`);
    }

    // The ordinary same-year span still stays clean, so this has not turned into
    // a year on every date.
    assert.ok(!/\d{4}/.test(formatEventDate(festival, 'en', '2026-01-01')), 'same-year span stays bare');
});

// Date.parse is no use for this: it rejects a bad month ('2026-13-01') but
// silently normalises a bad day, so '2026-02-30' comes back as 2 March and
// '2027-02-29' as 1 March. Round-tripping is what actually catches a day that
// does not exist — and the day is the half that matters here, since filtering
// compares the original string while formatting would show the shifted one.
function isRealDate(iso) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
    const parsed = new Date(`${iso}T00:00:00Z`);
    // A bad month gives an invalid Date, whose toISOString throws rather than
    // returning something to compare — so that case has to be caught before the
    // round-trip, not by it.
    if (Number.isNaN(parsed.getTime())) return false;
    return parsed.toISOString().slice(0, 10) === iso;
}

test('the date guard rejects days that do not exist', () => {
    assert.ok(isRealDate('2026-09-12'));
    assert.ok(isRealDate('2028-02-29'), 'a real leap day');
    assert.ok(!isRealDate('2026-02-30'));
    assert.ok(!isRealDate('2027-02-29'), 'not a leap year');
    assert.ok(!isRealDate('2026-04-31'));
    assert.ok(!isRealDate('2026-13-01'));
});

test('every shipped event is well formed', () => {
    for (const event of EVENTS) {
        assert.ok(isRealDate(event.date), `${event.id} date is a real day`);

        if (event.endDate) {
            assert.ok(event.endDate >= event.date, `${event.id} ends on or after it starts`);
            assert.ok(isRealDate(event.endDate), `${event.id} endDate is a real day`);
        }

        // Keys are full dates, so they would silently stop matching once an
        // annual entry rolls into another year.
        if (event.hours) {
            assert.ok(!event.annual, `${event.id} hours are for non-annual entries only`);
            for (const [day, hours] of Object.entries(event.hours)) {
                assert.ok(isRealDate(day) && day >= event.date && day <= (event.endDate || event.date), `${event.id} hours day ${day} is inside its run`);
                // null marks a closed day.
                if (hours === null) continue;

                const [start, end] = hours;
                assert.ok(start || end, `${event.id} ${day} has at least one known time`);
                if (start) assert.match(start, /^\d\d:\d\d$/, `${event.id} ${day} start is HH:MM`);
                if (end) assert.match(end, /^\d\d:\d\d$/, `${event.id} ${day} end is HH:MM`);
                if (start && end) assert.ok(start < end, `${event.id} ${day} opens before it closes`);
            }
        }

        for (const lang of ALLOWED_LANGS) {
            assert.ok(event.title[lang], `${event.id} has a ${lang} title`);

            // buildEventCard reads location and tip by language too, so a
            // half-translated entry renders the string "undefined" onto the card
            // rather than failing anywhere a person would notice.
            for (const field of ['location', 'tip']) {
                if (event[field]) {
                    assert.ok(event[field][lang], `${event.id} has a ${lang} ${field}`);
                }
            }
        }
    }
});

// buildEventCard/getFilteredEvents render or filter on any truthy value, but a
// stray string or object here would signal something other than a plain yes/no.
test('kidFriendly, free and publicHoliday, when set, are exactly true', () => {
    for (const event of EVENTS) {
        for (const flag of ['kidFriendly', 'free', 'publicHoliday']) {
            if (flag in event) {
                assert.equal(event[flag], true, `${event.id} ${flag} must be true, or omitted entirely`);
            }
        }
    }
});

// A leap day cannot recur yearly, so an `annual` entry landing on one is a data
// mistake. Catching it here is why events.js needs no runtime leap-year handling.
test('annual events sit on dates that exist every year', () => {
    for (const event of EVENTS.filter(e => e.annual)) {
        const [, month, day] = event.date.split('-');
        assert.ok(
            !(month === '02' && day === '29'),
            `${event.id} is annual but falls on 29 February`
        );
        // Roll it a few years out; a date that only exists sometimes shows up here.
        // Both ends, since an annual span is allowed to carry an endDate and a
        // 28 Feb - 29 Feb run would roll its end onto a day that isn't there.
        for (const year of [2027, 2028, 2029, 2030]) {
            const rolled = resolveOccurrence(event, `${year}-01-01`);
            assert.ok(isRealDate(rolled.date), `${event.id} starts on a real day in ${year}`);
            if (rolled.endDate) {
                assert.ok(isRealDate(rolled.endDate), `${event.id} ends on a real day in ${year}`);
            }
        }
    }
});

test('both languages carry every events string', () => {
    for (const lang of ALLOWED_LANGS) {
        for (const key of [
            'viewEvents',
            'eventsHappeningNow',
            'eventsKidFriendly',
            'eventsFilterKids',
            'eventsFilterFree',
            'eventsFilterHoliday',
            'eventsFilterEmpty',
            'eventsMoreInfo',
            'eventsEmpty',
            'eventsCoverage',
            'eventsOngoing',
            'eventsOngoingUntil'
        ]) {
            assert.ok(UI_TRANSLATIONS[lang][key], `${lang} is missing ${key}`);
        }
    }
});

// The regression this session fixed: a timed event used to stay listed on
// the Events tab until midnight even though its published hours were over.
test('a timed event drops off the upcoming list once its endTime passes', () => {
    const timed = { ...singleDay, startTime: '18:00', endTime: '21:00' };

    assert.equal(
        getUpcomingEvents([timed], '2026-09-18', new Date('2026-09-18T19:00:00Z')).length,
        1,
        'still listed mid-run (21:00 Amsterdam)'
    );
    assert.equal(
        getUpcomingEvents([timed], '2026-09-18', new Date('2026-09-18T19:30:00Z')).length,
        0,
        'gone once past its endTime (21:30 Amsterdam)'
    );
});

test('a timed event with no endTime stays on the upcoming list all day', () => {
    const openEnded = { ...singleDay, startTime: '18:00' };

    assert.equal(
        getUpcomingEvents([openEnded], '2026-09-18', new Date('2026-09-18T21:30:00Z')).length,
        1,
        'late but still that day (23:30 Amsterdam)'
    );
});

test('an empty list is a supported state, not a crash', () => {
    assert.deepEqual(getUpcomingEvents([], '2026-09-12'), []);
});

test('coverage reads through the latest span end, not just the last-sorted start', () => {
    // A long-running festival starting first can still end after a short event
    // that starts later - sorting by start date must not be mistaken for
    // sorting by end date when picking the coverage's upper bound.
    const longFestival = { id: 'long', date: '2026-09-20', endDate: '2026-11-30', title: { en: 'Long', nl: 'Long' } };
    const laterShort = { id: 'later', date: '2026-10-05', title: { en: 'Later', nl: 'Later' } };

    const upcoming = getUpcomingEvents([longFestival, laterShort], '2026-09-15');
    assert.equal(formatEventsCoverageEnd(upcoming, 'en'), 'November 2026');
    assert.equal(formatEventsCoverageEnd(upcoming, 'nl'), 'november 2026');
});

const exhibition = { id: 'exhibition', date: '2026-02-14', endDate: '2027-01-31', title: { en: 'Expo', nl: 'Expo' } };

test('a months-long run that has opened is ongoing, not before it opens or after it closes', () => {
    assert.equal(isOngoing(exhibition, '2026-02-13'), false, 'its opening is still a dated event');
    assert.equal(isOngoing(exhibition, '2026-02-14'), true);
    assert.equal(isOngoing(exhibition, '2026-09-25'), true);
    assert.equal(isOngoing(exhibition, '2027-01-31'), true, 'still on its last day');
    assert.equal(isOngoing(exhibition, '2027-02-01'), false);
});

test('a timed long run stays dated on opening day until it opens', () => {
    const timedExpo = { ...exhibition, startTime: '10:00', endTime: '17:00' };
    const at = hhmm => new Date(`2026-02-14T${hhmm}:00+01:00`);
    assert.equal(isOngoing(timedExpo, '2026-02-14', at('09:00')), false, 'before opening');
    assert.equal(isOngoing(timedExpo, '2026-02-14', at('10:00')), true, 'once open');
    assert.equal(isOngoing(timedExpo, '2026-02-15', new Date('2026-02-15T08:00:00+01:00')), true,
        'later mornings stay ongoing');
});

test('weekend festivals and one-day events are never ongoing', () => {
    assert.equal(isOngoing(festival, '2026-08-25'), false, 'an 11-day run stays a dated event');
    assert.equal(isOngoing(singleDay, '2026-09-18'), false);
    const twoWeeks = { ...festival, date: '2026-08-01', endDate: '2026-08-14' };
    const fifteenDays = { ...festival, date: '2026-08-01', endDate: '2026-08-15' };
    assert.equal(isOngoing(twoWeeks, '2026-08-05'), false);
    assert.equal(isOngoing(fifteenDays, '2026-08-05'), true);
});

test('an ongoing event shows when it closes, with the year only when it differs', () => {
    assert.equal(formatEventEnd(exhibition, 'en', '2026-09-25'), '31 January 2027');
    assert.equal(formatEventEnd(exhibition, 'nl', '2026-09-25'), '31 januari 2027');
    assert.equal(formatEventEnd(exhibition, 'en', '2027-01-10'), '31 January');
});

test('the shipped LEGO exhibition sits in the ongoing section while it runs', () => {
    const lego = EVENTS.find(event => event.id === 'lego-fabuland-expositie');
    assert.equal(isOngoing(lego, '2026-09-25'), true);
});
