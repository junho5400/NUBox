# NUBox

**Every lost and found on campus, in one place.**

NUBox lets anyone with a Northwestern account see what is being held at the lost-and-found desks across the Evanston campus, with a photo of each item and the desk that has it. Desk staff log the items they find, and record who picks each one up.

Live app: https://nubox-58de7.web.app (sign in with a Northwestern Google account)

CS 392 Rapid Prototyping, Fall 2026, Project 2 (social good). Team Blue: Sueun Cho, Dhriti Guddanti, Junho Hong, Diego Perez-Aguilar.

> NUBox is an academic proof-of-concept. It is not an official Northwestern service, and using it for real would need review with the desk staff and likely a re-implementation.

## The problem

- When you lose something, you often don't know where you lost it, so you don't know which lost and found to check.
- Northwestern has no central lost and found. Norris, SPAC, the libraries, and University Police each keep their own items under their own rules, and you can't see what any of them has without going there or calling.
- Describing an item in words is unreliable. A photo shows exactly what was found.
- When an item is handed over, there is often no record of who took it.

## How it works

1. **You lose something** and aren't sure where.
2. **Desk staff log what they find:** a photo, a category, where it was found, and which desk is holding it. The person who lost the item doesn't upload anything.
3. **You check NUBox** and search items from every desk at once. Each item shows the desk's location, hours, contact, and what to bring.
4. **You pick it up at that desk.** Staff check that it's yours and record the pickup (NetID, name, and a note on how ownership was verified), so every item's history can be traced.

## Who can do what

| Role | Who | Can |
|---|---|---|
| **User** | Any verified `@northwestern.edu` or `@u.northwestern.edu` Google account | Browse and search items that are available or were recently picked up |
| **Admin** | Lost-and-found desk staff | Everything a user can, plus log and edit items, upload photos, record pickups, transfer items between desks, mark items donated or discarded, and see private details and the activity log |
| **Super-admin** | Whoever manages the system, such as a desk supervisor | Everything an admin can, plus grant and revoke roles, manage desks, and set how long picked-up items stay listed |

## Features

- Google sign-in, restricted to verified Northwestern accounts. Staff use the separate **Staff sign in** button, which signs out any account without a staff role.
- Catalog with text search and filters for desk, category, and status
- Photos are cropped to 4:3 (staff can rotate them and drag to choose what's kept), scaled to at most 1600px wide, and re-encoded as JPEG before upload, which also drops location data. Students see a category icon instead of the photo for items staff mark as sensitive.
- Private details (for example, "Wildcard for J. S.") are visible to staff only and are used to check a claimant's story
- Each desk has its own holding period, and items past it are flagged in the staff inventory
- Picked-up items stay in the catalog as "Claimed" for a set number of days (14 by default, adjustable in Settings)
- Transfers between desks, and donation or disposal with a date, staff member, and note
- Append-only activity log of every staff action

The app starts with four desks: Norris Center Desk, SPAC, Main Library Circulation Desk, and Mudd Library Service Desk. Super-admins can add more in Settings.

**Not included yet:** students reporting lost items or claiming online, email notifications, the Chicago campus, residence hall desks, NUPD, and shuttles. See [docs/nubox-spec.md](docs/nubox-spec.md) for the full scope.

## Tech stack

- React 19, TypeScript, Vite, Tailwind CSS, React Router
- Firebase Authentication (Google), Cloud Firestore, Cloud Storage, Firebase Hosting
- Vitest and React Testing Library

There is no separate backend server. The app talks to Firebase directly from the browser, and access control is enforced by [firestore.rules](firestore.rules) and [storage.rules](storage.rules), not just by the UI.

## Getting started

Requires Node 24 or later.

```
npm install
npm run dev
```

`npm run dev` uses the real Firebase project, so you need a Northwestern Google account to sign in.

To see every screen without Firebase, use mock mode. It replaces `src/services/*` with in-memory fakes from `src/mocks/services/`:

```
npm run dev:mock
```

| Script | What it does |
|---|---|
| `npm run dev` | Start the dev server against Firebase |
| `npm run dev:mock` | Start the dev server with mock data and no Firebase |
| `npm test` | Run the tests in watch mode with the Vitest UI |
| `npm run coverage` | Run the tests once and report coverage |
| `npm run lint` | Run ESLint |
| `npm run build` | Type-check and build to `dist/` |
| `npm run deploy` | Build, then deploy hosting and security rules to Firebase (needs a local `.firebaserc`; see below) |

## Deploying

The Firebase project is `nubox-58de7`. To deploy, you must be a member of that project in the Firebase console.

`.firebaserc` is not committed, so name the project explicitly:

```
npm run build
npx firebase-tools deploy --project nubox-58de7
```

This deploys the site in `dist/`, `firestore.rules`, and `storage.rules`.

### First super-admin

Roles are stored in Firestore under `roles/{email}`. The first super-admin has to be added by hand in the Firebase console:

- Collection: `roles`
- Document ID: the person's email in lowercase
- Field: `role` (string) = `superadmin`

After that, roles can be granted and revoked from the **People** section of the app's Settings page.

## Project structure

```
.github/copilot-instructions.md   Coding conventions for this repo
docs/
  nubox-spec.md                   What NUBox does: roles, items, screens, data model
  lost-and-found-research.md      How Northwestern's lost and founds work today
src/
  components/                     React components, one per file
  hooks/                          Custom hooks (auth, data loading, toasts)
  services/                       All Firebase access; components never call Firebase directly
  mocks/                          In-memory fakes used only by `npm run dev:mock`
  types/                          Shared TypeScript types
  utilities/                      Pure helper functions, with their tests
firestore.rules                   Firestore security rules
storage.rules                     Cloud Storage security rules
firebase.json                     Hosting, Firestore, and Storage config
```

## Credits

Started from Chris Riesbeck's [react-start](https://github.com/criesbeck/react-start) template.
