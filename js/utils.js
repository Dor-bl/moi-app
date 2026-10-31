// Utils Module - Shared Global Exports: getMilestoneObj, showBadgeToast, saveState, saveItems, createConfetti
// Dependencies: Expects MILESTONES, UI_TRANSLATIONS, currentLang, completedItems.

let toastTimeout = null;

function getMilestoneObj(count) {
    let current = MILESTONES[0];
    for (let milestone of MILESTONES) {
        if (count >= milestone.threshold) {
            current = milestone;
        }
    }
    return current;
}

function showBadgeToast(badge) {
    const badgeToast = document.getElementById('badgeToast');
    const badgeToastIcon = document.getElementById('badgeToastIcon');
    const badgeToastTitle = document.getElementById('badgeToastTitle');
    const badgeToastDesc = document.getElementById('badgeToastDesc');
    const badgeToastTag = document.getElementById('badgeToastTag');
    const t = UI_TRANSLATIONS[currentLang];

    if (!badgeToast) return;

    badgeToastIcon.textContent = badge.icon;
    badgeToastTitle.textContent = badge.title[currentLang];
    badgeToastDesc.textContent = badge.desc[currentLang];
    badgeToastTag.textContent = t.badgeUnlockedTag;

    badgeToast.classList.add('show');
    createConfetti(window.innerWidth / 2, 100);

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        badgeToast.classList.remove('show');
    }, 4500);
}

// Overwrites the stored progress with this tab's copy. Right for a reset — sign-out
// and account deletion empty completedItems and mean it — and wrong for a change,
// which is what saveItems below is for.
function saveState() {
    localStorage.setItem('moiCheckState', JSON.stringify(completedItems));
}

// The progress as stored right now, or null when it is missing or cannot be trusted
// (a write cut short, a hand edit, a shape that is valid JSON but not an object).
function readStoredState() {
    try {
        const stored = JSON.parse(localStorage.getItem('moiCheckState'));
        if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return null;
        return stored;
    } catch {
        return null;
    }
}

// Persists a change to these items without discarding changes made elsewhere.
// localStorage is shared between tabs and completedItems is not: it was read once at
// page load, so saveState() from a tab opened before another tab's tick serialises
// the store as it was and replaces that tick. Here the stored value wins for every
// item this tab did not touch, and this tab's value wins for the ones it did — set,
// or removed when it no longer holds the id.
//
// Memory is still the base, not just the store, so a tick made while storage was
// refusing writes is written out by the next save that works, as saveState() always
// did. The limit of that is the other direction: a tab that still holds an item
// another tab has since unticked, or that was cleared by a sign-out elsewhere, will
// write it back when it saves something else. That is unchanged, and fixing it
// needs the tabs to tell each other, which is the machinery this app avoids.
//
// This is a re-read, not a lock: two saves in the same instant can still race. The
// realistic case it closes is one tab left open while the user ticks in another.
function saveItems(ids) {
    const merged = { ...completedItems, ...readStoredState() };

    for (const id of ids) {
        if (Object.prototype.hasOwnProperty.call(completedItems, id)) {
            merged[id] = completedItems[id];
        } else {
            delete merged[id];
        }
    }

    // Adopted only once the write has gone through. A refused write throws from
    // here and leaves this tab holding exactly what it held before.
    localStorage.setItem('moiCheckState', JSON.stringify(merged));
    completedItems = merged;
}

function createConfetti(x, y) {
    for (let i = 0; i < 8; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 30;
        
        confetti.style.left = `${x + Math.cos(angle) * distance}px`;
        confetti.style.top = `${y + Math.sin(angle) * distance}px`;
        
        const colors = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899'];
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 500);
    }
}
