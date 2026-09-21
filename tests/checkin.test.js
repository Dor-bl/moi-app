// The event check-in is the app's only location feature, and the two things that
// make it defensible are both testable without a browser: it refuses a fix too
// vague to mean anything, and it stores a verdict rather than a coordinate. Both
// are asserted here against the shipped js/checkin.js.

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCheckInModule, positionAt, plain } from './helpers/load-checkin.js';

// The Stadspark Drafbaan, matching the shipped bevrijdingsdag entry.
const STADSPARK = [53.2026, 6.5540];
const GROTE_MARKT = [53.2194, 6.5665];

const festival = {
    id: 'test-fest',
    date: '2026-05-05',
    title: { en: 'Fest', nl: 'Fest' },
    checkIn: { coords: STADSPARK, radius: 600 },
    badge: {
        icon: '🕊️',
        title: { en: 'Badge', nl: 'Badge' },
        desc: { en: 'Earned', nl: 'Verdiend' }
    }
};

const noCheckIn = { id: 'plain', date: '2026-05-05', title: { en: 'Plain', nl: 'Plain' } };

test('distance is right to within a metre over the range that matters', () => {
    const { distanceInMetres } = loadCheckInModule();

    assert.equal(Math.round(distanceInMetres(STADSPARK, STADSPARK)), 0);

    // Stadspark Drafbaan to the Grote Markt is about 2.1km as the crow flies.
    const cityCentre = distanceInMetres(STADSPARK, GROTE_MARKT);
    assert.ok(cityCentre > 2000 && cityCentre < 2300, `got ${cityCentre}m`);

    // One ten-thousandth of a degree of latitude is ~11.1m anywhere on earth,
    // which pins the scale factor rather than just the ordering.
    const oneStep = distanceInMetres([53.2026, 6.5540], [53.2027, 6.5540]);
    assert.ok(Math.abs(oneStep - 11.1) < 0.5, `got ${oneStep}m`);
});

test('a precise fix inside the radius passes and one outside it does not', () => {
    const { judgeCheckIn } = loadCheckInModule();

    assert.deepEqual(
        plain(judgeCheckIn(festival, positionAt(53.2026, 6.5540, 20))),
        { ok: true }
    );
    assert.deepEqual(
        plain(judgeCheckIn(festival, positionAt(...GROTE_MARKT, 20))),
        { ok: false, reason: 'tooFar' },
        'the city centre is 2km from the Stadspark'
    );
});

// The failure this guards against: a desktop browser geolocating off wifi or IP
// reports the middle of Groningen with a multi-kilometre error bound. The point
// lands inside the radius, so a distance-only check would hand the badge to
// somebody on another continent.
test('a fix vaguer than the radius is refused rather than accepted', () => {
    const { judgeCheckIn } = loadCheckInModule();

    assert.deepEqual(
        plain(judgeCheckIn(festival, positionAt(53.2026, 6.5540, 20000))),
        { ok: false, reason: 'imprecise' },
        'dead centre, but a 20km error bound answers nothing'
    );

    // The boundary: an error bound equal to the radius is still usable.
    assert.deepEqual(
        plain(judgeCheckIn(festival, positionAt(53.2026, 6.5540, 600))),
        { ok: true }
    );
    assert.deepEqual(
        plain(judgeCheckIn(festival, positionAt(53.2026, 6.5540, 601))),
        { ok: false, reason: 'imprecise' }
    );
});

test('a missing or non-numeric accuracy counts as imprecise, not as perfect', () => {
    const { judgeCheckIn } = loadCheckInModule();

    for (const accuracy of [undefined, null, NaN, Infinity]) {
        assert.deepEqual(
            plain(judgeCheckIn(festival, positionAt(53.2026, 6.5540, accuracy))),
            { ok: false, reason: 'imprecise' },
            `accuracy ${String(accuracy)} must not pass`
        );
    }
});

test('the button is offered only while the event is actually on', () => {
    const { canCheckIn } = loadCheckInModule();

    assert.equal(canCheckIn(festival, '2026-05-05'), true, 'on the day');
    assert.equal(canCheckIn(festival, '2026-05-04'), false, 'the day before');
    assert.equal(canCheckIn(festival, '2026-05-06'), false, 'the day after');
    assert.equal(canCheckIn(noCheckIn, '2026-05-05'), false, 'no coordinate to stand near');
});

test('an hours-bounded event closes its check-in window at endTime', () => {
    const { canCheckIn } = loadCheckInModule();
    const timed = { ...festival, startTime: '13:00', endTime: '23:00' };

    // Groningen is UTC+2 on 5 May, so these are 14:00 and 23:10 local.
    const duringHours = new Date('2026-05-05T12:00:00Z');
    const afterHours = new Date('2026-05-05T21:10:00Z');

    assert.equal(canCheckIn(timed, '2026-05-05', duringHours), true);
    assert.equal(canCheckIn(timed, '2026-05-05', afterHours), false);
});

// Keying on the event id alone would mean an `annual: true` entry is earnable once
// in a lifetime: Bommen Berend happens every year and each year's is its own badge.
test('each occurrence of an annual event is its own check-in', () => {
    const { checkInKeyFor, hasCheckedIn, recordCheckIn } = loadCheckInModule();

    const thisYear = { ...festival, date: '2026-05-05' };
    const nextYear = { ...festival, date: '2027-05-05' };

    assert.notEqual(checkInKeyFor(thisYear), checkInKeyFor(nextYear));

    recordCheckIn(thisYear);
    assert.equal(hasCheckedIn(thisYear), true);
    assert.equal(hasCheckedIn(nextYear), false, "last year's badge is not this year's");
});

test('a stale key off Object.prototype does not read as a check-in', () => {
    const { hasCheckedIn } = loadCheckInModule();

    assert.equal(hasCheckedIn({ ...festival, id: 'constructor', date: '' }), false);
    assert.equal(hasCheckedIn({ ...festival, id: 'toString', date: '' }), false);
});

test('a successful check-in stores the verdict and no coordinate', async () => {
    const { runCheckIn, setGeolocation, localStorage, toasts } = loadCheckInModule();

    setGeolocation({
        getCurrentPosition: onSuccess => onSuccess(positionAt(53.2026, 6.5540, 20))
    });

    assert.deepEqual(plain(await runCheckIn(festival)), { ok: true });

    const stored = localStorage.getItem('moiCheckEvents');
    assert.ok(stored, 'the verdict is persisted');
    assert.deepEqual(Object.keys(JSON.parse(stored)), ['test-fest@2026-05-05']);

    // The claim the privacy note makes, asserted rather than left in prose:
    // nothing resembling a coordinate survives the check.
    assert.ok(!stored.includes('53.2'), `latitude leaked into storage: ${stored}`);
    assert.ok(!stored.includes('6.55'), `longitude leaked into storage: ${stored}`);
    assert.ok(!/latitude|longitude|accuracy|coords/.test(stored), `position leaked: ${stored}`);

    assert.equal(toasts.length, 1, 'the badge is celebrated once');
    assert.equal(toasts[0].icon, '🕊️');
});

test('a refused check-in stores nothing at all', async () => {
    const { runCheckIn, setGeolocation, localStorage, toasts } = loadCheckInModule();

    setGeolocation({
        getCurrentPosition: onSuccess => onSuccess(positionAt(...GROTE_MARKT, 20))
    });

    assert.deepEqual(plain(await runCheckIn(festival)), { ok: false, reason: 'tooFar' });
    assert.equal(localStorage.getItem('moiCheckEvents'), null);
    assert.equal(toasts.length, 0);
});

// Every one of these has to reach the user as a sentence rather than a spinner
// that never stops, so each maps to a reason the UI has a message for.
test('every geolocation failure resolves to a reason with a message', async () => {
    const cases = [
        [{ code: 1, message: 'denied' }, 'denied'],
        [{ code: 2, message: 'unavailable' }, 'unavailable'],
        [{ code: 3, message: 'timeout' }, 'timeout'],
        [{ message: 'something else' }, 'unavailable']
    ];

    for (const [error, expected] of cases) {
        const { runCheckIn, setGeolocation, localStorage } = loadCheckInModule();
        setGeolocation({
            getCurrentPosition: (onSuccess, onError) => onError(error)
        });

        assert.deepEqual(plain(await runCheckIn(festival)), { ok: false, reason: expected });
        assert.equal(localStorage.getItem('moiCheckEvents'), null);
    }
});

// Storage refusing the write used to leave the key in memory: the next render
// showed an earned badge that vanished on reload, and the orphan would ride along
// on the next successful save of some other check-in.
test('a refused write is rolled back rather than left in memory', async () => {
    const { runCheckIn, setGeolocation, hasCheckedIn } = loadCheckInModule({ failWrites: true });

    setGeolocation({
        getCurrentPosition: onSuccess => onSuccess(positionAt(53.2026, 6.5540, 20))
    });

    assert.deepEqual(plain(await runCheckIn(festival)), { ok: false, reason: 'saveFailed' });
    assert.equal(hasCheckedIn(festival), false, 'nothing is left claiming to be earned');
});

// The position was fine and the badge was not saved. Reporting that as a
// geolocation failure is a false diagnosis of a real problem.
test('a save failure is its own reason, not a location one', async () => {
    const { runCheckIn, setGeolocation, toasts } = loadCheckInModule({ failWrites: true });

    setGeolocation({
        getCurrentPosition: onSuccess => onSuccess(positionAt(53.2026, 6.5540, 20))
    });

    const verdict = plain(await runCheckIn(festival));
    assert.equal(verdict.reason, 'saveFailed');
    assert.notEqual(verdict.reason, 'unavailable');
    assert.equal(toasts.length, 0, 'nothing to celebrate when nothing was saved');
});

// The badge is earned and stored by the time the toast runs, so a toast that
// throws must not report the check-in as failed.
test('a failing badge toast does not undo a saved check-in', async () => {
    const { runCheckIn, setGeolocation, localStorage, breakToast } = loadCheckInModule();

    breakToast();
    setGeolocation({
        getCurrentPosition: onSuccess => onSuccess(positionAt(53.2026, 6.5540, 20))
    });

    assert.deepEqual(plain(await runCheckIn(festival)), { ok: true });
    assert.ok(localStorage.getItem('moiCheckEvents'), 'the check-in is still stored');
});

// Deliberate, not an oversight: the window is judged when the user taps, not when
// the satellite answers. A fix is allowed 15 seconds, and refusing one that lands
// just after endTime would tell somebody standing in the festival that it has
// finished. The direction that would be wrong — a callback resolving somewhere
// else — is closed by the distance check instead. If this starts failing, that
// decision was changed rather than a bug fixed.
test('a fix that lands after the window closes still records the occurrence', async () => {
    const { runCheckIn, setGeolocation, hasCheckedIn, canCheckIn } = loadCheckInModule();
    const timed = { ...festival, startTime: '13:00', endTime: '23:00' };

    // The window is shut by the time this resolves...
    assert.equal(canCheckIn(timed, '2026-05-05', new Date('2026-05-05T21:10:00Z')), false);

    setGeolocation({
        getCurrentPosition: onSuccess => onSuccess(positionAt(53.2026, 6.5540, 20))
    });

    // ...and the badge is still recorded, because the tap is what claimed it.
    assert.deepEqual(plain(await runCheckIn(timed)), { ok: true });
    assert.equal(hasCheckedIn(timed), true);
});

test('a browser without geolocation fails cleanly instead of throwing', async () => {
    const { runCheckIn } = loadCheckInModule();
    assert.deepEqual(plain(await runCheckIn(festival)), { ok: false, reason: 'unavailable' });
});

// Locked to a one-shot read: watchPosition would leave a subscription running
// after the badge is earned, which is the thing the module promises not to do.
test('the position is read once, never watched', async () => {
    const { runCheckIn, setGeolocation } = loadCheckInModule();

    let calls = 0;
    let options = null;
    setGeolocation({
        getCurrentPosition: (onSuccess, onError, opts) => {
            calls += 1;
            options = opts;
            onSuccess(positionAt(53.2026, 6.5540, 20));
        },
        watchPosition: () => assert.fail('watchPosition must never be used')
    });

    await runCheckIn(festival);

    assert.equal(calls, 1);
    assert.equal(options.maximumAge, 0, 'a cached fix would not say where the phone is now');
    assert.ok(options.timeout > 0, 'a tap must not be able to hang forever');
});

test('the shipped Bevrijdingsfestival entry has a usable check-in and badge', () => {
    const { EVENTS, UI_TRANSLATIONS } = loadCheckInModule();

    const shipped = EVENTS.filter(event => event.checkIn);
    assert.ok(shipped.length > 0, 'at least one event ships with a check-in');

    for (const event of shipped) {
        const { coords, radius } = event.checkIn;
        assert.equal(coords.length, 2, `${event.id} needs a lat/lon pair`);
        // Inside the province, so a typo or a swapped pair fails here rather
        // than shipping a button nobody can ever satisfy.
        assert.ok(coords[0] > 53.0 && coords[0] < 53.6, `${event.id} latitude off: ${coords[0]}`);
        assert.ok(coords[1] > 6.2 && coords[1] < 7.3, `${event.id} longitude off: ${coords[1]}`);
        assert.ok(radius >= 100 && radius <= 2000, `${event.id} radius implausible: ${radius}`);

        assert.ok(event.badge, `${event.id} has a check-in but no badge to earn`);
        for (const lang of ['en', 'nl']) {
            assert.ok(event.badge.title[lang], `${event.id} badge title missing ${lang}`);
            assert.ok(event.badge.desc[lang], `${event.id} badge desc missing ${lang}`);
        }
    }

    // A missing string renders as "undefined" in the status line, so both
    // languages are checked rather than assumed.
    const keys = [
        'eventsCheckIn', 'eventsCheckInBusy', 'eventsCheckInDone', 'eventsCheckInHint',
        'eventsCheckInTooFar', 'eventsCheckInImprecise', 'eventsCheckInDenied',
        'eventsCheckInUnavailable', 'eventsCheckInTimeout', 'eventsCheckInClosed',
        'eventsCheckInSaveFailed'
    ];
    for (const lang of ['en', 'nl']) {
        for (const key of keys) {
            assert.equal(typeof UI_TRANSLATIONS[lang][key], 'string', `${lang}.${key} missing`);
        }
    }
});
