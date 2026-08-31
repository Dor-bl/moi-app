## 2026-08-31 - DOM Event Listeners in Render Loops
**Learning:** Attaching event listeners inside frequent DOM re-render cycles (like inside `forEach` in `renderList()`) is a memory-intensive anti-pattern. Each render creates new closures and event listeners, increasing memory usage and potentially causing leaks if old DOM elements aren't perfectly garbage collected.
**Action:** Use Event Delegation. Attach a single event listener to the parent container during initialization and use `event.target.closest()` to determine the clicked element.
