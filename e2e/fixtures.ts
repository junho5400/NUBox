import { expect, type APIRequestContext, type Page } from '@playwright/test';

const firestore = 'http://127.0.0.1:18080';
const database = 'projects/demo-nubox/databases/(default)';
const staffEmail = 'e2e-staff@northwestern.edu';
const studentEmail = 'e2e-student@u.northwestern.edu';

export async function seedDocument(
  request: APIRequestContext,
  path: string,
  data: Record<string, string | boolean | number | Date>,
) {
  const fields = Object.fromEntries(Object.entries(data).map(([key, value]) => {
    if (value instanceof Date) return [key, { timestampValue: value.toISOString() }];
    if (typeof value === 'boolean') return [key, { booleanValue: value }];
    if (typeof value === 'number') return [key, { integerValue: String(value) }];
    return [key, { stringValue: value }];
  }));
  const response = await request.patch(`${firestore}/v1/${database}/documents/${path}`, {
    headers: { Authorization: 'Bearer owner' },
    data: { fields },
  });
  await expect(response).toBeOK();
}

export async function seedCatalog(request: APIRequestContext) {
  const reset = await request.delete(`${firestore}/emulator/v1/${database}/documents`);
  await expect(reset).toBeOK();

  const foundOn = new Date();
  const common = { status: 'available', foundOn, createdAt: foundOn };
  await Promise.all([
    seedDocument(request, 'desks/main-library', { name: 'Main Library', active: true, holdingDays: 30 }),
    seedDocument(request, 'desks/norris', { name: 'Norris Center', active: true, holdingDays: 30 }),
    seedDocument(request, `roles/${staffEmail}`, { role: 'admin' }),
    seedDocument(request, 'items/backpack', {
      ...common, name: 'Black backpack', category: 'Bags', number: 'NB-0101', deskId: 'norris',
    }),
    seedDocument(request, 'items/bottle', {
      ...common, name: 'Blue Hydro Flask', category: 'Water bottles', number: 'NB-0102', deskId: 'main-library',
    }),
  ]);
}

export async function signIn(page: Page, role: 'student' | 'staff' = 'student') {
  await page.goto('/');
  await page.evaluate(async ({ path, email, staff }) => {
    const { signInToEmulator } = await import(path);
    await signInToEmulator(email, staff);
  }, { path: '/e2e/emulator-auth.ts', email: role === 'staff' ? staffEmail : studentEmail, staff: role === 'staff' });
  await expect(page.getByRole('heading', { name: role === 'staff' ? 'Inventory' : 'Found items' })).toBeVisible();
}
