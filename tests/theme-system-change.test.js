// Under the "system" theme option the page's CSS follows the OS live, but
// Google's sign-in button is an iframe drawn in a fixed colour scheme, so
// js/theme.js redraws it when prefers-color-scheme changes — and only while
// no explicit theme is set. Runs the real js/theme.js in node:vm with the DOM
// and matchMedia stubbed.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadTheme({ savedTheme = null, withGoogleButton = true } = {}) {
    const listeners = [];
    const calls = { render: 0 };
    const store = new Map(savedTheme ? [['moiCheckTheme', savedTheme]] : []);
    const root = {
        _attrs: {},
        hasAttribute(n) { return n in this._attrs; },
        setAttribute(n, v) { this._attrs[n] = v; },
        removeAttribute(n) { delete this._attrs[n]; }
    };
    const sandbox = {
        localStorage: {
            getItem: k => (store.has(k) ? store.get(k) : null),
            setItem: (k, v) => store.set(k, String(v)),
            removeItem: k => store.delete(k)
        },
        document: { documentElement: root, querySelectorAll: () => [] },
        window: {
            matchMedia: query => {
                assert.equal(query, '(prefers-color-scheme: dark)');
                return { matches: false, addEventListener: (type, cb) => { assert.equal(type, 'change'); listeners.push(cb); } };
            }
        }
    };
    const context = vm.createContext(sandbox);
    if (withGoogleButton) {
        vm.runInContext('function renderGoogleButton() { globalThis.__calls.render++; }', context);
        sandbox.__calls = calls;
    }
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/theme.js'), 'utf8'), context, { filename: 'js/theme.js' });
    vm.runInContext('globalThis.__initTheme = initTheme; globalThis.__setTheme = setTheme;', context);
    return { initTheme: sandbox.__initTheme, setTheme: sandbox.__setTheme, listeners, calls, root };
}

test('with the system option, an OS theme change redraws Google\'s button', () => {
    const t = loadTheme({ savedTheme: 'system' });
    t.initTheme();
    assert.equal(t.listeners.length, 1, 'one change listener registered at init');
    const before = t.calls.render; // initTheme itself redraws once via applyTheme

    t.listeners[0]();

    assert.equal(t.calls.render, before + 1);
});

test('with an explicit theme, an OS theme change is ignored', () => {
    const t = loadTheme({ savedTheme: 'dark' });
    t.initTheme();
    assert.equal(t.root.hasAttribute('data-theme'), true, 'premise: an explicit theme is set');
    const before = t.calls.render;

    t.listeners[0]();

    assert.equal(t.calls.render, before, 'the page does not follow the OS, so neither should the button');
});

test('switching from an explicit theme back to system makes the listener live again', () => {
    const t = loadTheme({ savedTheme: 'light' });
    t.initTheme();
    t.setTheme('system');
    const before = t.calls.render;

    t.listeners[0]();

    assert.equal(t.calls.render, before + 1);
});

test('a page without the auth module (privacy.html) registers the listener without throwing', () => {
    const t = loadTheme({ savedTheme: 'system', withGoogleButton: false });
    t.initTheme();
    assert.doesNotThrow(() => t.listeners[0]());
});
