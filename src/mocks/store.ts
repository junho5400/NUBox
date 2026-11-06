// In-memory data for `npm run dev:mock`. Never bundled into production.
import type { Activity, Claim, Desk, Disposal, Item } from '../types/item';
import type { AppSettings } from '../types/settings';
import type { Role } from '../types/user';
import blueBottlePhoto from './photos/blue-bottle.jpg';
import earbudsPhoto from './photos/earbuds.jpg';
import blackJacketPhoto from './photos/black-jacket.jpg';
import calculatorPhoto from './photos/calculator.jpg';
import umbrellaPhoto from './photos/umbrella.jpg';
import notebookPhoto from './photos/notebook.jpg';
import mousePhoto from './photos/mouse.jpg';
import purpleHoodiePhoto from './photos/purple-hoodie.jpg';
import navyFleecePhoto from './photos/navy-fleece.jpg';
import backpackPhoto from './photos/backpack.jpg';
import glassesPhoto from './photos/glasses.jpg';

type Listener = () => void;
const listeners = new Set<Listener>();
export const subscribe = (fn: Listener) => {
  listeners.add(fn);
  return () => void listeners.delete(fn);
};
export const emit = () => listeners.forEach((fn) => fn());

const day = (n: number) => {
  const d = new Date();
  d.setHours(9 + (n % 7), (n * 13) % 60, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
};

export const desks: Desk[] = [
  { id: 'main-library', name: 'Main Library', place: 'University Library, Circulation Desk', hours: 'While the library is open', contact: '847-491-7656, circulation@northwestern.edu', bring: 'Your Wildcard', holdingDays: 30, active: true },
  { id: 'mudd-library', name: 'Mudd Library', place: 'Mudd Library, Service Desk', hours: 'While the library is open', contact: 'mudd@northwestern.edu', bring: 'Your Wildcard', holdingDays: 30, active: true },
  { id: 'norris', name: 'Norris Center', place: 'Norris University Center, Center Desk', hours: 'While the building is open', contact: '847-491-2301, norriscenter@northwestern.edu', bring: 'Your Wildcard', holdingDays: 30, active: true },
  { id: 'spac', name: 'SPAC', place: 'Henry Crown Sports Pavilion, front desk', hours: 'While the building is open', contact: '847-467-4313, recreation@northwestern.edu', bring: 'Your Wildcard', holdingDays: 30, active: true },
];

type Seed = [name: string, category: Item['category'], deskId: string, daysAgo: number, extra?: Partial<Item>];
const seeds: Seed[] = [
  ['Blue Hydro Flask', 'Water bottles', 'spac', 1, { description: '32 oz, navy, dented near the base.', photoPath: blueBottlePhoto }],
  ['AirPods Pro case', 'Electronics', 'main-library', 1, { photoPath: earbudsPhoto }],
  ['Wallet', 'Wallets', 'norris', 2, { sensitive: true }],
  ['Black North Face jacket', 'Clothing', 'norris', 2, { photoPath: blackJacketPhoto }],
  ['Keys on a purple lanyard', 'Keys', 'mudd-library', 3, { sensitive: true }],
  ['TI-84 Plus calculator', 'Electronics', 'mudd-library', 4, { status: 'claimed', photoPath: calculatorPhoto }],
  ['Gray compact umbrella', 'Other', 'main-library', 5, { photoPath: umbrellaPhoto }],
  ['Spiral notebook', 'Books and supplies', 'norris', 6, { photoPath: notebookPhoto }],
  ['Logitech wireless mouse', 'Electronics', 'main-library', 7, { photoPath: mousePhoto }],
  ['Northwestern hoodie', 'Clothing', 'spac', 8, { photoPath: purpleHoodiePhoto }],
  ['Navy fleece', 'Clothing', 'norris', 16, { photoPath: navyFleecePhoto }],
  ['Silver bracelet', 'Jewelry', 'norris', 37, { sensitive: true }],
  ['Black backpack', 'Bags', 'spac', 41, { photoPath: backpackPhoto }],
  ['Reading glasses', 'Other', 'main-library', 45, { photoPath: glassesPhoto }],
  ['Gray scarf', 'Clothing', 'main-library', 50, { status: 'donated', statusChangedAt: day(19) }],
];

export const items: Item[] = seeds.map(([name, category, deskId, ago, extra], i) => ({
  id: `item-${i + 1}`,
  number: `NB-${String(151 - i).padStart(4, '0')}`,
  name,
  description: '',
  category,
  foundOn: day(ago),
  foundAt: '2nd floor lounge',
  deskId,
  status: 'available',
  statusChangedAt: day(Math.max(ago - 1, 0)),
  sensitive: false,
  photoPath: null,
  createdAt: day(ago),
  ...extra,
}));

export const privateDetails: Record<string, { details: string; claim: Claim | null; disposal: Disposal | null }> = {
  'item-6': { details: 'Name scratched on the back', claim: { netid: 'wcat2028', name: 'Willie Wildcat', contact: '', note: 'Described the scratched name', at: day(3), by: 'Junho Hong' }, disposal: null },
  'item-12': { details: 'Engraved “M.L.” inside the clasp', claim: null, disposal: null },
  'item-15': { details: '', claim: null, disposal: { method: 'donated', note: 'Past holding', at: day(19), by: 'Maya Patel' } },
};

const STAFF = ['Maya Patel', 'Sam Okafor', 'Junho Hong'];
/** The backpack was logged at Mudd, then transferred to SPAC. */
const loggedDesk = (item: Item) => desks.find((d) => d.id === (item.id === 'item-13' ? 'mudd-library' : item.deskId));

export const activity: Activity[] = [
  ...items.map((item, i): Activity => ({
    id: `l${i + 1}`,
    type: 'logged',
    itemId: item.id,
    itemName: item.name,
    detail: `at ${loggedDesk(item)?.name}`,
    at: item.createdAt,
    by: STAFF[i % STAFF.length],
  })),
  { id: 'a1', type: 'released', itemId: 'item-6', itemName: 'TI-84 Plus calculator', detail: 'to wcat2028', at: day(3), by: 'Junho Hong' },
  { id: 'a4', type: 'transferred', itemId: 'item-13', itemName: 'Black backpack', detail: 'from Mudd Library to SPAC', at: day(2), by: 'Junho Hong' },
  { id: 'a6', type: 'donated', itemId: 'item-15', itemName: 'Gray scarf', detail: 'Past holding', at: day(19), by: 'Maya Patel' },
];

export const settings: AppSettings = { claimedVisibleDays: 14 };

export const roles: { email: string; role: Exclude<Role, 'user'> }[] = [
  { email: 'willie.wildcat@u.northwestern.edu', role: 'superadmin' },
  { email: 'mayapatel@northwestern.edu', role: 'admin' },
];

/** ?as=student|staff|super|out picks who is signed in; remembered for the tab. */
export const mockRole = (): Role | 'out' => {
  const param = new URLSearchParams(location.search).get('as');
  if (param) sessionStorage.setItem('nubox-mock-as', param);
  const as = param ?? sessionStorage.getItem('nubox-mock-as') ?? 'staff';
  return as === 'student' ? 'user' : as === 'super' ? 'superadmin' : as === 'out' ? 'out' : 'admin';
};
