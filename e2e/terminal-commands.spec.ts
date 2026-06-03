import { test, expect } from '@playwright/test';

test.describe('Terminal Commands', () => {
  test.beforeEach(async ({ page }) => {
    // Skip boot sequence
    await page.addInitScript(() => {
      window.sessionStorage.setItem('hasBooted', 'true');
      // Pre-set identity
      window.localStorage.setItem('visitor_alias', 'TestUser');
    });
    
    await page.goto('/');
    
    // Scroll to contact section
    await page.locator('#contact').scrollIntoViewIfNeeded();
  });

  test('executes help command', async ({ page }) => {
    const terminalInput = page.locator('input[role="textbox"]');
    await expect(terminalInput).toBeVisible();

    await terminalInput.fill('help');
    await terminalInput.press('Enter');

    // Should display help menu categories
    await expect(page.locator('text=1. General')).toBeVisible();
    await expect(page.locator('text=Select a category')).toBeVisible();
    
    // Should be in help mode (sub-prompt)
    await terminalInput.fill('1');
    await terminalInput.press('Enter');
    
    // Should display general help commands
    await expect(page.locator('text=Shows information about me')).toBeVisible();
  });

  test('executes about command', async ({ page }) => {
    const terminalInput = page.locator('input[role="textbox"]');
    await terminalInput.fill('about');
    await terminalInput.press('Enter');

    // Should display about text
    await expect(page.locator('text=Hello! I\'m Rakesh Sarkar')).toBeVisible();
  });

  test('executes clear command', async ({ page }) => {
    const terminalInput = page.locator('input[role="textbox"]');
    
    // First run a command to generate output
    await terminalInput.fill('about');
    await terminalInput.press('Enter');
    await expect(page.locator('text=Hello! I\'m Rakesh Sarkar')).toBeVisible();
    
    // Then clear
    await terminalInput.fill('clear');
    await terminalInput.press('Enter');
    
    // Output should be gone
    await expect(page.locator('text=Hello! I\'m Rakesh Sarkar')).not.toBeVisible();
  });
});
