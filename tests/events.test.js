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
    formatEventDate
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

test('every shipped event is well formed', () => {
    for (const event of EVENTS) {
        assert.match(event.date, /^\d{4}-\d{2}-\d{2}$/, `${event.id} has an ISO date`);
        assert.ok(!Number.isNaN(Date.parse(`${event.date}T00:00:00Z`)), `${event.id} date is a real day`);

        if (event.endDate) {
            assert.ok(event.endDate >= event.date, `${event.id} ends on or after it starts`);
            assert.ok(!Number.isNaN(Date.parse(`${event.endDate}T00:00:00Z`)), `${event.id} endDate is a real day`);
        }

        for (const lang of ALLOWED_LANGS) {
            assert.ok(event.title[lang], `${event.id} has a ${lang} title`);
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
        for (const year of [2027, 2028, 2029, 2030]) {
            const rolled = resolveOccurrence(event, `${year}-01-01`);
            assert.ok(
                !Number.isNaN(Date.parse(`${rolled.date}T00:00:00Z`)),
                `${event.id} resolves to a real day in ${year}`
            );
        }
    }
});

test('both languages carry every events string', () => {
    for (const lang of ALLOWED_LANGS) {
        for (const key of ['viewEvents', 'eventsHappeningNow', 'eventsMoreInfo', 'eventsEmpty']) {
            assert.ok(UI_TRANSLATIONS[lang][key], `${lang} is missing ${key}`);
        }
    }
});

test('an empty list is a supported state, not a crash', () => {
    assert.deepEqual(getUpcomingEvents([], '2026-09-12'), []);
});
