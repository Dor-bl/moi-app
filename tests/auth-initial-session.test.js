// supabase-js emits INITIAL_SESSION to a new onAuthStateChange subscriber, and
// initAuth subscribes only after getSession() has already synced that session,
// so every signed-in load used to run the full cloud sync twice. Runs the real
// js/auth.js.

import test from 'node:test';
import assert from 'node:assert/strict';

import { loadAuthModule, createFakeSupabase } from './helpers/load-auth.js';

const USER_A = { id: 'user-a', email: 'a@example.test' };
const USER_B = { id: 'user-b', email: 'b@example.test' };

async function signedInLoad(window) {
    const supabase = createFakeSupabase({ session: { user: USER_A } });
    const { module, renders } = loadAuthModule({ supabaseClient: supabase, overrides: window ? { window } : {} });
    await module.initAuth();
    return { supabase, module, renders };
}

test('a signed-in page load syncs once, not again on INITIAL_SESSION', async () => {
    const replaced = [];
    const window = { location: { href: 'https://example.test/#', pathname: '/', search: '', hash: '' }, history: { replaceState: (...args) => replaced.push(args) } };
    const { supabase, module, renders } = await signedInLoad(window);
    const generation = module.authGeneration;

    await supabase.emit('INITIAL_SESSION', { user: USER_A });

    assert.equal(renders.list, 1, 'one sync per load');
    assert.equal(module.authGeneration, generation, 'no bump, so in-flight writes still mark themselves synced');
    assert.equal(replaced.length, 1, 'the bare "#" a callback leaves is still cleared');
});

test('TOKEN_REFRESHED still syncs: it is all a tab resuming with an expired token gets', async () => {
    const { supabase, module, renders } = await signedInLoad();
    const refreshed = { ...USER_A };

    await supabase.emit('TOKEN_REFRESHED', { user: refreshed });

    assert.equal(module.currentUser, refreshed);
    assert.equal(renders.list, 2, 'changes made on other devices are pulled on resume');
});

test('a different user still gets a full sync', async () => {
    const { supabase, module, renders } = await signedInLoad();

    await supabase.emit('INITIAL_SESSION', { user: USER_B });

    assert.equal(module.currentUser.id, USER_B.id);
    assert.equal(renders.list, 2);
});
