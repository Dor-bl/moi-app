# MoiCheck <img src="./assets/groningen-flag.svg" width="30" height="20" alt="Groningen Flag" valign="middle" />

**MoiCheck** is a lightweight, interactive bucket list app tailored specifically for expats moving to the Netherlands, with a starting focus on the **Groningen** area ("Stad").

As someone who moved to Groningen, this app is built to help new expats settle in, explore local culture, try traditional Groninger food, and track their journey toward becoming a true "Stadjer"!

---

## ✨ Features

- **Category Achievement Badges 🏆**: Complete all items in a category (e.g. *Food & Drink*) to unlock special badges like **Groninger Foodie 🍟**, **Culture Explorer 🏛️**, **True Stadjer 🚴‍♂️**, and **Groningen Legend 👑**, complete with real-time celebratory toasts and profile badge showcase.
- **User Login & Cloud Sync (Google 1-Click & Magic Links)**: Users can sign in to save progress and memory notes, keeping state synchronized across mobile devices and laptops.
- **Interactive Groningen Map View 🗺️**: Switch seamlessly between List View and Map View. Features interactive map pins for all 58 locations across Groningen with real-time status (Green for completed, Orange for pending).
- **Upcoming Events View 📅**: A third view alongside List and Map showing what's on in Groningen — Koningsdag, Bommen Berend, Sint Maarten, carbidschieten — with a *Happening now* badge for anything currently running. Events drop off the page by themselves the day after they finish, with no deploy needed: the list is filtered at render time against the current date in `Europe/Amsterdam`, and traditions on a fixed calendar date roll forward to their next occurrence automatically. Run `npm run events:check` to see what's still ahead and what needs fresh dates.
- **Event Check-In Badges 📍**: While an event is actually running, its card offers an *I'm here* button that confirms you made it and awards that event's badge — the **Stadspark Liberator 🕊️** for the Bevrijdingsfestival, say. The location check happens entirely in the browser: your coordinates are compared to the event's and then discarded, so what gets saved is the badge and never a position. A fix too vague to resolve the radius is refused rather than waved through, and each occurrence of a recurring event is its own badge. Only events carrying a `checkIn: { coords, radius }` block offer it — a city-wide entry like Koningsdag has no single point to stand near.
- **Gronings Word of the Day 🗣️**: A card above the list with one word of the local dialect — *Moi*, *Nait soezen*, *Mous* — and a three-way guess at what it means. Everyone gets the same word on the same day (the date picks it from `js/words.js`, so the list cycles with no deploy), the reveal shows it in a sentence with a local's note, and a running *words learned* count stays in the browser. Once answered the card folds to a one-line strip until tomorrow; it steps aside while a category filter is active, guests see a one-line sign-in nudge under the reveal, and Settings has a switch for anyone who only wants the list. A reason to open the app on a day with nothing to tick off.
- **Multi-Language Support (EN 🇬🇧 / NL 🇳🇱)**: Toggle instantly between English and Dutch for all items, tips, categories, and milestone badges.
- **58 Curated Groningen Bucket List Items**: Handpicked experiences spanning Food & Drink, Culture & Sights, Daily Life, Groningen Classics, and Nature & Wildlife.
- **Contact & Item Suggestions Form**: Expats can easily get in touch, suggest new Groningen bucket list items, report bugs, or send feedback with full bilingual support.
- **Category Filtering**: Easily filter items by category (*Food & Drink*, *Culture & Sights*, *Daily Life*, *Groningen Classics*, *Nature & Wildlife*).
- **"Surprise Me!" Random Picker 🎲**: Can't decide what to do this weekend? Tap the floating *Surprise me* button to deal a random uncompleted experience from the active category (with a *Pick another 🎲* button in the detail modal to reroll without repeating the same card twice in a row).
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

### Running Tests
```bash
npm ci
npx playwright install chromium
npm run lint
npm test
```
Browser-based tests launch headless Chromium via Playwright (or use the binary at `PW_CHROMIUM_PATH` when set).

---

## 🟢 Example Bucket List Items

- 🥔 **Eat your first Groninger Eierbal** – Grab one hot from a snackbar or automatiek wall.
- 🚴 **Navigate the Grote Markt intersection on a bicycle** – Master free-flowing Dutch bike traffic.
- 🏰 **Climb the Martinitoren (d'Olle Grieze)** – Over 300 steps for a panoramic view of the province.
- 🗣️ **Say "Moi!" to a bus driver or neighbor** – The quintessential universal northern greeting.

---

## 🔐 Login & Cloud Sync

Guests need no account: progress and notes live in the browser. Signing in with Google or
a magic link (via **Supabase**) keeps them in sync across devices, and any guest progress is
merged into the account on first login. To connect your own Supabase project, follow
[`docs/setup/supabase.md`](docs/setup/supabase.md).

---

## 📚 Further Docs

| Doc | What's in it |
|---|---|
| [Supabase setup](docs/setup/supabase.md) | Project setup and SQL, the `profiles` table, updating the vendored Supabase client |
| [Contact form](docs/setup/contact-form.md) | The `contact` Edge Function: secrets, deploying, end-to-end check |
| [Personal data](docs/compliance/data-handling.md) | Why there is no cookie banner, what data is held, account deletion, dormant-account cleanup |
| [Operations runbook](docs/operations/runbook.md) | Magic-link 500s, the daily magic-link check, browser error reports, security headers |
| [`docs/compliance/`](docs/compliance/) · [`docs/decisions/`](docs/decisions/) | GDPR register, retention, breach runbook, and decision records |

---

## 📄 License

MIT License. Feel free to fork and adapt for other Dutch cities!
