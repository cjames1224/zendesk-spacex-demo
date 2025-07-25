const { chromium } = require('playwright');
const chalk = require('chalk');
require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env'),
});

const ZENDESK_SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN;
const ZENDESK_EMAIL = process.env.ZENDESK_EMAIL;
const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || process.env.ZENDESK_ADMIN_PASSWORD;
const ZENDESK_URL = ZENDESK_SUBDOMAIN
  ? `https://${ZENDESK_SUBDOMAIN}.zendesk.com`
  : undefined;

if (!ZENDESK_URL || !ZENDESK_EMAIL || !ADMIN_PASSWORD) {
  console.error(
    chalk.red(
      'Error: ZENDESK_SUBDOMAIN, ZENDESK_EMAIL, and ADMIN_PASSWORD must be set in your environment.'
    )
  );
  process.exit(1);
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 200 });
  const page = await browser.newPage();

  // 1. Login
  console.log(chalk.blue('Step 1: Navigating to login...'));
  await page.goto(`${ZENDESK_URL}/access/login`);
  await page.fill('input[type="email"]', ZENDESK_EMAIL);
  await page.click('button[type="submit"]');
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  console.log(
    chalk.yellow(
      'Waiting for 2FA (up to 1 minute, or until dashboard loads)...'
    )
  );
  const navResult = await Promise.race([
    page.waitForURL(/agent/, { timeout: 60000 }).then(() => 'navigated'),
    page.waitForTimeout(60000).then(() => 'timeout'),
  ]);
  if (navResult === 'navigated') {
    console.log(
      chalk.green('✔ Navigated to dashboard or agent page, continuing...')
    );
  } else {
    console.log(chalk.yellow('2FA wait timed out, continuing...'));
  }

  // 2. Go to Views > Unassigned Tickets
  console.log(chalk.blue('Step 2: Navigating to Unassigned Tickets...'));
  await page.goto(`${ZENDESK_URL}/agent/filters/43204015601043`);
  await page.waitForTimeout(2000);

  let found = true;
  let ticketCount = 0;
  while (found) {
    // Find a ticket with Falcon 9 in the name
    const ticketRow = page
      .locator('tr')
      .filter({
        hasText: 'Falcon 9',
        strict: false,
      })
      .first();
    found = await ticketRow.isVisible();
    if (!found) break;
    await ticketRow.click();
    await page.waitForTimeout(700); // Wait for ticket details to load
    // Assign yourself (take it)
    const takeItBtn = page.getByRole('button', {
      name: /take it|assign to me/i,
    });
    if (await takeItBtn.isVisible()) {
      console.log(chalk.gray('  - Assigning ticket to yourself'));
      await takeItBtn.click();
      await page.waitForTimeout(400);
    }
    // Apply macro
    console.log(chalk.gray('  - Applying Falcon 9 launch info macro'));

    await page
      .locator(
        'div[data-test-id="ticket-footer-macro-menu-autocomplete-input"]'
      )
      .click();
    await page.waitForTimeout(400);
    // await page.locator('li[id="downshift-25-item-5"]').click();
    await page
      .locator('li[role="option"]')
      .filter({ hasText: /Falcon 9 Launch Info/i, strict: false })
      .first()
      .click();
    await page.waitForTimeout(400);
    // Set status to In Progress
    console.log(chalk.gray('  - Setting status to In Progress'));
    await page
      .locator('button[data-test-id="submit_button-menu-button"]')
      .click();
    await page.waitForTimeout(300);
    await page
      .locator('li[role="menuitem"]')
      .filter({ hasText: /In Progress/i, strict: false })
      .first()
      .click();
    await page.waitForTimeout(300);
    // Submit
    console.log(chalk.gray('  - Submitting ticket'));
    await page.getByRole('button', { name: /submit/i }).click();
    await page.locator('button[data-test-id="submit_button-button"]').click();

    await page.waitForTimeout(2000);
    ticketCount++;
    console.log(chalk.green(`  ✔ Processed ticket #${ticketCount}`));
    // Go back to Unassigned Tickets view
    await page.goto(`${ZENDESK_URL}/agent/filters/43204015601043`);
    await page.waitForTimeout(3000);
  }
  console.log(chalk.cyan(`Done. Processed ${ticketCount} tickets.`));
  // await browser.close(); // Uncomment to close browser automatically
})();
