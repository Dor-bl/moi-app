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

// As app.js persistOpenNote does it for a signed-in user.
function editNote(tab, id, note) {
    tab.completedItems[id].note = note;
    delete tab.completedItems[id].synced;
    tab.completedItems[id].noteEdited = true;
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
        assert.equal(entry.noteEdited, undefined, 'and clears the pending-edit mark');
    });
}

test('an unsynced local note equal to the cloud note is marked synced without an upload', { timeout: 5000 }, async () => {
    const storage = createLocalStorage();
    const supabase = createFakeSupabase({ rows: [cloudRow('user-b', '1', 'same')] });
    const tab = await signedInTab(storage, supabase);
    delete tab.completedItems['1'].synced;
    tab.completedItems['1'].noteEdited = true;
    supabase.upserts.length = 0;

    await tab.syncCloudProgress();

    assert.equal(plain(tab.completedItems)['1'].synced, true);
    assert.equal(supabase.upserts.length, 0);
});

// Review on #277: the account marker is written before the cloud read, so a failed first
// read used to make the next sync treat guest entries as this account's own edits. A guest
// tick with no note then uploaded '' over the account's memory. Guest rules must hold
// until one merge has succeeded.
test('a failed first read does not let a guest tick erase the account note on retry', { timeout: 5000 }, async () => {
    const storage = createLocalStorage();
    const supabase = createFakeSupabase({ rows: [cloudRow('user-b', '1', 'memory')] });
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });
    tab.completedItems = { '1': { date: '2026-11-01T00:00:00.000Z', note: '' } };
    tab.currentUser = userB;
    const realFrom = supabase.from;
    supabase.from = t => ({ ...realFrom(t), select: () => ({ eq: async () => ({ data: null, error: { message: 'offline' } }) }) });
    await tab.onUserLoggedIn();
    supabase.from = realFrom;

    await tab.syncCloudProgress();

    assert.equal(plain(tab.completedItems)['1'].note, 'memory');
    assert.deepEqual(supabase.upserts.map(u => u.row.note), []);
});

// Review on #277: a note edited while the first sign-in read is still in flight is a
// signed-in edit too. If its upload fails, the cloud row arriving afterwards must not
// replace it.
test('a note edited during the first sign-in read survives a failed upload', { timeout: 5000 }, async () => {
    const storage = createLocalStorage();
    const supabase = createFakeSupabase({ rows: [cloudRow('user-b', '1', 'old note')] });
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });
    tab.completedItems = { '1': { date: '2026-11-01T00:00:00.000Z', note: '' } };
    tab.currentUser = userB;
    const realFrom = supabase.from;
    let releaseRead;
    const readGate = new Promise(resolve => { releaseRead = resolve; });
    supabase.from = t => ({
        ...realFrom(t),
        select: () => ({ eq: async (c, v) => { await readGate; return realFrom(t).select().eq(c, v); } }),
        upsert: async () => ({ error: { message: 'offline' } })
    });
    const signIn = tab.onUserLoggedIn();
    await editNote(tab, '1', 'NEW');
    releaseRead();
    await signIn;

    const entry = plain(tab.completedItems)['1'];
    assert.equal(entry.note, 'NEW', 'the edit was replaced by the cloud note');
    assert.equal(entry.noteEdited, true, 'still pending, so the next sync retries it');
});

// Review on #277: a carried guest note whose upload failed is still guest progress, not a
// signed-in edit. If the account gains a note meanwhile (another device), the retry keeps
// the account's note, as the guest rules say.
test('a carried guest note that failed to upload does not overwrite a later account note', { timeout: 5000 }, async () => {
    const storage = createLocalStorage();
    const rows = [cloudRow('user-b', '1', '')];
    const supabase = createFakeSupabase({ rows });
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });
    tab.completedItems = { '1': { date: '2026-11-01T00:00:00.000Z', note: 'guest memory' } };
    tab.currentUser = userB;
    const realFrom = supabase.from;
    supabase.from = t => ({ ...realFrom(t), upsert: async () => ({ error: { message: 'offline' } }) });
    await tab.onUserLoggedIn();
    supabase.from = realFrom;
    rows[0].note = 'from another device';

    await tab.syncCloudProgress();

    assert.equal(plain(tab.completedItems)['1'].note, 'from another device');
    assert.deepEqual(supabase.upserts.map(u => u.row.note), []);
});

// Review on #277: older builds stored a carried guest note whose upload failed as
// `synced: false`. After an update such an entry is still guest progress, so a note the
// account has gained since keeps winning.
test('a guest note stored as synced: false by an older build does not overwrite the account note', { timeout: 5000 }, async () => {
    const storage = createLocalStorage();
    const supabase = createFakeSupabase({ rows: [cloudRow('user-b', '1', 'from another device')] });
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });
    tab.completedItems = { '1': { date: '2026-11-01T00:00:00.000Z', note: 'guest memory', synced: false } };
    tab.currentUser = userB;
    storage.setItem('moiCheckSyncedUser', 'user-b');

    await tab.syncCloudProgress();

    assert.equal(plain(tab.completedItems)['1'].note, 'from another device');
    assert.deepEqual(supabase.upserts.map(u => u.row.note), []);
});
