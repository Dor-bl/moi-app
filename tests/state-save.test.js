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

// The cloud sync ends in a full upload of completedItems under the signed-in user's id,
// so it must not adopt whatever another tab has put in the shared store while its query
// was in flight. After an account switch elsewhere that is a different account's private
// progress, and uploading it would hand it to the wrong user. That is why this path
// still overwrites with saveState() rather than merging with saveItems().
test('a sync does not upload another account’s progress that landed in the store mid-query', async () => {
    const storage = createLocalStorage();
    const supabase = createFakeSupabase({
        rows: [{ user_id: 'user-a', item_id: 'a-item', date: '2026-10-30T08:00:00.000Z', note: '' }]
    });

    // Hold the cloud query open so the other tab can act while it is in flight.
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const realFrom = supabase.from;
    supabase.from = table => {
        const api = realFrom(table);
        return { ...api, select: () => ({ eq: async (column, value) => {
            await gate;
            return api.select().eq(column, value);
        } }) };
    };

    const tabA = openTab(storage, { supabaseClient: supabase });
    tabA.currentUser = { id: 'user-a', email: 'a@example.test' };
    const sync = tabA.syncCloudProgress();

    // Meanwhile another tab switches the browser to account B: B's marker and B's
    // private progress are now what the shared store holds.
    storage.setItem('moiCheckSyncedUser', 'user-b');
    storage.setItem('moiCheckState', JSON.stringify({ 'b-private': entry('B’s note') }));

    release();
    await sync;

    assert.deepEqual(supabase.upserts.map(u => u.row.item_id), [], 'nothing of B’s is uploaded under A');
});
