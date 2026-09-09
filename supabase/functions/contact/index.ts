// Contact-form backend.
//
// Replaces FormSubmit — see docs/decisions/formsubmit-gdpr-basis.md for why.
// A message now travels visitor -> this function -> Resend -> hallo@moicheck.nl.
// Both are processors MoiCheck already has a data processing agreement with,
// which was the whole point of the exercise.
//
// Deploy:  supabase functions deploy contact
// Secret:  supabase secrets set RESEND_API_KEY=re_...

const TO = 'hallo@moicheck.nl';
const FROM = 'MoiCheck <noreply@moicheck.nl>';

// Mirrors the <select> in index.html. Anything else is a client that did not
// come from our form, so it is rejected rather than relayed.
const SUBJECTS = new Set(['Suggest Item', 'General Feedback', 'Report Bug', 'Say Moi']);

const MAX = { name: 100, email: 254, message: 5000 };

// Best-effort rate limit. Edge Function instances are ephemeral and there may
// be several, so this is a speed bump, not a guarantee — deliberately. A
// contact form on an app this size does not justify a shared-state limiter;
// the honeypot below stops far more of the traffic that actually shows up.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 3;
const recent = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
    const now = Date.now();
    const seen = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
    seen.push(now);
    recent.set(ip, seen);
    if (recent.size > 1000) recent.clear();
    return seen.length > MAX_PER_WINDOW;
}

function isAllowedOrigin(origin: string): boolean {
    return origin === 'https://moicheck.nl' ||
        origin === 'https://www.moicheck.nl' ||
        origin === 'http://localhost:8000' ||
        // Vercel previews for this project, matching the glob the README uses
        // for Supabase redirect URLs.
        /^https:\/\/moi-app-[a-z0-9-]+\.vercel\.app$/.test(origin);
}

function corsHeaders(origin: string | null): Record<string, string> {
    return {
        // Written so the compiler narrows `origin` to a string in the true
        // branch; a separate boolean would leave it `string | null` here.
        'Access-Control-Allow-Origin': origin && isAllowedOrigin(origin) ? origin : 'https://moicheck.nl',
        'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Vary': 'Origin',
    };
}

function json(body: unknown, status: number, origin: string | null): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
}

Deno.serve(async (req: Request) => {
    const origin = req.headers.get('origin');

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders(origin) });
    }
    if (req.method !== 'POST') {
        return json({ error: 'Method not allowed' }, 405, origin);
    }

    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';
    if (rateLimited(ip)) {
        return json({ error: 'Too many messages, please try again shortly.' }, 429, origin);
    }

    let payload: Record<string, unknown>;
    try {
        payload = await req.json();
    } catch {
        return json({ error: 'Invalid JSON' }, 400, origin);
    }

    const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
    const name = str(payload.name);
    const email = str(payload.email);
    const subject = str(payload.subject);
    const message = str(payload.message);

    // Honeypot. The field is off-screen and unlabelled for people, so a value
    // here means an automated submission. Answer 200 so the bot cannot tell it
    // was caught, and send nothing.
    if (str(payload.website)) {
        return json({ ok: true }, 200, origin);
    }

    if (!name || !email || !message) {
        return json({ error: 'Name, email and message are required.' }, 400, origin);
    }
    if (name.length > MAX.name || email.length > MAX.email || message.length > MAX.message) {
        return json({ error: 'One of the fields is too long.' }, 400, origin);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ error: 'That email address does not look valid.' }, 400, origin);
    }
    if (subject && !SUBJECTS.has(subject)) {
        return json({ error: 'Unknown subject.' }, 400, origin);
    }

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
        console.error('RESEND_API_KEY is not set; cannot deliver contact message');
        return json({ error: 'Contact is temporarily unavailable.' }, 500, origin);
    }

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: FROM,
            to: [TO],
            // So hitting reply in the inbox answers the visitor, not ourselves.
            reply_to: email,
            subject: `[MoiCheck Feedback] ${subject || 'General Feedback'}`,
            text: `From: ${name} <${email}>\nSubject: ${subject || 'General Feedback'}\n\n${message}\n`,
        }),
    });

    if (!res.ok) {
        // The body carries Resend's reason (unverified domain, bad key). It goes
        // to the function log, never to the visitor.
        console.error('Resend rejected the message:', res.status, await res.text());
        return json({ error: 'Could not send the message right now.' }, 502, origin);
    }

    return json({ ok: true }, 200, origin);
});
