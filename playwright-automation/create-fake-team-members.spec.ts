import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import { test, expect } from '@playwright/test';

const ZENDESK_SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN;
const ZENDESK_EMAIL = process.env.ZENDESK_EMAIL;
const ADMIN_PASSWORD = process.env.ZENDESK_ADMIN_PASSWORD;
const ZENDESK_URL = ZENDESK_SUBDOMAIN ? `https://${ZENDESK_SUBDOMAIN}.zendesk.com` : undefined;

if (!ZENDESK_URL || !ZENDESK_EMAIL || !ADMIN_PASSWORD) {
  console.error('Error: ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, and ADMIN_PASSWORD must be set in your environment.');
  process.exit(1);
}

function randomName() {
  const first = ['Alex', 'Sam', 'Chris', 'Taylor', 'Jordan', 'Morgan', 'Casey', 'Jamie', 'Riley', 'Drew'];
  const last = ['Smith', 'Johnson', 'Lee', 'Brown', 'Garcia', 'Martinez', 'Davis', 'Miller', 'Wilson', 'Moore'];
  return `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`;
}

function randomEmail() {
  return `fakeuser${Math.floor(Math.random() * 100000)}@example.com`;
}

test('Create 5 fake team members as Light agents', async ({ page }) => {
  // 1. Login
  await page.goto(`${ZENDESK_URL}/access/login`);
  await page.fill('input[type="email"]', ZENDESK_EMAIL);
  await page.click('button[type="submit"]');
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  // Wait up to 2 minutes for user to complete 2FA if prompted
  await page.waitForURL(/.*zendesk.com.*/, { timeout: 120000 });
  await page.waitForTimeout(1500); // Wait for dashboard to load

  // 2. Go to Admin > People > Team > Team Members
  await page.goto(`${ZENDESK_URL}/admin/people/team/team_members`);
  await expect(page).toHaveURL(/team_members/);
  await page.waitForTimeout(1000); // Wait for team members page to render

  for (let i = 0; i < 5; i++) {
    // 3. Click Create team member
    await page.getByRole('button', { name: /create team member/i }).click();
    await page.waitForTimeout(500); // Wait for modal to open
    // 4. Enter fake name and email
    const name = randomName();
    const email = randomEmail();
    await page.getByLabel(/full name/i).fill(name);
    await page.getByLabel(/email/i).fill(email);
    await page.waitForTimeout(300); // Pause to see filled fields
    await page.getByRole('button', { name: /next/i }).click();
    await page.waitForTimeout(500); // Wait for role selection
    // 5. Assign Light agent role
    await page.getByRole('radio', { name: /light agent/i }).check();
    await page.waitForTimeout(300); // Pause to see role selection
    await page.getByRole('button', { name: /save|invite|finish/i }).click();
    // Wait for the modal/dialog to close or for the new member to appear
    await page.waitForTimeout(1200); // Wait for save and UI update
  }

  // Confirm at least 5 new team members exist (optional, can be improved)
  await expect(page.locator('text=fakeuser')).toHaveCount(5);
}); 