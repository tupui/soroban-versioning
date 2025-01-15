import { test } from '@playwright/test';

test('outcome', async ({ page }) => {
    await page.goto('http://localhost:4321/proposal?id=0&name=tansu');
});