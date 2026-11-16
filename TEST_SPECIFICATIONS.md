# NUBox Test Specifications

This document describes, in plain English, every automated unit test in the NUBox repository. Each test is written as Given (the starting situation), When (what happens), and Then (what the app is expected to do).

There are 36 tests in 5 test files.

| File | What it covers | Tests |
| --- | --- | ---: |
| `src/App.test.tsx` | The whole app as students and staff use it | 14 |
| `src/utilities/items.test.ts` | Rules for found items, visibility and desks | 8 |
| `src/utilities/images.test.ts` | Photo rotating, zooming, cropping and panning | 7 |
| `src/utilities/dates.test.ts` | Date counting and formatting | 5 |
| `src/utilities/email.test.ts` | Checking for Northwestern email addresses | 2 |

## `src/App.test.tsx`

These tests open the full `App` inside `AuthProvider`. They use stand-ins ("mocks") for Google sign-in, staff roles, items, desks, activity history and settings, so no real database is involved.

Shared setup used by every test below, unless a row says otherwise:

- One desk, Norris Center, holds items for 30 days.
- Three found items:
  - Blue Hydro Flask (Water bottles): available, found yesterday.
  - Black backpack (Bags): available, found 45 days ago.
  - Old umbrella (Water bottles): picked up by its owner 30 days ago.
- Settings show picked-up items to students for 14 days.
- The signed-in test user is "Willie Wildcat" (wildcat@u.northwestern.edu). Signing in "as staff" means the account has the admin role and came through Staff sign in.

| Test Suite / Describe | Test Name | Given (Initial State) | When (Action / Event) | Then (Expected Outcome) |
| --- | --- | --- | --- | --- |
| App | starts sign-in from the sign-in page | The user is signed out and sees the sign-in page. | The user clicks Sign in with Google. | Google sign-in starts as a regular (non-staff) sign-in: `signInWithGoogle(false)` is called. |
| App | turns away a staff sign-in from an account without a staff role | The user is signed out. Their account has only the regular user role. | The user clicks Staff sign in, then Google reports a successful staff sign-in. | Sign-in starts in staff mode (`signInWithGoogle(true)`). An alert says "wildcat@u.northwestern.edu isn't on the staff list." The user is signed out again. |
| App | sends a staff sign-in from a staff account to the inventory | The user is signed out. Their account has the admin role. | The user clicks Staff sign in, then Google reports a successful staff sign-in. | The Inventory page is shown. |
| App | shows a staff account the student catalog after the regular sign-in, even from a staff page | A staff (admin) account signs in through the regular sign-in, not Staff sign in. The browser is on the staff `/inventory` address. | Component mounts / renders | The student "Found items" catalog is shown instead of the inventory, and there is no Inventory link. |
| App | explains when a non-Northwestern account is rejected | Sign-in was rejected because the account is someone@gmail.com. | Component mounts / renders | An alert says "Sign in with a Northwestern account." |
| App | shows students held items and hides old pickups | A student is signed in. Pickups stay visible for 14 days. | Component mounts / renders | The "Found items" catalog lists the Blue Hydro Flask. The Old umbrella, picked up 30 days ago, is not listed. |
| App | keeps pickups listed for as long as settings say | Settings are changed so pickups stay visible for 30 days. A student is signed in. | Component mounts / renders | The Old umbrella is listed and labelled "Picked up". |
| App | filters the catalog to picked-up items | Pickups stay visible for 30 days. A student is signed in. | The student opens the Status filter and chooses "Picked up". | The Old umbrella is shown. The Blue Hydro Flask, which is still held, is hidden. |
| App | filters the catalog by search text | A student is signed in. | The student types "backpack" in the search box. | The Black backpack is shown. The Blue Hydro Flask is hidden. |
| App | sends staff to the inventory and flags items past holding | A staff member is signed in. | Component mounts / renders | The Inventory page is shown. The Black backpack's row is marked "Past holding", because it has been held 45 days at a desk that holds items for 30. |
| App | shows staff who logged an item and what happened to it since | A staff member is signed in and opens the Black backpack's page. Its history has two entries: logged at Norris Center by Maya Patel 45 days ago, then edited by Sam Okafor 44 days ago. | Component mounts / renders | The History section shows "Logged at Norris Center ... by Maya Patel" and "Edited ... by Sam Okafor". The history for item `b` is requested. |
| App | releases to a visitor, who leaves a phone or email instead of a NetID | A staff member is signed in and opens the Blue Hydro Flask's page. Releasing the item will succeed. | The staff member clicks Release to owner, chooses Visitor, enters the name "Pat Doe" and clicks Release with no contact. They then enter "847-555-0100" as the phone or email and click Release again. | First attempt: the message "Enter a phone number or email." appears and nothing is released. Second attempt: the item is released to Pat Doe with contact 847-555-0100 and no NetID, and the message "Released to Pat Doe" appears. |
| App | lets staff undo a release, with an optional reason | A staff member is signed in and opens the page for the Old umbrella, which was already picked up. Undoing will succeed. | The staff member clicks Undo release, enters the reason "Released the wrong umbrella" and clicks Undo. | The item is reopened (`reopenItem`) with that reason. The message "Old umbrella is back in custody" appears. |
| App | offers no undo for items still in custody | A staff member is signed in and opens the Blue Hydro Flask's page. The item is still held. | Component mounts / renders | A "Release to owner" button is shown and there is no Undo button. |

## `src/utilities/items.test.ts`

Shared setup: "today" is Nov 6, 2026. The example item is a Blue Hydro Flask (NB-0151, "32 oz water bottle, navy", Water bottles), available at the SPAC desk, found 1 day ago. SPAC holds items for 30 days and is active. Rows below describe only what is changed from this example.

| Test Suite / Describe | Test Name | Given (Initial State) | When (Action / Event) | Then (Expected Outcome) |
| --- | --- | --- | --- | --- |
| isPastHolding | flags available items held longer than the desk allows | An available item found 31 days ago, and one found 30 days ago, at a desk that holds items for 30 days. | `isPastHolding` checks each item. | The 31-day item is past holding. The 30-day item is not. |
| isPastHolding | ignores items that already left the desk | An item found 60 days ago that has already been picked up (claimed). | `isPastHolding` checks it. | It is not past holding, because it is no longer at the desk. |
| isVisibleToStudents | shows held items and pickups within the visible window only | Pickups stay visible for 14 days. The items are: one still held, one picked up 14 days ago, one picked up 15 days ago, and one donated. | `isVisibleToStudents` checks each item. | The held item and the 14-day pickup are visible to students. The 15-day pickup and the donated item are hidden. |
| isVisibleToStudents | follows the configured window | An item picked up 5 days ago. | `isVisibleToStudents` checks it with a 7-day window and with a 3-day window. | It is visible with the 7-day window and hidden with the 3-day window. |
| pickableDesks | offers active desks only | The active SPAC desk and an inactive "Old desk". | `pickableDesks` lists the desks staff can choose. | Only SPAC is offered. |
| pickableDesks | keeps an inactive desk that is already chosen | The same two desks. The inactive "Old desk" is already chosen for the item. | `pickableDesks` lists the desks staff can choose. | Both desks are offered, so the current choice is not lost. |
| matchesSearch | matches every word against name, description, and number | The example item (Blue Hydro Flask, "32 oz water bottle, navy", NB-0151). | `matchesSearch` checks the searches "navy bottle", "nb-0151" and "navy wallet". | "navy bottle" and "nb-0151" match. "navy wallet" does not, because every word must match. |
| formatItemNumber | pads to four digits | The numbers 7 and 12345. | `formatItemNumber` formats each number. | They become "NB-0007" and "NB-12345". |

## `src/utilities/images.test.ts`

These tests cover the photo editor used when staff log an item. Photos are shown in a 4:3 frame and can be rotated, zoomed and moved. Examples use a 4000x3000 (landscape) photo or a 3000x4000 (portrait) photo, starting from the default centred, un-zoomed view (`CENTERED`).

| Test Suite / Describe | Test Name | Given (Initial State) | When (Action / Event) | Then (Expected Outcome) |
| --- | --- | --- | --- | --- |
| images | swaps width and height on a quarter turn | A 4000x3000 photo. | `rotatedSize` works out its size after one quarter turn and after two quarter turns. | One quarter turn makes it 3000x4000. Two quarter turns (upside down) leave it 4000x3000. |
| images | keeps the whole photo when zoomed out | A portrait photo with no zoom, and a landscape photo turned a quarter turn with no zoom. | `frameCrop` works out the saved area, and `canPan` checks whether the photo can be moved. | The whole photo is kept in both cases (the full 3000x4000 area). The un-zoomed photo cannot be moved. |
| images | crops a 4:3 area once zoomed in to fill the frame | A portrait photo zoomed in just enough (16/9 times) to fill the 4:3 frame. | `frameCrop` works out the saved area, both centred and moved to the very top. | Centred, it saves a 3000x2250 area starting 875 pixels down. Moved to the top, it saves the 3000x2250 area at the very top. |
| images | keeps zoom within limits | A landscape photo. | `zoomTo` is asked to zoom to 0.2 times (too far out) and to 99 times (too far in). | Zoom is held at 1 times at the low end and at the photo's maximum (`maxZoom`) at the high end. |
| images | zooms around the middle of the frame | A landscape photo zoomed to 2 times and moved to the far left, showing pixels 0 to 2000 across. | `zoomTo` zooms in further, to 2.5 times. | The view stays centred on the same middle point: it now shows 1600 pixels across, from 200 to 1800. |
| images | pans opposite to the drag and stops at the edges | A landscape photo zoomed to 2 times, and a portrait photo with no zoom. | `panBy` moves the zoomed photo by half the frame and then by a large amount the other way. It also tries to move the un-zoomed portrait photo. | Dragging right shows more of the left side and stops at the left edge. Dragging far left stops at the right edge. The un-zoomed portrait photo does not move. |
| images | places the preview so its frame edges are the saved edges | A portrait photo with no zoom, and a landscape photo turned a quarter turn. | `framedStyle` works out how to position the on-screen preview. | The portrait preview is centred at 56.3% of the frame width and full height. The turned photo is sized 75% by 75% and rotated 90 degrees, so the preview's edges match exactly what will be saved. |

## `src/utilities/dates.test.ts`

These tests call the date functions directly, with fixed example dates in November 2026.

| Test Suite / Describe | Test Name | Given (Initial State) | When (Action / Event) | Then (Expected Outcome) |
| --- | --- | --- | --- | --- |
| dates | counts calendar days, not 24-hour periods | Two pairs of times: 11 pm Nov 5 to 1 am Nov 6, and 8 am to 8 pm on Nov 6. | `daysBetween` counts the days in each pair. | The first pair counts as 1 day even though only 2 hours passed. The same-day pair counts as 0 days. |
| dates | labels recent days in words | "Now" is noon on Nov 6, 2026. | `formatDay` labels Nov 6, Nov 5 and Nov 3. | They are labelled "Today", "Yesterday" and "Nov 3". |
| dates | adds the year only outside the current year | "Now" is Nov 6, 2026. | `formatShortDate` formats Oct 30, 2026 and Oct 30, 2025. | They become "Oct 30" and "Oct 30, 2025". |
| dates | pluralizes days | Counts of 1 and 3. | `formatDays` turns each count into words. | They become "1 day" and "3 days". |
| dates | round-trips date input values in local time | The date-field text "2026-11-06", and a wrongly formatted "11/06/2026". | Each text is converted to a date (`fromDateInputValue`), and the valid one is converted back (`toDateInputValue`). | The valid date comes back as exactly "2026-11-06". The wrongly formatted text is rejected (no date). |

## `src/utilities/email.test.ts`

| Test Suite / Describe | Test Name | Given (Initial State) | When (Action / Event) | Then (Expected Outcome) |
| --- | --- | --- | --- | --- |
| isNorthwesternEmail | accepts student and staff Northwestern emails | A student address (@u.northwestern.edu), a staff address (@northwestern.edu), and a student address in mixed capital letters. | `isNorthwesternEmail` checks each address. | All three are accepted. |
| isNorthwesternEmail | rejects other domains and look-alikes | A Gmail address, look-alike domains (northwestern.edu.evil.com, fakenorthwestern.edu), a mail.northwestern.edu address, and no email at all. | `isNorthwesternEmail` checks each one. | All are rejected. |
