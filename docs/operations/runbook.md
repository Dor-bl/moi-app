# Operations runbook

## Troubleshooting: magic links fail with a 500

If `POST /auth/v1/otp` returns **500 (Internal Server Error)** — typically for everyone
except the project owner — the request reached Supabase and failed inside it. The client
sent a valid request; a malformed one would come back as a 400 or 422.

Read the real cause in *Logs -> Auth Logs* in the Supabase dashboard, on the failing
request's `error` field. The Edge Logs entry — the one showing just
`POST | 500 | /auth/v1/otp` — carries no body and cannot tell you anything. If the Auth
Logs view is hard to filter, *Logs -> Logs Explorer* reads the same source; set the window
to a minute around the failure:

```sql
select timestamp, event_message
from auth_logs
where timestamp > timestamp '2026-01-01 12:00:00'
  and timestamp < timestamp '2026-01-01 12:01:00'
order by timestamp desc
```

The causes, in order of likelihood:

1. **The email provider refused the recipient.** Most transactional senders will only
   deliver to your own account address until you verify a domain you control, and they
   reject everything else outright. With Resend the log reads:

   ```
   gomail: could not send email 1: 550 "You can only send testing emails to your own
   email address (you@example.com). To send emails to other recipients, please verify
   a domain at resend.com/domains, and change the `from` address to an email using
   this domain."
   ```

   Verify a domain with the provider, add the DNS records it asks for (SPF, DKIM, and
   ideally DMARC), then set the sender in *Authentication -> Emails -> SMTP Settings* to
   an address on that verified domain — `noreply@yourdomain.nl`, not `onboarding@resend.dev`.
   A `*.vercel.app` subdomain cannot be used: verification needs DNS records you can only
   add on a domain you own.
2. **The SMTP server rejected Supabase's login.** Custom SMTP is configured, but the
   username or password in it is wrong, so every send fails — the project owner's
   included. The log reads:

   ```
   "error": "535 \"Authentication credentials invalid\""
   ```

   The usual cause is an API key that was deleted, rotated, or pasted wrong. With Resend,
   create a new key with *Sending access* restricted to your domain, then in
   *Authentication -> Emails -> SMTP Settings* set the username to `resend` and the
   password to that key (host `smtp.resend.com`, port `465`). The settings apply on save;
   no redeploy is needed.
3. **No custom SMTP configured at all.** Supabase's built-in sender only delivers to the
   project's team members and is rate limited to a handful of messages per hour, so it
   fails the same way for real users. It is for development only.
4. **A database error while creating the user.** A trigger on `auth.users` that throws will
   fail the sign-up, and the log says `Database error saving new user`. **This repo defines
   one:** `on_auth_user_changed`, which calls `public.sync_profile()` to mirror the new
   account into `public.profiles` (see [Knowing who a `user_id` belongs to](../setup/supabase.md#knowing-who-a-user_id-belongs-to-the-profiles-table)). It is
   written so that it cannot throw — one unconditional insert with an `on conflict` arm —
   but it runs inside every sign-up, so it is the first thing to isolate: drop the trigger
   and see whether registration recovers. That identifies the path, not the fault. **Do not
   leave it dropped** — every account created meanwhile gets no mirror row, and recreating it
   without fixing the cause brings the same failure back. Read the database error, repair
   `sync_profile()` or whatever it depends on, recreate the trigger, then re-run the backfill
   from that section — while sign-ups are quiet, for the reason its comment gives — which
   reconciles the accounts that arrived without it. A trigger added by hand in the SQL editor
   is the other candidate.

Note that a failed send does not necessarily undo the sign-up: the auth event is logged
with an `actor_id`, and the address can be left behind as an unconfirmed row in
*Authentication -> Users*. After fixing delivery, check that list — a leftover unconfirmed
row is harmless, but it means the person is already "registered" and will get a sign-in
link rather than a fresh sign-up on their next attempt.

## Daily magic-link check

`.github/workflows/magic-link-check.yml` asks production to send a real magic link once a
day and fails the run if Supabase cannot. Magic-link email depends on settings that live
only in the Supabase dashboard (the SMTP credentials, the sending domain), so a break there
never shows up in this repo's tests. That is how #175 happened: the Resend key had become
invalid and every send failed with a 535. A failed scheduled run emails whoever last edited
the workflow's schedule. Run it by hand from the Actions tab after changing SMTP settings.

The link goes to `delivered@resend.dev`, Resend's test address, which accepts mail without
anyone receiving it. The request sets `create_user: false`, so the check never signs anyone
up. One-time setup:

1. In *Authentication -> Users*, choose *Add user -> Create new user* with the email
   `delivered@resend.dev`, any password, and *Auto Confirm User* ticked. Without this user
   the check fails with a 422.
2. Add a repository secret `SUPABASE_ANON_KEY` with the publishable key (`sb_publishable_...`) from
   *Project Settings -> API Keys*. The check also reads the existing `SUPABASE_PROJECT_REF`.

A failure names the HTTP status. A 500 means the email could not be sent: read the cause in
the Auth Logs as described under "Troubleshooting: magic links fail with a 500" above.

## Browser error reports

MoiCheck is a static site, so an error that happens only in a visitor's browser never
reaches a server log. `js/error-reporter.js` catches uncaught errors and unhandled promise
rejections and inserts them into a `client_errors` table: up to five distinct messages per
page load, nothing from `localhost`. Reports are anonymous. They carry no user id and no
session, only the page path (no query or fragment), and email addresses and tokens are
scrubbed from the text. `privacy.html` sections 1 and 4 describe exactly this, so change
them together. `tests/error-reporter.test.js` covers the scrubbing and the limits.

Visitors can insert rows but cannot read them, and `pg_cron` deletes rows older than 30
days. Run this once in the Supabase SQL Editor, **before** the client change reaches
production. Until the table exists, every report fails with a 404 in the visitor's console:

```sql
create table public.client_errors (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  message text not null check (char_length(message) <= 500),
  source text check (char_length(source) <= 300),
  line integer,
  col integer,
  stack text check (char_length(stack) <= 2000),
  page text check (char_length(page) <= 200),
  user_agent text check (char_length(user_agent) <= 300)
);

alter table public.client_errors enable row level security;
revoke all on public.client_errors from anon, authenticated;
grant insert (message, source, line, col, stack, page, user_agent)
  on public.client_errors to anon;
create policy "Anyone can report a browser error" on public.client_errors
  for insert to anon with check (true);

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule(
  'delete-old-client-errors',
  '17 3 * * *',
  $$delete from public.client_errors where created_at < now() - interval '30 days'$$
);
```

Only `anon` is granted. The reporter sends just the publishable key and never the
signed-in user's session, so every report arrives as `anon`. The Supabase security advisor
flags the `with check (true)` policy, which is intended: the table is insert-only, and the
length checks cap what a single row can hold.

To see what is breaking, most frequent first:

```sql
select message, page, count(*) as reports, max(created_at) as last_seen
from public.client_errors
group by message, page
order by reports desc;
```

## Security headers

`vercel.json` sends a Content-Security-Policy and supporting headers (`X-Content-Type-Options`,
`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) on every response. The CSP lists each
origin the app talks to explicitly: the Supabase project, Leaflet 1.9.4 on unpkg, and OpenStreetMap
tiles. Its main job is to limit where a compromised script could send a stolen session token.
When you add a new third-party origin, change the Supabase project, or bump the Leaflet version,
update the CSP in `vercel.json` too, or the browser will block the request. Keep scripts in files
rather than inline `<script>` blocks; the policy does not allow inline scripts. The headers only
apply on Vercel, so check a preview deployment's browser console for CSP violations before merging.
