---
name: review-triage
description: "How to triage Copilot and other automated review findings on a PR you opened. Covers finding a review that did not notify you, reading its summary as carefully as its threads, verifying the claim and its mechanism before acting, and replying where the finding lives. Use when a review bot has reviewed your PR, when asked to address review comments, or after pushing to a PR a bot reviews."
---

# Triaging automated review findings

On PRs 145 and 166, how a finding was presented was a poor guide to whether it was real. Four findings appeared only in a review's summary and never as an inline thread, and all four were real bugs. One sat under "Previously missed", labelled "in code that hasn't changed since last review", in a review whose own findings count said "None".

That is a small sample from one feature and one reviewer, not a base rate. The rule is not "believe the bot". It is **let checking decide, never presentation**: not the position, the heading, the severity label, or the bot's reputation, in either direction.

## 1. Find the review

Do not count on an event announcing a review. Of the eight reviews seen on 145, 166, 173, 206 and 208, every one with an inline comment arrived as an event and none without one did. That is a correlation in a small sample, with no established cause. It still points at the worst case: a review with no inline comment is the least likely to announce itself, and on 145 one such review held a real finding in its summary alone. Timing is unpredictable too: one landed nine minutes after CI went green, another about six hours after a push. So treat silence as no information, do not wait out a guessed window, and after a push end the turn and rely on a scheduled check-in if you have one.

To look: list the PR's reviews and **read the newest body**, and list the review threads and note which are resolved. Reviews list oldest first, so the newest is on the last page. Each review records the commit it reviewed, so compare it with the last review you handled rather than with the clock. A `copilot-pull-request-reviewer` check run is only a hint that a review is running or has just finished: check runs belong to a head commit, so once you push, the run for the earlier head drops out of the listing while its review stays. A missing run proves nothing.

Greptile does not report through those listings. On 199, 203, 206, 208 and 209 its verdict was
written into the PR description, in a block at the end that starts at `<!-- greptile_comment -->`
and holds a confidence score, a summary and the last commit it reviewed. On 199, 206 and 208 it left
no review, comment or thread. So fetch the PR itself and read that block, and compare its last
reviewed commit with the head, because the block shows only its latest review. All five scored 5/5,
so how it reports a real finding has not been seen: read the block every time, and do not take a
passing Greptile check run as its verdict.

The block sits in the description you write, and Greptile rewrites it. On 209 the first review
appended its block to a body that quoted that marker in prose, and left the prose alone. The
re-review after a push cut the body at the quoted marker and replaced everything after it, which
fits it matching from the first marker, though that is not confirmed. So never write the marker
out in your own PR text (call it the `greptile_comment` marker), and when you edit the
description, send the block back as it is. Whether an edit that leaves the block out drops it has
not been tested.

CodeRabbit does not report through the reviews listing either. On 209 and 212 it posted one comment
on the PR and edited it in place, from "review in progress" to its result, and it added a "Summary
by CodeRabbit" block to the description beside Greptile's. Both results were "No actionable
comments" and the reviews listing and threads stayed empty, so how it reports a real finding has not
been seen: read the comment and the description every time, and treat its description block as you
would Greptile's. It skips drafts and says so in that same comment, and its check run then reads
skipped. The comment also holds tick boxes (a manual review, committing to the branch, "Autofix").
Do not tick them: Autofix lets it push to the branch, and on 212 it was seen switched on though the
agent working on the PR had not touched it.

## 2. Read the summary, not only the threads

A review body can carry findings that have no thread: a per-file table, a "previously missed" section, plain prose. Read all of it. The headline count and the prose can disagree, so trust neither alone.

When the prose names an area but gives no location or failure, treat the noun as a lead rather than noise. Chase the one with no test behind it. Sometimes the code is already correct: on 145 a summary named "malformed stored dates", the existing fallback handled every shape, and the right outcome was a test proving it and **no code change**. Do not change working code to answer prose that gives no location, failure or repro.

## 3. Verify the claim and the mechanism before acting

- **Reproduce first.** Write the failing case, watch it fail, then fix. A fix you never saw fail proves nothing. If it will not fail, confirm your premise; if that holds, the finding is not real.
- **Assert your premise, not just the outcome.** A reproduction that fails to reproduce usually means your setup is wrong, and only a premise assertion says so.
- **Include a valid-input control** in any suite that feeds bad input. If the healthy case fails too, the bug is in the probe.
- **Check the stated mechanism.** It can be wrong while the conclusion is right. On 145 a finding blamed undefined globals; in a classic script the function declarations are hoisted and survive, and the real cause was a `let` stuck in its temporal dead zone, which made the impact larger. Say so in the reply and fix the real cause.
- **Look for the sibling case.** A fix often closes one shape and leaves its neighbour (a guard on "has ended" missed "daily hours closed", then "re-render while pending"). If a fix draws a new finding in the same area, suspect the shape of the fix, not just the finding.

## 4. Verification can say no

This does not override [`CLAUDE.md`](../../../CLAUDE.md) rule 4 or the "decline unrealistic edge cases" guidance in [`code-review`](../../../.github/skills/code-review/SKILL.md). A finding that needs hundreds of lines to satisfy a multi-tab race is still declined with the trade-off explained; the PR #50 post-mortem is what happens otherwise.

Keep three outcomes distinct, and say which one it is: **not real** (you checked, the code is already right), **real but not worth it** (declined, with the cost stated), **real** (fixed). On 145 one suggestion was declined, and the reasoning was documented and pinned by a test; that was the process working, not failing.

## 5. Reply where the finding lives

- A threaded finding gets a reply on its thread. Resolve it once the fix is pushed or the reply explains why not.
- A summary-only finding has no thread, so answer it in the PR status comment. Name the finding and either the commit that fixes it or, when nothing changed, what you checked and the verdict ([`pr-status`](../pr-status/SKILL.md) has the shape).
- Say what you **checked**, not just "fixed", including when the mechanism differed or the finding turned out already handled. A reply that only says "done" cannot be told apart from agreeing without looking.
- Silence is right when nothing changed and no review arrived.
