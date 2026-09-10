// Exercises the contact Edge Function's request handling under Node.
//
// The function targets Deno, which cannot be installed in every environment,
// so the two globals it touches — Deno.serve and Deno.env — are stubbed and the
// handler is driven directly. This covers validation, the honeypot, CORS and
// rate limiting; it does not replace deploying the function, which is the only
// way to check the Resend account, the verified sender domain and the
// platform's own JWT handling.

import test from 'node:test';
import assert from 'node:assert/strict';

let handler;
let resendCalls = [];
let resendBehaviour = () => new Response('{"id":"x"}', { status: 200 });

globalThis.Deno = {
    serve: (h) => { handler = h; },
    env: { get: (k) => (k === 'RESEND_API_KEY' ? 'test-key' : undefined) },
};

const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
    if (String(url).startsWith('https://api.resend.com')) {
        resendCalls.push(JSON.parse(init.body));
        return resendBehaviour();
    }
    return realFetch(url, init);
};

await import('../supabase/functions/contact/index.ts');

const ORIGIN = 'https://moicheck.nl';

function post(body, { origin = ORIGIN, ip = '203.0.113.9' } = {}) {
    const headers = { 'Content-Type': 'application/json', origin };
    if (ip) headers['cf-connecting-ip'] = ip;
    return handler(new Request('https://x.supabase.co/functions/v1/contact', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    }));
}

const valid = {
    name: 'Dor',
    email: 'visitor@example.com',
    subject: 'Say Moi',
    message: 'Moi!',
};

test.beforeEach(() => {
    resendCalls = [];
    resendBehaviour = () => new Response('{"id":"x"}', { status: 200 });
});

test('preflight is answered with CORS headers', async () => {
    const res = await handler(new Request('https://x/', { method: 'OPTIONS', headers: { origin: ORIGIN } }));
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), ORIGIN);
    assert.match(res.headers.get('access-control-allow-headers'), /authorization/);
});

test('a Vercel preview origin is allowed, an unknown one falls back', async () => {
    const preview = 'https://moi-app-git-something-blayzer.vercel.app';
    const ok = await handler(new Request('https://x/', { method: 'OPTIONS', headers: { origin: preview } }));
    assert.equal(ok.headers.get('access-control-allow-origin'), preview);

    const bad = await handler(new Request('https://x/', { method: 'OPTIONS', headers: { origin: 'https://evil.example' } }));
    assert.equal(bad.headers.get('access-control-allow-origin'), ORIGIN);
});

test('GET is rejected', async () => {
    const res = await handler(new Request('https://x/', { method: 'GET', headers: { origin: ORIGIN } }));
    assert.equal(res.status, 405);
});

test('a valid submission reaches Resend addressed to the project inbox', async () => {
    const res = await post(valid);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
    assert.equal(resendCalls.length, 1);
    assert.deepEqual(resendCalls[0].to, ['hallo@moicheck.nl']);
    // Replying in the inbox must answer the visitor, not ourselves.
    assert.equal(resendCalls[0].reply_to, 'visitor@example.com');
    assert.match(resendCalls[0].subject, /^\[MoiCheck Feedback\] Say Moi$/);
    assert.match(resendCalls[0].text, /Moi!/);
});

test('a filled honeypot looks like success and sends nothing', async () => {
    const res = await post({ ...valid, website: 'http://spam.example' });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
    assert.equal(resendCalls.length, 0, 'honeypot submissions must not be relayed');
});

test('missing and malformed fields are refused', async () => {
    const cases = [
        { ...valid, name: '' },
        { ...valid, message: '   ' },
        { ...valid, email: 'not-an-email' },
        { ...valid, subject: 'Something we never offer' },
        { ...valid, message: 'x'.repeat(5001) },
    ];
    // A distinct address per case: the rate limit is applied before validation,
    // so reusing one would answer 429 partway through and prove nothing about
    // the validation itself.
    for (const [i, body] of cases.entries()) {
        const res = await post(body, { ip: `192.0.2.${i + 1}` });
        assert.equal(res.status, 400, 'expected 400 for ' + JSON.stringify(body).slice(0, 60));
    }
    assert.equal(resendCalls.length, 0);
});

test('invalid JSON is refused rather than thrown', async () => {
    const res = await handler(new Request('https://x/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', origin: ORIGIN, 'cf-connecting-ip': '203.0.113.10' },
        body: 'not json',
    }));
    assert.equal(res.status, 400);
});

test('one address is rate limited after a burst', async () => {
    const ip = '198.51.100.7';
    const codes = [];
    for (let i = 0; i < 5; i++) codes.push((await post(valid, { ip })).status);
    assert.deepEqual(codes.slice(0, 3), [200, 200, 200]);
    assert.equal(codes[4], 429, 'a burst from one address should be slowed');
});

test('requests with no usable address are not funnelled into one bucket', async () => {
    // The regression the reviewer caught: bucketing these together let a few
    // header-less callers lock each other out.
    const codes = [];
    for (let i = 0; i < 6; i++) codes.push((await post(valid, { ip: null })).status);
    assert.ok(codes.every((c) => c === 200), 'expected all 200, got ' + codes);
});

test('a transport failure to Resend is a controlled 502 with CORS headers', async () => {
    resendBehaviour = () => { throw new TypeError('socket hang up'); };
    const res = await post(valid, { ip: '198.51.100.44' });
    assert.equal(res.status, 502);
    assert.equal(res.headers.get('access-control-allow-origin'), ORIGIN);
    assert.match((await res.json()).error, /Could not send/);
});

test('a rejection from Resend is a 502 that leaks nothing to the visitor', async () => {
    resendBehaviour = () => new Response('domain not verified', { status: 403 });
    const res = await post(valid, { ip: '198.51.100.45' });
    assert.equal(res.status, 502);
    const body = await res.json();
    assert.doesNotMatch(JSON.stringify(body), /domain not verified/);
});
