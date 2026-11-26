// Theme Module - Shared Global Exports: ALLOWED_THEMES, applyTheme, updateThemeButtonsUI, initTheme, setTheme
// Dependencies: Expects .theme-option-btn elements in the DOM.

const ALLOWED_THEMES = ['light', 'dark', 'system'];

function applyTheme(themeOption) {
    const validTheme = ALLOWED_THEMES.includes(themeOption) ? themeOption : 'system';
    if (validTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else if (validTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    updateThemeButtonsUI(validTheme);
    // Google renders its sign-in button in a fixed colour scheme; redraw it
    // to match. Guarded because not every page loads the auth module.
    if (typeof renderGoogleButton === 'function') renderGoogleButton();
}

function updateThemeButtonsUI(currentOption) {
    const themeOptionBtns = document.querySelectorAll('.theme-option-btn');
    themeOptionBtns.forEach(btn => {
        const option = btn.dataset.themeOption;
        btn.classList.toggle('active', option === currentOption);
    });
}

function initTheme() {
    let savedTheme = null;
    // Blocked site data makes any touch of localStorage throw (SecurityError),
    // and this runs during boot: fall back to the system theme rather than stop.
    try {
        savedTheme = localStorage.getItem('moiCheckTheme');
        if (!savedTheme) {
            savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                localStorage.setItem('moiCheckTheme', savedTheme);
                localStorage.removeItem('theme');
            }
        }
    } catch { /* storage blocked: system theme */ }
    if (!ALLOWED_THEMES.includes(savedTheme)) {
        savedTheme = 'system';
    }
    applyTheme(savedTheme);

    // Under the "system" option the page's CSS follows the OS theme live, but
    // Google's sign-in button is an iframe drawn in a fixed colour scheme.
    // Redraw it when the OS switches, only while no explicit theme is set.
    if (typeof window.matchMedia === 'function') {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            if (document.documentElement.hasAttribute('data-theme')) return;
            if (typeof renderGoogleButton === 'function') renderGoogleButton();
        });
    }
}

function setTheme(themeOption) {
    const validTheme = ALLOWED_THEMES.includes(themeOption) ? themeOption : 'system';
    // A refused write (storage full, site data blocked) only means the choice
    // lasts for this page view; it must not stop the theme from applying.
    try {
        localStorage.setItem('moiCheckTheme', validTheme);
    } catch { /* see above */ }
    applyTheme(validTheme);
}
