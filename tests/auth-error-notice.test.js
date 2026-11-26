// A failed sign-in (expired magic link, denied OAuth) comes back with the error
// in the URL, and initAuth shows it in an alert. The lead-in is UI text, so it
// follows the chosen language like the rest of the page; the provider's own
// description after it is passed through as sent.

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAuthModule, createFakeSupabase } from './helpers/load-auth.js';
import { loadEventsModule } from './helpers/load-events.js';

const { UI_TRANSLATIONS } = loadEventsModule();
const ERROR_URL = 'https://example.test/#error=access_denied&error_description=Email+link+is+invalid+or+has+expired';

function alertFor(lang) {
    const url = new URL(ERROR_URL);
    const alerts = [];
    const { module } = loadAuthModule({
        supabaseClient: createFakeSupabase({ session: null }),
        translations: UI_TRANSLATIONS,
        overrides: {
            alert: message => alerts.push(message),
            window: {
                location: { href: url.href, pathname: url.pathname, search: url.search, hash: url.hash },
                history: { replaceState: () => {} }
            }
        }
    });
    module.currentLang = lang;
    return module.initAuth().then(() => alerts);
}

for (const lang of ['en', 'nl']) {
    test(`the sign-in error alert is in the chosen language (${lang})`, async () => {
        const notice = UI_TRANSLATIONS[lang].authErrorNotice;
        assert.equal(typeof notice, 'string');
        assert.ok(notice.length > 0);

        const alerts = await alertFor(lang);

        assert.deepEqual(alerts, [`${notice} Email link is invalid or has expired`]);
    });
}

test('the en and nl sign-in notices differ', () => {
    assert.notEqual(UI_TRANSLATIONS.en.authErrorNotice, UI_TRANSLATIONS.nl.authErrorNotice);
});
