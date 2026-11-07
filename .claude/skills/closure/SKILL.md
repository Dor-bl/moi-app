---
name: closure
description: "End-of-session check that reports what is still open: unpushed work, PRs that are draft, red, conflicted or unmerged, merged changes whose live result was never checked, caveats and 'not checked' items stated earlier, questions the user never answered, and pending subscriptions or check-ins. Read-only. Use when the user types /closure or asks 'is anything left open?', 'are we done?' or 'what's still pending?' at the end of a session."
---

# Closure

Answers one question: **is anything from this session still open, and whose move is it?** The user should be able to close the session knowing nothing was dropped, or know exactly what was.

This skill only reports. It does not fix, push, merge, comment or message anyone. If something should be done, list it and let the user decide.

## What to check

Work through these in order and keep the evidence for each, so the report can say how an item was found rather than assert it.

1. **Local work.** `git status -sb`, `git fetch -q` followed by `git log HEAD --branches --not --remotes --oneline` (every local commit that is on no remote branch, including a branch that was never pushed and commits made on a detached HEAD), `git stash list`, and `git branch -vv`. Anything uncommitted, stashed, committed but unpushed, or on an unfinished feature branch with no PR is open. These commands list candidates, not verdicts: count only work this session created or touched, never apply the no-PR rule to the default branch (`main`), and report an older stash or an unrelated local branch on a separate "not from this session" line instead of as open. A container is reclaimed when the session ends, so unpushed work is lost work.
2. **Pull requests from this session.** For every PR this session opened or drove, read its current state, not the memory of it: draft or ready, merged or closed, CI on the current head, merge conflicts, unresolved review threads. A draft PR, a red check, a conflict, or an open thread is open. A merged PR is closed.
3. **Merged but not confirmed live.** For each merged change that has a deployed result (app code, data, a migration, config), did the session check it in production? A change merged but never looked at there is open, and the item says what to look at. Where the repo has a live site (`moicheck.nl`), check it directly rather than assuming. A change with no deployed result (a skill, docs, tests only) is not applicable: say so in one line and name what verifies it instead, such as CI or the file being discoverable in the next session. Do not leave it open for want of a production check.
4. **Caveats the session itself stated.** Re-read this session's own earlier messages for "not checked", "unverified", "left out", "couldn't reach", "I'll", "next step", and any test that failed for environmental reasons. Each one is either since resolved (say how) or still open (carry it into the report). Do not drop a caveat because it was already mentioned once.
5. **Unanswered questions.** Anything asked of the user that they did not answer, and any "want me to...?" offer they never took up. These are the user's to decide; list them as such, once.
6. **Background state.** PR subscriptions still active on merged or closed PRs, pending `send_later` check-ins, scheduled tasks created this session, and queued task suggestions. Stale ones are open; say what would clear them.
7. **Repo-specific follow-ups.** Where the work touched `EVENTS` in `js/data.js`, check `docs/routines/monthly-events-refresh.md`: the log table has a row for the change, and every entry marked unverified at source is named as such. `npm run events:check` still exiting non-zero because of other lapsed entries is the routine's job, not this session's, and is not an open item unless this session caused it.

## What does not count as open

- Work the user explicitly declined or deferred. Mention it in one line under "Declined", so it is visible that it was a decision rather than an oversight.
- Pre-existing failures that this session did not cause and did not claim to fix. If they were reported at the time, they are not new.
- A PR waiting only on a reviewer the user is responsible for: it is the user's move, so list it under "Yours", not as something dropped.

## Report format

Keep it short. Lead with the answer.

```
Closure: <nothing open | N items open | incomplete>

Open — mine
- <item>: <what is wrong, evidence, what would close it>

Open — yours
- <item>: <the decision or action needed>

Closed
- <one line each, only what a reader might wonder about>
```

- If nothing is open, say **"Nothing open."** and give the short Closed list. Do not invent items to look thorough.
- If a check could not run (GitHub or the live site was unreachable, a tool was missing) and nothing else is open, the headline is **"incomplete"**, not "Nothing open": say which checks are missing and what would settle them. When other items are open, list the unrun checks beside them.
- Put each open item under whoever has the next move. "Mine" items are things this session can still do on request; "Yours" items need the user.
- Name PRs by number and link, and say what state they were in when you read them, with the time if it could change.
- State plainly anything you could not check, and why (a blocked host, a missing tool), rather than skipping it silently.
- Never say something is done on the strength of having been told so earlier in the session. Re-read the state.
