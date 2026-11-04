// syncCloudProgress() merges this tab's in-memory progress with the account's cloud rows.
// "Local has it, cloud does not" used to mean "upload it", which is right for a guest tick
// that never reached the cloud and wrong for an item another tab has since unticked: the
// row came straight back (issue #225, observed on production). The tab now remembers which
// ids it has seen in this account's cloud, which separates the two cases. These run the
// real js/auth.js and js/utils.js (see helpers/load-auth.js) the way index.html loads them.

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadAuthModule, createLocalStorage, createFakeSupabase, plain } from './helpers/load-auth.js';

const local = (note = '') => ({ date: '2026-11-01T00:00:00.000Z', note });
const cloudRow = (user, item, note = '') => ({ user_id: user, item_id: item, date: '2026-10-30T08:00:00.000Z', note });
const userA = { id: 'user-a', email: 'a@example.test' };
const userB = { id: 'user-b', email: 'b@example.test' };

test('an item unticked in another tab is not put back by this tab’s next sync', async () => {
    const storage = createLocalStorage();
    // Held by reference so the test can delete the row the way the other tab's DELETE does.
    const rows = [cloudRow('user-b', '2', 'my memory')];
    const supabase = createFakeSupabase({ rows });

    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });
    tab.completedItems = {};
    tab.currentUser = userB;
    await tab.onUserLoggedIn();
    assert.deepEqual(Object.keys(plain(tab.completedItems)), ['2'], 'the first sync should bring the row down');
    supabase.upserts.length = 0;

    // Another tab of the same account unticks it: the row goes, and so does the store entry.
    rows.length = 0;
    storage.setItem('moiCheckState', JSON.stringify({}));

    // This tab re-syncs while it still holds the item (a reload of the other tab was
    // enough to trigger this in production).
    await tab.syncCloudProgress();

    assert.deepEqual(supabase.upserts, [], 'the deleted item was uploaded again');
    assert.deepEqual(Object.keys(plain(tab.completedItems)), [], 'this tab still holds the deleted item');
    assert.deepEqual(JSON.parse(storage.getItem('moiCheckState')), {}, 'the deleted item was written back to the store');
});

test('a guest’s ticks still merge into the account on sign-in', async () => {
    const storage = createLocalStorage();
    const supabase = createFakeSupabase({ rows: [cloudRow('user-b', 'from-cloud')] });
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });

    // Ticked before ever signing in, so these have never been in anyone's cloud.
    tab.completedItems = { 'guest-a': local('as a guest'), 'guest-b': local() };
    tab.currentUser = userB;
    await tab.onUserLoggedIn();

    assert.deepEqual(supabase.upserts.map(u => u.row.item_id).sort(), ['guest-a', 'guest-b'],
        'guest progress must still be uploaded');
    assert.deepEqual(Object.keys(plain(tab.completedItems)).sort(), ['from-cloud', 'guest-a', 'guest-b']);
});

test('an item id seen in one account’s cloud is not dropped for the next account', async () => {
    const storage = createLocalStorage();
    // Bucket-list ids are shared across accounts, so '2' means a different row per account.
    const rows = [cloudRow('user-a', '2', "A's")];
    const supabase = createFakeSupabase({ rows });
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });

    tab.completedItems = {};
    tab.currentUser = userA;
    await tab.onUserLoggedIn();          // this tab learns that '2' is in A's cloud
    supabase.upserts.length = 0;

    // Sign out, then sign in as B holding a tick on the same id that B has never uploaded.
    tab.currentUser = null;
    tab.onUserLoggedOut();
    tab.completedItems = { '2': local("B's own") };
    tab.currentUser = userB;
    await tab.onUserLoggedIn();

    assert.deepEqual(supabase.upserts.map(u => [u.row.user_id, u.row.item_id]), [['user-b', '2']],
        "B's own tick was dropped as if it were A's deletion");
    assert.ok('2' in plain(tab.completedItems), "B's own tick was removed from this tab");
});

// Known limit, asserted so it is on the record rather than a surprise. A tab that loads
// fresh has seen nothing in the cloud yet, so it cannot tell an item deleted on another
// device while it was closed from one that never got uploaded. Closing this needs the
// server to remember deletions (a deleted_at column), not more client state. A change
// that fixes the cross-device case should replace this test.
test('known limit: a deletion made on another device is still undone after a fresh load', async () => {
    const storage = createLocalStorage({
        moiCheckSyncedUser: 'user-b',
        moiCheckState: JSON.stringify({ '2': local('my memory') })
    });
    const supabase = createFakeSupabase({ rows: [] });   // the other device already deleted it
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });

    tab.completedItems = JSON.parse(storage.getItem('moiCheckState'));   // as app.js does at load
    tab.currentUser = userB;
    await tab.onUserLoggedIn();

    assert.deepEqual(supabase.upserts.map(u => u.row.item_id), ['2'],
        'if this now returns [] the cross-device case is fixed and this test should be replaced');
});
