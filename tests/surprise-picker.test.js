// Tests for the "Surprise Me!" random picker:
// 1. pickRandomUncompleted() unit behaviour (excludes completed items, avoids
//    dealing the same card twice in a row when >1 candidate remains, returns the
//    sole remaining item when only 1 is left, and returns null when all are done).
// 2. .surprise-fab contrast in light, dark, and system themes (WCAG AA >= 4.5:1)
//    and view-based visibility (shown in list & map, hidden in events & memories).
// 3. End-to-end interaction in index.html: tapping #surpriseBtn opens #detailModal
//    with an uncompleted item and shows #modalSurpriseBtn, and tapping
//    #modalSurpriseBtn deals a different item.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const REPO_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function loadPicker() {
    const context = vm.createContext({ console, Date, Math, JSON, Set, Object });
    vm.runInContext(fs.readFileSync(path.join(REPO_ROOT, 'js/data.js'), 'utf8'), context, { filename: 'js/data.js' });
    vm.runInContext(fs.readFileSync(path.join(REPO_ROOT, 'js/utils.js'), 'utf8'), context, { filename: 'js/utils.js' });
    vm.runInContext('globalThis.__out = { BUCKET_LIST, UI_TRANSLATIONS, pickRandomUncompleted };', context);
    return context.__out;
}

test('pickRandomUncompleted skips completed items and never repeats avoidId when 2+ remain', () => {
    const { pickRandomUncompleted } = loadPicker();
    const items = [{ id: '1' }, { id: '2' }, { id: '3' }];
    const completed = { '1': { date: '2026-11-08T10:00:00.000Z', note: '' } };

    // With id '1' completed and avoidId '2', only '3' can be picked regardless of rand().
    assert.equal(pickRandomUncompleted(items, completed, '2', () => 0).id, '3');
    assert.equal(pickRandomUncompleted(items, completed, '2', () => 0.999).id, '3');
});

test('pickRandomUncompleted returns the sole remaining item even when it matches avoidId, and null when all are done', () => {
    const { pickRandomUncompleted } = loadPicker();
    const items = [{ id: '1' }, { id: '2' }];

    const oneLeft = { '1': { date: '2026-11-08T10:00:00.000Z', note: '' } };
    assert.equal(pickRandomUncompleted(items, oneLeft, '2', () => 0).id, '2');

    const allDone = {
        '1': { date: '2026-11-08T10:00:00.000Z', note: '' },
        '2': { date: '2026-11-08T10:00:00.000Z', note: '' }
    };
    assert.equal(pickRandomUncompleted(items, allDone, null, () => 0), null);
});

test('surprise translations exist in both EN and NL', () => {
    const { UI_TRANSLATIONS } = loadPicker();
    for (const lang of ['en', 'nl']) {
        assert.ok(UI_TRANSLATIONS[lang].surpriseMe, `missing surpriseMe in ${lang}`);
        assert.ok(UI_TRANSLATIONS[lang].surpriseAnother, `missing surpriseAnother in ${lang}`);
    }
});

function relativeLuminance([r, g, b]) {
    const [rs, gs, bs] = [r, g, b].map(channel => {
        const c = channel / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(rgbA, rgbB) {
    const lA = relativeLuminance(rgbA) + 0.05;
    const lB = relativeLuminance(rgbB) + 0.05;
    return lA > lB ? lA / lB : lB / lA;
}

function parseRgb(colorString) {
    const match = colorString.match(/rgba?\(([^)]+)\)/);
    assert.ok(match, `expected an rgb()/rgba() color, got "${colorString}"`);
    const [r, g, b] = match[1].split(',').map(part => parseFloat(part.trim()));
    return [r, g, b];
}

test('surprise-fab stays legible in light, dark, and system themes and hides on events/memories views', async () => {
    const css = await readFile(path.join(REPO_ROOT, 'styles.css'), 'utf8');
    let browser;
    try {
        browser = await chromium.launch(
            process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}
        );

        const cases = [
            { label: 'explicit dark theme', themeAttr: 'dark', colorScheme: 'dark' },
            { label: 'system theme, OS set to dark', themeAttr: null, colorScheme: 'dark' },
            { label: 'explicit light theme', themeAttr: 'light', colorScheme: 'light' },
            { label: 'system theme, OS set to light', themeAttr: null, colorScheme: 'light' }
        ];

        for (const { label, themeAttr, colorScheme } of cases) {
            const context = await browser.newContext({ colorScheme });
            try {
                const page = await context.newPage();
                await page.setContent(`<!doctype html>
<html${themeAttr ? ` data-theme="${themeAttr}"` : ''}>
<head><style>${css}</style></head>
<body data-active-view="list">
    <main>
        <button type="button" class="surprise-fab" id="surpriseBtn">
            <span id="txtSurpriseMe">Surprise me</span>
        </button>
    </main>
</body>
</html>`);

                /* eslint-disable no-undef */
                const info = await page.evaluate(() => {
                    const fab = document.getElementById('surpriseBtn');
                    const style = getComputedStyle(fab);
                    const colors = { background: style.backgroundColor, color: style.color, position: style.position };
                    const displayByView = {};
                    for (const view of ['list', 'map', 'events', 'memories']) {
                        document.body.dataset.activeView = view;
                        displayByView[view] = getComputedStyle(fab).display;
                    }
                    return { colors, displayByView };
                });
                /* eslint-enable no-undef */

                assert.equal(info.colors.position, 'fixed');
                assert.equal(info.displayByView.list, 'flex');
                assert.equal(info.displayByView.map, 'flex');
                assert.equal(info.displayByView.events, 'none');
                assert.equal(info.displayByView.memories, 'none');

                const ratio = contrastRatio(parseRgb(info.colors.background), parseRgb(info.colors.color));

                assert.ok(
                    ratio >= 4.5,
                    `${label}: surprise-fab contrast ratio ${ratio.toFixed(2)}:1 is below WCAG AA (4.5:1) — ` +
                    `background ${info.colors.background}, text ${info.colors.color}`
                );
            } finally {
                await context.close();
            }
        }
    } finally {
        if (browser) await browser.close();
    }
});

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2'
};

function startAppServer() {
    const server = http.createServer(async (req, res) => {
        try {
            const url = new URL(req.url, 'http://localhost');
            const rel = url.pathname === '/' ? '/index.html' : url.pathname;
            if (rel === '/config.js') {
                res.writeHead(200, { 'Content-Type': 'application/javascript' });
                res.end('');
                return;
            }
            const filePath = path.join(REPO_ROOT, rel);
            const data = await readFile(filePath);
            res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
            res.end(data);
        } catch {
            res.writeHead(404);
            res.end();
        }
    });
    return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

test('clicking Surprise me FAB opens a random uncompleted item and Pick another deals a different one across EN and NL', async () => {
    const server = await startAppServer();
    let browser;
    try {
        const port = server.address().port;
        browser = await chromium.launch(
            process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}
        );
        const page = await browser.newPage({ viewport: { width: 375, height: 800 } });
        await page.goto(`http://127.0.0.1:${port}/`);

        // Click "Surprise me" FAB
        await page.click('#surpriseBtn');
        await page.waitForSelector('#detailModal.active');

        const firstTitle = await page.textContent('#modalTitle');
        assert.ok(firstTitle && firstTitle.length > 0);
        const rerollVisible = await page.isVisible('#modalSurpriseBtn');
        assert.equal(rerollVisible, true);
        assert.equal(await page.textContent('#modalSurpriseBtn'), 'Pick another 🎲');

        // Click "Pick another 🎲" — must deal a different item
        await page.click('#modalSurpriseBtn');
        const secondTitle = await page.textContent('#modalTitle');
        assert.notEqual(secondTitle, firstTitle);

        // Close modal, switch to NL in settings, and verify NL translations
        await page.click('#closeDetailModal');
        await page.click('#settingsBtn');
        await page.click('.lang-option-btn[data-lang="nl"]');
        await page.click('#closeSettingsModal');

        assert.equal(await page.textContent('#txtSurpriseMe'), 'Verras mij');
        await page.click('#surpriseBtn');
        assert.equal(await page.textContent('#modalSurpriseBtn'), 'Kies een andere 🎲');
    } finally {
        if (browser) await browser.close();
        await new Promise(resolve => server.close(resolve));
    }
});
