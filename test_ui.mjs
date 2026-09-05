import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({
        recordVideo: {
            dir: 'videos/'
        }
    });
    const page = await context.newPage();

    await page.goto('http://localhost:8000');

    // Check an item
    await page.click('.bucket-card .checkbox');
    await page.waitForTimeout(1000); // Wait for resort

    // Change language to NL
    await page.click('.lang-btn[data-lang="nl"]');
    await page.waitForTimeout(500);

    // Toggle filter
    await page.click('.filter-pill[data-filter="Food & Drink"]');
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'screenshot.png' });

    await context.close();
    await browser.close();
})();
