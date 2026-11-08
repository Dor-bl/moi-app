import test from 'node:test';
import assert from 'node:assert/strict';
import { loadWordsModule, fakeStorage } from './helpers/load-words.js';

const LANGS = ['en', 'nl'];
// Values built inside the vm context carry that context's prototypes, which
// strict deep-equality treats as a difference; compare their plain shape instead.
const plain = value => JSON.parse(JSON.stringify(value));
const { GRONINGS_WORDS, WORD_PROGRESS_KEY, wordForDate, quizOptionsFor } = loadWordsModule();

// A date range long enough to visit every word at least once.
function* days(from, count) {
    const start = new Date(`${from}T00:00:00Z`);
    for (let i = 0; i < count; i++) {
        yield new Date(start.getTime() + i * 86400000).toISOString().slice(0, 10);
    }
}

test('every word is complete in both languages and ids are unique', () => {
    const ids = new Set();
    for (const word of GRONINGS_WORDS) {
        assert.ok(word.id && !ids.has(word.id), `duplicate or missing id: ${word.id}`);
        ids.add(word.id);
        assert.ok(word.word.trim(), `${word.id}: empty word`);
        assert.ok(word.example?.gr?.trim(), `${word.id}: missing Gronings example`);
        for (const lang of LANGS) {
            assert.ok(word.meaning?.[lang]?.trim(), `${word.id}: missing ${lang} meaning`);
            assert.ok(word.example?.[lang]?.trim(), `${word.id}: missing ${lang} example`);
            if (word.note) assert.ok(word.note[lang]?.trim(), `${word.id}: note missing ${lang}`);
        }
    }
});

test('the list is long enough that a word does not come back within a month', () => {
    assert.ok(GRONINGS_WORDS.length >= 31, `only ${GRONINGS_WORDS.length} words`);
});

test('the same day always gives the same word, and consecutive days give different ones', () => {
    assert.equal(wordForDate('2026-11-08'), wordForDate('2026-11-08'));
    assert.notEqual(wordForDate('2026-11-08').id, wordForDate('2026-11-09').id);
    // Dates before 1970 produce negative day numbers; the index must still land in range.
    assert.ok(GRONINGS_WORDS.includes(wordForDate('1969-12-25')));
});

test('a full cycle of days visits every word exactly once', () => {
    const seen = new Map();
    for (const day of days('2026-01-01', GRONINGS_WORDS.length)) {
        const { id } = wordForDate(day);
        seen.set(id, (seen.get(id) || 0) + 1);
    }
    assert.equal(seen.size, GRONINGS_WORDS.length);
    assert.ok([...seen.values()].every(n => n === 1));
});

test('quiz options hold the right answer exactly once among three distinct texts', () => {
    for (const day of days('2026-01-01', GRONINGS_WORDS.length)) {
        const word = wordForDate(day);
        for (const lang of LANGS) {
            const options = quizOptionsFor(word, lang, day);
            assert.equal(options.length, 3, `${word.id}/${lang}: ${options.length} options`);
            const correct = options.filter(o => o.correct);
            assert.equal(correct.length, 1, `${word.id}/${lang}: ${correct.length} correct`);
            assert.equal(correct[0].text, word.meaning[lang]);
            const texts = new Set(options.map(o => o.text.trim().toLowerCase()));
            assert.equal(texts.size, 3, `${word.id}/${lang}: duplicate option text`);
        }
    }
});

test('quiz options are deterministic for a day and the answer moves between slots across days', () => {
    const word = wordForDate('2026-11-08');
    assert.deepEqual(plain(quizOptionsFor(word, 'en', '2026-11-08')), plain(quizOptionsFor(word, 'en', '2026-11-08')));

    const slots = new Set();
    for (const day of days('2026-01-01', 60)) {
        const w = wordForDate(day);
        slots.add(quizOptionsFor(w, 'en', day).findIndex(o => o.correct));
    }
    assert.equal(slots.size, 3, 'the right answer should land in every slot over two months');
});

test('a borrowed meaning that reads like the answer is skipped', () => {
    // Two words with the same meaning text; only one can be the answer, and the
    // other must not be offered as a distractor.
    const words = [
        { id: 'a', word: 'A', meaning: { en: 'water', nl: 'water' } },
        { id: 'b', word: 'B', meaning: { en: 'Water ', nl: 'water' } },
        { id: 'c', word: 'C', meaning: { en: 'sun', nl: 'zon' } },
        { id: 'd', word: 'D', meaning: { en: 'moon', nl: 'maan' } }
    ];
    const options = quizOptionsFor(words[0], 'en', '2026-11-08', words);
    assert.deepEqual(plain(options.map(o => o.text).sort()), ['moon', 'sun', 'water']);
});

test('answers are stored per day and read back; an untrustworthy store reads as empty', () => {
    const storage = fakeStorage();
    const { readWordProgress, recordWordAnswer } = loadWordsModule({ localStorage: storage });

    assert.deepEqual(plain(readWordProgress()), {});
    recordWordAnswer('2026-11-08', 'moi', true);
    recordWordAnswer('2026-11-09', 'stad', false);
    assert.deepEqual(plain(readWordProgress()), {
        '2026-11-08': { id: 'moi', correct: true },
        '2026-11-09': { id: 'stad', correct: false }
    });

    storage.setItem(WORD_PROGRESS_KEY, '[1,2]');
    assert.deepEqual(plain(readWordProgress()), {});
    storage.setItem(WORD_PROGRESS_KEY, '{not json');
    assert.deepEqual(plain(readWordProgress()), {});
});

// The multi-tab case: this tab's copy was read yesterday, another tab answered
// today since, and this tab now answers yesterday's card. Today's answer must
// survive the write, and an answer this tab holds from a refused write must too.
test('an answer written from a stale copy keeps what another tab saved since', () => {
    const storage = fakeStorage();
    const { readWordProgress, recordWordAnswer } = loadWordsModule({ localStorage: storage });

    const staleCopy = { '2026-11-06': { id: 'moi', correct: true } };          // read at load
    storage.setItem(WORD_PROGRESS_KEY, JSON.stringify({                        // another tab since
        '2026-11-06': { id: 'moi', correct: true },
        '2026-11-08': { id: 'wotter', correct: true }
    }));
    staleCopy['2026-11-05'] = { id: 'stad', correct: false };                  // held after a refused write

    const result = recordWordAnswer('2026-11-07', 'kouk', false, staleCopy);
    const expected = {
        '2026-11-05': { id: 'stad', correct: false },
        '2026-11-06': { id: 'moi', correct: true },
        '2026-11-07': { id: 'kouk', correct: false },
        '2026-11-08': { id: 'wotter', correct: true }
    };
    assert.deepEqual(plain(result), expected);
    assert.deepEqual(plain(readWordProgress()), expected);
});

test('a refused write still hands back the answer for this page view', () => {
    const storage = fakeStorage({ failWrites: true });
    const { recordWordAnswer } = loadWordsModule({ localStorage: storage });
    const progress = recordWordAnswer('2026-11-08', 'moi', true, {});
    assert.deepEqual(plain(progress), { '2026-11-08': { id: 'moi', correct: true } });
    assert.deepEqual(storage.dump(), {});
});

test('the card is on unless the setting says off, and anything odd reads as on', () => {
    const storage = fakeStorage();
    const { WORD_SETTING_KEY, readWordSetting, saveWordSetting } = loadWordsModule({ localStorage: storage });

    assert.equal(readWordSetting(), 'on', 'default');
    saveWordSetting('off');
    assert.equal(storage.getItem(WORD_SETTING_KEY), 'off');
    assert.equal(readWordSetting(), 'off');
    saveWordSetting('on');
    assert.equal(readWordSetting(), 'on');

    storage.setItem(WORD_SETTING_KEY, 'maybe');
    assert.equal(readWordSetting(), 'on', 'unknown value');
    saveWordSetting('whatever');
    assert.equal(storage.getItem(WORD_SETTING_KEY), 'on', 'only on/off are ever written');
});

test('a refused setting write does not throw', () => {
    const { saveWordSetting, readWordSetting } = loadWordsModule({ localStorage: fakeStorage({ failWrites: true }) });
    assert.doesNotThrow(() => saveWordSetting('off'));
    assert.equal(readWordSetting(), 'on');
});
