# Post-Mortem & Architecture Lesson: PR #50

### Executive Summary
PR #50 started as a ~60-line feature to allow users to delete their account and data. Over **49 review passes** and **53 commits**, it devolved into a **2,365-line (+2,125 lines)** distributed locking and transaction engine in client-side `localStorage`. It ended with Copilot flagging `🔵 Needs a closer look` because the complexity had become unmaintainable and unverifiable.

---

### What Went Wrong

#### 1. The "AI-vs-AI Feedback Loop" (Uncritical Acceptance of Edge Cases)
* **The Trap:** Copilot's reviewer model generated increasingly theoretical multi-tab edge cases:
  > *"What if Tab A deletes the account while Tab B has an in-flight token refresh, Tab C is in an OAuth callback, Web Locks API is unavailable, and localStorage throws QuotaExceededError?"*
* **The Mistake:** Instead of evaluating whether these theoretical edge cases were realistic or warranted in a lightweight expat bucket list app, Claude treated every Copilot comment as a hard engineering defect and added more client-side state machines to address it.
* **The Spiral:** Each new layer of guards introduced new state transitions, which generated new race conditions for Copilot to flag, creating an infinite 49-round loop.

#### 2. Fighting the Third-Party SDK Lifecycle
* `js/auth.js` wrapped `localStorage` in a custom `sessionStorageAdapter` that silently intercepted and blocked `setItem` and `removeItem` mutations (`sessionWriteRefused`, `sessionRemovalRefused`).
* **The Consequence:** Supabase's `gotrue-js` SDK maintains its own in-memory session caches, broadcast channels, and timer-driven background token refreshes (`autoRefreshToken: true`). By silently swallowing storage writes without notifying the SDK, the internal state of the SDK diverged from storage.
* Trying to enforce multi-tab consistency by monkey-patching storage from the *outside* of the SDK is fundamentally fragile.

#### 3. Building Distributed Consensus in `localStorage`
* Over the 49 passes, Claude implemented:
  * An emulation layer for the Web Locks API.
  * Tombstone records with monotonic expiry timestamps.
  * A migration system for legacy deletion record formats in `localStorage`.
  * Custom cross-tab messaging on `BroadcastChannel` to bypass native `auth.signOut()`.
  * Multi-tab token whitelists and sign-out guards.
* **The Reality:** A browser's `localStorage` is not an ACID-compliant distributed database. Trying to make it one for a single "Delete Account" button is classic architectural over-engineering.

#### 4. The Sunk-Cost Patching Trap
* When a feature that should take ~70 lines reaches 500 lines, that is a signal to **stop and rethink the architecture**, not to add another 500 lines of patches.

---

### Key Metrics Comparison

| Metric | PR #50 (Over-Engineered) | PR #55 (Simplified) |
|---|---|---|
| **Lines in `js/auth.js`** | **2,365 lines** (+2,125) | **340 lines** (+75) |
| **Total Repo Diff** | **+2,459 lines** | **+379 lines** |
| **Review Iterations** | **49 passes, 53 commits** | **1 clean pass** |
| **Copilot Verdict** | `🔵 Needs a closer look` (Refused to approve) | Clean / Green |

---

### Core Guidelines for Future Tasks

The rules distilled from this post-mortem live in [`CLAUDE.md`](../../CLAUDE.md) at the repository root, so coding agents load them on every task.
