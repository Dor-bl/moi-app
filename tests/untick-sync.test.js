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

// An ordinary tick does not go through the batch upsert in syncCloudProgress — it is
// uploaded on its own by syncItemToCloud from toggleComplete. If that path does not
// record the id, the item still reads as "never reached the cloud", and a later sync
// uploads it again after another tab unticks it: issue #225 on its most common path.
test('a tick uploaded on its own is not put back after another tab unticks it', async () => {
    const storage = createLocalStorage();
    const rows = [cloudRow('user-b', 'already-synced')];
    const supabase = createFakeSupabase({ rows });
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });
    tab.completedItems = {};
    tab.currentUser = userB;
    await tab.onUserLoggedIn();

    // The user ticks an item here; toggleComplete uploads it individually.
    tab.completedItems['7'] = local('ticked here');
    await tab.syncItemToCloud('7', true, 'ticked here');
    rows.push(cloudRow('user-b', '7', 'ticked here'));
    supabase.upserts.length = 0;

    // Another tab of the same account unticks it.
    rows.splice(rows.findIndex(r => r.item_id === '7'), 1);
    await tab.syncCloudProgress();

    assert.deepEqual(supabase.upserts, [], 'the item this tab ticked was uploaded again after the untick');
    assert.ok(!('7' in plain(tab.completedItems)), 'this tab still holds the deleted item');
});

// The other direction. After this tab unticks an item the row is gone, so the tab must
// stop believing it is in the cloud. Left behind, a re-tick whose upload fails reads as
// "was in the cloud, now missing" and the next sync drops the user's tick instead.
test('a re-tick whose upload failed survives the next sync', async () => {
    const storage = createLocalStorage();
    const rows = [cloudRow('user-b', '3', 'original')];
    const supabase = createFakeSupabase({ rows });
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });
    tab.completedItems = {};
    tab.currentUser = userB;
    await tab.onUserLoggedIn();

    // Unticked here: the cloud row goes.
    delete tab.completedItems['3'];
    await tab.syncItemToCloud('3', false);
    rows.length = 0;

    // Re-ticked straight away, but this upload fails.
    tab.completedItems['3'] = local('re-ticked');
    const realFrom = supabase.from;
    supabase.from = table => ({ ...realFrom(table), upsert: async () => ({ error: { message: 'offline' } }) });
    await tab.syncItemToCloud('3', true, 're-ticked');
    supabase.from = realFrom;
    supabase.upserts.length = 0;

    await tab.syncCloudProgress();

    assert.ok('3' in plain(tab.completedItems), 'the re-tick was dropped as if it were a deletion elsewhere');
    assert.deepEqual(supabase.upserts.map(u => u.row.item_id), ['3'], 'the re-tick should reach the cloud on the next sync');
});

// The clear that matters for the cross-tab switch is the one beside heldUserId, not the
// one in onUserLoggedOut(): when another tab moves the browser to B, this tab never logs
// out, it just receives B's sign-in. The test above goes through the logout path and so
// cannot protect this one. Here the store and marker are already B's, as #220's adoption
// branch expects, and B's tick has never been uploaded — if the set still held A's ids it
// would read as "was in B's cloud, now gone" and B's own progress would be deleted.
test('a cross-tab switch to another account does not drop the new account’s progress', async () => {
    const storage = createLocalStorage();
    const rows = [cloudRow('user-a', '2', "A's")];
    const supabase = createFakeSupabase({ rows });
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });

    tab.completedItems = {};
    tab.currentUser = userA;
    await tab.onUserLoggedIn();                  // this tab learns '2' is in A's cloud
    assert.ok('2' in plain(tab.completedItems));
    supabase.upserts.length = 0;

    // Another tab switches the browser to B: it has already moved the marker and left B's
    // own progress in the store. B has nothing in the cloud yet. No logout happens here.
    rows.length = 0;
    storage.setItem('moiCheckSyncedUser', 'user-b');
    storage.setItem('moiCheckState', JSON.stringify({ '2': local("B's own") }));

    tab.currentUser = userB;
    await tab.onUserLoggedIn();                  // this tab only now hears about B

    assert.ok('2' in plain(tab.completedItems), "B's own progress was dropped as if it were A's deletion");
    assert.deepEqual(supabase.upserts.map(u => [u.row.user_id, u.row.item_id]), [['user-b', '2']],
        "B's tick should be uploaded under B");
});

// The drop decision compares against what this tab knew when the read was issued, not the
// live set. A tick made while the read is in flight is uploaded by syncItemToCloud, which
// records its id, but the read's older snapshot cannot contain the row — against the live
// set that reads as "was in the cloud, now gone" and deletes the tick the user just made.
test('a tick made while a sync read is in flight is not deleted by it', async () => {
    const storage = createLocalStorage();
    const supabase = createFakeSupabase({ rows: [] });
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });
    tab.completedItems = {};
    tab.currentUser = userB;
    await tab.onUserLoggedIn();
    supabase.upserts.length = 0;

    // Hold the next read open so the tick can land during its flight.
    let releaseRead;
    const pendingRead = new Promise(resolve => { releaseRead = resolve; });
    const realFrom = supabase.from;
    supabase.from = table => ({ ...realFrom(table), select: () => ({ eq: () => pendingRead }) });

    const syncing = tab.syncCloudProgress();

    tab.completedItems['X'] = local('ticked during the sync');
    await tab.syncItemToCloud('X', true, 'ticked during the sync');
    assert.deepEqual(supabase.upserts.map(u => u.row.item_id), ['X'], 'the tick should reach the cloud');

    releaseRead({ data: [], error: null });   // the read returns its older, empty snapshot
    await syncing;
    supabase.from = realFrom;

    assert.ok('X' in plain(tab.completedItems), 'the tick was deleted although its cloud row exists');
    assert.ok('X' in JSON.parse(storage.getItem('moiCheckState')), 'the tick was dropped from the store');
});
