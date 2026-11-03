// Issue #89: the "Download my data" export (GDPR Art. 20). These tests run the
// real buildAccountExport() from js/auth.js (see helpers/load-auth.js), which
// the profile button in app.js turns into a JSON download.

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadAuthModule, createFakeSupabase, plain } from './helpers/load-auth.js';

const GOOGLE_USER = {
    id: 'user-g',
    email: 'g@example.test',
    created_at: '2026-09-01T08:00:00.000Z',
    last_sign_in_at: '2026-09-01T08:00:00.000Z',
    // Signed up by magic link, later used Google: provider keeps the first
    // method, providers lists both.
    app_metadata: { provider: 'email', providers: ['email', 'google'] },
    user_metadata: { full_name: 'Test Person', avatar_url: 'https://example.test/a.png' }
};
const MAGIC_LINK_USER = { id: 'user-m', email: 'm@example.test', app_metadata: { provider: 'email', providers: ['email'] }, user_metadata: {} };

// Returned newest first, as a database may: the export must reorder them.
const ROWS = [
    { user_id: 'user-g', item_id: '2', date: '2026-10-02T10:00:00+00:00', note: null },
    { user_id: 'user-g', item_id: '1', date: '2026-10-01T10:00:00.000Z', note: 'with friends' },
    // Another account's row: must never appear in user-g's export.
    { user_id: 'someone-else', item_id: '1', date: '2026-10-03T10:00:00.000Z', note: 'not yours' }
];

function signedIn(user, supabase) {
    const { module } = loadAuthModule({ supabaseClient: supabase });
    module.currentUser = user;
    return module;
}

test('the export holds the account, and every completed item with a readable title', async () => {
    const module = signedIn(GOOGLE_USER, createFakeSupabase({ rows: ROWS }));

    const out = plain(await module.buildAccountExport());

    assert.deepEqual(out.account, {
        id: 'user-g',
        email: 'g@example.test',
        name: 'Test Person',
        avatar_url: 'https://example.test/a.png',
        sign_in_providers: ['email', 'google'],
        created_at: '2026-09-01T08:00:00.000Z',
        last_sign_in_at: '2026-09-01T08:00:00.000Z'
    });
    assert.deepEqual(out.completed_items, [
        { item_id: '1', title: 'Eat your first Groninger Eierbal', date: '2026-10-01T10:00:00.000Z', note: 'with friends' },
        { item_id: '2', title: 'Climb the Martinitoren', date: '2026-10-02T10:00:00+00:00', note: '' }
    ]);
    assert.ok(!Number.isNaN(Date.parse(out.exported_at)), 'exported_at is a timestamp');
});

test('titles follow the app language, one language per file', async () => {
    const module = signedIn(GOOGLE_USER, createFakeSupabase({ rows: ROWS }));
    module.currentLang = 'nl';

    const out = plain(await module.buildAccountExport());

    assert.equal(out.completed_items[0].title, 'Eet je eerste Groningse Eierbal');
});

test('an account without a Google profile exports nulls rather than inventing a name', async () => {
    const module = signedIn(MAGIC_LINK_USER, createFakeSupabase({ rows: [] }));

    const out = plain(await module.buildAccountExport());

    assert.equal(out.account.name, null);
    assert.equal(out.account.avatar_url, null);
    assert.deepEqual(out.account.sign_in_providers, ['email']);
    assert.deepEqual(out.completed_items, []);
});

test('a failed read throws instead of returning an incomplete file', async () => {
    const module = signedIn(GOOGLE_USER, createFakeSupabase({ selectError: new Error('network down') }));

    await assert.rejects(module.buildAccountExport(), /network down/);
});

test('a result that arrives after sign-out is discarded', async () => {
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const slowSupabase = {
        from: () => ({
            select: () => ({
                eq: async () => {
                    await gate;
                    return { data: ROWS.filter(r => r.user_id === 'user-g'), error: null };
                }
            })
        })
    };
    const module = signedIn(GOOGLE_USER, slowSupabase);

    const pending = module.buildAccountExport();
    module.bumpAuthGeneration(); // what sign-out does while the request is in flight
    release();

    assert.equal(await pending, null);
});

test('signing out clears a failed export\'s message, so the next account does not see it', () => {
    const exportDataError = { textContent: 'Could not load your data.' };
    const { module } = loadAuthModule({
        overrides: { document: { getElementById: id => (id === 'exportDataError' ? exportDataError : null) } }
    });
    module.currentUser = GOOGLE_USER;

    module.onUserLoggedOut();

    assert.equal(exportDataError.textContent, '');
});

test('the unsynced warning fires only when the screen and the exported rows differ', () => {
    const { module } = loadAuthModule({});
    const exported = [{ item_id: '1', note: 'with friends' }, { item_id: '2', note: '' }];

    assert.equal(module.exportMissesLocalChanges(exported, { 1: { note: 'with friends' }, 2: { note: '' } }), false);
    // A note edit that never reached the cloud.
    assert.equal(module.exportMissesLocalChanges(exported, { 1: { note: 'edited' }, 2: { note: '' } }), true);
    // A completion that never reached the cloud.
    assert.equal(module.exportMissesLocalChanges(exported, { 1: { note: 'with friends' }, 2: {}, 3: { note: '' } }), true);
    // An un-complete that never reached the cloud.
    assert.equal(module.exportMissesLocalChanges(exported, { 1: { note: 'with friends' } }), true);
});
