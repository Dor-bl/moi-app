// privacy.html has to agree with itself.
//
// PR #146 added a section and renumbered five others, and across two days of
// review the policy drifted six times: each time a fact landed in one place and
// a sentence elsewhere in the same document did not move. Reviewers caught all
// six; CI caught none. The one claim that never drifted was the region, because
// tests/contact-region.test.js makes three files agree on it.
//
// This does the same for the parts of the policy that can be checked
// mechanically, and only those:
//
//   - sections are numbered 1..n, with no gap and no repeat;
//   - every "section N" or "§N" the policy cites is a section that exists;
//   - every processor §2 names is placed somewhere in §3, which is where the
//     policy says where each one handles data and what covers it.
//
// It cannot check meaning. A cross-reference can point at a section that exists
// and still be the wrong one, and §3 can name a provider while saying something
// false about it. What this catches is the structural half of the drift — a
// renumbering that leaves a reference dangling, a processor added to §2 and
// never accounted for in §3 — so review can spend its attention on the half no
// test can reach.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const policy = fs.readFileSync(path.join(ROOT, 'privacy.html'), 'utf8');

const headings = [...policy.matchAll(/<h2>(\d+)\. ([^<]*)<\/h2>/g)].map(m => ({
    number: Number(m[1]),
    title: m[2],
}));

const sectionBody = number => {
    const match = policy.match(new RegExp(`<h2>${number}\\. [^<]*</h2>([\\s\\S]*?)</section>`));
    return match ? match[1] : null;
};

test('privacy.html numbers its sections 1..n with no gap or repeat', () => {
    assert.ok(headings.length > 0, 'privacy.html has no numbered <h2> sections; if the markup changed, point this test at the new shape');
    const numbers = headings.map(h => h.number);
    const expected = numbers.map((_, i) => i + 1);
    assert.deepEqual(
        numbers,
        expected,
        `section headings run ${numbers.join(', ')} but should run ${expected.join(', ')}. A renumbering left a gap or a repeat — and every "section N" elsewhere, in this file and in the docs that cite it, may now point at the wrong place`
    );
});

test('every section privacy.html cites exists', () => {
    const existing = new Set(headings.map(h => h.number));
    const cited = [...policy.matchAll(/(?:section|§)\s?(\d+)/gi)].map(m => Number(m[1]));
    assert.ok(cited.length > 0, 'privacy.html cites no sections at all, which is not what it looked like when this test was written; check the regex still matches how the policy refers to itself');
    const dangling = [...new Set(cited.filter(n => !existing.has(n)))];
    assert.deepEqual(
        dangling,
        [],
        `privacy.html cites section ${dangling.join(', ')}, which does not exist (sections run 1–${Math.max(...existing)}). A section was removed or renumbered and a reference to it did not move`
    );
});

test('every processor §2 names is accounted for in §3', () => {
    const who = sectionBody(2);
    const where = sectionBody(3);
    assert.ok(who, 'privacy.html has no section 2; if "Who processes your data" moved, point this test at it');
    assert.ok(where, 'privacy.html has no section 3; if "Where your data is processed" moved, point this test at it');

    // §2 labels each processor as <li><strong>Name</strong>, and groups the
    // map's three sources under one label ("OpenStreetMap, Leaflet and unpkg").
    // Split those so each is checked on its own.
    const processors = [...who.matchAll(/<li><strong>([^<]+)<\/strong>/g)]
        .flatMap(m => m[1].split(/,\s*|\s+and\s+/))
        .map(name => name.trim())
        .filter(Boolean);
    assert.ok(processors.length > 0, 'found no <li><strong>Name</strong> entries in section 2; if the list markup changed, point this test at the new shape');

    const missing = processors.filter(name => !where.includes(name));
    assert.deepEqual(
        missing,
        [],
        `section 2 names ${missing.join(', ')} as handling visitors' data, but section 3 never mentions ${missing.length === 1 ? 'it' : 'them'}. Section 3 is where the policy says where each processor handles data and what covers any transfer out of the EU — a processor listed in one and absent from the other is the drift this PR series kept finding by hand`
    );
});
