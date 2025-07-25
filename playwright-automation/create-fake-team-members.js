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

function randomName() {
  const first = [
    'Alex',
    'Sam',
    'Chris',
    'Taylor',
    'Jordan',
    'Morgan',
    'Casey',
    'Jamie',
    'Riley',
    'Drew',
  ];
  const last = [
    'Smith',
    'Johnson',
    'Lee',
    'Brown',
    'Garcia',
    'Martinez',
    'Davis',
    'Miller',
    'Wilson',
    'Moore',
  ];
  return `${first[Math.floor(Math.random() * first.length)]} ${
    last[Math.floor(Math.random() * last.length)]
  }`;
}

function randomEmail() {
  return `fakeuser${Math.floor(Math.random() * 100000)}@spacex.com`;
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
    page.waitForURL(/agent/, { timeout: 120000 }).then(() => 'navigated'),
    page.waitForTimeout(120000).then(() => 'timeout'),
  ]);
  if (navResult === 'navigated') {
    console.log(
      chalk.green('✔ Navigated to dashboard or agent page, continuing...')
    );
  } else {
    console.log(chalk.yellow('2FA wait timed out, continuing...'));
  }

  // 2. Go to Admin > People > Team > Team Members
  console.log(chalk.blue('Step 2: Navigating to Team Members...'));
  await page.goto(`${ZENDESK_URL}/admin/people/team/members`);
  await page.waitForTimeout(2000);

  // Find the iframe containing the team member UI
  const frames = page.frames();
  let teamFrame = null;
  for (const frame of frames) {
    // Try to find a frame that contains the add-team-member button
    if (await frame.$('button[data-testid="add-team-member-button"]')) {
      teamFrame = frame;
      break;
    }
  }
  if (!teamFrame) {
    throw new Error('Could not find the iframe containing the team member UI.');
  }

  for (let i = 0; i < 5; i++) {
    console.log(chalk.green(`Step 3: Creating team member ${i + 1}...`));
    // Handle overlays that may block the button
    console.log(chalk.gray('  - Waiting for overlays to disappear...'));
    try {
      await teamFrame.waitForSelector(
        '[data-garden-id="modals.tooltip_modal.backdrop"]',
        { state: 'detached', timeout: 10000 }
      );
      console.log(chalk.gray('  - No overlay detected.'));
    } catch (e) {
      console.log(
        chalk.yellow(
          '  - Overlay still present, attempting to dismiss with Escape...'
        )
      );

      await page.waitForTimeout(800);
      await teamFrame.locator('button[data-testid="close-button"]').click();
      await page.waitForTimeout(400);
      await page.keyboard.press('Escape');
      // Wait again after pressing Escape
      try {
        await teamFrame.waitForSelector(
          '[data-garden-id="modals.tooltip_modal.backdrop"]',
          { state: 'detached', timeout: 5000 }
        );
        console.log(chalk.gray('  - Overlay dismissed after Escape.'));
      } catch (e2) {
        console.log(
          chalk.red(
            '  - Overlay could not be dismissed. Proceeding, but click may fail.'
          )
        );
      }
    }
    console.log(chalk.gray('  - Waiting for "Create team member" button...'));
    await teamFrame.waitForSelector(
      'button[data-testid="add-team-member-button"]',
      { timeout: 10000 }
    );
    await teamFrame
      .locator('button[data-testid="add-team-member-button"]')
      .click();
    await page.waitForTimeout(700);
    const name = randomName();
    const email = randomEmail();
    console.log(chalk.gray(`  - Filling name: ${name}`));
    await teamFrame.waitForSelector(
      'input[data-testid="add-team-member-name-input"]',
      { timeout: 10000 }
    );
    await teamFrame
      .locator('input[data-testid="add-team-member-name-input"]')
      .fill(name);
    console.log(chalk.gray(`  - Filling email: ${email}`));
    await teamFrame.waitForSelector(
      'input[data-testid="add-team-member-email-input"]',
      { timeout: 10000 }
    );
    await teamFrame
      .locator('input[data-testid="add-team-member-email-input"]')
      .fill(email);
    await teamFrame.waitForSelector(
      'button[data-testid="footer-next-btn"],button[type="submit"]',
      { timeout: 10000 }
    );
    await teamFrame.getByRole('button', { name: /next/i }).click();
    await page.waitForTimeout(700);
    console.log(chalk.gray('  - Selecting Light agent role'));
    await teamFrame
      .locator('div[data-garden-id="dropdowns.combobox.container"]')
      .click();
    await page.waitForTimeout(700);

    // await teamFrame.waitForSelector('li[role="radio"],input[type="radio"]', {
    //   timeout: 10000,
    // });
    await teamFrame.locator('div[data-testid="light_agent"]').click();
    await page.waitForTimeout(400);
    console.log(chalk.gray('  - Saving team member'));
    await teamFrame.waitForSelector(
      'button[data-testid="footer-save-btn"],button[type="submit"],button[aria-label*="save" i],button[aria-label*="invite" i],button[aria-label*="finish" i]',
      { timeout: 10000 }
    );
    await teamFrame
      .getByRole('button', { name: /save|invite|finish/i })
      .click();
    await page.waitForTimeout(1500);
    console.log(chalk.green(`  ✔ Created: ${name} <${email}>`));
  }

  console.log(chalk.cyan('Done creating team members.'));
  // await browser.close(); // Uncomment to close browser automatically
})();
