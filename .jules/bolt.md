## 2026-08-31 - DOM Event Listeners in Render Loops
**Learning:** Attaching event listeners inside frequent DOM re-render cycles (like inside `forEach` in `renderList()`) is a memory-intensive anti-pattern. Each render creates new closures and event listeners, increasing memory usage and potentially causing leaks if old DOM elements aren't perfectly garbage collected.
**Action:** Use Event Delegation. Attach a single event listener to the parent container during initialization and use `event.target.closest()` to determine the clicked element.

## 2026-08-31 - Redundant Array Filtering in Render Functions
**Learning:** The application frequently filters `BUCKET_LIST` by category inside render functions (`renderList`, `renderFilterPills`, etc.) and event handlers (`checkBadgeUnlocks`). While converting O(N) filters to an O(1) object map lookup removes a linear scan, for small static arrays this is a readability win, not a major performance bottleneck (as subsequent operations like DOM manipulation or secondary filtering often remain O(N) and dominate processing time).
**Action:** Group data into an O(1) map at initialization for improved readability and to eliminate redundant inline filtering. However, prioritize these optimizations (indexing by key) primarily when the collection is large or the lookup sits inside another tight loop, as linear scans over small arrays are fast.

## 2026-09-02 - DOM Node Caching in Re-Renders
**Learning:** Vanilla JS rendering loops that rebuild entire lists on state change (e.g., toggling a checkbox triggers `renderList()`) cause expensive DOM node destruction and string-parsing re-creation. Creating DOM nodes via `document.createElement()` and `innerHTML` over and over is a bottleneck for interaction performance.
**Action:** Use a `Map` cache (e.g., `cardCache`) to store generated DOM nodes keyed by item ID. On subsequent renders, retrieve the cached node, update its dynamic classes/attributes (like `.completed`), and only update text content if necessary (e.g., when the language changes).
