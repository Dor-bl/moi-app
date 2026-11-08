# MoiCheck <img src="./assets/groningen-flag.svg" width="30" height="20" alt="Groningen Flag" valign="middle" />

**MoiCheck** is a lightweight, interactive bucket list app tailored specifically for expats moving to the Netherlands, with a starting focus on the **Groningen** area ("Stad").

As someone who moved to Groningen, this app is built to help new expats settle in, explore local culture, try traditional Groninger food, and track their journey toward becoming a true "Stadjer"!

---

## ✨ Features

- **Category Achievement Badges 🏆**: Complete all items in a category (e.g. *Food & Drink*) to unlock special badges like **Groninger Foodie 🍟**, **Culture Explorer 🏛️**, **True Stadjer 🚴‍♂️**, and **Groningen Legend 👑**, complete with real-time celebratory toasts and profile badge showcase.
- **User Login & Cloud Sync (Google 1-Click & Magic Links)**: Users can sign in to save progress and memory notes, keeping state synchronized across mobile devices and laptops.
- **Interactive Groningen Map View 🗺️**: Switch seamlessly between List View and Map View. Features interactive map pins for all 55 locations across Groningen with real-time status (Green for completed, Orange for pending).
- **Upcoming Events View 📅**: A third view alongside List and Map showing what's on in Groningen — Koningsdag, Bommen Berend, Sint Maarten, carbidschieten — with a *Happening now* badge for anything currently running. Events drop off the page by themselves the day after they finish, with no deploy needed: the list is filtered at render time against the current date in `Europe/Amsterdam`, and traditions on a fixed calendar date roll forward to their next occurrence automatically. Run `npm run events:check` to see what's still ahead and what needs fresh dates.
- **Event Check-In Badges 📍**: While an event is actually running, its card offers an *I'm here* button that confirms you made it and awards that event's badge — the **Stadspark Liberator 🕊️** for the Bevrijdingsfestival, say. The location check happens entirely in the browser: your coordinates are compared to the event's and then discarded, so what gets saved is the badge and never a position. A fix too vague to resolve the radius is refused rather than waved through, and each occurrence of a recurring event is its own badge. Only events carrying a `checkIn: { coords, radius }` block offer it — a city-wide entry like Koningsdag has no single point to stand near.
- **Gronings Word of the Day 🗣️**: A card above the list with one word of the local dialect — *Moi*, *Nait soezen*, *Mous* — and a three-way guess at what it means. Everyone gets the same word on the same day (the date picks it from `js/words.js`, so the list cycles with no deploy), the reveal shows it in a sentence with a local's note, and a running *words learned* count stays in the browser. Once answered the card folds to a one-line strip until tomorrow, and Settings has a switch for anyone who only wants the list. A reason to open the app on a day with nothing to tick off.
- **Multi-Language Support (EN 🇬🇧 / NL 🇳🇱)**: Toggle instantly between English and Dutch for all items, tips, categories, and milestone badges.
- **55 Curated Groningen Bucket List Items**: Handpicked experiences spanning Food & Drink, Culture & Sights, Daily Life, Groningen Classics, and Nature & Wildlife.
- **Contact & Item Suggestions Form**: Expats can easily get in touch, suggest new Groningen bucket list items, report bugs, or send feedback with full bilingual support.
- **Category Filtering**: Easily filter items by category (*Food & Drink*, *Culture & Sights*, *Daily Life*, *Groningen Classics*, *Nature & Wildlife*).
- **Interactive Details & Memories**: Click any card to open a detailed modal with local tips ("Why locals do it") and add personal memory notes.
- **Progress Tracking & Milestones**: Watch your progress bar fill up as you complete tasks and unlock milestone badges (from *Newcomer* to *Real Groninger*).
- **Instant Local Storage**: No sign-up wall required; all progress and notes are stored locally in your browser.
- **Celebratory Micro-Animations**: Enjoy a quick celebratory particle animation whenever you check off an item!
- **Shareable Milestones**: Easily share your achievement status via Web Share API or clipboard copy.

---

## 🛠️ Tech Stack & Built With

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Resend](https://img.shields.io/badge/Resend-000000?style=for-the-badge&logo=resend&logoColor=white)](https://resend.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=Leaflet&logoColor=white)](https://leafletjs.com/)

- **HTML5**: Semantic structure and accessible DOM layout.
- **CSS3**: Custom responsive design system using CSS variables, Flexbox, and Grid.
- **Vanilla JavaScript (ES6+)**: Client-side application state management, dynamic DOM rendering, and local persistence.
- **Supabase**: Backend-as-a-Service providing passwordless magic-link authentication, Google OAuth, and real-time database synchronization.
- **Vercel**: Edge network deployment and fast static site hosting.
- **Resend**: Email infrastructure — Supabase's custom SMTP for magic links, and the sender behind contact-form submissions.
- **Leaflet & OpenStreetMap**: Interactive geospatial map view and customized location markers across Groningen.

---

## 🚀 Getting Started

Since MoiCheck is built with pure web technologies, no installation or build tools are required!

### Option 1: Open Directly in Browser
Simply open the `index.html` file in your preferred browser.

### Option 2: Run a Local Development Server
Using Python's built-in HTTP server:

```bash
# Clone the repository
git clone https.github.com/Dor-bl/moi-app.git
cd moi-app

# Run local server
python3 -m http.server 8000
```

Then visit `http://localhost:8000` in your web browser.

---

## 🟢 Example Bucket List Items

- 🥔 **Eat your first Groninger Eierbal** – Grab one hot from a snackbar or automatiek wall.
- 🚴 **Navigate the Grote Markt intersection on a bicycle** – Master free-flowing Dutch bike traffic.
- 🏰 **Climb the Martinitoren (d'Olle Grieze)** – Over 300 steps for a panoramic view of the province.
- 🗣️ **Say "Moi!" to a bus driver or neighbor** – The quintessential universal northern greeting.

---

## 🔐 User Login & Cloud Sync Setup (Supabase)

MoiCheck supports **User Accounts & Cross-Device Cloud Sync** powered by **Supabase**. Users can log in on their laptop, phone, or tablet, and their progress and memories stay automatically synchronized in real time!

### Features:
- **Google 1-Click Login**: Instant OAuth sign-in.
- **Magic Email Links**: Login via passwordless email link.
- **Automatic Progress Merge**: Local guest progress automatically merges into user accounts upon login.

### 1-Minute Supabase Setup Instructions:
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
6. Set up **custom SMTP** before letting anyone else sign in — see the troubleshooting note below.
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

### Knowing who a `user_id` belongs to (the `profiles` table)

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
  [processing register](docs/compliance/processing-register.md) and already disclosed. This is
  a second copy, in the same database, under the same processor, for the same purpose, erased
  by the same cascade. `buildAccountExport()` needs no change for the same reason — it already
  exports all three from the account itself. This SQL has been run against the project (2
  November 2026), so activity 1 of the register and `retention.md` §1 describe the mirror as
  live rather than as pending.

### Updating the vendored Supabase client

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

### Contact form (Supabase Edge Function)

The contact modal posts to an Edge Function rather than a third-party form service —
see [`docs/decisions/formsubmit-gdpr-basis.md`](docs/decisions/formsubmit-gdpr-basis.md)
for why. The function validates the submission and hands it to Resend, which delivers it
to `hallo@moicheck.nl`.

The POST carries `?forceFunctionRegion=eu-west-1`. Edge Functions otherwise run in the
region nearest the caller — the project's own `eu-west-1` governs the database and nothing
else — so without it a submission from outside the EU is processed outside the EU.
`privacy.html` section 3 tells visitors it is processed in Ireland, which makes that query
parameter a compliance claim rather than a performance tweak; `tests/contact-region.test.js`
fails if it disappears. The reasoning, and why the query parameter rather than the
`x-region` header, is in
[`docs/decisions/edge-function-region.md`](docs/decisions/edge-function-region.md). The
region a live invocation actually ran in comes back in the `x-sb-edge-region` response
header, which is the only way to confirm it end to end — `deploy-functions.yml` does exactly
that after each deploy and fails if the answer is not `eu-west-1`, so the three places that
have to agree (the pin, the policy, the platform) cannot drift apart quietly.

**The function must be deployed before the client change reaches production**, or the
form will POST to an endpoint that does not exist yet:

```bash
supabase link --project-ref <your-project-ref>   # once
supabase secrets set RESEND_API_KEY=re_xxxxxxxx  # from resend.com/api-keys
supabase functions deploy contact --no-verify-jwt
```

Pushing a change to `supabase/functions/contact/` on `main` now redeploys that
function automatically — only that path, so adding a second function means
extending the workflow rather than relying on it — see `.github/workflows/deploy-functions.yml` — so the commands
above are for the first deploy, for recovering when CI cannot, or for deploying
from a branch before merging. The workflow needs two repository secrets:

| Secret | Value |
| --- | --- |
| `SUPABASE_ACCESS_TOKEN` | A personal access token from *Account -> Access Tokens* in the Supabase dashboard |
| `SUPABASE_PROJECT_REF` | The project ref, the subdomain of your `*.supabase.co` URL |

Without them the job fails loudly with a message naming what is missing, rather
than appearing to succeed.

After deploying, the job asks the live function for the exact preflight a browser
sends and fails if the answer would not let the POST through — checking the
production origin, a Vercel preview origin, and one origin that must be refused.
The preview probe is not decoration: a preview-origin CORS mismatch is what
started #103, and production can keep working while previews break. If preview
hostnames ever change shape, update both the allow-list in
`supabase/functions/contact/index.ts` and the probe in the workflow.

The workflow pins both `supabase/setup-cli` (to a commit SHA — `@v1` is a branch
upstream, so it moves on its own) and the Supabase CLI version, because that job
runs third-party code with a production deploy token in scope. Bump them
deliberately; a stale pin fails at deploy time, which is the right direction to
fail in.

**`--no-verify-jwt` is required, not optional.** Without it the platform rejects the
browser's CORS preflight before the function runs: preflights carry no `Authorization`
header, so JWT verification has nothing to check and answers 401, and the real POST never
leaves the browser. This was confirmed on the first deploy of this function.

Losing that check costs nothing real. The anon key it would have demanded is published in
`config.js` and served to every visitor, so it never distinguished our form from anyone
else. What actually guards this endpoint is the `application/json` requirement (which
forces the preflight, and with it the origin allow-list, into the path), the honeypot,
the field validation, and the per-address rate limit.

The `from` address (`noreply@moicheck.nl` in `supabase/functions/contact/index.ts`) has
to be on a domain verified with Resend — the same requirement as the magic-link sender
described under *Troubleshooting* below. Delivery failures never reach the visitor; read
them in *Edge Functions -> contact -> Logs* in the Supabase dashboard.

Verify end to end after deploying:

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/contact" \
  -H "apikey: <publishable-key>" \
  -H "Content-Type: application/json" \
  -H "Origin: https://moicheck.nl" \
  -d '{"name":"Test","email":"you@example.com","subject":"Say Moi","message":"Test"}'
```

A `{"ok":true}` and a message in the inbox means the function itself works.

That is only half the check, and the weaker half. The browser sends a CORS preflight
before the real POST, because the client sets `apikey` and a JSON
content type — none of which are on the fetch safelist. The curl above sends no
preflight, so it passes even when the preflight would fail, and the form would then be
broken for every visitor while this check still looked green. Ask for the preflight
explicitly:

```bash
curl -i -X OPTIONS "https://<project-ref>.supabase.co/functions/v1/contact" \
  -H "Origin: https://moicheck.nl" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: apikey, content-type"
```

Expect a 200 carrying `access-control-allow-origin: https://moicheck.nl`. A **401 here
means the function was deployed without `--no-verify-jwt`** — the platform rejected the
preflight before the function saw it. Redeploy with the flag and repeat.

Then submit the real form once from the deployed site, which is the only check that
exercises the whole path at once.

Spam handling is deliberately small: a honeypot field the form fills only for bots, and a
per-instance rate limit. If that ever stops being enough, add Cloudflare Turnstile rather
than building a shared-state limiter.

The function also refuses anything that is not `application/json`. That looks like a
formality and is not: `text/plain` is on the fetch safelist, so without the check a page
on any origin could post a JSON body under that type, skip the preflight entirely, and
have its visitors send mail through us — the origin allow-list never gets consulted.
Requiring a content type outside the safelist is what forces the preflight, and with it
the allow-list, back into the path.

### Why there is no cookie banner

Everything MoiCheck stores on a visitor's device is exempt from the ePrivacy consent
requirement, on one of three grounds: it is the service itself (completed items and
notes), a preference the visitor set (theme, language, completed-list layout), or strictly
necessary for sign-in, which only happens because they asked to sign in (the Supabase
session token and the account marker). The event check-in is on the same footing: reading a
position is in scope for the rule, and it is exempt because it happens only inside a tap on
a button whose whole meaning is "confirm I am here" — nothing is read in the background and
no coordinate is kept. The key-by-key reasoning, and what would change it,
is written up in
[`docs/decisions/consent-exemption-analysis.md`](docs/decisions/consent-exemption-analysis.md);
`privacy.html` section 6 states the same thing in plain language for visitors. Add a new
storage key that fits none of those three grounds and that analysis needs revisiting.

### What personal data MoiCheck holds, and for how long

Two documents under `docs/compliance/` answer this, so it does not have to be reconstructed
from the code:

- [`processing-register.md`](docs/compliance/processing-register.md) — the GDPR Article 30
  record. Ten entries — eight processing activities with their purposes, data categories,
  processors, transfers, retention and safeguards, plus two boundary records. Activities 9 and 10 exist to mark the boundary: what
  stays on the device — and the one thing that doesn't, since progress made while signed out
  is merged into the account on sign-in — and the fact that there is no profiling or
  automated decision-making.
- [`retention.md`](docs/compliance/retention.md) — how long each category lives, which
  provider holds what for how long, and the written position on backups versus erasure.

Two more sit beside them: [`breach-runbook.md`](docs/compliance/breach-runbook.md) for when
something has leaked, and
[`account-hosting-audit.md`](docs/compliance/account-hosting-audit.md) for which account holds
which credential and which region each service runs in.

`privacy.html` is the public statement of the same facts. **Change the code, check both**: a
new table, column or `localStorage` key changes the register, and a new storage key also means
revisiting the consent-exemption analysis above.

### Account deletion (GDPR right to erasure)

Signed-in users can delete their account and data from the profile modal (*Delete my account & data*).
The anon key cannot touch `auth.users`, so the deletion runs through a `delete_user()`
database function. Run this in the Supabase SQL Editor:

```sql
create or replace function delete_user()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from public.user_progress where user_id = auth.uid();
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function delete_user() from public, anon;
grant execute on function delete_user() to authenticated;
```

The function runs as its owner (`security definer`) but only deletes the authenticated caller's own rows, `set search_path = ''` stops search path hijacking, and grants ensure only authenticated users can invoke it.

If your `user_progress` table predates the `on delete cascade` on `user_id`, update the foreign key constraint:

```sql
alter table user_progress drop constraint user_progress_user_id_fkey;
alter table user_progress add constraint user_progress_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;
```

If the function is not configured on the Supabase project, the app informs the user that self-service deletion is not yet available and provides contact info for manual removal.

### Dormant accounts are deleted after 24 months

An account nobody has used for 24 months is deleted, with its progress and notes, by a
nightly `pg_cron` job. This is the retention period `privacy.html` §4 states; the reasoning,
and why there is no warning email, is in
[`docs/compliance/retention.md`](docs/compliance/retention.md) §2.

"Used" cannot be read from `last_sign_in_at` alone. The SDK refreshes a session without
signing in again, so an account can be in daily use while that timestamp stays at its first
visit. A refresh does update the session row (`updated_at`, `refreshed_at`), but signing out
deletes that row, so the session tables forget the activity at exactly the moment it matters.
A small table, `account_last_seen`, keeps it: a job at 20 minutes past every hour copies each
live session's latest timestamp into it, and the deletion at 03:23 reads it.

The deletion removes the `auth.users` row and nothing else. Everything that points at it —
`user_progress`, `account_last_seen`, `profiles`, sessions, refresh tokens, identities — is
`on delete cascade`. Both jobs run as `postgres` inside the database, so nothing new is
exposed through the API, and `delete_user()` keeps its self-only check. Run this once in the
Supabase SQL Editor:

```sql
create extension if not exists pg_cron with schema pg_catalog;

create table public.account_last_seen (
  user_id uuid primary key references auth.users (id) on delete cascade,
  seen_at timestamptz not null
);
alter table public.account_last_seen enable row level security;
revoke all on public.account_last_seen from anon, authenticated;

-- Backfill once from today's sessions, so the deletion never runs on an empty table.
insert into public.account_last_seen (user_id, seen_at)
select user_id, max(greatest(updated_at, refreshed_at at time zone 'UTC'))
from auth.sessions
group by user_id
on conflict (user_id) do nothing;

select cron.schedule(
  'record-account-activity',
  '20 * * * *',
  $$
  insert into public.account_last_seen (user_id, seen_at)
  select user_id, max(greatest(updated_at, refreshed_at at time zone 'UTC'))
  from auth.sessions
  group by user_id
  on conflict (user_id) do update
    set seen_at = greatest(account_last_seen.seen_at, excluded.seen_at)
  $$
);

select cron.schedule(
  'delete-dormant-accounts',
  '23 3 * * *',
  $$
  delete from auth.users u
  where greatest(u.created_at, u.last_sign_in_at,
                 (select l.seen_at from public.account_last_seen l where l.user_id = u.id))
        < now() - interval '24 months'
    and not exists (
      select 1 from auth.sessions s
      where s.user_id = u.id
        and greatest(s.updated_at, s.refreshed_at at time zone 'UTC') >= now() - interval '24 months')
  $$
);
```

`refreshed_at` is stored without a time zone (in UTC), hence the cast. The live-session check
in the deletion repeats what the hourly job records, so a failed copy cannot delete an account
in use.

What it can still miss: a visit that resumes an existing session (no new sign-in) and is
followed by a sign-out before the next hourly copy. That visit is never recorded, so the 24
months run from the use recorded before it, and the account can be deleted that much earlier
than 24 months after the visit. A fresh sign-in is always recorded (`last_sign_in_at`), so it
takes a resumed session, a sign-out within the hour, and no visit after that. Closing it would
need a trigger on Supabase's own `auth.sessions` table. It would run inside every sign-out, and
inside the cascade when an account is deleted, so a fault in it would break both. That is not
done; see `retention.md` §2.

To see who the next run would delete, run the same `where` clause as a `select u.id, u.email, u.last_sign_in_at from auth.users u where …`.
Change the window in both `privacy.html` §4 and this job, never one alone.

### Troubleshooting: magic links fail with a 500

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
   account into `public.profiles` (see *Knowing who a `user_id` belongs to* above). It is
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

### Daily magic-link check

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

### Browser error reports

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

### Security headers

`vercel.json` sends a Content-Security-Policy and supporting headers (`X-Content-Type-Options`,
`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) on every response. The CSP lists each
origin the app talks to explicitly: the Supabase project, Leaflet 1.9.4 on unpkg, and OpenStreetMap
tiles. Its main job is to limit where a compromised script could send a stolen session token.
When you add a new third-party origin, change the Supabase project, or bump the Leaflet version,
update the CSP in `vercel.json` too, or the browser will block the request. Keep scripts in files
rather than inline `<script>` blocks; the policy does not allow inline scripts. The headers only
apply on Vercel, so check a preview deployment's browser console for CSP violations before merging.

---

## 📄 License

MIT License. Feel free to fork and adapt for other Dutch cities!
