// A map-view popup title was unreadable in dark mode: Leaflet's own stylesheet
// loads lazily (app.js loadLeaflet(), only once the map first opens) and lands
// *after* styles.css in the document. Leaflet 1.9.4 ships
//   .leaflet-popup-content-wrapper, .leaflet-popup-tip { background: white; color: #333; }
// which has the same specificity as our theme override, so on source order
// alone it silently reset the popup to a white background while our more
// specific `.map-popup-card h3` rule still painted the dark-mode light text
// color on top of it — light text on white, invisible. Nobody noticed until a
// user reported it by eye.
//
// This test reproduces that exact cascade — our real styles.css, Leaflet's
// real default rule injected in the same load order the app uses, and the
// real popup markup buildMapPopup() produces (app.js) — and checks the
// result is actually legible, so a future selector change that drops back to
// equal specificity fails CI instead of a screenshot.
//
// It builds the fixture in memory rather than driving the live app end to
// end: the app's own map only renders once Leaflet itself has loaded from
// unpkg.com, an external CDN a CI run shouldn't have to depend on for a CSS
// regression test.

import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const REPO_ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// The exact rule shipped in leaflet@1.9.4 dist/leaflet.css (pinned in app.js
// via LEAFLET_CSS_URL/LEAFLET_CSS_SRI). Leaflet appends this stylesheet to
// <head> after styles.css is already there, so it comes second in the
// cascade — same as here.
const LEAFLET_DEFAULT_POPUP_CSS = `
.leaflet-popup-content-wrapper,
.leaflet-popup-tip {
    background: white;
    color: #333;
}
`;

function popupFixture(themeAttr) {
    const themeAttrHtml = themeAttr ? ` data-theme="${themeAttr}"` : '';
    return `<!doctype html>
<html${themeAttrHtml}>
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div class="leaflet-container">
        <div class="leaflet-popup">
            <div class="leaflet-popup-content-wrapper">
                <div class="leaflet-popup-content">
                    <div class="map-popup-card">
                        <span class="card-category">Culture & Sights</span>
                        <h3>Catch a gig at Summerstage in the Stadspark</h3>
                        <p>Every July the old drafbaan turns into Groningen's biggest open-air stage.</p>
                        <button class="map-popup-btn">View details</button>
                    </div>
                </div>
                <div class="leaflet-popup-tip-container">
                    <div class="leaflet-popup-tip"></div>
                </div>
            </div>
        </div>
    </div>
    <script>
        // Mirrors loadLeaflet() in app.js: the stylesheet is appended to
        // <head> well after the page (and styles.css) has already loaded.
        const leafletStyle = document.createElement('style');
        leafletStyle.textContent = ${JSON.stringify(LEAFLET_DEFAULT_POPUP_CSS)};
        document.head.appendChild(leafletStyle);
    </script>
</body>
</html>`;
}

function startStaticServer() {
    const server = http.createServer(async (req, res) => {
        const url = new URL(req.url, 'http://localhost');
        if (url.pathname === '/styles.css') {
            const css = await readFile(path.join(REPO_ROOT, 'styles.css'));
            res.writeHead(200, { 'Content-Type': 'text/css' });
            res.end(css);
            return;
        }
        if (url.pathname.startsWith('/__fixture__/')) {
            const themeAttr = url.pathname.replace('/__fixture__/', '') || null;
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(popupFixture(themeAttr === 'system' ? null : themeAttr));
            return;
        }
        res.writeHead(404);
        res.end();
    });
    return new Promise(resolve => {
        server.listen(0, '127.0.0.1', () => resolve(server));
    });
}

function parseRgb(colorString) {
    const match = colorString.match(/rgba?\(([^)]+)\)/);
    assert.ok(match, `expected an rgb()/rgba() color, got "${colorString}"`);
    const [r, g, b] = match[1].split(',').map(part => parseFloat(part.trim()));
    return [r, g, b];
}

// WCAG 2.x relative luminance + contrast ratio.
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

async function readPopupColors(browser, port, themeAttr, colorScheme) {
    const context = await browser.newContext({ colorScheme });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${port}/__fixture__/${themeAttr}`);

    // Runs in the browser context, not Node — DOM globals are expected here.
    /* eslint-disable no-undef */
    const colors = await page.evaluate(() => {
        const wrapper = document.querySelector('.leaflet-popup-content-wrapper');
        const title = document.querySelector('.map-popup-card h3');
        return {
            background: getComputedStyle(wrapper).backgroundColor,
            titleColor: getComputedStyle(title).color
        };
    });
    /* eslint-enable no-undef */
    await context.close();
    return colors;
}

test('dark-mode map popup title stays legible against Leaflet\'s equal-specificity default styling', async () => {
    const server = await startStaticServer();
    const port = server.address().port;
    const browser = await chromium.launch();

    try {
        const cases = [
            { label: 'explicit dark theme', themeAttr: 'dark', colorScheme: 'dark' },
            { label: 'system theme, OS set to dark', themeAttr: 'system', colorScheme: 'dark' },
            { label: 'explicit light theme', themeAttr: 'light', colorScheme: 'light' }
        ];

        for (const { label, themeAttr, colorScheme } of cases) {
            const colors = await readPopupColors(browser, port, themeAttr, colorScheme);
            const background = parseRgb(colors.background);
            const titleColor = parseRgb(colors.titleColor);
            const ratio = contrastRatio(background, titleColor);

            assert.ok(
                ratio >= 4.5,
                `${label}: popup title contrast ratio ${ratio.toFixed(2)}:1 is below WCAG AA (4.5:1) — ` +
                `background ${colors.background}, text ${colors.titleColor}`
            );

            if (themeAttr === 'dark' || (themeAttr === 'system' && colorScheme === 'dark')) {
                assert.notDeepEqual(
                    background, [255, 255, 255],
                    `${label}: popup background fell back to Leaflet's default white instead of the dark card color`
                );
            }
        }
    } finally {
        await browser.close();
        server.close();
    }
});
