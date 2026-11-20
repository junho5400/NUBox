import { expect, test } from '@playwright/test';

const itemsUrl = 'http://127.0.0.1:18080/v1/projects/demo-nubox/databases/(default)/documents/items';
const items = [
  { id: 'search-backpack', name: 'Black backpack', category: 'Bags', number: 'NB-0001' },
  { id: 'search-bottle', name: 'Blue Hydro Flask', category: 'Water bottles', number: 'NB-0002' },
];

test('a Northwestern student can find an item by search', async ({ page, request }) => {
  // Given two available items in the local Firestore emulator.
  for (const { id, ...item } of items) {
    const fields = Object.fromEntries(
      Object.entries({ ...item, status: 'available' }).map(([key, value]) => [key, { stringValue: value }]),
    );
    const response = await request.patch(`${itemsUrl}/${id}`, {
      headers: { Authorization: 'Bearer owner' },
      data: { fields },
    });
    await expect(response).toBeOK();
  }

  // Given a student signed in through the Auth emulator.
  await page.goto('/');
  await page.evaluate(async (fixturePath) => {
    const { signInAsTestStudent } = await import(fixturePath);
    await signInAsTestStudent();
  }, '/e2e/emulator-auth.ts');

  const backpack = page.getByRole('link', { name: /Black backpack/ });
  const bottle = page.getByRole('link', { name: /Blue Hydro Flask/ });
  await expect(backpack).toBeVisible();
  await expect(bottle).toBeVisible();
  // When the student searches by name.
  await page.getByRole('searchbox').fill('backpack');

  // Then only the matching item remains visible.
  await expect(backpack).toBeVisible();
  await expect(bottle).toHaveCount(0);
});
