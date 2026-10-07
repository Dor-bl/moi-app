// Analytics Module - Shared Global Exports: window.va, window.vaq (Vercel Web Analytics queue)
// Dependencies: None. The tracking script is served only by Vercel hosting.

(function () {
    const SCRIPT_ID = 'vercel-analytics-script';

    // Initialize the analytics queue first, so window.va is always callable
    // even on hosts where the tracking script below is never injected.
    window.va = window.va || function () {
        (window.vaq = window.vaq || []).push(arguments);
    };

    // Guard against a double injection if this snippet is ever included twice.
    if (document.getElementById(SCRIPT_ID)) return;

    // /_vercel/insights/script.js is served by the Vercel edge only; requesting
    // it from localhost or any other host just yields a 404 on every page load.
    const host = window.location.hostname;
    const isLocalHost = host === 'localhost' ||
        host === '127.0.0.1' ||
        host === '[::1]' ||
        host === '::1' ||
        host === '' ||
        host.endsWith('.local');
    if (isLocalHost) return;

    // Injected scripts load async by default; `defer` would be ignored here.
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.src = '/_vercel/insights/script.js';
    document.head.appendChild(script);
})();
