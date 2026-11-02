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
const NON_FETCHING_REL = new Set(['canonical', 'alternate', 'author', 'license', 'help', 'next', 'prev', 'me']);
// Attribute value: double-quoted, single-quoted or unquoted.
const attr = (tag, name) => {
    const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
    return m ? (m[1] ?? m[2] ?? m[3]).trim() : undefined;
};

function externalLoads(html) {
    const found = [];
    // Quote-aware: a ">" inside a quoted attribute value does not end the tag.
    for (const tag of html.match(/<(?:script|img|iframe|source|video|audio|embed|link)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi) || []) {
        const name = tag.match(/^<(\w+)/)[1].toLowerCase();
        // A link is exempt only if every rel token is non-fetching ("canonical stylesheet" still loads).
        if (name === 'link' && (attr(tag, 'rel') || '').toLowerCase().split(/\s+/).every((t) => NON_FETCHING_REL.has(t))) continue;
        for (const a of ['src', 'href', 'poster', 'srcset']) {
            const value = attr(tag, a);
            if (!value) continue;
            // srcset is a comma-separated list of "url [descriptor]" candidates.
            const urls = a === 'srcset' ? value.split(',').map((c) => c.trim().split(/\s+/)[0]) : [value];
            for (const url of urls) if (EXTERNAL.test(url)) found.push(`${name}: ${url}`);
        }
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

test('the guard flags remote srcset and poster candidates', () => {
    const html = '<img src="a.png" srcset="b.png 1x, https://unpkg.com/c.png 2x"><video poster="//cdn.example/p.jpg"></video>';
    assert.deepEqual(externalLoads(html), ['img: https://unpkg.com/c.png', 'video: //cdn.example/p.jpg']);
});

test('the guard flags unquoted and padded URLs and mixed link relations', () => {
    const html = '<script src=https://unpkg.com/a.js></script><script src=" https://unpkg.com/b.js "></script>' +
        '<link rel="canonical stylesheet" href="https://cdn.example/a.css">';
    assert.deepEqual(externalLoads(html), ['script: https://unpkg.com/a.js', 'script: https://unpkg.com/b.js', 'link: https://cdn.example/a.css']);
});

test('a ">" inside a quoted attribute does not hide a later external URL', () => {
    const html = '<img alt="A > B" src="https://cdn.example/a.png"><script alt=\'x > y\' src="https://unpkg.com/a.js"></script>';
    assert.deepEqual(externalLoads(html), ['img: https://cdn.example/a.png', 'script: https://unpkg.com/a.js']);
});

test('the guard flags a CDN script and stylesheet but not a canonical link', () => {
    const html = '<link rel="canonical" href="https://x.nl/"><script src="https://unpkg.com/a.js"></script>' +
        '<link rel="stylesheet" href="//cdn.example/a.css">';
    assert.deepEqual(externalLoads(html), ['script: https://unpkg.com/a.js', 'link: //cdn.example/a.css']);
});
