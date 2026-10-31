// moiCheckState is shared between every tab of the origin, but each tab keeps its own
// in-memory completedItems, read once at page load. A save that serialised only that
// copy replaced whatever another tab had stored since. These run the real js/auth.js
// and js/utils.js (see helpers/load-auth.js) over one storage object shared by two
// loaded modules, which is the browser's arrangement: one store, two memories.

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadAuthModule, createLocalStorage, createFakeSupabase, plain } from './helpers/load-auth.js';

const entry = (note = '') => ({ date: '2026-10-31T10:00:00.000Z', note });
const stored = storage => JSON.parse(storage.getItem('moiCheckState'));

// A tab as app.js opens it: completedItems is whatever the store held at that moment.
function openTab(storage, overrides = {}) {
    const { module } = loadAuthModule({ storage, ...overrides });
    module.completedItems = JSON.parse(storage.getItem('moiCheckState')) || {};
    return module;
}

test('ticks made in two tabs that were open at the same time both survive', () => {
    const storage = createLocalStorage();
    const a = openTab(storage);
    const b = openTab(storage);

    a.completedItems['item-1'] = entry();
    a.saveItems(['item-1']);
    b.completedItems['item-2'] = entry();
    b.saveItems(['item-2']);

    assert.deepEqual(Object.keys(stored(storage)).sort(), ['item-1', 'item-2']);
    assert.ok('item-1' in plain(b.completedItems), 'the second tab now holds the first tab’s tick too');
});

test('unticking in a stale tab removes that item and keeps a tick made elsewhere', () => {
    const storage = createLocalStorage({ moiCheckState: JSON.stringify({ 'item-1': entry() }) });
    const a = openTab(storage);
    const b = openTab(storage);

    a.completedItems['item-3'] = entry();
    a.saveItems(['item-3']);

    delete b.completedItems['item-1'];
    b.saveItems(['item-1']);

    assert.deepEqual(Object.keys(stored(storage)), ['item-3']);
});

test('a note edited in a stale tab does not discard a note edited in another tab', () => {
    const both = { 'item-1': entry('old 1'), 'item-2': entry('old 2') };
    const storage = createLocalStorage({ moiCheckState: JSON.stringify(both) });
    const a = openTab(storage);
    const b = openTab(storage);

    a.completedItems['item-2'].note = 'from A';
    a.saveItems(['item-2']);

    b.completedItems['item-1'].note = 'from B';
    b.saveItems(['item-1']);

    const result = stored(storage);
    assert.equal(result['item-1'].note, 'from B');
    assert.equal(result['item-2'].note, 'from A', 'untouched items keep what the store says, not this tab’s older copy');
});

test('a reset still overwrites the store rather than merging into it', () => {
    const storage = createLocalStorage({ moiCheckState: JSON.stringify({ 'item-1': entry(), 'item-2': entry() }) });
    const tab = openTab(storage);

    // What sign-out and account deletion do (js/auth.js). Merging here would undo them.
    tab.completedItems = {};
    tab.saveState();

    assert.deepEqual(stored(storage), {});
});

test('a refused write throws and leaves this tab holding what it had', () => {
    const storage = createLocalStorage();
    const tab = openTab(storage);
    tab.completedItems['item-1'] = entry();
    storage.setItem = () => { throw new Error('QuotaExceededError'); };

    tab.completedItems['item-2'] = entry();
    assert.throws(() => tab.saveItems(['item-2']), /QuotaExceededError/);

    // Unchanged from before: ticks made while storage is refusing stay visible for the
    // session, and the next save that works writes them out.
    assert.deepEqual(Object.keys(plain(tab.completedItems)).sort(), ['item-1', 'item-2']);
});

test('an unreadable store falls back to this tab’s copy instead of failing', () => {
    const storage = createLocalStorage({ moiCheckState: '{"item-1": {"date"' });
    const { module: tab } = loadAuthModule({ storage });
    tab.completedItems = { 'item-1': entry() };

    tab.saveItems(['item-1']);

    assert.deepEqual(Object.keys(stored(storage)), ['item-1']);
});

test('syncing cloud rows in a stale tab keeps a tick made in another tab', async () => {
    const storage = createLocalStorage();
    const supabase = createFakeSupabase({
        rows: [{ user_id: 'user-b', item_id: 'item-7', date: '2026-10-30T08:00:00.000Z', note: '' }]
    });
    const stale = openTab(storage, { supabaseClient: supabase });
    const other = openTab(storage);

    other.completedItems['item-5'] = entry();
    other.saveItems(['item-5']);

    stale.currentUser = { id: 'user-b', email: 'b@example.test' };
    await stale.syncCloudProgress();

    assert.deepEqual(Object.keys(stored(storage)).sort(), ['item-5', 'item-7']);
});
