// Runs the shipped js/error-reporter.js in a node:vm scope with stubbed browser
// globals and checks what it would send. The privacy claims in privacy.html
// (no query or fragment, no email, no token, no session) are what these
// assertions protect; the rest keeps a looping error from flooding the table.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = fs.readFileSync(path.join(ROOT, 'js/error-reporter.js'), 'utf8');

function load({ hostname = 'moicheck.nl', url = 'https://example.supabase.co', key = 'sb_publishable_abc' } = {}) {
    const listeners = {};
    const requests = [];
    const window = {
        SUPABASE_URL: url,
        SUPABASE_ANON_KEY: key,
        location: { hostname, pathname: '/' },
        addEventListener: (type, fn) => { listeners[type] = fn; },
    };
    const context = vm.createContext({
        window,
        navigator: { userAgent: 'TestBrowser/1.0' },
        fetch: (target, init) => {
            requests.push({ url: target, init, body: JSON.parse(init.body) });
            return Promise.resolve({ ok: true });
        },
        Error,
        Number,
        String,
        Set,
        JSON,
    });
    vm.runInContext(SOURCE, context, { filename: 'js/error-reporter.js' });
    return { listeners, requests, window };
}

test('reports an uncaught error to the client_errors table', () => {
    const { listeners, requests } = load();
    const error = new Error('boom');
    listeners.error({ message: 'Uncaught Error: boom', filename: 'https://moicheck.nl/app.js?v=2', lineno: 10, colno: 4, error });

    assert.equal(requests.length, 1);
    const { url, init, body } = requests[0];
    assert.equal(url, 'https://example.supabase.co/rest/v1/client_errors');
    assert.equal(init.method, 'POST');
    assert.equal(init.headers.apikey, 'sb_publishable_abc');
    assert.equal(init.headers.Authorization, undefined, 'a report must never carry the user session');
    assert.equal(body.message, 'Uncaught Error: boom');
    assert.equal(body.source, 'https://moicheck.nl/app.js', 'query string is dropped from the script URL');
    assert.equal(body.line, 10);
    assert.equal(body.col, 4);
    assert.equal(body.page, '/');
    assert.equal(body.user_agent, 'TestBrowser/1.0');
});

test('scrubs email addresses and tokens from every text field', () => {
    const { listeners, requests } = load();
    listeners.error({
        message: 'Failed for jan@example.nl with access_token=abc.def',
        filename: '',
        error: { message: 'x', stack: 'at https://moicheck.nl/#refresh_token=xyz eyJhbGc.eyJzdWI.sig sb_publishable_secretish' },
    });

    const { body } = requests[0];
    assert.doesNotMatch(JSON.stringify(body), /jan@example\.nl|abc\.def|xyz|eyJhbGc|sb_publishable_secretish/);
    assert.match(body.message, /\[email\]/);
    assert.match(body.message, /access_token=\[redacted\]/);
});

test('scrubs any token-like URL parameter, including the magic-link token_hash', () => {
    const { listeners, requests } = load();
    const url = 'https://moicheck.nl/?token_hash=TH1&type=magiclink#provider_token=PT1&provider_refresh_token=PR1&client_secret=CS1&page=2';
    listeners.error({ message: `Failed to load ${url}`, filename: '', error: { stack: `at ${url}` } });

    const { body } = requests[0];
    for (const secret of ['TH1', 'PT1', 'PR1', 'CS1']) {
        assert.doesNotMatch(JSON.stringify(body), new RegExp(secret), `${secret} leaked`);
    }
    // Control: ordinary parameters survive, so the scrubber is not just eating everything.
    assert.match(body.message, /type=magiclink/);
    assert.match(body.message, /page=2/);
});

test('sends only the page path, never the query or fragment', () => {
    const { listeners, requests, window } = load();
    window.location.pathname = '/privacy.html';
    window.location.search = '?code=secret';
    window.location.hash = '#access_token=secret';
    listeners.error({ message: 'boom', filename: 'https://moicheck.nl/app.js' });
    assert.equal(requests[0].body.page, '/privacy.html');
});

test('reports unhandled promise rejections', () => {
    const { listeners, requests } = load();
    listeners.unhandledrejection({ reason: new Error('network down') });
    listeners.unhandledrejection({ reason: 'plain string' });
    assert.deepEqual(requests.map(r => r.body.message), [
        'Unhandled rejection: network down',
        'Unhandled rejection: plain string',
    ]);
});

test('sends each message once and at most five per page load', () => {
    const { listeners, requests } = load();
    for (let i = 0; i < 3; i++) listeners.error({ message: 'same', filename: 'https://moicheck.nl/app.js' });
    for (let i = 0; i < 10; i++) listeners.error({ message: `different ${i}`, filename: 'https://moicheck.nl/app.js' });
    assert.equal(requests.length, 5);
    assert.equal(requests.filter(r => r.body.message === 'same').length, 1);
});

test('ignores browser extensions and opaque cross-origin "Script error."', () => {
    const { listeners, requests } = load();
    listeners.error({ message: 'ext', filename: 'chrome-extension://abc/content.js' });
    listeners.error({ message: 'Script error.', filename: '' });
    assert.equal(requests.length, 0);
});

test('stays off on localhost and when Supabase is not configured', () => {
    assert.deepEqual(Object.keys(load({ hostname: 'localhost' }).listeners), []);
    assert.deepEqual(Object.keys(load({ url: '' }).listeners), []);
    assert.deepEqual(Object.keys(load({ key: '' }).listeners), []);
});
