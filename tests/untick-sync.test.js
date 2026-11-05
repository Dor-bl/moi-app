// syncCloudProgress() merges this tab's in-memory progress with the account's cloud rows.
// "Local has it, cloud does not" used to mean "upload it", which is right for a guest tick
// that never reached the cloud and wrong for an item another tab has since unticked: the
// row came straight back (issue #225, observed on production). Entries now carry
// `synced: true` once the cloud is known to hold them, which separates the two cases. These run the
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

// The flag is stored with the entry, so it outlives the tab that set it: a tab that loads
// fresh, or another device that has the item synced, drops it when the cloud no longer
// has it, instead of putting back a deletion made while it was closed.
test('a deletion made elsewhere is not undone by a fresh load that had the item synced', async () => {
    const storage = createLocalStorage({
        moiCheckSyncedUser: 'user-b',
        moiCheckState: JSON.stringify({ '2': { ...local('my memory'), synced: true } })
    });
    const supabase = createFakeSupabase({ rows: [] });   // deleted elsewhere
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });

    tab.completedItems = JSON.parse(storage.getItem('moiCheckState'));   // as app.js does at load
    tab.currentUser = userB;
    await tab.onUserLoggedIn();

    assert.deepEqual(supabase.upserts, [], 'the deleted item was uploaded again');
    assert.deepEqual(JSON.parse(storage.getItem('moiCheckState')), {});
});

// Entries saved before the flag existed have none, so they are treated as never uploaded
// and merged up once, as before; the cloud row that comes back marks them synced.
test('an entry stored before the flag existed is still uploaded, then marked synced', async () => {
    const storage = createLocalStorage({
        moiCheckSyncedUser: 'user-b',
        moiCheckState: JSON.stringify({ '2': local('my memory') })
    });
    const supabase = createFakeSupabase({ rows: [] });
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });

    tab.completedItems = JSON.parse(storage.getItem('moiCheckState'));
    tab.currentUser = userB;
    await tab.onUserLoggedIn();

    assert.deepEqual(supabase.upserts.map(u => u.row.item_id), ['2']);
    assert.equal(JSON.parse(storage.getItem('moiCheckState'))['2'].synced, true);
});

// Rule 3 in CLAUDE.md: a response that lands after a sign-out and sign-in (even as the same
// user) belongs to the old session and must not mark anything.
test('an upload that returns after the session changed does not mark the item synced', async () => {
    const storage = createLocalStorage();
    const supabase = createFakeSupabase({ rows: [] });
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });
    tab.completedItems = {};
    tab.currentUser = userB;
    await tab.onUserLoggedIn();

    let release;
    const realFrom = supabase.from;
    supabase.from = table => ({ ...realFrom(table), upsert: () => new Promise(r => { release = r; }) });
    tab.completedItems['X'] = local();
    const uploading = tab.syncItemToCloud('X', true);
    tab.bumpAuthGeneration();
    release({ error: null });
    await uploading;
    supabase.from = realFrom;

    assert.ok(!plain(tab.completedItems)['X'].synced, 'a stale response marked the item synced');
});

// An ordinary tick does not go through the batch upsert in syncCloudProgress — it is
// uploaded on its own by syncItemToCloud from toggleComplete. If that path does not
// mark it synced, the item still reads as "never reached the cloud", and a later sync
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

// The other direction. A re-tick is a new entry without the flag, so when its upload
// fails it reads as "never reached the cloud" and the next sync uploads it, rather than
// as "was in the cloud, now missing", which would drop the user's tick.
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

// When another tab moves the browser to B, this tab never logs out, it just receives B's
// sign-in. The test above goes through the logout path and so cannot protect this one.
// Here the store and marker are already B's, as #220's adoption branch expects, and B's
// tick has never been uploaded. If A's synced entry for the same id survived the switch it
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

// Only entries already synced when the read was sent are judged by it. A tick made while
// the read is in flight is uploaded and marked synced by syncItemToCloud, but the read's
// older snapshot cannot contain the row; judged by it, the tick would read as "was in the
// cloud, now gone" and be deleted.
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

// Two tabs of one account share the store and the cloud. An item a tab picks up from the
// store (saveItems() folds in what other tabs saved) was not seen in the cloud by that tab
// itself, but it is still one another tab has uploaded: an untick there must stick here too.
test('an item picked up from another tab is not put back after that tab unticks it', async () => {
    const storage = createLocalStorage();
    const rows = [];
    const supabase = createFakeSupabase({ rows });
    const { module: tabA } = loadAuthModule({ storage, supabaseClient: supabase });
    const { module: tabB } = loadAuthModule({ storage, supabaseClient: supabase });
    for (const tab of [tabA, tabB]) {
        tab.completedItems = {};
        tab.currentUser = userB;
        await tab.onUserLoggedIn();
    }

    // Tab B ticks X, as toggleComplete does: upload started, then the save.
    tabB.completedItems['X'] = local('from B');
    const uploading = tabB.syncItemToCloud('X', true, 'from B');
    tabB.saveItems(['X']);
    await uploading;
    rows.push(cloudRow('user-b', 'X', 'from B'));

    // Tab A saves something of its own and so takes X in from the store.
    tabA.completedItems['Y'] = local();
    tabA.saveItems(['Y']);
    assert.ok('X' in plain(tabA.completedItems));

    // Tab B unticks X.
    delete tabB.completedItems['X'];
    const deleting = tabB.syncItemToCloud('X', false);
    tabB.saveItems(['X']);
    await deleting;
    rows.splice(rows.findIndex(r => r.item_id === 'X'), 1);
    supabase.upserts.length = 0;

    await tabA.syncCloudProgress();

    assert.ok(!supabase.upserts.some(u => u.row.item_id === 'X'), 'the item B unticked was uploaded again by A');
    assert.ok(!('X' in plain(tabA.completedItems)), 'tab A still holds the item B unticked');
});

// The other side of dropping: a sync in one tab must not wipe a tick another tab has saved
// but not yet uploaded (its upload failed). Here B unticks X and re-ticks it offline; A still
// holds the old, uploaded X and then syncs.
test('a sync does not erase another tab’s re-tick that has not reached the cloud yet', async () => {
    const storage = createLocalStorage();
    const rows = [cloudRow('user-b', 'X', 'old')];
    const supabase = createFakeSupabase({ rows });
    const { module: tabA } = loadAuthModule({ storage, supabaseClient: supabase });
    const { module: tabB } = loadAuthModule({ storage, supabaseClient: supabase });
    for (const tab of [tabA, tabB]) {
        tab.completedItems = {};
        tab.currentUser = userB;
        await tab.onUserLoggedIn();
    }

    // B unticks X: the row goes.
    delete tabB.completedItems['X'];
    const deleting = tabB.syncItemToCloud('X', false);
    tabB.saveItems(['X']);
    await deleting;
    rows.length = 0;

    // B re-ticks X while offline: saved to the store, the upload fails.
    const realFrom = supabase.from;
    supabase.from = table => ({ ...realFrom(table), upsert: async () => ({ error: { message: 'offline' } }) });
    tabB.completedItems['X'] = { date: '2026-11-02T00:00:00.000Z', note: 're-ticked' };
    const uploading = tabB.syncItemToCloud('X', true, 're-ticked');
    tabB.saveItems(['X']);
    await uploading;
    supabase.from = realFrom;
    supabase.upserts.length = 0;

    await tabA.syncCloudProgress();

    const stored = JSON.parse(storage.getItem('moiCheckState'));
    assert.ok('X' in stored, "A's sync erased B's re-tick from the store");
    assert.equal(stored['X'].note, 're-ticked');
    assert.deepEqual(supabase.upserts.map(u => u.row.item_id), ['X'], "B's re-tick should be uploaded");
});

// markSynced() saves through saveItems(), which folds in anything another tab saved to the
// shared store while the request was in flight. This tab then holds an item it is not
// showing as ticked, and a click on that box would untick it. saveItems() reports it by
// returning true; the callers that drew the list before must redraw it.
test('an upload that returns after another tab saved a tick repaints the list', async () => {
    const storage = createLocalStorage();
    const supabase = createFakeSupabase({ rows: [] });
    const { module: tab, renders } = loadAuthModule({ storage, supabaseClient: supabase });
    tab.completedItems = {};
    tab.currentUser = userB;
    await tab.onUserLoggedIn();
    const repaintsBefore = renders.list;

    // Hold this tab's upload open so the other tab can save while it is in flight.
    let releaseUpload;
    const gate = new Promise(resolve => { releaseUpload = resolve; });
    const realFrom = supabase.from;
    supabase.from = table => ({
        ...realFrom(table),
        upsert: async row => { await gate; return realFrom(table).upsert(row); }
    });

    tab.completedItems['X'] = local('ticked in this tab');
    const uploading = tab.syncItemToCloud('X', true, 'ticked in this tab');

    // Another tab of the same account ticks Y and saves it to the shared store.
    const stored = JSON.parse(storage.getItem('moiCheckState') || '{}');
    stored['Y'] = local('ticked in the other tab');
    storage.setItem('moiCheckState', JSON.stringify(stored));

    releaseUpload();
    await uploading;
    supabase.from = realFrom;

    assert.ok('Y' in plain(tab.completedItems), 'this tab should have taken the other tab’s tick in');
    assert.ok(renders.list > repaintsBefore,
        'this tab holds Y but never redrew, so its box for Y still reads unticked and a click would untick it');
});
