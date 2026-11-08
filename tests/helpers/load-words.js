// Loads the real js/words.js the way index.html does: a classic script in a
// shared global scope. See load-events.js for why node:vm rather than import.

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function loadWordsModule({ localStorage } = {}) {
    const context = vm.createContext({ console, Date, Math, JSON, localStorage });
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/words.js'), 'utf8'), context, { filename: 'js/words.js' });
    vm.runInContext(`
        globalThis.__module = {
            GRONINGS_WORDS,
            WORD_PROGRESS_KEY,
            wordForDate,
            quizOptionsFor,
            readWordProgress,
            recordWordAnswer,
            WORD_SETTING_KEY,
            readWordSetting,
            saveWordSetting
        };
    `, context, { filename: 'test-hooks.js' });
    return context.__module;
}

// The slice of the Storage interface words.js uses, with a switch to make every
// write throw the way a full or blocked store does.
export function fakeStorage({ failWrites = false } = {}) {
    const store = new Map();
    return {
        getItem: key => (store.has(key) ? store.get(key) : null),
        setItem(key, value) {
            if (failWrites) throw new DOMException('QuotaExceededError', 'QuotaExceededError');
            store.set(key, String(value));
        },
        removeItem: key => { store.delete(key); },
        dump: () => Object.fromEntries(store)
    };
}
