// On sign-in, an item the account already holds takes the account's row - except for a
// memory note the account does not have. A guest who ticked an item and wrote a note
// before signing in, into an account that has the tick but no note, used to lose the
// note: the cloud row replaced the local entry wholesale and nothing uploaded it. Now the
// note is kept and uploaded. When both sides have a note the account's still wins, and
// a note on an entry already marked synced is still cleared when the cloud's is empty,
// because that means it was cleared on another device. These run the real js/auth.js
// (see helpers/load-auth.js).

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadAuthModule, createLocalStorage, createFakeSupabase, plain } from './helpers/load-auth.js';

const local = (note = '') => ({ date: '2026-11-01T00:00:00.000Z', note });
const cloudRow = (user, item, note = '') => ({ user_id: user, item_id: item, date: '2026-10-30T08:00:00.000Z', note });
const userB = { id: 'user-b', email: 'b@example.test' };

test('a guest note is kept and uploaded when the account has the item but no note', async () => {
    const storage = createLocalStorage();
    const supabase = createFakeSupabase({ rows: [cloudRow('user-b', '5', '')] });
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });

    tab.completedItems = { '5': local('the eierbal was still hot') };
    tab.currentUser = userB;
    await tab.onUserLoggedIn();

    const entry = plain(tab.completedItems)['5'];
    assert.equal(entry.note, 'the eierbal was still hot', 'the guest note was replaced by the empty cloud note');
    assert.equal(entry.date, '2026-10-30T08:00:00.000Z', 'everything but the note still comes from the account');
    assert.equal(entry.synced, true, 'marked synced once the upload went through');
    assert.deepEqual(supabase.upserts.map(u => [u.row.user_id, u.row.item_id, u.row.note]),
        [['user-b', '5', 'the eierbal was still hot']], 'the note must reach the account');
    assert.equal(JSON.parse(storage.getItem('moiCheckState'))['5'].note, 'the eierbal was still hot');
});

test('when both sides have a note, the account’s wins and nothing is uploaded', async () => {
    const storage = createLocalStorage();
    const supabase = createFakeSupabase({ rows: [cloudRow('user-b', '5', 'from my phone')] });
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });

    tab.completedItems = { '5': local('as a guest') };
    tab.currentUser = userB;
    await tab.onUserLoggedIn();

    assert.equal(plain(tab.completedItems)['5'].note, 'from my phone');
    assert.deepEqual(supabase.upserts, []);
});

test('a note on an entry already synced is still cleared when the cloud note is empty', async () => {
    const storage = createLocalStorage();
    const supabase = createFakeSupabase({ rows: [cloudRow('user-b', '5', '')] });
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });

    // Synced earlier with this note; another device has since cleared it in the cloud.
    tab.completedItems = { '5': { ...local('cleared elsewhere'), synced: true } };
    tab.currentUser = userB;
    await tab.onUserLoggedIn();

    assert.equal(plain(tab.completedItems)['5'].note, '', 'the clearing made elsewhere must stand');
    assert.deepEqual(supabase.upserts, []);
});

test('a blank guest note is not carried, and the account’s row is taken whole', async () => {
    const storage = createLocalStorage();
    const supabase = createFakeSupabase({ rows: [cloudRow('user-b', '5', '')] });
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });

    tab.completedItems = { '5': local('   ') };
    tab.currentUser = userB;
    await tab.onUserLoggedIn();

    assert.equal(plain(tab.completedItems)['5'].note, '');
    assert.equal(plain(tab.completedItems)['5'].synced, true);
    assert.deepEqual(supabase.upserts, []);
});

test('a carried note whose upload fails stays unsynced, and the next sync carries it again', async () => {
    const storage = createLocalStorage();
    const supabase = createFakeSupabase({ rows: [cloudRow('user-b', '5', '')] });
    // First upsert fails, later ones succeed: the fake has no switch for this, so wrap it.
    let failNext = true;
    const realFrom = supabase.from.bind(supabase);
    supabase.from = table => {
        const api = realFrom(table);
        const realUpsert = api.upsert;
        api.upsert = async rows => {
            if (failNext) { failNext = false; return { error: { message: 'network' } }; }
            return realUpsert(rows);
        };
        return api;
    };
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });

    tab.completedItems = { '5': local('keep me') };
    tab.currentUser = userB;
    await tab.onUserLoggedIn();

    let entry = plain(tab.completedItems)['5'];
    assert.equal(entry.note, 'keep me', 'the note is kept even though the upload failed');
    assert.equal(entry.synced, undefined, 'not marked synced after a failed upload');
    assert.deepEqual(supabase.upserts, [], 'nothing recorded by the failed attempt');

    await tab.syncCloudProgress();

    entry = plain(tab.completedItems)['5'];
    assert.equal(entry.synced, true, 'the retry marked it synced');
    assert.deepEqual(supabase.upserts.map(u => [u.row.item_id, u.row.note]), [['5', 'keep me']]);
});
