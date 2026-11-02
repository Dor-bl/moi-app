// Another tab can switch the browser to a different account without a sign-out in this
// one. This tab then receives a sign-in for the new user, but the stored account marker
// has usually been moved to that user by the other tab already, so the marker check in
// syncCloudProgress cannot tell that the progress this tab still holds belongs to the
// previous user. Without a reset that progress is merged with the new user's cloud rows
// and uploaded under their id. These run the real js/auth.js and js/utils.js
// (see helpers/load-auth.js) the way index.html loads them.

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadAuthModule, createLocalStorage, createFakeSupabase, plain } from './helpers/load-auth.js';

const entry = (note = '') => ({ date: '2026-10-31T10:00:00.000Z', note });
const row = (user, item, note = '') => ({ user_id: user, item_id: item, date: '2026-10-30T08:00:00.000Z', note });
const stored = storage => JSON.parse(storage.getItem('moiCheckState'));
const userA = { id: 'user-a', email: 'a@example.test' };
const userB = { id: 'user-b', email: 'b@example.test' };

// A tab that has signed in as A and holds A's progress, as the app does after a sync.
async function tabSignedInAsA(storage, supabase) {
    const { module } = loadAuthModule({ storage, supabaseClient: supabase });
    module.completedItems = {};
    module.currentUser = userA;
    await module.onUserLoggedIn();
    return module;
}

test('a tab that receives a sign-in for a different user drops the previous user’s progress', async () => {
    const storage = createLocalStorage();
    const supabase = createFakeSupabase({ rows: [row('user-a', 'a-item', 'A private'), row('user-b', 'b-item')] });
    const tab = await tabSignedInAsA(storage, supabase);
    assert.deepEqual(Object.keys(plain(tab.completedItems)), ['a-item']);
    supabase.upserts.length = 0;

    // Another tab switches the browser to B and has already moved the marker and the store.
    storage.setItem('moiCheckSyncedUser', 'user-b');
    storage.setItem('moiCheckState', JSON.stringify({ 'b-item': entry() }));

    // This tab now receives the sign-in event for B.
    tab.currentUser = userB;
    await tab.onUserLoggedIn();

    assert.deepEqual(supabase.upserts.map(u => [u.row.user_id, u.row.item_id]), [],
        'A’s progress was uploaded under B');
    assert.deepEqual(Object.keys(plain(tab.completedItems)), ['b-item']);
    assert.deepEqual(Object.keys(stored(storage)), ['b-item']);
});

test('a sign-in for the same user again keeps what this tab holds and uploads the new tick', async () => {
    const storage = createLocalStorage();
    const supabase = createFakeSupabase({ rows: [row('user-a', 'a-item')] });
    const tab = await tabSignedInAsA(storage, supabase);

    // The auth event fires again for the same user (a refresh, a regained focus).
    tab.completedItems['x'] = entry('ticked here');
    tab.currentUser = { ...userA };
    await tab.onUserLoggedIn();

    assert.deepEqual(Object.keys(plain(tab.completedItems)).sort(), ['a-item', 'x']);
    assert.deepEqual(supabase.upserts.map(u => u.row.item_id), ['x']);
});

test('progress made as a guest after a sign-out still merges into the next account', async () => {
    const storage = createLocalStorage();
    const supabase = createFakeSupabase({ rows: [row('user-a', 'a-item'), row('user-b', 'b-item')] });
    const tab = await tabSignedInAsA(storage, supabase);
    supabase.upserts.length = 0;

    // A signs out in this tab, a guest ticks something, and then B signs in.
    tab.currentUser = null;
    tab.onUserLoggedOut();
    tab.completedItems['guest-item'] = entry('made as a guest');
    tab.currentUser = userB;
    await tab.onUserLoggedIn();

    assert.deepEqual(Object.keys(plain(tab.completedItems)).sort(), ['b-item', 'guest-item']);
    assert.deepEqual(supabase.upserts.map(u => [u.row.user_id, u.row.item_id]), [['user-b', 'guest-item']]);
});

// The marker already names the new user, so the store is that user's own saved progress,
// possibly including ticks and notes that never reached the cloud. Resetting must replace
// this tab's copy with that store, not wipe it: if the cloud read then fails, wiping it
// would lose them for good.
test('the new user’s unsynced progress in the store survives the switch when the cloud read fails', async () => {
    const storage = createLocalStorage();
    const supabase = createFakeSupabase({ rows: [row('user-a', 'a-item', 'A private')] });
    const tab = await tabSignedInAsA(storage, supabase);

    // Another tab switched to B and holds an unsynced tick; the store and marker are B's.
    storage.setItem('moiCheckSyncedUser', 'user-b');
    storage.setItem('moiCheckState', JSON.stringify({ 'b-local': entry('B unsynced') }));

    // From here on the cloud read fails.
    supabase.upserts.length = 0;
    const realFrom = supabase.from;
    supabase.from = table => ({
        ...realFrom(table),
        select: () => ({ eq: async () => ({ data: null, error: { message: 'offline' } }) })
    });

    tab.currentUser = userB;
    await tab.onUserLoggedIn();

    assert.deepEqual(Object.keys(stored(storage)), ['b-local'], 'B’s unsynced progress was wiped from the store');
    assert.deepEqual(Object.keys(plain(tab.completedItems)), ['b-local'], 'this tab did not take B’s copy');
    assert.ok(!('a-item' in plain(tab.completedItems)), 'A’s progress is still held');
    assert.deepEqual(supabase.upserts, []);
});

test('the new user’s unsynced progress is uploaded under them once the cloud read works', async () => {
    const storage = createLocalStorage();
    const supabase = createFakeSupabase({ rows: [row('user-a', 'a-item'), row('user-b', 'b-cloud')] });
    const tab = await tabSignedInAsA(storage, supabase);
    supabase.upserts.length = 0;

    storage.setItem('moiCheckSyncedUser', 'user-b');
    storage.setItem('moiCheckState', JSON.stringify({ 'b-local': entry('B unsynced') }));

    tab.currentUser = userB;
    await tab.onUserLoggedIn();

    assert.deepEqual(Object.keys(plain(tab.completedItems)).sort(), ['b-cloud', 'b-local']);
    assert.deepEqual(supabase.upserts.map(u => [u.row.user_id, u.row.item_id]), [['user-b', 'b-local']]);
});

// The values in the store are not guaranteed to be objects (a hand-edited key, a
// half-written value, an older build). syncCloudProgress's upload reads .note and
// .date off every entry it holds, inside a try that only logs, so one bad value
// used to throw there and drop the whole upsert — losing exactly the unsynced
// progress this branch adopts the store to keep.
test('a malformed entry in the adopted store does not stop the new user’s progress uploading', async () => {
    const storage = createLocalStorage();
    const supabase = createFakeSupabase({ rows: [row('user-a', 'a-item'), row('user-b', 'b-cloud')] });
    const tab = await tabSignedInAsA(storage, supabase);
    supabase.upserts.length = 0;

    // Another tab switched to B; B's store carries an unsynced tick and a bad value.
    storage.setItem('moiCheckSyncedUser', 'user-b');
    storage.setItem('moiCheckState', JSON.stringify({ 'b-local': entry('B unsynced'), 'b-bad': null }));

    tab.currentUser = userB;
    await tab.onUserLoggedIn();

    assert.deepEqual(supabase.upserts.map(u => [u.row.user_id, u.row.item_id]), [['user-b', 'b-local']],
        'B’s unsynced tick was not uploaded');
    assert.ok(!('b-bad' in plain(tab.completedItems)), 'the malformed entry was kept');
    assert.deepEqual(Object.keys(plain(tab.completedItems)).sort(), ['b-cloud', 'b-local']);
});

test('non-object entries of every shape are dropped from the adopted store', async () => {
    const storage = createLocalStorage();
    const supabase = createFakeSupabase({ rows: [] });
    const tab = await tabSignedInAsA(storage, supabase);
    supabase.upserts.length = 0;

    storage.setItem('moiCheckSyncedUser', 'user-b');
    storage.setItem('moiCheckState', JSON.stringify({
        'ok': entry('keep me'), 'nul': null, 'num': 7, 'str': 'x', 'arr': [], 'bool': true
    }));

    tab.currentUser = userB;
    await tab.onUserLoggedIn();

    assert.deepEqual(Object.keys(plain(tab.completedItems)), ['ok']);
    assert.deepEqual(supabase.upserts.map(u => u.row.item_id), ['ok']);
});
