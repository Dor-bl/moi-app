// saveState() overwrites the stored progress: the sign-in sync after its merge, and the
// resets on sign-out and account deletion. When the browser refuses that write (storage
// full), the in-memory state is still right, and what follows the save must still run:
// the sync's upload, the rest of the sign-out. A refused write used to throw out of the
// caller instead. These run the real js/auth.js and js/utils.js (see helpers/load-auth.js).

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadAuthModule, createLocalStorage, createFakeSupabase, plain } from './helpers/load-auth.js';

const SYNCED_USER_KEY = 'moiCheckSyncedUser';
const userB = { id: 'user-b', email: 'b@example.test' };

// Storage that is readable and writable except for the progress itself, the key that
// grows: the other keys are short and still fit.
function storageRefusingProgress(seed = {}) {
    const storage = createLocalStorage(seed);
    const setItem = storage.setItem;
    storage.setItem = (key, value) => {
        if (key === 'moiCheckState') throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
        setItem(key, value);
    };
    return storage;
}

test('a refused progress write on sign-in still uploads the guest ticks', async () => {
    const storage = storageRefusingProgress();
    const supabase = createFakeSupabase({
        rows: [{ user_id: 'user-b', item_id: '5', date: '2026-10-30T08:00:00.000Z', note: '' }]
    });
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });

    tab.completedItems = { '7': { date: '2026-11-01T00:00:00.000Z', note: 'as a guest' } };
    tab.currentUser = userB;
    await tab.onUserLoggedIn();

    assert.deepEqual(supabase.upserts.map(u => [u.row.user_id, u.row.item_id, u.row.note]),
        [['user-b', '7', 'as a guest']], 'the guest tick must reach the account');
    assert.deepEqual(Object.keys(plain(tab.completedItems)).sort(), ['5', '7'], 'this tab holds both');
});

test('a refused progress write on sign-out still finishes the sign-out', () => {
    const storage = storageRefusingProgress({
        moiCheckState: JSON.stringify({ '5': { date: '2026-10-30T08:00:00.000Z', note: '' } }),
        [SYNCED_USER_KEY]: 'user-b'
    });
    const { module: tab, renders } = loadAuthModule({ storage });
    tab.completedItems = { '5': { date: '2026-10-30T08:00:00.000Z', note: '' } };
    tab.currentUser = userB;

    assert.doesNotThrow(() => tab.onUserLoggedOut());

    assert.deepEqual(plain(tab.completedItems), {});
    assert.equal(storage.getItem(SYNCED_USER_KEY), null, 'the account marker is cleared');
    assert.equal(storage.getItem('moiCheckState'), null, 'the account’s progress does not stay behind');
    assert.ok(renders.list > 0, 'the list is redrawn empty');
});

test('after a refused sign-out write and a reload, another account gets none of the old notes', async () => {
    const storage = storageRefusingProgress({
        moiCheckState: JSON.stringify({ '5': { date: '2026-10-30T08:00:00.000Z', note: 'private to b' } }),
        [SYNCED_USER_KEY]: 'user-b'
    });
    // Not yet uploaded (a failed upload, or written offline): the case a sync would upload.
    const { module: before } = loadAuthModule({ storage });
    before.completedItems = { '5': { date: '2026-10-30T08:00:00.000Z', note: 'private to b' } };
    before.currentUser = userB;
    before.onUserLoggedOut();

    // Reload: app.js reads the store into completedItems, then another account signs in.
    const supabase = createFakeSupabase({ rows: [] });
    const { module: after } = loadAuthModule({ storage, supabaseClient: supabase });
    after.completedItems = JSON.parse(storage.getItem('moiCheckState')) || {};
    after.currentUser = { id: 'user-c', email: 'c@example.test' };
    await after.onUserLoggedIn();

    assert.deepEqual(supabase.upserts, [], 'nothing of user-b’s reaches user-c');
    assert.deepEqual(plain(after.completedItems), {});
});

test('a refused write on an account switch does not leave the old account’s progress stored', async () => {
    const storage = storageRefusingProgress({
        moiCheckState: JSON.stringify({ '5': { date: '2026-10-30T08:00:00.000Z', note: 'private to b', synced: true } }),
        [SYNCED_USER_KEY]: 'user-b'
    });
    const supabase = createFakeSupabase({ rows: [] });
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });
    tab.completedItems = JSON.parse(storage.getItem('moiCheckState'));
    tab.currentUser = { id: 'user-c', email: 'c@example.test' };

    await tab.onUserLoggedIn();

    assert.equal(storage.getItem('moiCheckState'), null, 'user-b’s progress is out of the store');
    assert.equal(storage.getItem(SYNCED_USER_KEY), 'user-c');
    assert.deepEqual(supabase.upserts, []);
});

test('a refused write still uploads the guest ticks when a synced item is dropped too', async () => {
    const storage = storageRefusingProgress();
    const supabase = createFakeSupabase({
        rows: [{ user_id: 'user-b', item_id: '5', date: '2026-10-30T08:00:00.000Z', note: '' }]
    });
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });

    tab.completedItems = {
        '7': { date: '2026-11-01T00:00:00.000Z', note: 'as a guest' },
        // Synced earlier and since unticked on another device: the sync drops it.
        '9': { date: '2026-10-01T00:00:00.000Z', note: '', synced: true }
    };
    tab.currentUser = userB;
    await tab.onUserLoggedIn();

    assert.deepEqual(supabase.upserts.map(u => u.row.item_id), ['7'], 'the guest tick must reach the account');
    assert.deepEqual(Object.keys(plain(tab.completedItems)).sort(), ['5', '7']);
});

test('a note edit that was never written is uploaded and kept, not swapped for the stored copy', async () => {
    const storage = storageRefusingProgress({
        moiCheckState: JSON.stringify({ '5': { date: '2026-11-01T00:00:00.000Z', note: 'old' } })
    });
    const supabase = createFakeSupabase({ rows: [] });
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });
    tab.completedItems = JSON.parse(storage.getItem('moiCheckState'));

    // As a guest, the edit's write is refused: it waits as this tab's unsaved change.
    tab.completedItems['5'].note = 'new';
    assert.throws(() => tab.saveItems(['5']), /quota/);

    tab.currentUser = userB;
    await tab.onUserLoggedIn();

    assert.deepEqual(supabase.upserts.map(u => [u.row.item_id, u.row.note]), [['5', 'new']]);
    assert.equal(plain(tab.completedItems)['5'].note, 'new', 'the stored "old" is not taken for a newer edit');
});

test('a refused sign-in merge is not undone by the next save that goes through', async () => {
    const cloudNote = 'the account’s note, longer than the one stored here';
    const merged5 = { date: '2026-10-30T08:00:00.000Z', note: cloudNote, synced: true };
    // Room for the merged item alone, not with the synced item the sync then drops.
    const limit = JSON.stringify({ '5': merged5 }).length + 5;
    const storage = createLocalStorage({
        moiCheckState: JSON.stringify({
            '5': { date: '2026-10-30T08:00:00.000Z', note: 'old', synced: true },
            '9': { date: '2026-10-01T00:00:00.000Z', note: 'unticked on another device', synced: true }
        })
    });
    const setItem = storage.setItem;
    storage.setItem = (key, value) => {
        if (key === 'moiCheckState' && String(value).length > limit) {
            throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
        }
        setItem(key, value);
    };
    const supabase = createFakeSupabase({
        rows: [{ user_id: 'user-b', item_id: '5', date: '2026-10-30T08:00:00.000Z', note: cloudNote }]
    });
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });
    tab.completedItems = JSON.parse(storage.getItem('moiCheckState'));
    tab.currentUser = userB;

    await tab.onUserLoggedIn();

    assert.equal(plain(tab.completedItems)['5'].note, cloudNote, 'this tab keeps the account’s note');
    const stored = JSON.parse(storage.getItem('moiCheckState'));
    assert.equal(stored['5'].note, cloudNote, 'and that is what was written');
    assert.ok(!('9' in stored));
});
