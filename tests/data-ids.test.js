// Ids are what saved progress hangs on: bucket-list ticks are stored in
// completedItems by id, and event check-ins by `${id}@${date}`. A duplicate id
// makes two cards share one tick or one badge, and no other check notices:
// the cards still render. tests/words.test.js does the same for the words.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// data.js is a classic script of top-level consts, so it is run in a vm scope
// rather than imported (see tests/helpers/load-events.js).
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/data.js'), 'utf8'), context, { filename: 'js/data.js' });
const { BUCKET_LIST, EVENTS } = vm.runInContext('({ BUCKET_LIST, EVENTS })', context);

function duplicateIds(entries) {
    const seen = new Set();
    const duplicates = new Set();
    for (const { id } of entries) {
        if (seen.has(id)) duplicates.add(id);
        seen.add(id);
    }
    return [...duplicates];
}

for (const [name, entries] of [['BUCKET_LIST', BUCKET_LIST], ['EVENTS', EVENTS]]) {
    test(`every ${name} entry has an id, and no two share one`, () => {
        assert.ok(entries.length > 0, `${name} loaded`);
        for (const entry of entries) {
            assert.ok(typeof entry.id === 'string' && entry.id.trim(), `${name} entry without an id: ${JSON.stringify(entry.title)}`);
        }
        assert.deepEqual(duplicateIds(entries), [], `${name} has duplicate ids`);
    });
}
