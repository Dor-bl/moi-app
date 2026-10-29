// privacy.html promises that nothing third-party is contacted until the visitor
// opens the Map view (where Leaflet and OpenStreetMap tiles are loaded on demand
// from app.js). This is the cheap, static half of guarding that promise: it fails
// if index.html or privacy.html gains a tag that makes the browser fetch from
// another origin on load, or if styles.css pulls in a remote @import / url().
//
// It cannot see runtime requests (a fetch() or a script injected by JS). Those
// would need a browser-driven test; this catches the common regression of a CDN
// <script>/<link> added to the page head.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

const EXTERNAL = /^(?:https?:)?\/\//i;
// <link rel> values that do not make the browser fetch the target on load.
const NON_FETCHING_REL = /\b(canonical|alternate|author|license|help|next|prev|me)\b/i;

function externalLoads(html) {
    const found = [];
    for (const tag of html.match(/<(?:script|img|iframe|source|video|audio|embed|link)\b[^>]*>/gi) || []) {
        const name = tag.match(/^<(\w+)/)[1].toLowerCase();
        const url = (tag.match(/\s(?:src|href)\s*=\s*["']([^"']+)["']/i) || [])[1];
        if (!url || !EXTERNAL.test(url)) continue;
        if (name === 'link' && NON_FETCHING_REL.test((tag.match(/\srel\s*=\s*["']([^"']+)["']/i) || [])[1] || '')) continue;
        found.push(`${name}: ${url}`);
    }
    return found;
}

for (const file of ['index.html', 'privacy.html']) {
    test(`${file} loads nothing from another origin`, () => {
        assert.deepEqual(externalLoads(read(file)), []);
    });
}

test('styles.css does not import or reference remote resources', () => {
    const css = read('styles.css');
    assert.doesNotMatch(css, /@import\s+(?:url\()?\s*["']?(?:https?:)?\/\//i);
    assert.doesNotMatch(css, /url\(\s*["']?(?:https?:)?\/\//i);
});

test('the guard flags a CDN script and stylesheet but not a canonical link', () => {
    const html = '<link rel="canonical" href="https://x.nl/"><script src="https://unpkg.com/a.js"></script>' +
        '<link rel="stylesheet" href="//cdn.example/a.css">';
    assert.deepEqual(externalLoads(html), ['script: https://unpkg.com/a.js', 'link: //cdn.example/a.css']);
});
