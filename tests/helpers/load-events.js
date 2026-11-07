// Loads the real js/data.js and js/events.js the way index.html does: classic
// scripts sharing one global scope, data.js first. Both are plain scripts with no
// exports and package.json is "type": "module", so they cannot be imported -
// node:vm gives them a scope instead. The point is that the tests (and
// scripts/events-check.js) run the shipped source rather than a copy of it.

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function loadEventsModule() {
    const context = vm.createContext({ console, Intl, Date });

    for (const file of ['js/data.js', 'js/events.js']) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
    }

    vm.runInContext(`
        globalThis.__module = {
            EVENTS,
            UI_TRANSLATIONS,
            ALLOWED_LANGS,
            todayInGroningen,
            resolveOccurrence,
            getUpcomingEvents,
            isHappeningNow,
            isOngoing,
            formatEventEnd,
            formatEventDate,
            formatEventTimes,
            formatEventsCoverageEnd
        };
    `, context, { filename: 'test-hooks.js' });

    return context.__module;
}
