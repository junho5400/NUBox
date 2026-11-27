import { expect, test } from '@playwright/test';
import { seedCatalog, signIn } from './fixtures';

test.beforeEach(async ({ request }) => {
  await seedCatalog(request);
});

test('staff can release an item to its owner and students see it as picked up', async ({ browser, page }) => {
  await signIn(page, 'staff');
  await page.getByRole('link', { name: 'Black backpack', exact: true }).click();
  await page.getByRole('button', { name: 'Release to owner' }).click();

  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Name', exact: true }).fill('Alex Kim');
  await dialog.getByRole('textbox', { name: 'NetID', exact: true }).fill('AKX1234');
  await dialog.getByRole('button', { name: 'Release', exact: true }).click();

  await expect(page.getByText('Released to akx1234')).toBeVisible();
  await expect(dialog).toHaveCount(0);

  await page.getByRole('link', { name: 'Released', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Black backpack', exact: true })).toBeVisible();

  const studentContext = await browser.newContext();
  try {
    const student = await studentContext.newPage();
    await signIn(student);
    const backpack = student.getByRole('link', { name: /Black backpack/ });
    await expect(backpack.getByText('Picked up', { exact: true })).toBeVisible();
    await expect(student.getByRole('link', { name: /Blue Hydro Flask/ }).getByText('Picked up')).toHaveCount(0);
  } finally {
    await studentContext.close();
  }
});
