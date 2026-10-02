// Issue #84: /.well-known/security.txt must stay valid.
//
// RFC 9116 treats a security.txt whose Expires has passed as invalid, and
// nothing about an expired file looks broken from the outside — it just stops
// counting. This is the reminder: it fails CI two weeks before the date so the
// renewal is a one-line PR rather than a lapse nobody notices. Renew by moving
// Expires forward (RFC 9116 recommends less than a year ahead).
//
// It also checks the fields the RFC requires and the vercel.json entry that
// serves the file as text/plain. Whether Vercel actually sends that header is
// a property of the live deploy: `curl -sI https://moicheck.nl/.well-known/security.txt`.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (...parts) => fs.readFileSync(path.join(ROOT, ...parts), 'utf8');

const fields = read('.well-known', 'security.txt')
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => {
        const i = line.indexOf(':');
        return [line.slice(0, i).trim().toLowerCase(), line.slice(i + 1).trim()];
    });
const values = name => fields.filter(([k]) => k === name).map(([, v]) => v);

const DAY = 24 * 60 * 60 * 1000;

test('security.txt has at least one Contact', () => {
    assert.ok(values('contact').length >= 1);
    for (const contact of values('contact')) {
        assert.match(contact, /^(mailto:|https:\/\/|tel:)/);
    }
});

test('security.txt has exactly one Expires, not about to lapse and under a year out', () => {
    const expires = values('expires');
    assert.equal(expires.length, 1);
    const when = Date.parse(expires[0]);
    assert.ok(!Number.isNaN(when), `unparseable Expires: ${expires[0]}`);
    const left = when - Date.now();
    assert.ok(left > 14 * DAY, `security.txt expires ${expires[0]} — move Expires forward`);
    assert.ok(left < 366 * DAY, `Expires ${expires[0]} is more than a year out (RFC 9116 §2.5.5)`);
});

test('security.txt points at SECURITY.md and is canonical on moicheck.nl', () => {
    assert.ok(fs.existsSync(path.join(ROOT, 'SECURITY.md')));
    assert.deepEqual(values('policy'), ['https://github.com/Dor-bl/moi-app/blob/main/SECURITY.md']);
    assert.deepEqual(values('canonical'), ['https://moicheck.nl/.well-known/security.txt']);
    assert.deepEqual(values('preferred-languages'), ['en, nl']);
});

test('vercel.json serves security.txt as text/plain', () => {
    const { headers } = JSON.parse(read('vercel.json'));
    const rule = headers.find(h => h.source === '/.well-known/security.txt');
    assert.ok(rule, 'no headers entry for /.well-known/security.txt');
    const type = rule.headers.find(h => h.key.toLowerCase() === 'content-type');
    assert.match(type?.value ?? '', /^text\/plain/);
});
