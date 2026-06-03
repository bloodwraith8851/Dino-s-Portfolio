import { test, expect } from '@playwright/test';

test.describe('Boot Sequence', () => {
  test('displays boot sequence on first visit', async ({ page }) => {
    // Clear session storage to ensure first-visit behavior
    await page.addInitScript(() => {
      window.sessionStorage.clear();
    });

    await page.goto('/');

    // The boot overlay uses a fixed full-screen div with z-[9999]
    const bootOverlay = page.locator('[class*="fixed"][class*="inset-0"][class*="z-"]');
    await expect(bootOverlay).toBeVisible({ timeout: 10000 });

    // Check if boot text appears (the first BOOT_LOG line)
    await expect(page.getByText('Loading Linux', { exact: false })).toBeVisible({ timeout: 10000 });

    // Skip the boot sequence
    await page.keyboard.press('Escape');

    // Boot overlay should disappear
    await expect(bootOverlay).not.toBeVisible({ timeout: 10000 });

    // Main hero section should be visible — h1 contains "Rakesh" and "Sarkar" split by <br>
    await expect(page.locator('h1', { hasText: 'Rakesh' })).toBeVisible({ timeout: 15000 });
  });

  test('skips boot sequence on subsequent visits', async ({ page }) => {
    // Set session storage to simulate returning visitor
    await page.addInitScript(() => {
      window.sessionStorage.setItem('hasBooted', 'true');
    });

    await page.goto('/');

    // Boot overlay should NOT be present
    const bootOverlay = page.locator('[class*="fixed"][class*="inset-0"][class*="z-\\[9999\\]"]');
    await expect(bootOverlay).not.toBeVisible({ timeout: 5000 });

    // Main hero h1 should be visible
    await expect(page.locator('h1', { hasText: 'Rakesh' })).toBeVisible({ timeout: 15000 });
  });
});
