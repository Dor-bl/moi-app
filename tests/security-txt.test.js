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

test('security.txt Contact is our reporting address', () => {
    assert.deepEqual(values('contact'), ['mailto:hallo@moicheck.nl']);
});

test('security.txt has exactly one Expires, not about to lapse and under a year out', () => {
    const expires = values('expires');
    assert.equal(expires.length, 1);
    // RFC 9116 §2.5.5 requires an RFC 3339 date-time. Date.parse alone would
    // also accept "Thu, 30 Sep 2027 ..." or a bare date, which crawlers reject.
    assert.match(expires[0], /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/,
        `Expires must be an RFC 3339 date-time: ${expires[0]}`);
    const when = Date.parse(expires[0]);
    assert.ok(!Number.isNaN(when), `unparseable Expires: ${expires[0]}`);
    // Date.parse rolls impossible days over ("2027-02-30" becomes 2 March), so
    // check the written day exists in its month.
    const [y, m, d] = expires[0].slice(0, 10).split('-').map(Number);
    assert.equal(new Date(Date.UTC(y, m - 1, d)).getUTCDate(), d, `Expires is not a real date: ${expires[0]}`);
    assert.ok(when - Date.now() > 14 * DAY, `security.txt expires ${expires[0]} — move Expires forward`);
    // A calendar year rather than 365 days, so a renewal to the same date next
    // year still passes when that span includes 29 February.
    const yearOut = new Date();
    yearOut.setUTCFullYear(yearOut.getUTCFullYear() + 1);
    assert.ok(when < yearOut.getTime(), `Expires ${expires[0]} is not under a year out (RFC 9116 §2.5.5 recommends less than a year)`);
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
    assert.equal(type?.value, 'text/plain; charset=utf-8');
});
