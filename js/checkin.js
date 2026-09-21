// Check-In Module - Shared Global Exports: eventCheckIns, checkInKeyFor, canCheckIn,
// distanceInMetres, judgeCheckIn, hasCheckedIn, recordCheckIn, readPosition, runCheckIn
// Dependencies: Expects UI_TRANSLATIONS, currentLang, isHappeningNow (js/events.js),
// showBadgeToast (js/utils.js), navigator.geolocation.
//
// The privacy shape of this file is the point of it, so it is stated here rather
// than left to be inferred: a coordinate is read once, per deliberate tap, compared
// in memory, and dropped. What persists is the verdict — an event key and the day it
// was earned. No latitude, no longitude, no accuracy, no track. Nothing is sent
// anywhere: event check-ins are local to the browser, so there is no attendance
// record on a server to disclose, retain or delete.
//
// That is what keeps this exempt under Article 5(3) ePrivacy on the same ground as
// moiCheckState (see docs/decisions/consent-exemption-analysis.md): the user asked
// for the one thing whose whole purpose is checking where they are, and the browser's
// own permission prompt is the consent step. Keep it that way — a stored coordinate
// or an outbound request turns a no-banner feature into a legal-basis question.

// Separate from moiCheckState on purpose. MILESTONES derives its top tier from
// BUCKET_LIST.length, and updateProgress() counts the keys of completedItems, so
// folding event check-ins in there would inflate progress past 100% and make
// "Real Groninger" unreachable-or-free depending on the festival calendar.
let eventCheckIns = JSON.parse(localStorage.getItem('moiCheckEvents')) || {};

function saveCheckIns() {
    localStorage.setItem('moiCheckEvents', JSON.stringify(eventCheckIns));
}

// Keyed by occurrence, not by event. An `annual: true` entry is one row in EVENTS
// that resolves to a different date every year, so keying on the id alone would
// mean Bommen Berend is earned once in a lifetime and can never be earned again.
// The date comes from the resolved occurrence the Events view already renders.
function checkInKeyFor(event) {
    return `${event.id}@${event.date}`;
}

// Object.create(null) is not used for the parsed store because JSON.parse already
// produces a plain object whose "__proto__" key is a own property rather than a
// setter — but a stale key like "constructor" would still inherit off the
// prototype on read, so membership is asked via hasOwnProperty.
function hasCheckedIn(event) {
    return Object.prototype.hasOwnProperty.call(eventCheckIns, checkInKeyFor(event));
}

function recordCheckIn(event) {
    const key = checkInKeyFor(event);
    eventCheckIns[key] = { date: new Date().toISOString() };

    try {
        saveCheckIns();
    } catch (err) {
        // Storage refused the write — a full quota, or Safari's private mode,
        // where setItem throws. Undo the in-memory mutation before rethrowing:
        // left in place it would render as an earned badge that vanishes on
        // reload, and it would ride along on the next successful save of some
        // *other* check-in. Deleting rather than restoring a previous value is
        // right because the button is only rendered for a key not already stored.
        delete eventCheckIns[key];
        throw err;
    }
}

// Two gates, both required: the event has to have opted in by carrying a checkIn
// block (most have no single point to stand near — "Across the city" is not a
// coordinate), and it has to actually be on right now. isHappeningNow already
// handles the calendar, the span and the startTime/endTime hours in Groningen's
// timezone, which is the whole reason the badge means "on the day, on the spot"
// rather than "some time that year".
function canCheckIn(event, today, now = new Date()) {
    return Boolean(event.checkIn) && isHappeningNow(event, today, now);
}

// Haversine on a spherical earth. Over the hundreds of metres this compares, the
// difference from a proper ellipsoidal (Vincenty) distance is centimetres —
// orders of magnitude below the GPS accuracy that dominates the verdict below.
function distanceInMetres([lat1, lon1], [lat2, lon2]) {
    const EARTH_RADIUS_M = 6371000;
    const toRad = deg => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

    return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

// Refuses rather than false-accepts when the fix is too vague to mean anything.
// A desktop browser geolocating off wifi or IP can report the middle of the city
// with a 20km error bound: the reported point would sit inside the radius and the
// badge would go to somebody in Amsterdam. Comparing the error bound against the
// radius first is what makes "too far" a real answer — if the fix cannot resolve
// the radius, there is no question to answer and saying so is the honest outcome.
//
// In practice the commonest way to land here is not a weak signal but a deliberate
// one: iOS and Android both let a site have "approximate" location, which is a
// grid of kilometres and can never resolve a radius in the hundreds of metres.
// That is why eventsCheckInImprecise names precise location first and the outdoors
// hint second — found by testing on a real phone, where the old copy sent the
// tester outside to fix something that going outside cannot fix.
//
// Deliberately not doing anything cleverer than this. The check is spoofable in
// ten seconds with devtools, exactly like the honour-system checkboxes on the
// bucket list, and it is meant as a nudge rather than proof. Anti-spoofing work
// here would be defending a threat model that a city bucket list does not have.
function judgeCheckIn(event, position) {
    const { coords: target, radius } = event.checkIn;
    const { latitude, longitude, accuracy } = position.coords;

    if (!Number.isFinite(accuracy) || accuracy > radius) {
        return { ok: false, reason: 'imprecise' };
    }

    const distance = distanceInMetres([latitude, longitude], target);
    return distance <= radius ? { ok: true } : { ok: false, reason: 'tooFar' };
}

// getCurrentPosition, never watchPosition: one fix, on one tap, and no subscription
// left running. Promisified so runCheckIn below reads as a straight line.
function readPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            const err = new Error('Geolocation unsupported');
            err.code = 'UNSUPPORTED';
            reject(err);
            return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            // Long enough for a cold GPS fix outdoors, short enough that a tap
            // does not look ignored. A stale cached fix is refused outright:
            // maximumAge: 0 means the answer describes where the phone is now,
            // not where it was when some other page last asked.
            timeout: 15000,
            maximumAge: 0
        });
    });
}

// Maps everything that can go wrong onto one of the eventsCheckIn* strings, so the
// caller has a message for every path and never leaves the button spinning. The
// PERMISSION_DENIED branch is a legitimate ending, not an error to work around:
// declining location means no event badge, and the copy says so without nagging.
function describeCheckInError(err) {
    if (err && err.code === 1) return 'denied';
    if (err && err.code === 2) return 'unavailable';
    if (err && err.code === 3) return 'timeout';
    return 'unavailable';
}

// The whole flow, kept in one place so the UI layer only has to render a verdict:
// resolve a position, judge it, and on success persist and celebrate. Returns a
// reason key rather than throwing, because every outcome here is a message.
async function runCheckIn(event) {
    let position;
    try {
        position = await readPosition();
    } catch (err) {
        return { ok: false, reason: describeCheckInError(err) };
    }

    // The window is judged when the user taps — handleCheckInClick resolves the
    // occurrence through canCheckIn — and deliberately not again here. A fix is
    // allowed up to the 15-second timeout, so re-checking would refuse somebody
    // who tapped at 22:59:58, stood exactly where they said they were, and had a
    // slow satellite: told the event has finished while standing in it. What the
    // badge records is the occurrence that was live when they claimed it, which
    // is the honest reading of "on the day, on the spot", and the key stored is
    // that occurrence's regardless of which side of midnight the fix lands on.
    //
    // The direction that would actually be wrong — a callback resolving long
    // after the tap, somewhere else — is already closed by the position itself,
    // which fails the distance check below. Pinned by a test, so changing this
    // is a decision rather than an accident.
    const verdict = judgeCheckIn(event, position);
    if (!verdict.ok) return verdict;

    try {
        recordCheckIn(event);
    } catch (err) {
        // Its own reason rather than a geolocation one: the position was fine
        // and the badge was not saved, so a message about the location would be
        // a false diagnosis of a real failure.
        console.warn('Check-in could not be saved:', err);
        return { ok: false, reason: 'saveFailed' };
    }

    // The badge is earned and stored by this point. A toast that throws must not
    // turn that into a failure the user is told about.
    try {
        if (event.badge) showBadgeToast(event.badge);
    } catch (err) {
        console.warn('Badge toast failed:', err);
    }

    return { ok: true };
}
