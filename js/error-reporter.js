// Error Reporter Module - Shared Global Exports: none
// Dependencies: window.SUPABASE_URL and window.SUPABASE_ANON_KEY from config.js,
// which index.html loads just before this file.
//
// MoiCheck is a static site, so an error that only happens in a visitor's browser
// never reaches a server log. This sends uncaught errors and unhandled promise
// rejections to the client_errors table in Supabase (README "Browser error
// reports"), where they are kept 30 days.
//
// Reports are anonymous: no user id, the page path without its query or
// fragment (magic-link tokens arrive in the fragment), and email addresses and
// tokens scrubbed out of every text field. privacy.html describes exactly this,
// so keep the two in step.

(function () {
    const url = window.SUPABASE_URL;
    const key = window.SUPABASE_ANON_KEY;
    if (!url || !key || typeof fetch !== 'function') return;

    // Same rule as analytics.js: local development should not fill the table.
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]' ||
        host === '::1' || host === '' || host.endsWith('.local')) return;

    // A broken render loop can throw on every frame; a handful per page load is
    // enough to see the problem.
    const MAX_REPORTS = 5;
    const seen = new Set();

    function scrub(value, max) {
        if (value === null || value === undefined || value === '') return null;
        return String(value)
            .replace(/[^\s@"'<>()]+@[^\s@"'<>()]+\.[a-z]{2,}/gi, '[email]')
            .replace(/\b(access_token|refresh_token|id_token|token|code|apikey|key)=[^&#\s]+/gi, '$1=[redacted]')
            .replace(/\beyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[jwt]')
            .replace(/\bsb_(publishable|secret)_[\w-]+/g, '[key]')
            .slice(0, max);
    }

    function report(message, source, line, column, stack) {
        const text = scrub(message, 500) || 'Unknown error';
        if (seen.size >= MAX_REPORTS || seen.has(text)) return;
        seen.add(text);

        const body = {
            message: text,
            source: source ? scrub(String(source).split(/[?#]/)[0], 300) : null,
            line: Number.isInteger(line) ? line : null,
            col: Number.isInteger(column) ? column : null,
            stack: scrub(stack, 2000),
            page: window.location.pathname.slice(0, 200),
            user_agent: scrub(navigator.userAgent, 300)
        };

        // apikey only, no Authorization header: the publishable key is not a
        // JWT, and this way a report never carries the signed-in user's session.
        fetch(`${url}/rest/v1/client_errors`, {
            method: 'POST',
            keepalive: true,
            headers: {
                'Content-Type': 'application/json',
                'apikey': key,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(body)
        }).catch(() => {
            // Nothing to do: reporting must never cause an error of its own.
        });
    }

    window.addEventListener('error', event => {
        // Browser extensions and cross-origin scripts surface here too. The
        // second kind arrives as a bare "Script error." with nothing to act on.
        const source = event.filename || '';
        if (/^(chrome|moz|safari(-web)?)-extension:/.test(source)) return;
        if (event.message === 'Script error.' && !source) return;
        const error = event.error;
        report(event.message || (error && error.message), source, event.lineno, event.colno, error && error.stack);
    });

    window.addEventListener('unhandledrejection', event => {
        const reason = event.reason;
        const message = reason instanceof Error ? reason.message : String(reason);
        report(`Unhandled rejection: ${message}`, null, null, null, reason && reason.stack);
    });
})();
