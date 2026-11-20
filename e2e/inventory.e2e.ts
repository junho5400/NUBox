import { expect, test, type Page } from '@playwright/test';
import { seedCatalog, seedDocument, signIn } from './fixtures';

test.beforeEach(async ({ request }) => {
  await seedCatalog(request);
});

async function logItem(page: Page, name: string, category: string) {
  await page.getByRole('link', { name: 'Log item' }).click();
  await page.getByRole('textbox', { name: 'Name', exact: true }).fill(name);
  await page.getByRole('button', { name: 'Category', exact: true }).click();
  await page.getByRole('option', { name: category, exact: true }).click();
  await page.getByRole('button', { name: 'Held at', exact: true }).click();
  await page.getByRole('option', { name: 'Main Library', exact: true }).click();
}

test('staff can hide a sensitive wallet photo from students', async ({ browser, page }) => {
  await signIn(page, 'staff');
  await logItem(page, 'Wallet with an ID', 'Wallets');
  const photo = 'src/mocks/photos/backpack.jpg'; // Synthetic photo used to exercise upload.
  await page.locator('input[type=file]:not([capture])').setInputFiles(photo);
  await page.getByRole('checkbox', { name: /Sensitive item/ }).check();
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  const photoInStaffView = page.getByRole('complementary', { name: 'Wallet with an ID' })
    .getByRole('img', { name: 'Wallet with an ID' });
  await expect(photoInStaffView).toBeVisible();
  await expect.poll(() => photoInStaffView.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

  const studentContext = await browser.newContext();
  try {
    const student = await studentContext.newPage();
    await signIn(student);
    const wallet = student.getByRole('link', { name: /Wallet with an ID/ });
    await expect(wallet.getByText('Wallets', { exact: true })).toBeVisible();
    await expect(wallet.getByRole('img')).toHaveCount(0);
    await wallet.click();
    await expect(student.getByRole('heading', { name: 'Wallet with an ID' })).toBeVisible();
    await expect(student.getByRole('img', { name: 'Wallet with an ID' })).toHaveCount(0);
  } finally {
    await studentContext.close();
  }
});

test('undoing a mistaken release returns the item to In custody', async ({ page, request }) => {
  await seedDocument(request, 'items/umbrella', {
    status: 'claimed', name: 'Old umbrella', number: 'NB-0103', category: 'Other',
    deskId: 'main-library', foundOn: new Date(), statusChangedAt: new Date(),
  });
  await signIn(page, 'staff');
  await page.getByRole('link', { name: 'Released', exact: true }).click();
  const umbrella = page.getByRole('link', { name: 'Old umbrella', exact: true });
  await umbrella.click();
  await page.getByRole('button', { name: 'Undo release' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox', { name: 'Reason' }).fill('Released the wrong umbrella');
  await dialog.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect(page.getByText('Old umbrella is back in custody')).toBeVisible();
  await expect(umbrella).toHaveCount(0);

  await page.getByRole('link', { name: /In custody/ }).click();
  await page.reload();
  await expect(umbrella).toBeVisible();
});

test('staff can find a newly logged item by filtering to Main Library', async ({ page }) => {
  await signIn(page, 'staff');
  await logItem(page, 'Canvas tote', 'Bags');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Canvas tote' })).toBeVisible();
  await page.getByRole('link', { name: 'Close', exact: true }).click();

  const tote = page.getByRole('row', { name: /Canvas tote/ });
  const backpack = page.getByRole('row', { name: /Black backpack/ });
  await expect(tote).toBeVisible();
  await expect(backpack).toBeVisible();

  await page.getByRole('button', { name: 'Desk', exact: true }).click();
  await page.getByRole('option', { name: 'Main Library', exact: true }).click();

  await expect(tote).toContainText('Main Library');
  await expect(backpack).toHaveCount(0);
});
