## 2024-06-03 - DOM Insertion Performance
**Learning:** Using multiple `.appendChild()` calls inside loops in Vanilla JS causes unnecessary repetitive DOM reflows and repaints, which is a significant performance bottleneck in list-heavy applications.
**Action:** Always batch DOM insertions using `document.createDocumentFragment()` before appending to the live DOM.
