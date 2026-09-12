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

// Prefer the headers the platform sets over x-forwarded-for, whose first entry
// is whatever the client sent and is therefore trivially rotated by anyone who
// wants to. Returns null when no address can be established at all.
function clientIp(req: Request): string | null {
    const cf = req.headers.get('cf-connecting-ip');
    if (cf) return cf;
    const real = req.headers.get('x-real-ip');
    if (real) return real;
    const forwarded = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
    return forwarded || null;
}

function rateLimited(ip: string): boolean {
    const now = Date.now();
    const seen = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
    if (recent.size > 1000) recent.clear();

    // Stop recording once an address is over the limit. Appending regardless
    // would let one determined sender grow its own array without bound inside
    // the window, and the entries past the limit tell us nothing new — the
    // decision is already made.
    if (seen.length >= MAX_PER_WINDOW) {
        recent.set(ip, seen);
        return true;
    }

    seen.push(now);
    recent.set(ip, seen);
    return false;
}

function isAllowedOrigin(origin: string): boolean {
    return origin === 'https://moicheck.nl' ||
        origin === 'https://www.moicheck.nl' ||
        origin === 'http://localhost:8000' ||
        // Vercel previews for this project. The trailing scope is what makes
        // this safe to allow: `moi-app-<anything>.vercel.app` is a subdomain a
        // stranger can claim by creating a project under that name, and a page
        // there could then post through its visitors' browsers, spreading the
        // load across their addresses rather than one the rate limit can see.
        // Producing `-blayzer.vercel.app` needs control of that Vercel scope.
        /^https:\/\/moi-app-[a-z0-9-]+-blayzer\.vercel\.app$/.test(origin);
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

    // No address means no bucket. Sharing one across every header-less caller
    // would let a handful of them lock each other out, which is worse than the
    // spam this is meant to slow down — the honeypot and validation still apply.
    const ip = clientIp(req);
    if (ip && rateLimited(ip)) {
        return json({ error: 'Too many messages, please try again shortly.' }, 429, origin);
    }

    // The origin allow-list does not gate this on its own. A page anywhere can
    // send a no-cors POST with a safelisted content type — text/plain carrying
    // a JSON body — which skips the preflight entirely and still reaches us;
    // the attacker cannot read the reply, but the mail is already sent. Only
    // application/json is outside that safelist, so requiring it is what puts
    // the preflight, and therefore the allow-list, back in the path.
    const mediaType = (req.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    if (mediaType !== 'application/json') {
        return json({ error: 'Expected application/json.' }, 415, origin);
    }

    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return json({ error: 'Invalid JSON' }, 400, origin);
    }

    // `null` and `[]` are valid JSON, and reading fields off them throws —
    // which would escape the handler and lose the CORS headers with it, so the
    // visitor would see a CORS error rather than this 400.
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return json({ error: 'Expected a JSON object.' }, 400, origin);
    }
    const payload = body as Record<string, unknown>;

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

    let res: Response;
    try {
        res = await fetch('https://api.resend.com/emails', {
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
    } catch (err) {
        // A throw here is the transport failing (DNS, TLS, socket), not Resend
        // refusing the message. Without this the request dies uncaught, and the
        // browser sees a CORS error rather than the message below.
        console.error('Could not reach Resend:', err);
        return json({ error: 'Could not send the message right now.' }, 502, origin);
    }

    if (!res.ok) {
        // The body carries Resend's reason (unverified domain, bad key). It goes
        // to the function log, never to the visitor.
        console.error('Resend rejected the message:', res.status, await res.text());
        return json({ error: 'Could not send the message right now.' }, 502, origin);
    }

    return json({ ok: true }, 200, origin);
});
