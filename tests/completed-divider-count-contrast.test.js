// The "N left" pill in .completed-divider-count paired --text-light on top of
// --border-color. In dark mode that combination (#94A3B8 on #334155) only
// reaches ~4.04:1, below the WCAG AA 4.5:1 threshold for normal-size text —
// caught by an automated accessibility scan of the deployed app, not by eye.
// The fix swaps the pill's background to --card-bg, which clears AA in both
// themes; this test pins that contrast so it can't regress back to
// --border-color (or drift some other way) unnoticed.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const REPO_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

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

async function readPillColors(browser, css, themeAttr, colorScheme) {
    const context = await browser.newContext({ colorScheme });
    try {
        const page = await context.newPage();
        await page.setContent(`<!doctype html>
<html${themeAttr ? ` data-theme="${themeAttr}"` : ''}>
<body>
    <button class="completed-divider">
        <span class="completed-divider-label">
            Completed
            <span class="completed-divider-count">12</span>
        </span>
    </button>
</body>
</html>`);
        await page.addStyleTag({ content: css });

        // Runs in the browser context, not Node — DOM globals are expected here.
        /* eslint-disable no-undef */
        return await page.evaluate(() => {
            const pill = document.querySelector('.completed-divider-count');
            const style = getComputedStyle(pill);
            return { background: style.backgroundColor, color: style.color };
        });
        /* eslint-enable no-undef */
    } finally {
        await context.close();
    }
}

test('the "left" count pill on the completed-items divider stays legible in every theme', async () => {
    const css = await readFile(path.join(REPO_ROOT, 'styles.css'), 'utf8');
    let browser;
    try {
        browser = await chromium.launch();

        const cases = [
            { label: 'explicit dark theme', themeAttr: 'dark', colorScheme: 'dark' },
            { label: 'system theme, OS set to dark', themeAttr: null, colorScheme: 'dark' },
            { label: 'explicit light theme', themeAttr: 'light', colorScheme: 'light' },
            { label: 'system theme, OS set to light', themeAttr: null, colorScheme: 'light' }
        ];

        for (const { label, themeAttr, colorScheme } of cases) {
            const colors = await readPillColors(browser, css, themeAttr, colorScheme);
            const ratio = contrastRatio(parseRgb(colors.background), parseRgb(colors.color));

            assert.ok(
                ratio >= 4.5,
                `${label}: completed-divider-count contrast ratio ${ratio.toFixed(2)}:1 is below WCAG AA (4.5:1) — ` +
                `background ${colors.background}, text ${colors.color}`
            );
        }
    } finally {
        if (browser) await browser.close();
    }
});
