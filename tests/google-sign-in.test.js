// Google sign-in on the app's own origin (PR #187). These tests run the real
// js/auth.js through helpers/load-auth.js with Google Identity Services,
// crypto and the DOM stubbed, and cover the four things that would otherwise
// only be found by hand: the nonce handoff, the ID-token exchange, the
// no-client-ID fallback, and the retry after a blocked script.

import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import { loadAuthModule, createFakeSupabase, plain } from './helpers/load-auth.js';

const CLIENT_ID = '123-abc.apps.googleusercontent.com';

// The three elements the flow touches, plus a documentElement for the theme
// check. Each remembers enough for an assertion.
function createElements() {
    const el = (extra = {}) => ({
        style: { display: '' },
        innerHTML: '',
        classList: { _set: new Set(['active']), add(c) { this._set.add(c); }, remove(c) { this._set.delete(c); }, contains(c) { return this._set.has(c); } },
        ...extra
    });
    return {
        googleSignInContainer: el(),
        googleAuthBtn: el(),
        authModal: el()
    };
}

// `googleScript` controls what happens when auth.js appends the GIS <script>:
// 'ok' installs the stub and fires onload, 'fail' fires onerror.
function createBrowser({ googleScript = 'ok' } = {}) {
    const elements = createElements();
    const gis = { inits: [], renders: [], scriptLoads: 0 };
    // `sandbox.googleScript` is read at load time, so a test can flip it
    // between opens: blocked first, available on the retry.
    const sandbox = { gis, elements, googleScript };

    const installGoogle = () => {
        sandbox.window.google = { accounts: { id: {
            initialize(cfg) { gis.inits.push(cfg); },
            renderButton(container, opts) { gis.renders.push({ container, opts }); container.innerHTML = '<iframe>'; }
        } } };
    };

    sandbox.document = {
        getElementById: id => elements[id] || null,
        documentElement: {
            _attrs: {},
            getAttribute(n) { return this._attrs[n] ?? null; },
            hasAttribute(n) { return n in this._attrs; },
            setAttribute(n, v) { this._attrs[n] = v; },
            removeAttribute(n) { delete this._attrs[n]; }
        },
        createElement: () => ({}),
        head: {
            appendChild(script) {
                gis.scriptLoads++;
                assert.equal(script.src, 'https://accounts.google.com/gsi/client', 'the script auth.js appends is the GIS client');
                // Async like a real network load: the caller is awaiting a promise.
                setTimeout(() => {
                    if (sandbox.googleScript === 'ok') { installGoogle(); script.onload(); } else { script.onerror(); }
                }, 0);
            }
        }
    };
    sandbox.crypto = globalThis.crypto;
    sandbox.TextEncoder = TextEncoder;
    // app.js owns the sheet's close (and the focus hand-off); here it only has
    // to take the sheet down so the tests below can see it closed.
    sandbox.closeAuthModal = () => elements.authModal.classList.remove('active');
    sandbox.window = {
        GOOGLE_CLIENT_ID: CLIENT_ID,
        crypto: globalThis.crypto,
        matchMedia: () => ({ matches: false })
    };
    return sandbox;
}

const sha256 = text => createHash('sha256').update(text).digest('hex');
const tick = () => new Promise(resolve => setTimeout(resolve, 5));

test('opening the dialog loads Google\'s script once, hands initialize a hashed nonce, and swaps the buttons', async () => {
    const browser = createBrowser();
    const { module } = loadAuthModule({ supabaseClient: createFakeSupabase(), overrides: browser });

    await module.initGoogleSignIn();

    assert.equal(browser.gis.scriptLoads, 1);
    assert.equal(browser.gis.inits.length, 1);
    const init = browser.gis.inits[0];
    assert.equal(init.client_id, CLIENT_ID);
    assert.match(module.googleNonce, /^[0-9a-f]{64}$/, 'the raw nonce is 32 random bytes as hex');
    assert.equal(init.nonce, sha256(module.googleNonce), 'Google is given the SHA-256 of the raw nonce, which Supabase recomputes from the raw value');
    assert.equal(typeof init.callback, 'function');

    assert.equal(browser.gis.renders.length, 1, 'the button is rendered once');
    assert.equal(browser.elements.googleAuthBtn.style.display, 'none', 'the custom button is hidden');
    assert.equal(browser.elements.googleSignInContainer.style.display, 'flex', 'Google\'s container is shown');

    // Reopening the dialog must not fetch or initialise again.
    await module.initGoogleSignIn();
    assert.equal(browser.gis.scriptLoads, 1);
    assert.equal(browser.gis.inits.length, 1);
});

test('a credential from Google is exchanged with Supabase using the raw nonce, then the dialog closes', async () => {
    const browser = createBrowser();
    const supabase = createFakeSupabase();
    const calls = [];
    supabase.auth.signInWithIdToken = async args => { calls.push(args); return { data: { session: {} }, error: null }; };
    const { module } = loadAuthModule({ supabaseClient: supabase, overrides: browser });
    await module.initGoogleSignIn();

    await browser.gis.inits[0].callback({ credential: 'ID.TOKEN.JWT' });

    assert.equal(calls.length, 1);
    assert.deepEqual(plain(calls[0]), { provider: 'google', token: 'ID.TOKEN.JWT', nonce: module.googleNonce });
    assert.equal(sha256(calls[0].nonce), browser.gis.inits[0].nonce, 'what Supabase receives hashes to what Google embedded');
    assert.equal(browser.elements.authModal.classList.contains('active'), false, 'the auth modal is closed');
});

test('a rejected token is surfaced without logging the token and leaves the dialog open', async () => {
    const browser = createBrowser();
    const supabase = createFakeSupabase();
    supabase.auth.signInWithIdToken = async () => ({ data: {}, error: { status: 400, code: 'bad_id_token', message: 'Invalid ID token' } });
    const alerts = [];
    browser.alert = msg => alerts.push(msg);
    const logged = [];
    browser.console = { ...console, error: (...args) => logged.push(args) };
    const { module } = loadAuthModule({ supabaseClient: supabase, overrides: browser });
    await module.initGoogleSignIn();

    await browser.gis.inits[0].callback({ credential: 'ID.TOKEN.JWT' });

    assert.deepEqual(alerts, ['Invalid ID token']);
    assert.equal(browser.elements.authModal.classList.contains('active'), true);
    assert.ok(!JSON.stringify(logged).includes('ID.TOKEN.JWT'), 'the token never reaches the console');
});

test('without a client ID nothing is fetched and the redirect-based button is untouched (control)', async () => {
    const browser = createBrowser();
    browser.window.GOOGLE_CLIENT_ID = '';
    const { module } = loadAuthModule({ supabaseClient: createFakeSupabase(), overrides: browser });

    await module.initGoogleSignIn();

    assert.equal(browser.gis.scriptLoads, 0);
    assert.equal(browser.gis.inits.length, 0);
    assert.equal(browser.elements.googleAuthBtn.style.display, '', 'custom button still shown');
    assert.equal(browser.elements.googleSignInContainer.style.display, '', 'container untouched (hidden by its markup)');
    assert.equal(module.googleSignInStarted, false);
});

test('a blocked script leaves the fallback in place and allows a retry on the next open', async () => {
    const browser = createBrowser({ googleScript: 'fail' });
    const warnings = [];
    browser.console = { ...console, warn: (...args) => warnings.push(args.join(' ')) };
    const { module } = loadAuthModule({ supabaseClient: createFakeSupabase(), overrides: browser });

    await module.initGoogleSignIn();
    await tick();

    assert.equal(browser.gis.scriptLoads, 1);
    assert.equal(browser.gis.inits.length, 0, 'never initialised');
    assert.equal(browser.elements.googleAuthBtn.style.display, '', 'custom button still shown');
    assert.equal(module.googleSignInStarted, false, 'the once-guard is released so the next open can try again');
    assert.ok(warnings.some(w => w.includes('using redirect flow')), 'the fallback is logged, not thrown');

    // The next open, with Google reachable again, must fetch and finish.
    browser.googleScript = 'ok';
    await module.initGoogleSignIn();

    assert.equal(browser.gis.scriptLoads, 2, 'a second script request is made');
    assert.equal(browser.gis.inits.length, 1, 'and this time it initialises');
    assert.equal(browser.elements.googleAuthBtn.style.display, 'none', 'custom button hidden');
    assert.equal(browser.elements.googleSignInContainer.style.display, 'flex', 'Google\'s container shown');
    assert.equal(module.googleSignInStarted, true);
});

test('renderGoogleButton follows the current language and theme', async () => {
    const browser = createBrowser();
    const { module } = loadAuthModule({ supabaseClient: createFakeSupabase(), overrides: browser });
    await module.initGoogleSignIn();
    const last = () => browser.gis.renders.at(-1).opts;
    assert.equal(last().locale, 'en');
    assert.equal(last().theme, 'outline');

    browser.document.documentElement.setAttribute('data-theme', 'dark');
    module.renderGoogleButton();
    assert.equal(last().theme, 'filled_black', 'explicit dark theme');

    browser.document.documentElement.removeAttribute('data-theme');
    browser.window.matchMedia = () => ({ matches: true });
    module.renderGoogleButton();
    assert.equal(last().theme, 'filled_black', 'system option follows prefers-color-scheme');

    browser.window.matchMedia = () => ({ matches: false });
    module.renderGoogleButton();
    assert.equal(last().theme, 'outline');

    module.currentLang = 'nl';
    module.renderGoogleButton();
    assert.equal(last().locale, 'nl', 'Dutch UI renders a Dutch button');

    module.currentLang = 'en';
    module.renderGoogleButton();
    assert.equal(last().locale, 'en');
});
