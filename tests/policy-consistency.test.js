// privacy.html has to agree with itself — and with its Dutch translation.
//
// PR #146 added a section and renumbered five others, and across two days of
// review the policy drifted six times: each time a fact landed in one place and
// a sentence elsewhere in the same document did not move. Reviewers caught all
// six; CI caught none. The one claim that never drifted was the region, because
// tests/contact-region.test.js makes three files agree on it.
//
// This does the same for the parts of the policy that can be checked
// mechanically, and only those. Per policy file:
//
//   - sections are numbered 1..n, with no gap and no repeat;
//   - every "section N" / "paragraaf N" / "§N" the policy cites is a section
//     that exists;
//   - every processor §2 names is placed somewhere in §3, which is where the
//     policy says where each one handles data and what covers it;
//   - the language-precedence clause is present, before §1, and links to the
//     other translation.
//
// And across the two translations, which is the drift a single-file check
// cannot see: the same sections, the same processors, the same date, and the
// same answer to which language governs. A fact added to one language and not
// the other is the most likely way this document ever becomes untrue, because
// the person editing it reads only one of them.
//
// The precedence clause is checked through the data-clause and
// data-governing-lang attributes on its paragraph rather than by its wording.
// Matching the prose would mean this test fails on every rewrite of a sentence
// it is not really about, which is how a test gets loosened until it checks
// nothing. The attributes let it ask the two questions that matter — is the
// clause still there, and do both files name the same winner — and stay quiet
// about how either sentence is phrased.
//
// It cannot check meaning. A cross-reference can point at a section that exists
// and still be the wrong one, §3 can name a provider while saying something
// false about it, and the Dutch can say the opposite of the English while
// matching it structurally. What this catches is the structural half of the
// drift, so review can spend its attention on the half no test can reach.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const MONTHS = {
    en: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'],
    nl: ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'],
};

// Each language says the same things in its own words, so the patterns that
// read the document have to be per-language. Everything else is shared.
const POLICIES = [
    {
        file: 'privacy.html',
        lang: 'en',
        counterpart: 'privacy-nl.html',
        // "section 4", "§4"
        citation: /(?:section|§)\s?(\d+)/gi,
        // §2 groups the map's three sources under one label
        // ("OpenStreetMap, Leaflet and unpkg"); split those so each is checked.
        conjunction: /,\s*|\s+and\s+/,
        updated: /Last updated:\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/,
    },
    {
        file: 'privacy-nl.html',
        lang: 'nl',
        counterpart: 'privacy.html',
        // "paragraaf 4", "§4"
        citation: /(?:paragraaf|§)\s?(\d+)/gi,
        // "OpenStreetMap, Leaflet en unpkg"
        conjunction: /,\s*|\s+en\s+/,
        updated: /Laatst bijgewerkt:\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/,
    },
];

const read = policy => {
    const text = fs.readFileSync(path.join(ROOT, policy.file), 'utf8');
    const headings = [...text.matchAll(/<h2>(\d+)\. ([^<]*)<\/h2>/g)].map(m => ({
        number: Number(m[1]),
        title: m[2],
    }));
    const sectionBody = number => {
        const match = text.match(new RegExp(`<h2>${number}\\. [^<]*</h2>([\\s\\S]*?)</section>`));
        return match ? match[1] : null;
    };
    const processors = number => {
        const body = sectionBody(number);
        if (body === null) return null;
        return [...body.matchAll(/<li><strong>([^<]+)<\/strong>/g)]
            .flatMap(m => m[1].split(policy.conjunction))
            .map(name => name.trim())
            .filter(Boolean);
    };
    // The whole <p ...data-clause="language-precedence"...>…</p>, or null.
    const precedenceClause = () => {
        const m = text.match(/<p\b[^>]*\bdata-clause="language-precedence"[^>]*>[\s\S]*?<\/p>/);
        return m ? { html: m[0], index: m.index } : null;
    };
    const governingLang = () => {
        const clause = precedenceClause();
        const m = clause && clause.html.match(/\bdata-governing-lang="([a-z-]+)"/);
        return m ? m[1] : null;
    };
    const updatedOn = () => {
        const m = text.match(policy.updated);
        if (!m) return null;
        const month = MONTHS[policy.lang].indexOf(m[2].toLowerCase());
        return month === -1 ? null : `${m[3]}-${String(month + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    };
    return { ...policy, text, headings, sectionBody, processors, precedenceClause, governingLang, updatedOn };
};

const policies = POLICIES.map(read);

for (const policy of policies) {
    test(`${policy.file} numbers its sections 1..n with no gap or repeat`, () => {
        assert.ok(policy.headings.length > 0, `${policy.file} has no numbered <h2> sections; if the markup changed, point this test at the new shape`);
        const numbers = policy.headings.map(h => h.number);
        const expected = numbers.map((_, i) => i + 1);
        assert.deepEqual(
            numbers,
            expected,
            `section headings run ${numbers.join(', ')} but should run ${expected.join(', ')}. A renumbering left a gap or a repeat — and every "section N" elsewhere, in this file and in the docs that cite it, may now point at the wrong place`
        );
    });

    test(`every section ${policy.file} cites exists`, () => {
        const existing = new Set(policy.headings.map(h => h.number));
        const cited = [...policy.text.matchAll(policy.citation)].map(m => Number(m[1]));
        assert.ok(cited.length > 0, `${policy.file} cites no sections at all, which is not what it looked like when this test was written; check the regex still matches how the policy refers to itself`);
        const dangling = [...new Set(cited.filter(n => !existing.has(n)))];
        assert.deepEqual(
            dangling,
            [],
            `${policy.file} cites section ${dangling.join(', ')}, which does not exist (sections run 1–${Math.max(...existing)}). A section was removed or renumbered and a reference to it did not move`
        );
    });

    test(`every processor §2 names is accounted for in §3 (${policy.file})`, () => {
        const where = policy.sectionBody(3);
        const processors = policy.processors(2);
        assert.ok(processors, `${policy.file} has no section 2; if "Who processes your data" moved, point this test at it`);
        assert.ok(where, `${policy.file} has no section 3; if "Where your data is processed" moved, point this test at it`);
        assert.ok(processors.length > 0, `found no <li><strong>Name</strong> entries in section 2 of ${policy.file}; if the list markup changed, point this test at the new shape`);

        const missing = processors.filter(name => !where.includes(name));
        assert.deepEqual(
            missing,
            [],
            `section 2 of ${policy.file} names ${missing.join(', ')} as handling visitors' data, but section 3 never mentions ${missing.length === 1 ? 'it' : 'them'}. Section 3 is where the policy says where each processor handles data and what covers any transfer out of the EU — a processor listed in one and absent from the other is the drift this PR series kept finding by hand`
        );
    });

    test(`${policy.file} carries the language-precedence clause, before §1`, () => {
        const clause = policy.precedenceClause();
        assert.ok(
            clause,
            `${policy.file} has no <p data-clause="language-precedence">. The clause saying which translation governs where the two disagree was removed, or its marker was dropped in a rewrite — either way a reader of this file is no longer told, and the other translation may still claim one`
        );

        const occurrences = policy.text.match(/data-clause="language-precedence"/g) || [];
        assert.equal(occurrences.length, 1, `${policy.file} marks ${occurrences.length} paragraphs as the precedence clause; there should be exactly one, or it is ambiguous which one governs`);

        const firstHeading = policy.text.search(/<h2>1\. /);
        assert.ok(firstHeading > -1, `${policy.file} has no section 1 heading to place the clause against`);
        assert.ok(
            clause.index < firstHeading,
            `the precedence clause in ${policy.file} sits after the section 1 heading. It belongs in the opening section, where a reader meets it before the document it applies to, not buried further down`
        );

        assert.ok(
            clause.html.includes(`href="${policy.counterpart}"`),
            `the precedence clause in ${policy.file} does not link to ${policy.counterpart}. It tells the reader another translation exists and which one wins, so it has to be possible to get there from it`
        );

        assert.ok(
            policy.governingLang(),
            `the precedence clause in ${policy.file} has no data-governing-lang, so this test cannot tell which language it says prevails`
        );
    });
}

// --- The two translations against each other -------------------------------

const [en, nl] = policies;

test('both translations have the same sections', () => {
    assert.deepEqual(
        nl.headings.map(h => h.number),
        en.headings.map(h => h.number),
        `${en.file} has ${en.headings.length} numbered sections and ${nl.file} has ${nl.headings.length}. A section was added to or removed from one language only, which also breaks every "section N" reference in the other`
    );
});

test('both translations name the same processors in §2', () => {
    const inEnglish = en.processors(2);
    const inDutch = nl.processors(2);
    const onlyEnglish = inEnglish.filter(name => !inDutch.includes(name));
    const onlyDutch = inDutch.filter(name => !inEnglish.includes(name));
    assert.deepEqual(
        { onlyEnglish, onlyDutch },
        { onlyEnglish: [], onlyDutch: [] },
        `the two policies disagree about who processes visitors' data: ${en.file} alone names ${onlyEnglish.join(', ') || 'nothing extra'}, ${nl.file} alone names ${onlyDutch.join(', ') || 'nothing extra'}. Provider names are not translated, so this is a processor added to one language and not the other`
    );
});

test('both translations name the same governing language', () => {
    const languages = policies.map(p => p.lang);
    const claims = policies.map(p => ({ file: p.file, governs: p.governingLang() }));
    const distinct = [...new Set(claims.map(c => c.governs))];

    assert.equal(
        distinct.length,
        1,
        `the two policies disagree about which one governs: ${claims.map(c => `${c.file} says "${c.governs}"`).join(', ')}. One was edited to name itself, or the clause was reworded in one language only — and a reader is now told a different answer depending on which file they opened`
    );
    assert.ok(
        languages.includes(distinct[0]),
        `the precedence clause names "${distinct[0]}" as the governing language, which is not one of the policies here (${languages.join(', ')}). Either a translation was removed or the attribute holds a typo`
    );
});

test('both translations carry the same "last updated" date', () => {
    const english = en.updatedOn();
    const dutch = nl.updatedOn();
    assert.ok(english, `could not read the "last updated" date from ${en.file}; if its wording changed, point this test at the new shape`);
    assert.ok(dutch, `could not read the "last updated" date from ${nl.file}; if its wording changed, point this test at the new shape`);
    assert.equal(
        dutch,
        english,
        `${en.file} was last updated ${english} and ${nl.file} ${dutch}. One translation was edited without the other, so a reader in one language is being told something the other no longer says`
    );
});
