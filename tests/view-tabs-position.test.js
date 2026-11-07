// The List / Map / Events / Memories tabs used to sit below the progress bar,
// which the Events and Memories views hide, so the tabs jumped up on every
// switch. They now sit above it. This pins that: the tab row must keep the
// same position in every view, at phone and desktop widths.
//
// Loads the real index.html + styles.css without app.js and flips
// body[data-active-view] directly, which is all switchView() does to layout.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const REPO_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const VIEWS = ['list', 'map', 'events', 'memories'];

test('view tabs keep the same position in every view', async () => {
    const [html, css] = await Promise.all([
        readFile(path.join(REPO_ROOT, 'index.html'), 'utf8'),
        readFile(path.join(REPO_ROOT, 'styles.css'), 'utf8'),
    ]);
    // Drop scripts and external stylesheets so the page is layout-only.
    const markup = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<link[^>]*>/gi, '');

    const browser = await chromium.launch(
        process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {},
    );
    try {
        for (const width of [375, 1024]) {
            const page = await browser.newPage({ viewport: { width, height: 800 } });
            await page.setContent(markup);
            await page.addStyleTag({ content: css });

            const tops = {};
            for (const view of VIEWS) {
                // Runs in the browser context, not Node.
                /* eslint-disable no-undef */
                tops[view] = await page.evaluate(v => {
                    document.body.dataset.activeView = v;
                    const rect = document.querySelector('.view-toggle-container').getBoundingClientRect();
                    return { top: rect.top, left: rect.left };
                }, view);
                /* eslint-enable no-undef */
            }
            await page.close();

            for (const view of VIEWS) {
                assert.deepEqual(
                    tops[view],
                    tops.list,
                    `tabs moved in "${view}" view at ${width}px: ${JSON.stringify(tops)}`,
                );
            }
        }
    } finally {
        await browser.close();
    }
});
