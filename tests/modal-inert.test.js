// Closed modals must stay out of the keyboard tab order. `.modal-overlay` hides a
// closed modal with opacity/pointer-events only, so Settings and Contact carry
// `inert` while closed and app.js lifts it only while they are open (#243).
//
// Prerequisite: run `npx playwright install chromium` on a fresh checkout, or
// point `PW_CHROMIUM_PATH` at an existing Chromium executable.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const REPO_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2'
};

/**
 * Starts a local static server rooted at `REPO_ROOT`, serving an empty config.js
 * so the app runs without Supabase. Paths outside `REPO_ROOT` get a 404.
 *
 * @returns {Promise<import('node:http').Server>} Listening HTTP server instance.
 */
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
            const filePath = path.resolve(REPO_ROOT, '.' + rel);
            if (!filePath.startsWith(REPO_ROOT + path.sep)) {
                res.writeHead(404);
                res.end();
                return;
            }
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

test('closed Settings and Contact modals are inert and never take Tab focus', async () => {
    const server = await startAppServer();
    let browser;
    try {
        browser = await chromium.launch(
            process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}
        );
        const page = await browser.newPage({ viewport: { width: 375, height: 800 } });
        await page.goto(`http://127.0.0.1:${server.address().port}/`);
        await page.waitForSelector('#settingsBtn');

        const isInert = sel => page.evaluate(s => globalThis.document.querySelector(s).hasAttribute('inert'), sel);
        const focusedId = () => page.evaluate(() => globalThis.document.activeElement.id);

        assert.equal(await isInert('#settingsModal'), true);
        assert.equal(await isInert('#contactModal'), true);

        // Tab through the whole page with every modal closed: focus never lands
        // inside closed Settings or Contact. 120 presses is well past the ~40 real stops.
        for (let i = 0; i < 120; i++) {
            await page.keyboard.press('Tab');
            const inClosedModal = await page.evaluate(() => {
                // #authModal is opened from js/auth.js and is out of scope for #243.
                const overlay = globalThis.document.activeElement?.closest('#settingsModal, #contactModal');
                return overlay && !overlay.classList.contains('active') ? overlay.id : null;
            });
            assert.equal(inClosedModal, null, `Tab stop ${i + 1} landed inside closed #${inClosedModal}`);
        }

        // Settings: open lifts inert, × restores it and hands focus back.
        await page.click('#settingsBtn');
        await page.waitForSelector('#settingsModal.active');
        assert.equal(await isInert('#settingsModal'), false);
        await page.focus('#closeSettingsModal');
        await page.keyboard.press('Enter');
        assert.equal(await isInert('#settingsModal'), true);
        assert.equal(await focusedId(), 'settingsBtn');

        // Settings: a click on the backdrop closes it and restores inert too.
        await page.click('#settingsBtn');
        await page.waitForSelector('#settingsModal.active');
        await page.mouse.click(5, 5);
        assert.equal(await page.isVisible('#settingsModal.active'), false);
        assert.equal(await isInert('#settingsModal'), true);

        // Contact: same open/close contract via × and the backdrop.
        await page.click('#contactBtn');
        await page.waitForSelector('#contactModal.active');
        assert.equal(await isInert('#contactModal'), false);
        await page.focus('#closeContactModal');
        await page.keyboard.press('Enter');
        assert.equal(await isInert('#contactModal'), true);
        assert.equal(await focusedId(), 'contactBtn');

        await page.click('#contactBtn');
        await page.waitForSelector('#contactModal.active');
        await page.mouse.click(5, 5);
        assert.equal(await page.isVisible('#contactModal.active'), false);
        assert.equal(await isInert('#contactModal'), true);
    } finally {
        if (browser) await browser.close();
        server.close();
    }
});
