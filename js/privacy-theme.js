// Privacy Page Theme - Shared Global Exports: None
// Dependencies: None. Applies the saved theme on privacy.html. It lives in a file
// rather than an inline <script> so the Content-Security-Policy in vercel.json
// can stay free of 'unsafe-inline' and script hashes.

(function () {
    try {
        var saved = localStorage.getItem('moiCheckTheme');
        if (saved === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else if (saved === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    } catch { /* localStorage unavailable */ }
})();
