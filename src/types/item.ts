export const CATEGORIES = [
  'Bags',
  'Books and supplies',
  'Clothing',
  'Electronics',
  'IDs and cards',
  'Jewelry',
  'Keys',
  'Wallets',
  'Water bottles',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export type ItemStatus = 'available' | 'claimed' | 'donated' | 'discarded';

export interface Item {
  id: string;
  number: string;
  name: string;
  description: string;
  category: Category;
  foundOn: Date;
  foundAt: string;
  deskId: string;
  status: ItemStatus;
  statusChangedAt: Date;
  sensitive: boolean;
  photoPath: string | null;
  createdAt: Date;
}

export interface ItemInput {
  name: string;
  description: string;
  category: Category;
  foundOn: Date;
  foundAt: string;
  deskId: string;
  sensitive: boolean;
  privateDetails: string;
}

export interface Claim {
  netid: string;
  name: string;
  note: string;
  at: Date;
  by: string;
}

export interface Disposal {
  method: 'donated' | 'discarded';
  note: string;
  at: Date;
  by: string;
}

export interface ItemPrivate {
  details: string;
  claim: Claim | null;
  disposal: Disposal | null;
}

export interface Desk {
  id: string;
  name: string;
  place: string;
  hours: string;
  /** Phone and/or email, shown to students. */
  contact: string;
  bring: string;
  holdingDays: number;
  /** Inactive desks take no new items but still resolve for items already there. */
  active: boolean;
}

export type ActivityType = 'logged' | 'edited' | 'released' | 'transferred' | 'donated' | 'discarded';

export interface Activity {
  id: string;
  type: ActivityType;
  itemId: string;
  itemName: string;
  detail: string;
  at: Date;
  by: string;
}

/** Who performed an action, as recorded in history. */
export interface Actor {
  email: string;
  name: string;
}
