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
    for (const tag of html.match(/<(?:script|img|iframe|source|video|audio|embed|link|input|object)\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi) || []) {
        const name = tag.match(/^<(\w+)/)[1].toLowerCase();
        // A link is exempt only if every rel token is non-fetching ("canonical stylesheet" still loads).
        if (name === 'link' && (attr(tag, 'rel') || '').toLowerCase().split(/\s+/).every((t) => NON_FETCHING_REL.has(t))) continue;
        for (const a of ['src', 'href', 'poster', 'srcset', 'data']) {
            const value = attr(tag, a);
            if (!value) continue;
            // srcset is a comma-separated list of "url [descriptor]" candidates.
            const urls = a === 'srcset' ? value.split(',').map((c) => c.trim().split(/\s+/)[0]) : [value];
            for (const url of urls) if (EXTERNAL.test(url)) found.push(`${name}: ${url}`);
        }
    }
    return found;
}

// Remote @import / url() in CSS text. Run over styles.css and over the whole HTML,
// which covers <style> blocks and style="" attributes.
const REMOTE_CSS = [/@import\s+(?:url\()?\s*["']?(?:https?:)?\/\//i, /url\(\s*["']?(?:https?:)?\/\//i];
const remoteCss = (text) => REMOTE_CSS.some((re) => re.test(text));

for (const file of ['index.html', 'privacy.html']) {
    test(`${file} loads nothing from another origin`, () => {
        assert.deepEqual(externalLoads(read(file)), []);
        assert.equal(remoteCss(read(file)), false);
    });
}

test('styles.css does not import or reference remote resources', () => {
    assert.equal(remoteCss(read('styles.css')), false);
});

test('the guard flags input/object loads and remote CSS in <style> and style=""', () => {
    assert.deepEqual(externalLoads('<input type="image" src="https://cdn.example/b.png"><object data="//cdn.example/f"></object>'),
        ['input: https://cdn.example/b.png', 'object: //cdn.example/f']);
    assert.equal(remoteCss('<style>body{background:url(https://cdn.example/a.png)}</style>'), true);
    assert.equal(remoteCss('<div style="background: url(\'//cdn.example/a.png\')">'), true);
    assert.equal(remoteCss('<div style="background: url(assets/a.png)">'), false);
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
