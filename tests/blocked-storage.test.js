// With site data blocked, Chromium throws a SecurityError on any touch of
// `localStorage`. The boot-time reads in app.js and js/theme.js run at the top
// level of classic scripts, so one throw there stopped the whole script and the
// page rendered with an empty list. Blocked storage must cost persistence, not
// the app: the list still draws, in the default language and theme.
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

// Static server rooted at REPO_ROOT, with an empty config.js so the app runs
// without Supabase (same as tests/modal-inert.test.js).
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

test('the app still renders its list when localStorage throws on access', async () => {
    const server = await startAppServer();
    let browser;
    try {
        browser = await chromium.launch(
            process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}
        );
        const page = await browser.newPage();
        // What a blocked-site-data browser does: the property getter itself throws.
        await page.addInitScript(() => {
            Object.defineProperty(globalThis, 'localStorage', {
                configurable: true,
                get() {
                    throw new DOMException('Access is denied for this document.', 'SecurityError');
                }
            });
        });
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.goto(`http://127.0.0.1:${server.address().port}/`);
        await page.waitForLoadState('load');

        const cards = await page.locator('#listContainer > *').count();
        assert.deepEqual(errors, [], 'no uncaught error at boot');
        assert.ok(cards > 0, 'the bucket list rendered');
        assert.equal(await page.evaluate(() => globalThis.document.documentElement.lang), 'en');
        assert.equal(
            await page.evaluate(() => globalThis.document.documentElement.hasAttribute('data-theme')),
            false,
            'system theme'
        );
    } finally {
        if (browser) await browser.close();
        server.close();
    }
});
