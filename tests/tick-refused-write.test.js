// When the browser refuses to save progress (storage full), saveItems() throws by
// design and keeps the change pending for the next save that works. The tick and the
// note edit must still show for this session: the card was left unticked while the
// tick sat in memory, so the next click on the box unticked it, and an edited note
// kept the detail modal from closing at all.
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

test('a tick and a note edit still show when the progress write is refused', async () => {
    const server = await startAppServer();
    let browser;
    try {
        browser = await chromium.launch(
            process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}
        );
        const page = await browser.newPage();
        // Storage full: reads work, and so do the small preference keys, but writing
        // the progress is refused.
        await page.addInitScript(() => {
            const setItem = globalThis.Storage.prototype.setItem;
            globalThis.Storage.prototype.setItem = function (key, value) {
                if (key === 'moiCheckState') {
                    throw new globalThis.DOMException('The quota has been exceeded.', 'QuotaExceededError');
                }
                return setItem.call(this, key, value);
            };
        });
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.goto(`http://127.0.0.1:${server.address().port}/`);
        await page.waitForSelector('.bucket-card .checkbox');
        const id = await page.locator('.bucket-card').first().getAttribute('data-id');
        const card = page.locator(`.bucket-card[data-id="${id}"]`);

        await card.locator('.checkbox').click();
        assert.equal(await card.evaluate(el => el.classList.contains('completed')), true, 'the card shows the tick');
        assert.match(await page.textContent('#progressCount'), /^1\b/, 'the progress counts it');

        await page.waitForTimeout(800); // the ticked card re-sorts after the confetti
        await card.click({ position: { x: 150, y: 10 } });
        await page.waitForSelector('#detailModal.active');
        await page.fill('#memoryNote', 'written while storage is full');
        await page.click('#closeDetailModal');
        assert.equal(await page.locator('#detailModal.active').count(), 0, 'the modal closes');

        assert.deepEqual(errors, [], 'no uncaught error');
    } finally {
        if (browser) await browser.close();
        server.close();
    }
});
