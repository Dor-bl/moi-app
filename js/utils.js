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

function saveState() {
    localStorage.setItem('moiCheckState', JSON.stringify(completedItems));
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
