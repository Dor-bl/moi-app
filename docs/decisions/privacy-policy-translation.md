# The privacy policy in Dutch

**Status:** done. `privacy.html` (English) and `privacy-nl.html` (Dutch) are the same document
in two languages.

## Why

MoiCheck is bilingual everywhere else, and it is aimed at people who have just moved to
Groningen — a group that includes plenty of people who read Dutch more comfortably than
English, and whose rights under the AVG are the subject of the document. A policy that only
some of its readers can read is doing half its job. It is also the document most likely to be
read by someone who is already uneasy about what happens to their data, which is the worst
moment to hand them a language barrier.

The sponsor page was translated first, and the gap was awkward in the other direction: a Dutch
page about money linking out to an English page about data.

## Two files, not one page that switches

The same reasoning as the sponsor page ([`sponsorship.md`](sponsorship.md)), and it applies
harder here:

- The CSP in `vercel.json` carries no `'unsafe-inline'` in `script-src`. An in-page switcher
  needs a `js/` file whose only job is hiding `<div>`s, and a privacy policy should not need a
  script to render its own text — least of all one that would make half the document invisible
  if the script failed.
- Two URLs are indexable in two languages; one URL with hidden markup is indexable in one. The
  two declare each other with `hreflang`, and both are in `sitemap.xml`.
- Without JavaScript a toggled page shows one language or both. Two files always show exactly
  one, and the one the reader asked for.

`app.js` points the footer link at the file matching the current language, so switching the app
to Dutch and then opening the policy lands on the Dutch one.

## Which version governs

Neither claims precedence over the other, and that is deliberate. The usual move — "in case of
discrepancy the English version prevails" — would be a way of saying the Dutch text is
decorative, which is both untrue and a poor thing to tell a Dutch reader of a document about
their own rights. It is also doubtful that such a clause would do much against a Dutch
consumer, since the obligation under Article 12 AVG is to inform *that reader* clearly.

So both versions open by saying the same thing: this is one document in two languages, they
describe the same practice, and a discrepancy is a mistake to report and fix rather than a
difference in what we do. That is an accurate description of the intent, and it puts the burden
where it belongs — on us keeping them in step.

## Keeping them in step

Drift is the obvious failure, and the likely form is not malice but attention: whoever edits the
policy reads one language, changes it, and does not open the other file.

`tests/policy-consistency.test.js` was already checking that the English policy agreed with
itself. It now runs those checks against both files and adds three across them: the same section
numbers, the same processors named in §2, and the same "last updated" date. The date check is
the cheap one that catches the most, since any real edit moves it.

**What the test cannot do is read.** It will not notice that a Dutch paragraph says the opposite
of its English counterpart, or that a new sentence was added to one and not the other inside an
existing section. It catches the structural half so review can spend its attention on the half
no test can reach. Treat a green run as "nothing obviously fell off", not as "the translation is
correct".

## The one piece of CSS the English page does not need

Dutch compounds are long, unbreakable tokens — *gebruiksstatistieken*,
*evenementenweergave*, *toestemmingsregel* — and one of them per column is enough to push a
table's minimum width past a phone screen, which scrolls the whole page sideways. The English
text has no words this long, so `privacy.html` needs nothing for it.

`privacy-nl.html` sets `hyphens: auto` on table cells. The `lang="nl"` on the `html` element is
what tells the browser which patterns to use, and breaking the words where Dutch actually breaks
them lowers each column's minimum width without making the text look chewed.

Two alternatives that look right and are not, both measured rather than assumed:

- `overflow-wrap: break-word` does not reduce a cell's minimum width at all. The page overflowed
  by exactly the same 130px at 320px with it as without it.
- `overflow-wrap: anywhere` does reduce it — to nothing. The table layout then starves the two
  narrow columns down to about three characters a line, which fits the screen and cannot be
  read.
