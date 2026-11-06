# Northwestern Lost & Found: Research Notes

Researched 2026-11-06 from public Northwestern web pages. Several sources are old (noted below), and many desks publish no policy at all, so **everything here should be confirmed with the staff who run each desk** before we rely on it.

## Summary

- There is no central system today. Each building runs its own lost and found with its own rules.
- **Holding periods differ by location:** 30 days at Norris and Recreation, up to 6 months at University Police (NUPD).
- **NUPD already publishes a basic public list** (date found, item, location) of *unidentified* found property. It's a plain web table with no photos, search, or status, which is roughly the problem NUBox solves.
- NUPD pickup requires an appointment and a government-issued photo ID, plus proof of ownership in some cases.
- Northwestern has two campuses (Evanston and Chicago), and NUPD runs found property for both.

## Known lost & found locations

### Confirmed by an official page

| Location | Campus | Holding period | Pickup | Contact |
|---|---|---|---|---|
| **University Police (NUPD) found property**, 1201 Davis St. | Evanston | "In most instances" no longer than 6 months, then disposed of per state/local statute | By appointment; government photo ID required; may need proof of ownership | (847) 491-3254, dssfoundproperty@northwestern.edu |
| **University Police (NUPD)**, 211 E. Superior St. | Chicago | Same as above | Same as above | (312) 503-3456 |
| **Norris University Center: Center Desk**, 1999 Campus Dr. | Evanston | 30 days, then donated or disposed of | Any time the building is open | (847) 491-2301, norriscenter@northwestern.edu |
| **Northwestern Recreation** (SPAC and other rec facilities; which desk holds items isn't stated) | Evanston | 30 days, then donated to charity (also applies to expired permanent lockers) | Not stated | 847-467-4313, recreation@northwestern.edu |
| **University (Main) Library + Deering**: Circulation Desk | Evanston | Not stated | Contact the desk | circulation@northwestern.edu, 847-491-7656 |
| **Mudd Library**: Mudd Service Desk | Evanston | Not stated | Contact the desk | mudd@northwestern.edu |

### Likely, but no lost & found policy published

These desks are staffed and handle resident issues, but their pages don't mention lost and found. Confirm with Residential Services.

| Area desk | Staffed | Contact | Halls served |
|---|---|---|---|
| **North**: Schapiro Hall | 24/7 | 847-467-5802, NorthAreaDesk@northwestern.edu | 584 Lincoln, 2347 & 2349 Sheridan, Elder, Kemper, Schapiro |
| **Northeast**: Sargent Hall | 24/7 | 847-467-5801, NortheastAreaDesk@northwestern.edu | 2303/2307/2313 Sheridan, Ayers, Bobb-McCulloch, Goodrich, Lindgren, Sargent, Slivka |
| **South**: Allison Hall (north entrance) | 24/7 | 847-467-5800, SouthAreaDesk@northwestern.edu | 626 & 636 Emerson, 1838 Chicago, 1835 Hinman, 1871 Orrington, Allison, E/W Fairchild, Hobart, Jones, Rogers, Shepard |
| **Southwest**: Willard Hall (courtyard entrance) | 24/7 | 847-491-2341, SouthwestAreaDesk@northwestern.edu | 710 & 720 Emerson, 717 University, 1856 Orrington, Chapin, Foster-Walker, N/S Mid-Quads, Willard |

### Handled outside the university

- **Shuttles** (intercampus and campus loops): the shuttle *vendor* runs lost and found at 708-474-7474 (from a 2024 brochure; verify). NUBox can't track these items, so show this as a link/note rather than a location.

### Not found / unknown

No public lost & found info for dining halls, academic buildings (Tech, Ford, Kellogg Global Hub, etc.), Welsh-Ryan / Ryan Field events, or the Wildcard Office. Found items in academic buildings probably go to building managers or NUPD. One example: the IT building at 1800 Sherman keeps a lost & found bin and sends valuables (wallets, phones) to a manager.

## Policy observations

1. **Holding periods vary by desk** (30 days vs. 6 months). Our single global `flagAfterDays` setting isn't enough.
2. **Items move between desks.** NUPD's list includes items "found *or turned in*" at other addresses, so items likely get handed to NUPD. Unconfirmed: whether Norris or the area desks forward valuables (wallets, phones) to NUPD.
3. **Identified vs. unidentified items.** NUPD only publishes items *without* identification; when an owner can be identified (e.g. a wallet with a Wildcard), they contact the owner directly.
4. **Proof of ownership / ID check** at pickup is standard practice at NUPD.
5. **Disposal is regulated.** NUPD disposes "in accordance with state and local statutes." The Illinois Estrays and Lost Property Act (765 ILCS 1020) covers found property. NUBox doesn't need to implement law, but a record of when and how each item was disposed of supports the desks' compliance.
6. **Typical items** on NUPD's current list: wallets (most common), phones, keys, earbuds/AirPods, an iPad, a backpack, jewelry, and prop weapons. This matches our category list well; prop weapons fit "Other."

## Recommended additions to the NUBox spec

**Strongly recommended**
1. **Per-location holding period.** Each location sets its own retention (Norris 30, NUPD 180…), and the overdue flag uses that location's value.
2. **Campus field on locations** (Evanston / Chicago), with a campus filter for users.
3. **Location info for users:** hours, phone/email, and pickup instructions (e.g. "By appointment. Bring a government-issued photo ID"), shown on each item.
4. **Transfers between locations.** Add a **Transfer** action (e.g. Norris → NUPD) and keep the item's location history, so users always know where the item is now.
5. **Disposal record.** When an item is donated or discarded, record the date, method, and admin.
6. **Activity history per item:** who created, edited, transferred, released, or disposed of it, and when. This delivers the "trackable" goal.

**Worth considering**
7. **"Owner identified / notified" marker** for items with a name or ID, so staff know someone was contacted. Item still appears publicly with a generic title.
8. **Pickup verification:** an "ID checked" checkbox in the pickup form.
9. **Mobile-first admin entry.** Desk workers will most likely snap a photo and log items from a phone at the desk, so adding an item has to be fast on mobile.
10. **"Other places to check" page** with links to the shuttle vendor line, NUPD contact, and library desks for items not in NUBox.

## Questions to ask desk staff

The biggest risk to NUBox is adoption, not technology. Talking to one or two desks first (Norris Center Desk is the obvious pilot) would answer:

- How do you log items today (paper log, spreadsheet, nothing)?
- Do valuables (wallets, phones, IDs, laptops) stay with you or go to NUPD? After how long?
- What do you do with found Wildcards?
- Do you contact owners when there's a name/ID on the item?
- What proof do you ask for before releasing an item?
- What happens at the end of the holding period, and who does it?
- Who would be the admins, and would a supervisor be willing to be a super-admin?
- Would desk workers use a phone or a desk computer to log items?

## Sources

- [NUPD: Found Property, How to Reclaim](https://www.northwestern.edu/up/community-services/found-property.html)
- [NUPD: Found Property (reclaim details)](https://www.northwestern.edu/up/community-services/found-property-how-to-reclaim.html)
- [Norris University Center: Building Policies & Operations](https://www.northwestern.edu/norris/about/operations.html)
- [Northwestern Recreation: General Policies (2015 page)](https://nurecreation.com/sports/2015/8/28/policiesgeneral.aspx)
- [NU Libraries: "Does the library have a lost and found?" (updated 2021)](https://northwestern.libanswers.com/faq/290490)
- [Residential Services: Area Desks](https://www.northwestern.edu/living/services/area-desks/)
- [Transportation & Parking: Shuttle FAQs](https://www.northwestern.edu/transportation-parking/shuttles/routes/policies/faqs.html)
- [Intercampus shuttle brochure (2024)](https://www.northwestern.edu/transportation-parking/docs/intercampus-shuttle-brochure.pdf)
- [Illinois Estrays and Lost Property Act, 765 ILCS 1020](https://ilga.gov/ftp/ILCS/Ch%200765/Act%201020/076510200F.html)
