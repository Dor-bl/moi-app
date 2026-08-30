## 2024-05-30 - [Targeted DOM Update]
**Learning:** Full list re-renders in vanilla JS apps for minor state changes (like toggling a checkbox) are significant bottlenecks ($O(N)$).
**Action:** Prefer targeted DOM updates ($O(1)$) using class toggles when the rest of the list structure remains static.
