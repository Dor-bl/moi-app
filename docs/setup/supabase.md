# Supabase setup: login and cloud sync

MoiCheck supports **User Accounts & Cross-Device Cloud Sync** powered by **Supabase**. Users can log in on their laptop, phone, or tablet, and their progress and memories stay automatically synchronized in real time!

## Features:
- **Google 1-Click Login**: Instant OAuth sign-in.
- **Magic Email Links**: Login via passwordless email link.
- **Automatic Progress Merge**: Local guest progress automatically merges into user accounts upon login. For an item the account already has, the account's row wins, except that a guest's memory note is kept (and uploaded) when the account has no note for that item; when both have a note, the account's stays.

## 1-Minute Supabase Setup Instructions:
1. Create a free account at [supabase.com](https://supabase.com) and create a project.
2. In your Supabase SQL Editor, run this snippet to create the `user_progress` table:
   ```sql
   create table user_progress (
     -- on delete cascade: deleting a user (dashboard or a GDPR erasure
     -- request) must take their progress with them. Without it Postgres
     -- refuses with "Database error deleting user".
     user_id uuid references auth.users (id) on delete cascade not null,
     item_id text not null,
     -- Matches maxlength="1000" on the memory textarea, so the cap holds for
     -- API calls that skip the browser too.
     note text check (char_length(note) <= 1000),
     date timestamp with time zone default timezone('utc'::text, now()) not null,
     primary key (user_id, item_id)
   );

   -- Enable Row Level Security (RLS)
   alter table user_progress enable row level security;

   create policy "Users can manage their own progress" on user_progress
     for all using (auth.uid() = user_id);
   ```
   Already created the table without `on delete cascade`? Swap the constraint in place:
   ```sql
   alter table public.user_progress
     drop constraint user_progress_user_id_fkey,
     add constraint user_progress_user_id_fkey
       foreign key (user_id) references auth.users (id) on delete cascade;
   ```
   Already created the table without the note length check? Add it (fails if an existing note is over 1000 characters; check with `select max(char_length(note)) from public.user_progress;` first):
   ```sql
   alter table public.user_progress
     add constraint user_progress_note_check
       check (char_length(note) <= 1000);
   ```
3. Copy your project **URL** and **publishable key** from `Project Settings -> API Keys`.
4. Paste them at the top of `js/auth.js` (`SUPABASE_URL` & `SUPABASE_ANON_KEY`) or set `window.SUPABASE_URL` and `window.SUPABASE_ANON_KEY` in `config.js`. Use the **publishable** key (`sb_publishable_...`, under *Project Settings -> API Keys*) as `SUPABASE_ANON_KEY`; the legacy JWT `anon` key still works but blocks revoking the legacy JWT secret.

   On Vercel, `config.js` is not committed; the project's **Build Command** (*Settings -> Build and Deployment*) writes it at build time:

   ```sh
   echo "window.SUPABASE_URL='${NEXT_PUBLIC_SUPABASE_URL:-$SUPABASE_URL}'; window.SUPABASE_ANON_KEY='${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:-$SUPABASE_PUBLISHABLE_KEY}'; window.GOOGLE_CLIENT_ID='${GOOGLE_CLIENT_ID}';" > config.js
   ```

   The key comes from `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` when that Vercel variable exists, otherwise from `SUPABASE_PUBLISHABLE_KEY` (either set by the Supabase integration, or by hand); keep whichever one you use set for Production and Preview. The browser global keeps the name `SUPABASE_ANON_KEY` because the app reads that name. Do not add a fallback to `SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`: the Supabase integration fills those with the legacy JWT key, so a missing publishable key would silently ship the legacy one. After a deploy, `https://moicheck.nl/config.js` should show `sb_publishable_...`.
5. Under **Authentication -> URL Configuration**, set **Site URL** to your production origin (`https://moicheck.nl`) and add it to **Redirect URLs** as well. Add any other origin you sign in from too, such as `http://localhost:8000` and your Vercel previews — a glob covers all of them at once, e.g. `https://moi-app-*-blayzer.vercel.app/**`. The app passes the origin (`window.location.origin`) as the magic-link redirect target and the current page URL without its query or fragment (`window.location.origin + window.location.pathname`) for Google sign-in, so list each origin with a trailing `/**` (`https://moicheck.nl/**`) so that any page under it is accepted; an origin that is not listed will bounce users back without a session, and magic links requested from it will open on the Site URL instead (see step 7).
6. Set up **custom SMTP** before letting anyone else sign in — see [Troubleshooting: magic links fail with a 500](../operations/runbook.md#troubleshooting-magic-links-fail-with-a-500).
7. Under **Authentication -> Emails**, change the link in **both** the *Confirm signup* and *Magic Link* templates from `{{ .ConfirmationURL }}` to:
   ```
   {{ .RedirectTo }}/?token_hash={{ .TokenHash }}&amp;type=email
   ```
   (`&amp;` rather than `&` because the template is HTML; browsers decode it when the link is clicked.) `{{ .RedirectTo }}` is the origin the app passed when it requested the link, so a link requested from a Vercel preview or `localhost` opens there rather than on production. If that origin is not in **Redirect URLs** (step 5), Supabase substitutes the **Site URL**, which is why every link used to land on production. Mail scanners (Outlook, Office 365, most corporate filters) prefetch every link in a message. With the default link that first fetch hits Supabase's verify endpoint and uses up the one-time token, so the person taps a dead link seconds later. With this link the page loads and shows a *Finish Signing In* button; nothing is verified until they tap it. Then search the whole template for `ConfirmationURL` — it must appear **nowhere**, including as the visible text of a "copy and paste this link" line. Scanners read URLs out of plain text just as readily as out of `href`, so one leftover mention burns the token and the new link arrives dead. Until you change the templates the old flow keeps working — the app handles both.
8. **Google sign-in on your own origin (optional, recommended).** Out of the box, "Continue with Google" bounces through Supabase's OAuth callback, so Google's consent screen says *"to continue to \<project\>.supabase.co"*. To have it name your site and app instead, the app can run the Google flow in the browser and hand Supabase the resulting ID token:
   - In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), open the OAuth client you created for Supabase (type *Web application*). Under **Authorized JavaScript origins** add your production origin (`https://moicheck.nl`) and `http://localhost:8000` for local development. Leave the Supabase callback under **Authorized redirect URIs** as it is — it stays in use as the fallback.
   - In Supabase, under **Authentication -> Providers -> Google**, make sure the same client ID is in the **Client IDs** field. Supabase only accepts ID tokens issued for a client it knows.
   - Set `window.GOOGLE_CLIENT_ID` in `config.js` (or, on Vercel, add a `GOOGLE_CLIENT_ID` environment variable scoped to **Production only**; the build command in step 4 already emits `window.GOOGLE_CLIENT_ID`). The client ID is public — it is visible in the page regardless — so the Production-only scope is not about secrecy: Google's *Authorized JavaScript origins* must be exact origins, no wildcards, and every Vercel preview has its own per-branch host, so on a preview Google would refuse to draw the button after the custom one is already hidden. Leave the variable unset for Preview and previews keep the redirect flow, which still works there. (If you want Google-on-origin on one stable preview host, add that exact origin in Google Cloud Console and set the variable for that environment alone.)
   - Check the **User support email** under **Google Auth Platform -> Branding** before going live: anyone who clicks the app name on Google's sign-in screen sees it under *Developer info*. Google only offers the signed-in account's own address or a Google Group it manages, so to show `hallo@moicheck.nl` rather than a personal Gmail, create a free Google Account with that address (accounts.google.com/signup -> *Use your existing email*; no Workspace needed, and skip the offer to add a Gmail address), grant it **Owner** on the project, then sign in as it and select it there.

   The consent screen then reads *"to continue to moicheck.nl"* with your app name and logo from the consent-screen settings. Leave the value empty and the app uses the redirect flow as before; nothing breaks either way.

   Two things are already taken care of: the Content Security Policy in `vercel.json` allows Google's script, stylesheet, iframe and endpoints under `https://accounts.google.com/gsi/` (the four entries [Google's guide](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid) lists), and the script is fetched only when someone opens the sign-in dialog, not on every visit — the privacy policy's Google entry describes that, so keep the two in step if you change it.

## Knowing who a `user_id` belongs to (the `profiles` table)

Every row in `user_progress` is keyed by a `user_id` UUID and nothing else, so the table on
its own cannot tell you *whose* progress you are reading. The person behind the UUID lives in
`auth.users`, inside Supabase's private `auth` schema.

For a one-off lookup you do not need any schema change:

- **Dashboard.** **Authentication -> Users** searches on the UUID and shows the email,
  the provider, and the last sign-in. In the table editor, the arrow beside a `user_id` cell
  follows the foreign key to that same row.
- **SQL Editor**, which runs as `postgres` and so may read `auth`:

  ```sql
  select id, email,
         -- Same fallback as buildAccountExport() and the mirror below: Google
         -- supplies full_name, but an account whose metadata carries only
         -- name would otherwise read as having none.
         coalesce(raw_user_meta_data ->> 'full_name',
                  raw_user_meta_data ->> 'name') as name,
         created_at, last_sign_in_at
  from auth.users
  where id = '00000000-0000-0000-0000-000000000000';
  ```

What neither covers is anything running under the publishable key: the browser cannot read
`auth.users`, by design, and should not be able to. `public.profiles` is the usual Supabase
answer — a mirror of the few account fields that are safe to join against, kept in `public`
and maintained by a trigger so it cannot drift:

```sql
create table public.profiles (
  -- Same cascade as user_progress: deleting the user takes the mirror with
  -- them, so delete_user() and a dashboard deletion both stay as they are.
  id uuid primary key references auth.users (id) on delete cascade,
  -- Three fields and no more. Each is a copy of something auth.users already
  -- holds, privacy.html already discloses and the account export already
  -- carries, so the mirror adds nothing new to account for. A freshness
  -- column would: it would be a fourth field to place in the export and the
  -- retention record, and the trigger below already keeps the copy current.
  email text,
  full_name text,
  avatar_url text
);

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

create policy "Users can read their own profile" on public.profiles
  for select using (auth.uid() = id);

create or replace function public.sync_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url;
  return new;
end;
$$;

-- A trigger function has no business being callable over the REST API, and
-- Supabase's security advisor flags it as reachable at /rest/v1/rpc/sync_profile
-- without this. Revoking EXECUTE closes that endpoint; the trigger is unaffected,
-- because it runs as the function's owner rather than as the signed-in caller.
revoke execute on function public.sync_profile() from public, anon, authenticated;

create trigger on_auth_user_changed
  after insert or update of email, raw_user_meta_data on auth.users
  for each row execute function public.sync_profile();

-- Backfill everyone who signed in before the trigger existed. The same statement
-- reconciles later: on a fresh table the conflict arm never fires, and after the
-- trigger has been dropped for debugging it refreshes the rows that went stale as
-- well as inserting the ones that were missed. The arm mirrors sync_profile()'s,
-- so the two cannot drift.
--
-- Run it while sign-ups are quiet. The statement reads auth.users as of its own
-- start, so a change committing while it runs is written by the trigger and then
-- overwritten by this statement's older value, leaving that row stale until the
-- account changes again. Checked, not assumed: with `do nothing` the trigger's
-- value survived and with `do update` it did not. The window is the statement's
-- runtime and the blast radius is one row, which is why this says "run it quiet"
-- rather than locking auth.users -- holding locks on the auth service's own table
-- is a good way to cause the sign-up failure this backfill exists to recover from.
insert into public.profiles (id, email, full_name, avatar_url)
select id, email,
       coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name'),
       raw_user_meta_data ->> 'avatar_url'
from auth.users
on conflict (id) do update set
  email = excluded.email,
  full_name = excluded.full_name,
  avatar_url = excluded.avatar_url;
```

The question the table exists for is then a plain join, with no `auth` schema in sight:

```sql
select p.email, p.full_name, up.item_id, up.date, up.note
from public.user_progress up
join public.profiles p on p.id = up.user_id
order by p.email, up.date desc;
```

Six things to know before running it:

- **Nobody signed in may write to the mirror, and only its subject may read it.** The
  `revoke all` then `grant select` is the same shape as `client_errors` further down: the
  grant settles that `anon` sees nothing at all and that `authenticated` can read but never
  insert, update or delete, and the policy then settles *which* rows a reader gets. The
  trigger is the only writer, and it writes as the table's owner.
- **The read policy is deliberately self-only.** `profiles` holds email addresses, so
  `using (true)` would hand every signed-in user every other user's address — a data breach
  written as a convenience. The SQL Editor bypasses RLS and still sees every row, which is
  what the two admin lookups above rely on — as would a server-side secret key, which is one
  more reason one must never reach the browser. If other
  people's names ever belong on screen — a shared leaderboard, say — expose a view over
  `full_name` alone and leave `email` behind this policy.
- **`revoke execute` on the function is not optional.** Leave it out and the security advisor
  reports `sync_profile()` as callable at `/rest/v1/rpc/sync_profile` by `anon` and
  `authenticated` — checked on this project, where adding it cleared both findings. Calling a
  trigger function directly fails anyway (`new` does not exist outside a trigger), so this
  closes a door rather than fixing a hole, but a standing advisor warning is one you stop
  reading. Supabase's auth service writes `auth.users` as its own role and fires the trigger
  through the table, not through this grant, so registration is unaffected — verified against a
  non-owner writer with no `EXECUTE`.
- **The trigger runs inside sign-up.** If it raises, Supabase answers *"Database error saving
  new user"* and nobody can register. It is written so it cannot: the insert is unconditional
  and has an `on conflict` arm. If you extend it and registration starts failing, drop the
  trigger first and confirm sign-up recovers before debugging anything else.
- **`update of email, raw_user_meta_data` is load-bearing.** `auth.users` is written on every
  sign-in to move `last_sign_in_at`; without that column list the trigger would fire on each
  of those for nothing.
- **It adds no new category of personal data,** which is why `privacy.html` does not change:
  email, name and avatar URL are already held under activity 1 of the
  [processing register](../compliance/processing-register.md) and already disclosed. This is
  a second copy, in the same database, under the same processor, for the same purpose, erased
  by the same cascade. `buildAccountExport()` needs no change for the same reason — it already
  exports all three from the account itself. This SQL has been run against the project (2
  November 2026), so activity 1 of the register and `retention.md` §1 describe the mirror as
  live rather than as pending.

## Updating the vendored Supabase client

The Supabase browser client is **vendored** at `assets/vendor/supabase-js-2.116.0.js` rather
than loaded from a CDN. That script runs on every page load with full DOM access and can read
the session token out of `localStorage`, so its bytes are pinned in this repo: a compromised
CDN, or one bad publish to a floating version tag, cannot silently replace it.

To move to a newer version:

```bash
# 1. Fetch the exact version from npm (npm verifies the tarball checksum for you)
npm pack @supabase/supabase-js@<version>
tar -xzf supabase-supabase-js-<version>.tgz

# 2. The CDN entry point is the UMD build - the same file the CDN used to serve
cp package/dist/umd/supabase.js assets/vendor/supabase-js-<version>.js

# 3. Point index.html at the new filename and delete the old one
```

Keep the version in the filename: it makes the pinned version visible in `index.html`, and it
cache-busts automatically on upgrade. Record the checksum of what you committed so a reviewer
can confirm it matches the published package:

```bash
sha256sum assets/vendor/supabase-js-<version>.js
```

| Version | sha256 |
| --- | --- |
| 2.116.0 | `84ee9bf45695c1dd3ba1595b6bcfb0f09672434631351ffc8ebe9140545d5ff6` |

`assets/vendor/supabase-js-LICENSE.txt` is the upstream MIT licence and must stay alongside
the bundle. `assets/vendor/` is excluded from ESLint (`eslint.config.js`): the bundle has to
match upstream byte for byte, so it must never be edited to satisfy a lint rule.

Leaflet is still loaded from unpkg, but with an exact version and an SRI hash
(`index.html:39-40`), which gives the same guarantee. If you ever bump it, regenerate the
`integrity` value — dropping it would quietly remove the protection.
