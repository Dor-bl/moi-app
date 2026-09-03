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
    let savedTheme = localStorage.getItem('moiCheckTheme');
    if (!savedTheme) {
        savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            localStorage.setItem('moiCheckTheme', savedTheme);
            localStorage.removeItem('theme');
        }
    }
    if (!ALLOWED_THEMES.includes(savedTheme)) {
        savedTheme = 'system';
    }
    applyTheme(savedTheme);
}

function setTheme(themeOption) {
    const validTheme = ALLOWED_THEMES.includes(themeOption) ? themeOption : 'system';
    localStorage.setItem('moiCheckTheme', validTheme);
    applyTheme(validTheme);
}
