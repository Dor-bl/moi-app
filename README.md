# MoiCheck <img src="./assets/groningen-flag.svg" width="30" height="20" alt="Groningen Flag" valign="middle" />

**MoiCheck** is a lightweight, interactive bucket list app tailored specifically for expats moving to the Netherlands, with a starting focus on the **Groningen** area ("Stad").

As someone who moved to Groningen, this app is built to help new expats settle in, explore local culture, try traditional Groninger food, and track their journey toward becoming a true "Stadjer"!

---

## ✨ Features

- **Category Achievement Badges 🏆**: Complete all items in a category (e.g. *Food & Drink*) to unlock special badges like **Groninger Foodie 🍟**, **Culture Explorer 🏛️**, **True Stadjer 🚴‍♂️**, and **Groningen Legend 👑**, complete with real-time celebratory toasts and profile badge showcase.
- **User Login & Cloud Sync (Google 1-Click & Magic Links)**: Users can sign in to save progress and memory notes, keeping state synchronized across mobile devices and laptops.
- **Interactive Groningen Map View 🗺️**: Switch seamlessly between List View and Map View. Features interactive map pins for all 31 locations across Groningen with real-time status (Green for completed, Orange for pending).
- **Multi-Language Support (EN 🇬🇧 / NL 🇳🇱)**: Toggle instantly between English and Dutch for all items, tips, categories, and milestone badges.
- **31 Curated Groningen Bucket List Items**: Handpicked experiences spanning Food & Drink, Culture & Sights, Daily Life, Groningen Classics, and Nature & Wildlife.
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
[![FormSubmit](https://img.shields.io/badge/FormSubmit-FF6B6B?style=for-the-badge&logo=mail.ru&logoColor=white)](https://formsubmit.co/)
[![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=Leaflet&logoColor=white)](https://leafletjs.com/)

- **HTML5**: Semantic structure and accessible DOM layout.
- **CSS3**: Custom responsive design system using CSS variables, Flexbox, and Grid.
- **Vanilla JavaScript (ES6+)**: Client-side application state management, dynamic DOM rendering, and local persistence.
- **Supabase**: Backend-as-a-Service providing passwordless magic-link authentication, Google OAuth, and real-time database synchronization.
- **Vercel**: Edge network deployment and fast static site hosting.
- **Resend & FormSubmit**: Email infrastructure supporting contact modal submissions and user communication.
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
5. Under **Authentication -> URL Configuration**, set **Site URL** to your production origin (`https://moicheck.nl`) and add it to **Redirect URLs** as well. Add any other origin you sign in from too, such as a Vercel preview URL or `http://localhost:8000`. The app passes `window.location.origin` as the redirect target, so an origin that is not listed will bounce users back without a session.
6. Set up **custom SMTP** before letting anyone else sign in — see the troubleshooting note below.
7. Under **Authentication -> Emails**, change the link in **both** the *Confirm signup* and *Magic Link* templates from `{{ .ConfirmationURL }}` to:
   ```
   {{ .SiteURL }}/?token_hash={{ .TokenHash }}&amp;type=email
   ```
   (`&amp;` rather than `&` because the template is HTML; browsers decode it when the link is clicked.) Mail scanners (Outlook, Office 365, most corporate filters) prefetch every link in a message. With the default link that first fetch hits Supabase's verify endpoint and uses up the one-time token, so the person taps a dead link seconds later. With this link the page loads and shows a *Finish Signing In* button; nothing is verified until they tap it. Then search the whole template for `ConfirmationURL` — it must appear **nowhere**, including as the visible text of a "copy and paste this link" line. Scanners read URLs out of plain text just as readily as out of `href`, so one leftover mention burns the token and the new link arrives dead. Until you change the templates the old flow keeps working — the app handles both.

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
