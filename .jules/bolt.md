## 2026-08-31 - DOM Event Listeners in Render Loops
**Learning:** Attaching event listeners inside frequent DOM re-render cycles (like inside `forEach` in `renderList()`) is a memory-intensive anti-pattern. Each render creates new closures and event listeners, increasing memory usage and potentially causing leaks if old DOM elements aren't perfectly garbage collected.
**Action:** Use Event Delegation. Attach a single event listener to the parent container during initialization and use `event.target.closest()` to determine the clicked element.

## 2026-08-31 - Redundant Array Filtering in Render Functions
**Learning:** The application frequently filters `BUCKET_LIST` by category inside render functions (`renderList`, `renderFilterPills`, etc.) and event handlers (`checkBadgeUnlocks`). While converting O(N) filters to an O(1) object map lookup removes a linear scan, for small static arrays this is a readability win, not a major performance bottleneck (as subsequent operations like DOM manipulation or secondary filtering often remain O(N) and dominate processing time).
**Action:** Group data into an O(1) map at initialization for improved readability and to eliminate redundant inline filtering. However, prioritize these optimizations (indexing by key) primarily when the collection is large or the lookup sits inside another tight loop, as linear scans over small arrays are fast.

## 2026-09-04 - Leaflet Icon Memory Allocation
**Learning:** Instantiating new `L.divIcon` objects (along with complex inline HTML strings) for every item inside a frequent render loop (like `renderMapMarkers`) causes severe O(N) memory allocation and garbage collection pressure on map updates.
**Action:** Cache and reuse Leaflet icon instances (`L.divIcon`) when the visual states are finite (e.g., 'todo' and 'done'). Leaflet correctly handles sharing the same icon instance across multiple markers.
## 2026-09-05 - [DOM Node Caching for Re-renders]
**Learning:** Re-rendering long lists by destroying and recreating DOM nodes using `innerHTML` causes significant garbage collection overhead and rendering jitter.
**Action:** Use a `Map` to cache detached DOM elements and selectively update only dynamic state (e.g. CSS classes) when retrieving them, drastically improving render speeds.

## 2026-09-06 - Batching Supabase API Requests
**Learning:** Looping through multiple items and making individual `await supabaseClient.from(...).upsert(...)` calls causes network request waterfalls and leads to severe performance degradation due to sequential network requests.
**Action:** Prepare an array of payloads inside the loop, and then perform a single `upsert(missingInCloud)` call after the loop to dramatically speed up data synchronization.

## 2026-09-09 - Intl.DateTimeFormat caching
**Learning:** `Date.prototype.toLocaleDateString` rebuilds an `Intl.DateTimeFormat` on every call, so a cached formatter is roughly 50x faster per call. That ratio is per call and says nothing about whether it matters: the completed-items loop in `openProfileModal` is bounded by `BUCKET_LIST` (39 items) and runs once per modal open, so the measured saving is ~3ms behind a click — below a single frame. Worth doing for intent, not for speed.
**Action:** Cache `Intl.DateTimeFormat` per locale and call `formatter.format(date)`. Before quoting a multiplier, check how many times the loop actually runs — a large per-call ratio over a small bounded collection is still a rounding error. Select the cached formatter with an explicit branch, not `cache[key]`, when the key comes from user-controlled storage: a keyed lookup walks the prototype chain and returns a truthy non-formatter for keys like `constructor`, defeating any `|| fallback` and throwing at `.format`.
## 2026-09-11 - Date Parsing in Sort Comparator
**Learning:** Calling `new Date()` (via `memoryTimestamp`) inside an array `.sort()` comparator parses the same date string multiple times (O(N log N)). This causes unnecessary performance overhead and memory pressure.
**Action:** Use a Schwartzian transform pattern: pre-compute parsed values during the `.map()` step, perform the sort using those cached values, and keep the code readable.

## 2026-09-11 - Consecutive Array Filters
**Learning:** Partitioning an array into two subsets using two consecutive `.filter()` calls iterates through the array twice (2 * O(N)).
**Action:** Combine partitions into a single O(N) loop to halve array iterations during frequent re-renders. Avoid micro-optimizing subsequent `.forEach` DOM node loops, as readability takes precedence over imperceptible JS execution gains when DOM operations dominate.
