// A signed-in user edits a memory note while the browser refuses to save progress.
// persistOpenNote (app.js) keeps the edit pending and still uploads it; when the upload
// succeeds, markSynced must keep the edit, not take the older stored note for another
// tab's newer save. These run the real js/auth.js and js/utils.js (see
// helpers/load-auth.js); the two calls below are what persistOpenNote makes.

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadAuthModule, createLocalStorage, createFakeSupabase, plain } from './helpers/load-auth.js';

test('a signed-in note edit whose local save was refused survives its upload', async () => {
    const storage = createLocalStorage({
        moiCheckState: JSON.stringify({ '5': { date: '2026-10-30T08:00:00.000Z', note: 'old', synced: true } }),
        moiCheckSyncedUser: 'user-b'
    });
    const setItem = storage.setItem;
    storage.setItem = (key, value) => {
        if (key === 'moiCheckState') throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
        setItem(key, value);
    };
    const supabase = createFakeSupabase();
    const { module: tab } = loadAuthModule({ storage, supabaseClient: supabase });
    tab.completedItems = JSON.parse(storage.getItem('moiCheckState'));
    tab.currentUser = { id: 'user-b', email: 'b@example.test' };

    const entry = tab.completedItems['5'];
    entry.note = 'new';
    delete entry.synced;
    assert.throws(() => tab.saveItems(['5']), /quota/);
    await tab.syncItemToCloud('5', true, 'new');

    assert.deepEqual(supabase.upserts.map(u => [u.row.item_id, u.row.note]), [['5', 'new']]);
    assert.equal(plain(tab.completedItems)['5'].note, 'new', 'the edit is not replaced by the stored "old"');
});
