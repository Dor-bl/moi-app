# Project Guidelines for Claude

The pull request workflow in [`GEMINI.md`](GEMINI.md) applies here too: start from a fresh `origin/main`, work on a descriptive branch, commit, push, and open a PR with a clear description.

## Rules for Auth and Concurrency Design

Distilled from the [PR #50 post-mortem](docs/postmortems/pr-50-account-deletion.md), where a ~60-line account-deletion feature grew into a 2,000-line distributed locking engine in `localStorage` over 49 review rounds.

1. **Respect SDK ownership.**
   - Do NOT intercept or silently swallow storage adapter reads/writes (`setItem`, `removeItem`) to fight an auth SDK's internal lifecycle.
   - Let the SDK (e.g. Supabase, Firebase) manage its own tokens, timers, and storage natively.
   - React to session changes via the official auth state listener (`onAuthStateChange`), rather than hacking storage keys.

2. **Avoid multi-tab over-engineering.**
   - Do NOT implement distributed mutexes, custom Web Locks emulators, tombstones, or two-phase commit protocols in `localStorage` unless the core application domain explicitly demands it.
   - For user-triggered destructive actions (delete account, sign out), standard API calls + local state resets (`completedItems = {}; saveState();`) + native SDK `signOut()` are sufficient for 99.9% of real-world use cases.

3. **Drop in-flight races simply (generation counters).**
   - To prevent background fetch/sync responses from overwriting local state after logout/deletion, use a simple monotonically increasing counter (`authGeneration++`). Discard any response whose captured generation does not match the current one. Do not build complex locks to solve this.

4. **Push back on reviewer hallucinations and micro-edge-cases.**
   - If an automated review bot (like Copilot) repeatedly flags extreme multi-tab concurrency races that require hundreds of lines of custom adapters to satisfy, STOP.
   - Question whether the edge case exists in realistic usage. If satisfying the edge case compromises code maintainability, prioritize simplicity and explain the architectural trade-off instead of adding more patches.
   - When a feature that should take ~70 lines reaches 500 lines, stop and rethink the architecture rather than adding more patches.
