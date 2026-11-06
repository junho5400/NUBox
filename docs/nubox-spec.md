# NUBox Specification

NUBox is a central, searchable catalog of items held at Northwestern's Lost and Found desks. Admins log found items; anyone with a Northwestern account can browse them; pickups are recorded so every item's history is traceable.

## Tech stack

- React + TypeScript + Vite (from the react-start template), Tailwind for styling
- Firebase Auth (Google provider), Cloud Firestore, Cloud Storage
- Access control enforced in Firestore/Storage security rules, not only in the UI

## Authentication

- Sign in with Google.
- Allowed accounts: verified emails ending in `@u.northwestern.edu` or `@northwestern.edu`.
- Any other account is signed out and shown a "Northwestern accounts only" message.
- One Google sign-in for everyone; the role on the account decides what it sees. A quieter **Staff sign in** link uses the same sign-in, but an account without an admin or super-admin role is signed out and told it isn't on the staff list, instead of landing in the student catalog.
- Security rules require `request.auth.token.email_verified == true` and a matching email domain for every read.

## Roles

| Role | Permissions |
|---|---|
| **User** (default for any NU account) | Browse and search items |
| **Admin** | User permissions, plus create/edit items, upload photos, record pickups, mark items donated/discarded, view private details, claimant info, and aging flags |
| **Super-admin** | Admin permissions, plus grant/revoke admin and super-admin roles, and manage locations, categories, and settings |

- Roles are stored by email in `roles/{email}`, so a super-admin can grant a role before that person has ever signed in.
- The first super-admin is created manually in the Firebase console. All later grants happen in the app's **Manage users** screen.
- Admins are not scoped to locations; all admins can manage items at every location.
- Users can never write their own role.

## Items

### Fields shown to all users
- **Title**: short and deliberately general, e.g. "Black leather wallet"
- **Public description**: optional, general enough that a claimant must still prove ownership
- **Category**
- **Location**: the Lost and Found desk currently holding it
- **Found where**: optional free text, e.g. "Tech LR3"
- **Date found**
- **Photo**: optional; hidden from users when the item is marked sensitive (a category icon is shown instead)
- **Status**: `available`, `claimed`, `donated`, `discarded`

### Admin-only fields
- **Private details**: identifying info used to verify claimants, e.g. "Wildcard for J. S., two credit cards, $20"
- **Sensitive flag**: hides the photo from users
- **Logged by / logged at**
- **Days held** and an **overdue flag** once it exceeds its location's holding period while still `available`

### Statuses and visibility
- `available`: visible to users.
- `claimed`: users see "Claimed on <date>" for `claimedVisibleDays` (default 14), then it no longer appears in their view.
- `donated` / `discarded`: hidden from users. Admins keep full history of all statuses.

## Recording a pickup

The workflow mirrors the current desk process: the claimant comes to the desk, the admin verifies ownership, then records the pickup.

1. Admin opens the item and clicks **Record pickup**.
2. Admin enters the claimant's **NetID**, **name**, and an optional **verification note** (e.g. "described the sticker on the back").
3. The app saves the claim time and the recording admin automatically, and sets the item status to `claimed`.

Claimant information is admin-only and stored separately from the item document, because Firestore cannot hide individual fields of a readable document.

## Transfers, disposal, and history

- **Transfer:** an admin can move an item to another location (e.g. Mudd → Norris). The item's current location updates and the move is recorded.
- **Disposal:** marking an item `donated` or `discarded` records the date, the admin, and an optional note.
- **History:** every action on an item (created, edited, transferred, picked up, donated, discarded) is appended to an admin-only, append-only history log with the admin and timestamp.

## Locations and categories

- Evanston campus only for now.
- Managed by super-admins (add, edit, deactivate).
- A location has: name, building/room, hours, phone/email, pickup instructions (e.g. "Bring your Wildcard"), and its own **holding period in days**. The overdue flag uses the item's location's holding period.
- Initial locations (desks confirmed to run a lost and found; see `docs/lost-and-found-research.md`):

| Location | Holding period |
|---|---|
| Norris University Center: Center Desk | 30 days |
| Henry Crown Sports Pavilion (SPAC): Recreation | 30 days |
| University Library: Circulation Desk (also covers Deering) | TBD with staff (default 30) |
| Mudd Library: Service Desk | TBD with staff (default 30) |

- Initial categories: Electronics, Clothing, Bags, Keys, IDs & Cards, Wallets, Water Bottles, Jewelry, Books & Supplies, Other.

## Screens

- **Sign in**: Google sign-in button and a quiet "Staff sign in" link; rejection message for non-NU accounts and, from the staff link, for accounts not on the staff list.
- **Browse** (all users): item grid, newest found first; filters for location, category, and status (available / recently claimed); text search on title and public description.
- **Item detail** (all users): public fields plus the holding location's hours, contact, and pickup instructions; for admins, also private details, claim record, history, and actions (edit, record pickup, transfer, donate/discard).
- **Add / edit item** (admins): form with optional photo upload and sensitive checkbox.
- **Admin dashboard** (admins): all items, including overdue (flagged) items, with filter by status and a "days held" column.
- **Manage users** (super-admins): list, grant, and revoke roles by email.
- **Manage locations & categories** (super-admins).
- **Settings** (super-admins): `claimedVisibleDays`.

## Data model (Firestore)

```
roles/{email}                    { role: 'admin' | 'superadmin', grantedBy, grantedAt }
desks/{deskId}                   { name, place, hours, contact, bring, holdingDays, active }
                                 (inactive desks are left out of desk choices but still
                                  resolve for items already there)
counters/items                   { next }  (sequential item numbers, NB-0001)
settings/app                     { claimedVisibleDays }  (any NU account reads, super-admins write)

items/{itemId}                   { number, name, description, category, foundOn, foundAt,
                                   deskId, status, statusChangedAt, sensitive, photoPath,
                                   createdAt, createdBy }
items/{itemId}/private/details   { text }                                   (staff only)
items/{itemId}/private/claim     { netid, name, note, at, by }              (staff only)
items/{itemId}/private/disposal  { method: 'donated' | 'discarded', note, at, by } (staff only)

activity/{entryId}               { type, itemId, itemName, detail, by, byEmail, at }
                                 (staff only, append-only)
```

Categories are a fixed list in `src/types/item.ts`. Claimed items stay visible to students for `settings/app.claimedVisibleDays` days (1–365, set in Settings); until a super-admin saves it, the default is 14 (`CLAIMED_VISIBLE_DAYS`).

## Storage

- `photos/{itemId}/photo.jpg`: staff can read all; students only when the item is listed and not sensitive.
- Uploads are limited to staff, image types, and 10 MB. The app resizes photos to 1600px and strips metadata before upload.

## Out of scope (for now)

- Students submitting "I lost something" reports or claiming online
- Notifications/emails
- Location-scoped admins
- Official NU SSO through NUIT
- Chicago campus, NUPD, residence hall area desks (policies unconfirmed), shuttles
