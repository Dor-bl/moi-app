# Weekly Bucket List Suggestion Routine

A Claude Routine fires every **Saturday at 10:00 Europe/Amsterdam** (`0 8 * * 6` UTC),
scans the current `BUCKET_LIST` in [`js/data.js`](../../js/data.js), and opens a pull
request adding **one** new item.

This file is the authoritative spec for what a good suggestion looks like. Edit it here
rather than editing the Routine prompt — each run reads this file first and follows it.

## The core criterion: the Groningen Area

An item must be doable in the **city of Groningen or the province of Groningen**, on a
day trip from Stad without needing to stay overnight. Concretely:

- **In scope**: anything inside the city; the province (Ten Boer, Winsum, Uithuizen,
  Delfzijl, Appingedam, Leek, Zuidhorn, Bourtange, Ter Apel, Lauwersoog, Pieterburen…);
  and the Wadden coast / Waddenzee activities that depart from a Groningen harbour.
- **Edge cases that are fine**: Schiermonnikoog and the mudflats reached via Lauwersoog,
  and the wadlopen routes that start on the Groningen coast.
- **Out of scope**: Amsterdam, Utrecht, Rotterdam, Den Haag, Friesland-only or
  Drenthe-only destinations, and generic "anywhere in the Netherlands" experiences.

## Other requirements

1. **No duplicates.** It must not repeat, or substantially overlap with, any of the
   existing items — check titles *and* tips, in both languages.
2. **Real and verifiable.** The place, event, or tradition must actually exist. Verify it
   with a web search before writing it up. Do not invent locations.
3. **Accurate coordinates.** `coords` is `[lat, lng]` and must land on the real spot, so
   the map pin is not misplaced.
4. **Prefer under-represented categories.** Use one of the five existing categories
   verbatim (EN + NL). When several candidates are equally good, favour the category with
   the fewest items — as of writing, *Nature & Wildlife* (2) and *Daily Life* (6) are the
   thinnest.
5. **Expat-flavoured, not touristy.** The tip should read like a local telling a newcomer
   why they do this — the same voice as the existing `tip` fields.
6. **Bilingual.** `title` and `tip` (and `urlLabel`, if a `url` is included) need natural
   EN and NL text. The NL is not a literal translation; it should read like Dutch.

## Item shape

Append to the end of `BUCKET_LIST`, keeping the existing style:

```js
{
    id: '<next sequential number as a string>',
    coords: [53.xxxx, 6.xxxx],
    category: { en: 'Nature & Wildlife', nl: 'Natuur & Dieren' },
    title: { en: '...', nl: '...' },
    tip: { en: '...', nl: '...' },
    // Optional, only when there is a genuinely useful official page:
    url: 'https://...',
    urlLabel: { en: '... 🦭', nl: '... 🦭' }
}
```

The five categories, exactly as they appear in `js/data.js`:

| EN | NL |
| --- | --- |
| Food & Drink | Eten & Drinken |
| Culture & Sights | Cultuur & Bezienswaardigheden |
| Daily Life | Dagelijks Leven |
| Groningen Classics | Groningse Klassiekers |
| Nature & Wildlife | Natuur & Dieren |

## What else the change has to touch

- **`README.md`** hardcodes the item count in two places ("all 32 locations" and
  "**32 Curated Groningen Bucket List Items**"). Both must be bumped to the new total.
- **`MILESTONES`** needs no change — its top tier is derived from `BUCKET_LIST.length`.
- **`CATEGORY_BADGES`** needs no change — badges unlock per category dynamically.
- Run `npm ci && npm run lint` (ESLint is the CI gate) before pushing.

## Run discipline

- **One open suggestion at a time.** Before doing anything, check for an open PR whose
  head branch starts with `suggest/bucket-list-item-`. If one exists, the routine stops
  and reports it, rather than stacking a second suggestion.
- Also skim recently closed suggestion PRs — an item that was already proposed and
  rejected should not come back.
- Branch: `suggest/bucket-list-item-<YYYY-MM-DD>` off the latest `origin/main`.
