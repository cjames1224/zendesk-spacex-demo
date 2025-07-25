  import dotenv from 'dotenv';
  import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { test, expect } from '@playwright/test';

const ZENDESK_SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN;
const ZENDESK_EMAIL = process.env.ZENDESK_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || process.env.ZENDESK_ADMIN_PASSWORD;
const ZENDESK_URL = ZENDESK_SUBDOMAIN ? `https://${ZENDESK_SUBDOMAIN}.zendesk.com` : undefined;

if (!ZENDESK_URL || !ZENDESK_EMAIL || !ADMIN_PASSWORD) {
  console.error('Error: ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, and ADMIN_PASSWORD must be set in your environment.');
  process.exit(1);
}

async function login(page) {
  await page.goto(`${ZENDESK_URL}/access/login`);
  await page.fill('input[type="email"]', ZENDESK_EMAIL);
  await page.click('button[type="submit"]');
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  // Wait up to 2 minutes for user to complete 2FA if prompted
  await page.waitForURL(/.*zendesk.com.*/, { timeout: 120000 });
  await page.waitForTimeout(1500); // Wait for dashboard to load
}

test('Apply Launch Info macro to Falcon 9 unassigned tickets', async ({ page }) => {
  await login(page);

  // Go to Views > Unassigned Tickets
  await page.goto(`${ZENDESK_URL}/agent/filters/360000000000-unassigned-tickets`);
  await expect(page).toHaveURL(/unassigned-tickets/);
  await page.waitForTimeout(1000); // Wait for tickets to load

  let found = true;
  while (found) {
    // Find a ticket with Falcon 9 in the name
    const ticketRow = page.locator('tr', { hasText: 'Falcon 9' }).first();
    found = await ticketRow.isVisible();
    if (!found) break;
    await ticketRow.click();
    await page.waitForTimeout(500); // Wait for ticket details to load
    // Assign yourself (take it)
    const takeItBtn = page.getByRole('button', { name: /take it|assign to me/i });
    if (await takeItBtn.isVisible()) {
      await takeItBtn.click();
      await page.waitForTimeout(400); // Wait for assignment
    }
    // Apply macro
    await page.getByRole('button', { name: /apply macro/i }).click();
    await page.waitForTimeout(400); // Wait for macro list
    await page.getByRole('option', { name: /falcon 9 launch info/i }).click();
    await page.waitForTimeout(400); // Wait for macro to apply
    // Set status to In Progress
    await page.getByRole('button', { name: /submit as/i }).click();
    await page.getByRole('option', { name: /in progress/i }).click();
    await page.waitForTimeout(300); // Wait for status change
    // Submit
    await page.getByRole('button', { name: /submit/i }).click();
    await page.waitForTimeout(1000); // Wait for submit
    // Go back to Unassigned Tickets view
    await page.goto(`${ZENDESK_URL}/agent/filters/360000000000-unassigned-tickets`);
    await page.waitForTimeout(1000);
  }
  // Confirm no more tickets with Falcon 9 in the name
  await expect(page.locator('tr', { hasText: 'Falcon 9' })).toHaveCount(0);
}); 