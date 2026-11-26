// A failed sign-in (expired magic link, denied OAuth) comes back with the
// error in the URL. initAuth shows it once and must then take it out of the
// address bar: a guest has no session, so nothing else clears it, and every
// reload would show the same alert again.

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAuthModule, createFakeSupabase } from './helpers/load-auth.js';

function pageAt(href) {
    const url = new URL(href);
    const replaced = [];
    const window = {
        location: { href: url.href, pathname: url.pathname, search: url.search, hash: url.hash },
        history: { replaceState: (state, title, next) => replaced.push(next) }
    };
    return { window, replaced };
}

test('an auth error in the hash is shown once and removed from the URL', async () => {
    const { window, replaced } = pageAt('https://example.test/?view=list#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');
    const alerts = [];
    const { module } = loadAuthModule({
        supabaseClient: createFakeSupabase({ session: null }),
        overrides: { window, alert: message => alerts.push(message) }
    });

    await module.initAuth();

    assert.equal(alerts.length, 1);
    assert.match(alerts[0], /Email link is invalid or has expired/);
    assert.deepEqual(replaced, ['/?view=list'], 'error hash dropped, unrelated query kept');
});

test('an auth error in the query string is removed too, keeping other params', async () => {
    const { window, replaced } = pageAt('https://example.test/?error=access_denied&error_description=Denied&view=map');
    const { module } = loadAuthModule({
        supabaseClient: createFakeSupabase({ session: null }),
        overrides: { window, alert: () => {} }
    });

    await module.initAuth();

    assert.deepEqual(replaced, ['/?view=map']);
});

test('a URL with no auth error is left alone', async () => {
    const { window, replaced } = pageAt('https://example.test/?view=map');
    const alerts = [];
    const { module } = loadAuthModule({
        supabaseClient: createFakeSupabase({ session: null }),
        overrides: { window, alert: message => alerts.push(message) }
    });

    await module.initAuth();

    assert.equal(alerts.length, 0);
    assert.deepEqual(replaced, []);
});
