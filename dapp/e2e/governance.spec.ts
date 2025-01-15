import { test } from '@playwright/test';

test('submit-proposal', async ({ page }) => {
    await page.goto('http://localhost:4321/governance?name=tansu');
    await page.getByRole('button', { name: 'Submit proposal' }).click();
});

test('go-to-proposal-detail-page', async ({ page }) => {
    await page.goto('http://localhost:4321/governance?name=tansu');
    await page.getByText('0Add a DAO systemCancelled').click();
});