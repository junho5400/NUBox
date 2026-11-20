import { expect, test } from '@playwright/test';
import { seedCatalog, signIn } from './fixtures';

test.beforeEach(async ({ page, request }) => {
  await seedCatalog(request);
  await signIn(page);
});

test('a Northwestern student can find an item by search', async ({ page }) => {
  const backpack = page.getByRole('link', { name: /Black backpack/ });
  const bottle = page.getByRole('link', { name: /Blue Hydro Flask/ });
  await expect(backpack).toBeVisible();
  await expect(bottle).toBeVisible();

  await page.getByRole('searchbox').fill('backpack');

  await expect(backpack).toBeVisible();
  await expect(bottle).toHaveCount(0);
});

test('the Water bottles category shows only water bottles', async ({ page }) => {
  const backpack = page.getByRole('link', { name: /Black backpack/ });
  const bottle = page.getByRole('link', { name: /Blue Hydro Flask/ });
  await expect(backpack).toBeVisible();
  await expect(bottle).toBeVisible();

  await page.getByRole('button', { name: 'Category', exact: true }).click();
  await page.getByRole('option', { name: 'Water bottles' }).click();

  await expect(bottle).toBeVisible();
  await expect(backpack).toHaveCount(0);
});
