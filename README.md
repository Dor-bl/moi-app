# MoiCheck <img src="./assets/groningen-flag.svg" width="30" height="20" alt="Groningen Flag" valign="middle" />

**MoiCheck** is a lightweight, interactive bucket list app tailored specifically for expats moving to the Netherlands, with a starting focus on the **Groningen** area ("Stad").

As someone who moved to Groningen, this app is built to help new expats settle in, explore local culture, try traditional Groninger food, and track their journey toward becoming a true "Stadjer"!

---

## ✨ Features

- **Category Achievement Badges 🏆**: Complete all items in a category (e.g. *Food & Drink*) to unlock special badges like **Groninger Foodie 🍟**, **Culture Explorer 🏛️**, **True Stadjer 🚴‍♂️**, and **Groningen Legend 👑**, complete with real-time celebratory toasts and profile badge showcase.
- **User Login & Cloud Sync (Google 1-Click & Magic Links)**: Users can sign in to save progress and memory notes, keeping state synchronized across mobile devices and laptops.
- **Interactive Groningen Map View 🗺️**: Switch seamlessly between List View and Map View. Features interactive map pins for all 44 locations across Groningen with real-time status (Green for completed, Orange for pending).
- **Upcoming Events View 📅**: A third view alongside List and Map showing what's on in Groningen — Koningsdag, Bommen Berend, Sint Maarten, carbidschieten — with a *Happening now* badge for anything currently running. Events drop off the page by themselves the day after they finish, with no deploy needed: the list is filtered at render time against the current date in `Europe/Amsterdam`, and traditions on a fixed calendar date roll forward to their next occurrence automatically. Run `npm run events:check` to see what's still ahead and what needs fresh dates.
- **Multi-Language Support (EN 🇬🇧 / NL 🇳🇱)**: Toggle instantly between English and Dutch for all items, tips, categories, and milestone badges.
- **44 Curated Groningen Bucket List Items**: Handpicked experiences spanning Food & Drink, Culture & Sights, Daily Life, Groningen Classics, and Nature & Wildlife.
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
     note text,
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
3. Copy your project **URL** and **anon Key** from `Project Settings -> API`.
4. Paste them at the top of `js/auth.js` (`SUPABASE_URL` & `SUPABASE_ANON_KEY`) or set `window.SUPABASE_URL` and `window.SUPABASE_ANON_KEY` in `config.js`.
5. Under **Authentication -> URL Configuration**, set **Site URL** to your production origin (`https://moicheck.nl`) and add it to **Redirect URLs** as well. Add any other origin you sign in from too, such as `http://localhost:8000` and your Vercel previews — a glob covers all of them at once, e.g. `https://moi-app-*-blayzer.vercel.app/**`. The app passes the origin (`window.location.origin`) as the magic-link redirect target and the current page URL without its query or fragment (`window.location.origin + window.location.pathname`) for Google sign-in, so list each origin with a trailing `/**` (`https://moicheck.nl/**`) so that any page under it is accepted; an origin that is not listed will bounce users back without a session, and magic links requested from it will open on the Site URL instead (see step 7).
6. Set up **custom SMTP** before letting anyone else sign in — see the troubleshooting note below.
7. Under **Authentication -> Emails**, change the link in **both** the *Confirm signup* and *Magic Link* templates from `{{ .ConfirmationURL }}` to:
   ```
   {{ .RedirectTo }}/?token_hash={{ .TokenHash }}&amp;type=email
   ```
   (`&amp;` rather than `&` because the template is HTML; browsers decode it when the link is clicked.) `{{ .RedirectTo }}` is the origin the app passed when it requested the link, so a link requested from a Vercel preview or `localhost` opens there rather than on production. If that origin is not in **Redirect URLs** (step 5), Supabase substitutes the **Site URL**, which is why every link used to land on production. Mail scanners (Outlook, Office 365, most corporate filters) prefetch every link in a message. With the default link that first fetch hits Supabase's verify endpoint and uses up the one-time token, so the person taps a dead link seconds later. With this link the page loads and shows a *Finish Signing In* button; nothing is verified until they tap it. Then search the whole template for `ConfirmationURL` — it must appear **nowhere**, including as the visible text of a "copy and paste this link" line. Scanners read URLs out of plain text just as readily as out of `href`, so one leftover mention burns the token and the new link arrives dead. Until you change the templates the old flow keeps working — the app handles both.

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
  -H "Authorization: Bearer <anon-key>" \
  -H "apikey: <anon-key>" \
  -H "Content-Type: application/json" \
  -H "Origin: https://moicheck.nl" \
  -d '{"name":"Test","email":"you@example.com","subject":"Say Moi","message":"Test"}'
```

A `{"ok":true}` and a message in the inbox means the function itself works.

That is only half the check, and the weaker half. The browser sends a CORS preflight
before the real POST, because the client sets `Authorization`, `apikey` and a JSON
content type — none of which are on the fetch safelist. The curl above sends no
preflight, so it passes even when the preflight would fail, and the form would then be
broken for every visitor while this check still looked green. Ask for the preflight
explicitly:

```bash
curl -i -X OPTIONS "https://<project-ref>.supabase.co/functions/v1/contact" \
  -H "Origin: https://moicheck.nl" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization, apikey, content-type"
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
session token and the account marker). The key-by-key reasoning, and what would change it,
is written up in
[`docs/decisions/consent-exemption-analysis.md`](docs/decisions/consent-exemption-analysis.md);
`privacy.html` section 5 states the same thing in plain language for visitors. Add a new
storage key that fits none of those three grounds and that analysis needs revisiting.

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

### Troubleshooting: magic links fail with a 500

If `POST /auth/v1/otp` returns **500 (Internal Server Error)** — typically for everyone
except the project owner — the request reached Supabase and failed inside it. The client
sent a valid request; a malformed one would come back as a 400 or 422.

Read the real cause in *Logs -> Auth Logs* in the Supabase dashboard, on the failing
request's `error` field. The Edge Logs entry — the one showing just
`POST | 500 | /auth/v1/otp` — carries no body and cannot tell you anything. The causes,
in order of likelihood:

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
2. **No custom SMTP configured at all.** Supabase's built-in sender only delivers to the
   project's team members and is rate limited to a handful of messages per hour, so it
   fails the same way for real users. It is for development only.
3. **A database error while creating the user.** A trigger on `auth.users` (for example a
   `handle_new_user` function that inserts into a profiles table) that throws will fail the
   sign-up. The log says `Database error saving new user`. This repo's schema defines no
   such trigger, so this only applies if one was added by hand in the SQL editor.

Note that a failed send does not necessarily undo the sign-up: the auth event is logged
with an `actor_id`, and the address can be left behind as an unconfirmed row in
*Authentication -> Users*. After fixing delivery, check that list — a leftover unconfirmed
row is harmless, but it means the person is already "registered" and will get a sign-in
link rather than a fresh sign-up on their next attempt.

---

## 📄 License

MIT License. Feel free to fork and adapt for other Dutch cities!
