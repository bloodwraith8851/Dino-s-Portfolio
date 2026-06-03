import { test, expect } from '@playwright/test';

test.describe('Boot Sequence', () => {
  test('displays boot sequence on first visit', async ({ page }) => {
    // Clear session storage to ensure first-visit behavior
    await page.addInitScript(() => {
      window.sessionStorage.clear();
    });

    await page.goto('/');

    // Check if boot sequence overlay is present
    const bootOverlay = page.locator('.fixed.inset-0.bg-\\[\\#0C0C0C\\]');
    await expect(bootOverlay).toBeVisible();

    // Check if some boot text appears
    await expect(page.locator('text=Loading Linux')).toBeVisible();

    // Wait for boot sequence to finish (or we can skip it)
    await page.keyboard.press('Escape');
    
    // Boot overlay should disappear
    await expect(bootOverlay).not.toBeVisible();
    
    // Main hero section should be visible
    await expect(page.locator('h1', { hasText: 'RAKESH SARKAR' })).toBeVisible();
  });

  test('skips boot sequence on subsequent visits', async ({ page }) => {
    // Set session storage to simulate returning visitor
    await page.addInitScript(() => {
      window.sessionStorage.setItem('hasBooted', 'true');
    });

    await page.goto('/');

    // Boot overlay should NOT be present
    const bootOverlay = page.locator('.fixed.inset-0.bg-\\[\\#0C0C0C\\]');
    await expect(bootOverlay).not.toBeVisible();
    
    // Main hero section should be visible immediately
    await expect(page.locator('h1', { hasText: 'RAKESH SARKAR' })).toBeVisible();
  });
});
