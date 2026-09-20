// Loads the real js/data.js, js/events.js and js/checkin.js the way index.html
// does: classic scripts sharing one global scope, in page order. Same reasoning as
// load-events.js — they are plain scripts with no exports and package.json is
// "type": "module", so node:vm gives them a scope rather than an import.
//
// checkin.js reads localStorage at load time and calls showBadgeToast on a
// successful check-in, so both are stubbed here. The stubs are returned so a test
// can assert on what was stored and what was celebrated, which is the whole
// privacy claim: the verdict is persisted and the coordinate is not.

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { createLocalStorage } from './load-auth.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function loadCheckInModule({ seed = {}, lang = 'en' } = {}) {
    const localStorage = createLocalStorage(seed);
    const toasts = [];

    const context = vm.createContext({
        console,
        Intl,
        Date,
        Math,
        JSON,
        Object,
        Number,
        Boolean,
        Promise,
        localStorage,
        currentLang: lang,
        showBadgeToast: badge => toasts.push(badge),
        navigator: {}
    });

    for (const file of ['js/data.js', 'js/events.js', 'js/checkin.js']) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
    }

    vm.runInContext(`
        globalThis.__module = {
            EVENTS,
            UI_TRANSLATIONS,
            checkInKeyFor,
            canCheckIn,
            distanceInMetres,
            judgeCheckIn,
            hasCheckedIn,
            recordCheckIn,
            runCheckIn,
            setGeolocation: impl => { navigator.geolocation = impl; }
        };
    `, context, { filename: 'test-hooks.js' });

    return { ...context.__module, localStorage, toasts };
}

// Shapes a GeolocationPosition the way the browser hands one over, so judgeCheckIn
// is fed the same property names it reads in production.
export function positionAt(latitude, longitude, accuracy) {
    return { coords: { latitude, longitude, accuracy } };
}

// A verdict built inside the vm context carries that realm's Object.prototype, and
// assert/strict compares prototypes — so deepEqual against a literal written here
// fails with two objects the reporter prints identically, which is a confusing way
// to spend an afternoon. Spreading it into a host object is the whole fix.
export function plain(value) {
    return { ...value };
}
