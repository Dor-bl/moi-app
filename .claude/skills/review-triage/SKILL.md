---
name: review-triage
description: "How to triage Copilot and other automated review findings on a PR you opened. Covers finding a review that did not notify you, reading its summary as carefully as its threads, verifying the claim and its mechanism before acting, and replying where the finding lives. Use when a review bot has reviewed your PR, when asked to address review comments, or after pushing to a PR a bot reviews."
---

# Triaging automated review findings

On PRs 145 and 166, how a finding was presented was a poor guide to whether it was real. Four findings appeared only in a review's summary and never as an inline thread, and all four were real bugs. One sat under "Previously missed", labelled "in code that hasn't changed since last review", in a review whose own findings count said "None".

That is a small sample from one feature and one reviewer, not a base rate. The rule is not "believe the bot". It is **let checking decide, never presentation**: not the position, the heading, the severity label, or the bot's reputation, in either direction.

## 1. Find the review

A review's arrival is not reliably delivered to you as an event. On 145 two reviews produced none and were found only by looking; on 166 one did arrive. Timing is unpredictable too: one landed nine minutes after CI went green, another about six hours after a push. So do not read silence as "no review", and do not wait out a guessed window. After a push, end the turn and rely on a scheduled check-in if you have one.

To look: list the PR's check runs for a `copilot-pull-request-reviewer` run newer than the last one you handled, then list the review threads and note which are resolved, then list the reviews and **read the newest body**. Reviews list oldest first, so the newest is on the last page.

## 2. Read the summary, not only the threads

A review body can carry findings that have no thread: a per-file table, a "previously missed" section, plain prose. Read all of it. The headline count and the prose can disagree, so trust neither alone.

When the prose names an area but gives no location or failure, treat the noun as a lead rather than noise. Chase the one with no test behind it. Sometimes the code is already correct: on 145 a summary named "malformed stored dates", the existing fallback handled every shape, and the right outcome was a test proving it and **no code change**. Do not change working code to answer prose that gives no location, failure or repro.

## 3. Verify the claim and the mechanism before acting

- **Reproduce first.** Write the failing case, watch it fail, then fix. A fix you never saw fail proves nothing.
- **Assert your premise, not just the outcome.** A reproduction that fails to reproduce usually means your setup is wrong, and only a premise assertion says so.
- **Include a valid-input control** in any suite that feeds bad input. If the healthy case fails too, the bug is in the probe.
- **Check the stated mechanism.** It can be wrong while the conclusion is right. On 145 a finding blamed undefined globals; in a classic script the function declarations are hoisted and survive, and the real cause was a `let` stuck in its temporal dead zone, which made the impact larger. Say so in the reply and fix the real cause.
- **Look for the sibling case.** A fix often closes one shape and leaves its neighbour (a guard on "has ended" missed "daily hours closed", then "re-render while pending"). If a fix draws a new finding in the same area, suspect the shape of the fix, not just the finding.

## 4. Verification can say no

This does not override [`CLAUDE.md`](../../../CLAUDE.md) rule 4 or the "decline unrealistic edge cases" guidance in [`code-review`](../../../.github/skills/code-review/SKILL.md). A finding that needs hundreds of lines to satisfy a multi-tab race is still declined with the trade-off explained; the PR #50 post-mortem is what happens otherwise.

Keep three outcomes distinct, and say which one it is: **not real** (you checked, the code is already right), **real but not worth it** (declined, with the cost stated), **real** (fixed). On 145 one suggestion was declined, and the reasoning was documented and pinned by a test; that was the process working, not failing.

## 5. Reply where the finding lives

- A threaded finding gets a reply on its thread. Resolve it once the fix is pushed or the reply explains why not.
- A summary-only finding has no thread, so answer it in the PR status comment, naming the finding and the commit ([`pr-status`](../pr-status/SKILL.md) has the shape).
- Say what you **checked**, not just "fixed", including when the mechanism differed or the finding turned out already handled. A reply that only says "done" cannot be told apart from agreeing without looking.
- Silence is right when nothing changed and no review arrived.
