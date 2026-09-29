---
name: pr-status
description: Post a status comment on a pull request after each round of work on it, so the owner can see where it stands from GitHub without reading the session. Use on any PR you opened or are driving, right after you push fixes for a review round, when CI on the current head changes state, and when a merge is followed by a deploy or live check whose result the owner is waiting on.
---

# PR status comments

The owner follows work on GitHub, not in sessions. A fix explained only in the session is invisible to them; findings answered one thread at a time are scattered across ten. After each round, one comment on the PR says where it stands.

This came out of PR #146, where the owner had to ask twice for exactly this: *"On GitHub, it's easier to see if it was addressed or not, with a TL;DR or action items for me."*

## When to post

- **After a review round** — once for the round, after the fixes are pushed. Not once per fix.
- **When CI on the current head changes state**, red to green or green to red.
- **After a merge, when something runs because of it** — a deploy, a live check. Report the result, including a failure that is not this PR's, and what you did about it.
- **When a review bot's summary disagrees with its own findings**, or names something the diff does not contain. Say what you checked and what you found. A summary's prose is not a finding, but a specific noun in it is worth chasing: on #146 one led to a real bug.

Do **not** post for: a green re-run of an already-green head, an echo of your own comment, a Vercel or other bot status edit, or a check-in where nothing changed. Silence when nothing changed is correct.

## Shape

**TL;DR** — one line. Mergeable or not, and why.

**Your action items** — numbered. Mark each **blocking** or *not blocking*. If the only item is "approve and merge", say exactly that. Put here anything only the owner can do — a decision, a credential, a dashboard setting, a manual check — with the exact command when there is one.

**What changed** — a table, finding → commit SHA. One row per finding, including the ones answered by explaining rather than changing code. On the first status comment of a PR, include every earlier round; after that, only this round's.

**Deliberately not done** — anything a finding asked for that you declined or deferred, the reason, and where it lives now (an issue, a follow-up in a decision record).

End with the Claude Code attribution footer.

## Rules

- **The comment is the record.** If the owner reads nothing else on the PR, they should know whether to merge and what, if anything, is theirs.
- **Say "nothing is open" in those words when it is true.** An absent list reads as an omission, not a statement.
- **Verified, not recalled.** Re-read CI and the review threads on the current head before posting. Name SHAs, not "the latest commit".
- **Do not narrate.** No per-fix comments and no progress updates between rounds. The diff records the work; this comment records the state.
- **Also say it in the session**, briefly — the owner may be there too. But the PR comment comes first, and the session reply can point at it.
