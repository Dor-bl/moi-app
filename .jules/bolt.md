## 2024-05-24 - High-Frequency DOM Recreation
**Learning:** This codebase relies on a pure functional re-rendering approach for Vanilla JS (`renderList` completely clears and rebuilds the DOM on every state change, such as toggling a checkbox). This pattern is highly susceptible to layout thrashing.
**Action:** Always batch DOM manipulations using `DocumentFragment` when modifying functions like `renderList` to ensure we don't trigger reflows for every single element created in these high-frequency render loops.
