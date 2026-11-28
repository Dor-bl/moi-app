// A failed magic-link request (429 rate limit, 5xx from Supabase) is shown in an
// alert. That text is UI text, so it follows the chosen language; a provider
// message for other errors is passed through as sent.

import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAuthModule } from './helpers/load-auth.js';
import { loadEventsModule } from './helpers/load-events.js';

const { UI_TRANSLATIONS } = loadEventsModule();

function describe(lang, error) {
    const { module } = loadAuthModule({ translations: UI_TRANSLATIONS });
    module.currentLang = lang;
    return module.describeMagicLinkError(error);
}

for (const [status, key] of [[429, 'magicLinkRateLimited'], [500, 'magicLinkUnavailable'], [503, 'magicLinkUnavailable']]) {
    test(`magic-link error ${status} follows the chosen language`, () => {
        assert.equal(describe('en', { status }), UI_TRANSLATIONS.en[key]);
        assert.equal(describe('nl', { status }), UI_TRANSLATIONS.nl[key]);
        assert.notEqual(UI_TRANSLATIONS.nl[key], UI_TRANSLATIONS.en[key]);
    });
}

test('magic-link error without a message falls back to translated text', () => {
    assert.equal(describe('nl', {}), UI_TRANSLATIONS.nl.magicLinkFailed);
    assert.equal(describe('en', null), UI_TRANSLATIONS.en.magicLinkFailed);
});

test('magic-link error with a provider message passes it through', () => {
    assert.equal(describe('nl', { status: 400, message: 'Invalid email' }), 'Invalid email');
});
