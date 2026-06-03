import { test, expect } from '@playwright/test';

test.describe('Terminal Commands', () => {
  test.beforeEach(async ({ page }) => {
    // Skip boot sequence and pre-set visitor identity
    await page.addInitScript(() => {
      window.sessionStorage.setItem('hasBooted', 'true');
      window.localStorage.setItem('visitor_alias', 'TestUser');
    });

    await page.goto('/');

    // Wait for the page to fully render (ban check is async)
    await page.waitForTimeout(3000);

    // Scroll to the contact/terminal section
    await page.locator('#contact').scrollIntoViewIfNeeded();

    // Wait for the terminal input to be ready
    await expect(page.locator('input[role="textbox"]')).toBeVisible({ timeout: 15000 });
  });

  test('executes help command', async ({ page }) => {
    const terminalInput = page.locator('input[role="textbox"]');

    await terminalInput.fill('help');
    await terminalInput.press('Enter');

    // Should display help menu categories — the text is inside HTML rendered via dangerouslySetInnerHTML
    // so we search for visible text fragments
    await expect(page.getByText('General', { exact: false })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Select a category', { exact: false })).toBeVisible({ timeout: 10000 });

    // Enter sub-menu
    await terminalInput.fill('1');
    await terminalInput.press('Enter');

    // Should display general help commands — actual text is "Who is Rakesh?"
    await expect(page.getByText('Who is Rakesh', { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test('executes about command', async ({ page }) => {
    const terminalInput = page.locator('input[role="textbox"]');
    await terminalInput.fill('about');
    await terminalInput.press('Enter');

    // Actual ABOUT_TEXT starts with "Hi, my name is Rakesh Sarkar"
    await expect(page.getByText('Rakesh Sarkar', { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test('executes clear command', async ({ page }) => {
    const terminalInput = page.locator('input[role="textbox"]');

    // First run about to generate output
    await terminalInput.fill('about');
    await terminalInput.press('Enter');
    await expect(page.getByText('full-stack developer', { exact: false })).toBeVisible({ timeout: 10000 });

    // Then clear
    await terminalInput.fill('clear');
    await terminalInput.press('Enter');

    // The about output should be gone
    await expect(page.getByText('full-stack developer', { exact: false })).not.toBeVisible({ timeout: 5000 });
  });
});
