# Weekly Bucket List Suggestion Routine

A Claude Routine fires every **Saturday morning**, scans the current `BUCKET_LIST` in
[`js/data.js`](../../js/data.js), and opens a pull request adding **one** new item.

The schedule is `0 8 * * 6`, and cron is evaluated in UTC while Amsterdam switches between
CEST (UTC+2) and CET (UTC+1). So the run lands at **10:00 local during summer time and
09:00 local during winter time**. Nothing depends on the exact hour, so the schedule is
left alone across the DST changes rather than being re-pinned twice a year.

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

- **`README.md`** hardcodes the item count in two places — the map feature bullet
  ("all NN locations") and the list bullet ("**NN Curated Groningen Bucket List
  Items**"). Read whatever numbers are currently there and bump both; never assume the
  count, since it moves every time a suggestion is merged.
- **`MILESTONES`** needs no change — its top tier is derived from `BUCKET_LIST.length`.
- **`CATEGORY_BADGES`** needs no change — badges unlock per category dynamically.
- Run `npm ci && npm run lint` (ESLint is the CI gate) before pushing.

## Run discipline

- **One open suggestion at a time.** Before doing anything, check for an open suggestion
  PR. If one exists, the routine stops and reports it, rather than stacking a second.
- Recognise a previous suggestion by a head branch **starting with this routine's current
  outcome-branch prefix** — match on the prefix, never the exact branch name; see below
  for why, and for how to find the prefix, which is **not** guaranteed to be the one
  written here. As a secondary signal, the PR title starts with `feat: add` and ends with
  `to the bucket list` (#67 is `feat: add seal-spotting boat trip from Lauwersoog to the
  bucket list`). Match those two ends, not a fixed middle: the item name sits between
  them, unquoted. When the two signals disagree, trust the title: the branch prefix is the
  half that goes stale.
- Also skim recently closed suggestion PRs — an item that was already proposed and
  rejected should not come back.

## Push authorization (the thing that breaks this routine)

A routine run happens in a throwaway container that is destroyed when the run ends, so a
commit that only exists locally is lost. Two settings decide whether it can push:

- the routine must have the repo attached as a **source**, and
- it must have an **outcome branch** authorizing the push.

Neither can be set through the `create_trigger` MCP tool — they come from the routine's
configuration in the claude.ai Routines UI. Without them the run does all the work and
then fails at `git push` with HTTP 403. That is exactly what happened on the first test
run (2026-09-05): a verified item, lint passing, committed locally, and nothing to show
for it once the container was reclaimed.

Setting the source in the UI creates the outcome branch automatically, with an arbitrary
generated name unrelated to what this routine does — and **not** something to rename to a
tidier one, since the authorization is what makes the push work.

### The branch name is a prefix, not a literal

On push the platform appends a per-session suffix, so a run lands on something like
`<outcome-branch>-rywxf6`. Two consequences:

- The run still branches off `origin/main` as usual; it is the **branch name** that must
  start with the authorized prefix. Do not base the work on the outcome branch itself.
  The suffix that appears on push is expected, not an error.
- Anything looking for previous suggestion PRs must **match the prefix**. An exact-string
  comparison silently matches nothing, which would defeat the one-open-suggestion rule
  and stack a second PR every week.

### The prefix changes — look it up, do not trust this file

Reconfiguring the routine's source regenerates the outcome branch, so the prefix is not
stable and any copy of it written down goes stale silently. It has already drifted once:

| Prefix | Evidence |
| --- | --- |
| `claude/keen-edison` | what #67 actually pushed to (`claude/keen-edison-rywxf6`, merged 5 Sep 2026) |
| `claude/epic-hamilton` | the outcome branch configured on the Routine as of 15 Sep 2026 |

Nothing announced that change, and nothing failed loudly because of it: a prefix match
against the old name simply finds no previous suggestion, so the one-open-suggestion
guard passes when it should have stopped the run. The cost is silent duplicate PRs, which
is why the title check above is the signal to trust.

**So read the prefix off the Routine itself** — the outcome branch in the claude.ai
Routines UI, or `list_triggers`, where it appears at
`session_request.config.outcomes[].git_repository.git_info.branches`. Treat the table
above as history, not as configuration.

### Backstop

A run that still cannot push must paste the complete item and the README count change
into its final reply. The reply outlives the container, so the suggestion can be applied
by hand instead of being lost.

## Proposed so far

Kept here so a future run does not re-propose something already rejected.

| Item | Category | PR |
| --- | --- | --- |
| Seal-spotting boat trip from Lauwersoog | Nature & Wildlife | [#67](https://github.com/Dor-bl/moi-app/pull/67) |
