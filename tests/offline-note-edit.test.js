// Issue #276: a signed-in user's note edit (or clear) that failed to upload while
// offline must survive the next syncCloudProgress and be uploaded again, instead of
// being replaced by the older cloud note.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAuthModule, createLocalStorage, createFakeSupabase, plain } from './helpers/load-auth.js';

const cloudRow = (user, item, note = '') => ({ user_id: user, item_id: item, date: '2026-10-30T08:00:00.000Z', note });
const userB = { id: 'user-b', email: 'b@example.test' };

async function signedInTab(storage, supabase) {
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });
    tab.completedItems = {};
    tab.currentUser = userB;
    await tab.onUserLoggedIn();
    return tab;
}

// As app.js persistOpenNote does it.
function editNote(tab, id, note) {
    tab.completedItems[id].note = note;
    delete tab.completedItems[id].synced;
    tab.saveItems([id]);
    return tab.syncItemToCloud(id, true, note);
}

for (const newNote of ['NEW', '']) {
    test(`offline note edit to ${JSON.stringify(newNote)} survives the next sync`, { timeout: 5000 }, async () => {
        const storage = createLocalStorage();
        const supabase = createFakeSupabase({ rows: [cloudRow('user-b', '1', 'old note')] });
        const tab = await signedInTab(storage, supabase);
        const realFrom = supabase.from;
        supabase.from = t => ({ ...realFrom(t), upsert: async () => ({ error: { message: 'offline' } }) });
        await editNote(tab, '1', newNote);
        supabase.from = realFrom;
        supabase.upserts.length = 0;

        await tab.syncCloudProgress();

        const entry = plain(tab.completedItems)['1'];
        assert.equal(entry.note, newNote, 'the offline edit was overwritten by the cloud note');
        assert.deepEqual(supabase.upserts.map(u => u.row.note), [newNote], 'the edit should be retried');
        assert.equal(entry.synced, true, 'a successful retry marks the entry synced');
    });
}

test('an unsynced local note equal to the cloud note is marked synced without an upload', { timeout: 5000 }, async () => {
    const storage = createLocalStorage();
    const supabase = createFakeSupabase({ rows: [cloudRow('user-b', '1', 'same')] });
    const tab = await signedInTab(storage, supabase);
    delete tab.completedItems['1'].synced;
    supabase.upserts.length = 0;

    await tab.syncCloudProgress();

    assert.equal(plain(tab.completedItems)['1'].synced, true);
    assert.equal(supabase.upserts.length, 0);
});
