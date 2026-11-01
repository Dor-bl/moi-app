// Utils Module - Shared Global Exports: getMilestoneObj, showBadgeToast, saveState, saveItems, createConfetti
// Dependencies: Expects MILESTONES, UI_TRANSLATIONS, currentLang, completedItems, currentUser, SYNCED_USER_KEY.

let toastTimeout = null;

// Ids changed in this tab whose write has not gone through yet (see saveItems).
const unsavedIds = new Set();

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
    unsavedIds.clear();
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
// A change whose write was refused stays this tab's until a write goes through: its
// ids wait in unsavedIds and join the next save, so a note edited, a tick or an untick
// made while storage was full is written out then, as saveState() always did, instead
// of being replaced by the older stored value. The limit is the other direction: a tab
// that still holds an item another tab has since unticked, or that was cleared by a
// sign-out elsewhere, will write it back when it saves something else. That is
// unchanged, and fixing it needs the tabs to tell each other, which is the machinery
// this app avoids.
//
// Returns true when the save folded in items this tab did not hold, i.e. when what the
// tab now holds is more than what it is showing; the caller repaints in that case.
// Returns false, having written nothing, when the store belongs to another account.
//
// This is a re-read, not a lock: two saves in the same instant can still race. The
// realistic case it closes is one tab left open while the user ticks in another.
function saveItems(ids) {
    // Another tab may have switched the browser to a different account while this tab,
    // still signed in as the old one, has not yet run its auth listener. The store then
    // holds that account's private progress, and merging it would put it into
    // completedItems, where the cloud sync's full upload sends it to this account.
    // Writing this tab's copy over it would be the old leak in the other direction. So
    // neither: the tab is about to reset itself, and a tick made in that gap is not
    // saved. No marker (guest progress) or a matching one is the normal case.
    const owner = localStorage.getItem(SYNCED_USER_KEY);
    if (currentUser && owner && owner !== currentUser.id) return false;

    for (const id of ids) unsavedIds.add(id);
    const merged = { ...completedItems, ...readStoredState() };

    for (const id of unsavedIds) {
        if (Object.prototype.hasOwnProperty.call(completedItems, id)) {
            merged[id] = completedItems[id];
        } else {
            delete merged[id];
        }
    }

    // Adopted only once the write has gone through. A refused write throws from
    // here and leaves this tab holding exactly what it held before.
    localStorage.setItem('moiCheckState', JSON.stringify(merged));
    // merged holds every id this tab held, so a longer one means items came in.
    const adopted = Object.keys(merged).length > Object.keys(completedItems).length;
    completedItems = merged;
    unsavedIds.clear();
    return adopted;
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
