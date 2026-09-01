## 2026-08-31 - DOM Event Listeners in Render Loops
**Learning:** Attaching event listeners inside frequent DOM re-render cycles (like inside `forEach` in `renderList()`) is a memory-intensive anti-pattern. Each render creates new closures and event listeners, increasing memory usage and potentially causing leaks if old DOM elements aren't perfectly garbage collected.
**Action:** Use Event Delegation. Attach a single event listener to the parent container during initialization and use `event.target.closest()` to determine the clicked element.

## 2026-08-31 - Redundant Array Filtering in Render Functions
**Learning:** The application frequently filters `BUCKET_LIST` by category inside render functions (`renderList`, `renderFilterPills`, etc.) and event handlers (`checkBadgeUnlocks`). This leads to O(N) redundant filtering operations on every state change or view switch, which is inefficient.
**Action:** Replace redundant O(N) array filtering operations with an O(1) object map by grouping the data once at initialization (e.g., `itemsByCategory`). Use this memoized data structure for lookups during render cycles.
