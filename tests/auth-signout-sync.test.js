// Issue #52: signing out used to leave completedItems and moiCheckState in the
// browser, so the next account to sign in on a shared device inherited the
// previous user's ticks and notes and syncCloudProgress uploaded them under the
// new user id. These tests run the real js/auth.js (see helpers/load-auth.js).

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadAuthModule, createLocalStorage, createFakeSupabase, plain } from './helpers/load-auth.js';

const USER_A = { id: 'user-a', email: 'a@example.test' };
const USER_B = { id: 'user-b', email: 'b@example.test' };

const A_PROGRESS = {
    'item-1': { date: '2025-08-01T10:00:00.000Z', note: 'private note from A' },
    'item-2': { date: '2025-08-02T10:00:00.000Z', note: '' }
};

// A browser where user A signed in, synced, and ticked things.
function browserAfterUserA() {
    return createLocalStorage({
        moiCheckState: JSON.stringify(A_PROGRESS),
        moiCheckSyncedUser: USER_A.id,
        moiCheckLang: 'nl',
        moiCheckTheme: 'dark'
    });
}

test('sign-out clears the progress the signed-out account left in this browser', () => {
    const storage = browserAfterUserA();
    const { module, renders } = loadAuthModule({ storage });
    module.completedItems = { ...A_PROGRESS };
    module.currentUser = USER_A;

    module.onUserLoggedOut();

    assert.deepEqual(plain(module.completedItems), {});
    assert.equal(storage.getItem('moiCheckState'), '{}');
    assert.equal(storage.getItem('moiCheckSyncedUser'), null);
    assert.equal(renders.list, 1, 'the list is re-rendered so the UI matches the cleared state');
    assert.equal(renders.progress, 1);
});

test('sign-out keeps device preferences, which are settings rather than personal data', () => {
    const storage = browserAfterUserA();
    const { module } = loadAuthModule({ storage });
    module.completedItems = { ...A_PROGRESS };

    module.onUserLoggedOut();

    assert.equal(storage.getItem('moiCheckLang'), 'nl');
    assert.equal(storage.getItem('moiCheckTheme'), 'dark');
});

test('guest progress made before any sign-in still merges into the account', async () => {
    const guestProgress = { 'item-9': { date: '2025-09-01T09:00:00.000Z', note: 'ticked while signed out' } };
    const storage = createLocalStorage({ moiCheckState: JSON.stringify(guestProgress) });
    const supabase = createFakeSupabase({ rows: [] });
    const { module } = loadAuthModule({ storage, supabaseClient: supabase });
    module.completedItems = { ...guestProgress };
    module.currentUser = USER_B;

    await module.syncCloudProgress();

    assert.deepEqual(plain(module.completedItems), guestProgress, 'guest ticks survive the sync');
    assert.equal(supabase.upserts.length, 1);
    assert.deepEqual(plain(supabase.upserts[0].row), {
        user_id: USER_B.id,
        item_id: 'item-9',
        note: 'ticked while signed out',
        date: '2025-09-01T09:00:00.000Z'
    });
    assert.equal(storage.getItem('moiCheckSyncedUser'), USER_B.id);
});

test('progress left by a previous account is dropped, not uploaded under the new user', async () => {
    const storage = browserAfterUserA();
    const bRows = [{ user_id: USER_B.id, item_id: 'item-7', date: '2025-09-02T08:00:00.000Z', note: "B's own note" }];
    const supabase = createFakeSupabase({ rows: bRows });
    const { module } = loadAuthModule({ storage, supabaseClient: supabase });
    module.completedItems = { ...A_PROGRESS };
    module.currentUser = USER_B;

    await module.syncCloudProgress();

    assert.deepEqual(supabase.upserts, [], "none of A's items are written to B's account");
    assert.deepEqual(plain(module.completedItems), {
        'item-7': { date: '2025-09-02T08:00:00.000Z', note: "B's own note" }
    }, 'B ends up with only their own cloud rows');
    assert.equal(storage.getItem('moiCheckSyncedUser'), USER_B.id);
});

test('signing back in as the same account keeps local progress and uploads what the cloud is missing', async () => {
    const storage = browserAfterUserA();
    const cloudRows = [{ user_id: USER_A.id, item_id: 'item-1', date: '2025-08-01T10:00:00.000Z', note: 'private note from A' }];
    const supabase = createFakeSupabase({ rows: cloudRows });
    const { module } = loadAuthModule({ storage, supabaseClient: supabase });
    module.completedItems = { ...A_PROGRESS };
    module.currentUser = USER_A;

    await module.syncCloudProgress();

    assert.deepEqual(Object.keys(plain(module.completedItems)).sort(), ['item-1', 'item-2']);
    assert.equal(supabase.upserts.length, 1, 'only the item the cloud does not have yet');
    assert.equal(supabase.upserts[0].row.item_id, 'item-2');
});

test('a session that ended while the tab was closed leaves no progress behind on the next load', async () => {
    const storage = browserAfterUserA();
    const supabase = createFakeSupabase({ session: null });
    const { module } = loadAuthModule({ storage, supabaseClient: supabase });
    module.completedItems = { ...A_PROGRESS };

    await module.initAuth();

    assert.deepEqual(plain(module.completedItems), {});
    assert.equal(storage.getItem('moiCheckState'), '{}');
    assert.equal(storage.getItem('moiCheckSyncedUser'), null);
});

test('a guest browser with no synced-user marker is left alone on load', async () => {
    const guestProgress = { 'item-9': { date: '2025-09-01T09:00:00.000Z', note: '' } };
    const storage = createLocalStorage({ moiCheckState: JSON.stringify(guestProgress) });
    const supabase = createFakeSupabase({ session: null });
    const { module } = loadAuthModule({ storage, supabaseClient: supabase });
    module.completedItems = { ...guestProgress };

    await module.initAuth();

    assert.deepEqual(plain(module.completedItems), guestProgress);
    assert.equal(storage.getItem('moiCheckState'), JSON.stringify(guestProgress));
});

test('SIGNED_OUT clears progress even when this tab never had a user set', async () => {
    const storage = createLocalStorage();
    const supabase = createFakeSupabase({ session: null });
    const { module } = loadAuthModule({ storage, supabaseClient: supabase });

    await module.initAuth();

    // Another tab signed in and synced; this tab still has currentUser === null.
    storage.setItem('moiCheckSyncedUser', USER_A.id);
    storage.setItem('moiCheckState', JSON.stringify(A_PROGRESS));
    module.completedItems = { ...A_PROGRESS };

    await supabase.emit('SIGNED_OUT', null);

    assert.equal(module.currentUser, null);
    assert.deepEqual(plain(module.completedItems), {});
    assert.equal(storage.getItem('moiCheckState'), '{}');
    assert.equal(storage.getItem('moiCheckSyncedUser'), null);
});
