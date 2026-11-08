// Words Module - Shared Global Exports: GRONINGS_WORDS, WORD_PROGRESS_KEY, WORD_SETTING_KEY,
// wordForDate, quizOptionsFor, readWordProgress, recordWordAnswer, readWordSetting, saveWordSetting
// Dependencies: none. Pure data and date arithmetic, so tests can drive it without a DOM;
// only readWordProgress/recordWordAnswer touch localStorage, and only when called.

// One Gronings word a day, the same word for everyone: the day picks it, nothing
// is drawn at random, so two friends comparing phones see the same card and a
// reload never changes the answer. Spellings follow everyday usage rather than a
// single dictionary - Gronings is written many ways - and the contact form is
// the place to argue about one.
//
// Each entry: `word` as shown, `meaning` as the quiz answer in both UI languages,
// an `example` in Gronings (`gr`) with its translation, and an optional `note`
// for the bit of context a local would add.
const GRONINGS_WORDS = [
    {
        id: 'moi',
        word: 'Moi',
        meaning: { en: 'hello (and goodbye)', nl: 'hallo (en tot ziens)' },
        example: { gr: "Moi! Hou is 't?", en: 'Hi! How are you?', nl: 'Hoi! Hoe gaat het?' },
        note: { en: 'The all-purpose northern greeting. Works at the bakery, on the bus and at the bar - and it is where this app got its name.', nl: 'De noordelijke groet voor alles. Werkt bij de bakker, in de bus en aan de bar - en deze app dankt er zijn naam aan.' }
    },
    {
        id: 'hou-ist',
        word: "Hou is 't?",
        meaning: { en: 'how are you?', nl: 'hoe gaat het?' },
        example: { gr: "Moi, hou is 't mit die?", en: 'Hi, how are you doing?', nl: 'Hoi, hoe is het met jou?' }
    },
    {
        id: 'goud',
        word: 'Goud',
        meaning: { en: 'good, fine', nl: 'goed' },
        example: { gr: "'t Is goud zo.", en: "It's fine like this.", nl: 'Het is goed zo.' },
        note: { en: 'Not gold - that is "gold" in Gronings too. "Goud zo" is the local "okay then".', nl: 'Niet het edelmetaal - dat is in het Gronings ook "gold". "Goud zo" is het lokale "oké dan".' }
    },
    {
        id: 'aaierbal',
        word: 'Aaierbal',
        meaning: { en: 'eierbal, the Groningen egg snack', nl: 'eierbal' },
        example: { gr: 'Ik neem n aaierbal mit mayo.', en: "I'll have an eierbal with mayo.", nl: 'Ik neem een eierbal met mayo.' },
        note: { en: 'A hard-boiled egg in ragout, breaded and deep-fried. Item 1 on your bucket list for a reason.', nl: 'Een hardgekookt ei in ragout, gepaneerd en gefrituurd. Niet voor niets nummer 1 op je lijst.' }
    },
    {
        id: 'stad',
        word: 'Stad',
        meaning: { en: 'the city of Groningen', nl: 'de stad Groningen' },
        example: { gr: 'Wie goan noar Stad.', en: "We're going into town.", nl: 'We gaan naar de stad.' },
        note: { en: 'There is only one city in Groningen, so nobody says which. Capital S, no article.', nl: 'Er is maar één stad in Groningen, dus niemand zegt welke. Hoofdletter S, geen lidwoord.' }
    },
    {
        id: 'stadjer',
        word: 'Stadjer',
        meaning: { en: 'someone from the city of Groningen', nl: 'inwoner van de stad Groningen' },
        example: { gr: 'Hai is n echte Stadjer.', en: "He's a true Stadjer.", nl: 'Hij is een echte Stadjer.' }
    },
    {
        id: 'ommelaand',
        word: 'Ommelaand',
        meaning: { en: 'the countryside around the city', nl: 'het platteland rond de stad' },
        example: { gr: 'Stad en Ommelaand.', en: 'City and surrounding land.', nl: 'Stad en Ommeland.' },
        note: { en: 'The province in two words: Stad, and everything else.', nl: 'De provincie in twee woorden: Stad, en de rest.' }
    },
    {
        id: 'grunnen',
        word: 'Grunnen',
        meaning: { en: 'Groningen', nl: 'Groningen' },
        example: { gr: 'Grunnen, Stad en Ommelaand.', en: 'Groningen, city and countryside.', nl: 'Groningen, stad en ommeland.' },
        note: { en: 'Also spelled Grönnen or Grunn. You will see it on shirts, beer and the back of cars.', nl: 'Ook gespeld als Grönnen of Grunn. Je ziet het op shirts, bier en achterruiten.' }
    },
    {
        id: 'olle-grieze',
        word: "d'Olle Grieze",
        meaning: { en: 'the Martini Tower ("the old grey one")', nl: 'de Martinitoren ("de oude grijze")' },
        example: { gr: "Kiek, doar staait d'Olle Grieze.", en: 'Look, there stands the Martini Tower.', nl: 'Kijk, daar staat de Martinitoren.' }
    },
    {
        id: 'kouk',
        word: 'Kouk',
        meaning: { en: 'cake, spiced loaf', nl: 'koek' },
        example: { gr: 'n Plak Grunneger kouk bie de thee.', en: 'A slice of Groningen spiced cake with tea.', nl: 'Een plak Groninger koek bij de thee.' }
    },
    {
        id: 'wicht',
        word: 'Wicht',
        meaning: { en: 'girl', nl: 'meisje' },
        example: { gr: 'Dat wicht fietst hail haard.', en: 'That girl cycles really fast.', nl: 'Dat meisje fietst heel hard.' }
    },
    {
        id: 'laif',
        word: 'Laif',
        meaning: { en: 'dear, sweet', nl: 'lief' },
        example: { gr: 'Mien laive!', en: 'My dear!', nl: 'Mijn lieverd!' }
    },
    {
        id: 'schier',
        word: 'Schier',
        meaning: { en: 'pretty, neat', nl: 'mooi, netjes' },
        example: { gr: 'Wat n schier hoes!', en: 'What a pretty house!', nl: 'Wat een mooi huis!' },
        note: { en: 'Yes, as in Schiermonnikoog: the island of the grey ("schier") monks.', nl: 'Ja, als in Schiermonnikoog: het eiland van de grijze ("schiere") monniken.' }
    },
    {
        id: 'smok',
        word: 'Smok',
        meaning: { en: 'kiss', nl: 'zoen, kus' },
        example: { gr: 'Geef mie n smok.', en: 'Give me a kiss.', nl: 'Geef me een zoen.' }
    },
    {
        id: 'toen',
        word: 'Toen',
        meaning: { en: 'garden', nl: 'tuin' },
        example: { gr: 'Opa zit in de toen.', en: 'Grandpa is sitting in the garden.', nl: 'Opa zit in de tuin.' }
    },
    {
        id: 'hoes',
        word: 'Hoes',
        meaning: { en: 'house', nl: 'huis' },
        example: { gr: 'Kom mor in hoes.', en: 'Come on inside.', nl: 'Kom maar binnen.' }
    },
    {
        id: 'kiek',
        word: 'Kiek',
        meaning: { en: 'look', nl: 'kijk' },
        example: { gr: 'Kiek es, de zun schient!', en: 'Look, the sun is shining!', nl: 'Kijk eens, de zon schijnt!' }
    },
    {
        id: 'nait-soezen',
        word: 'Nait soezen',
        meaning: { en: "don't whine, don't fuss", nl: 'niet zeuren' },
        example: { gr: 'Nait soezen, gewoon doun!', en: "Don't whine, just do it!", nl: 'Niet zeuren, gewoon doen!' },
        note: { en: 'As close as the city has to a motto. You will hear it from colleagues, coaches and grandmothers.', nl: 'Het dichtst bij een stadsmotto dat Groningen heeft. Je hoort het van collega\'s, coaches en oma\'s.' }
    },
    {
        id: 'bult',
        word: 'Bult',
        meaning: { en: 'a lot, a heap', nl: 'veel, een hoop' },
        example: { gr: 'Hai het n bult geld.', en: 'He has a lot of money.', nl: 'Hij heeft veel geld.' }
    },
    {
        id: 'eem',
        word: 'Eem',
        meaning: { en: 'a moment, just', nl: 'even' },
        example: { gr: 'Wacht eem.', en: 'Wait a moment.', nl: 'Wacht even.' }
    },
    {
        id: 'kwoad',
        word: 'Kwoad',
        meaning: { en: 'angry', nl: 'boos, kwaad' },
        example: { gr: 'Wees nait kwoad.', en: "Don't be angry.", nl: 'Wees niet boos.' }
    },
    {
        id: 'lutje',
        word: 'Lutje',
        meaning: { en: 'little, small', nl: 'klein' },
        example: { gr: 'Even n lutje stokje.', en: 'Just a little piece.', nl: 'Even een klein stukje.' }
    },
    {
        id: 'potje',
        word: 'Potje',
        meaning: { en: 'child', nl: 'kind' },
        example: { gr: 'Dat lutje potje lacht.', en: 'That little child is laughing.', nl: 'Dat kleine kind lacht.' }
    },
    {
        id: 'vot',
        word: 'Vot',
        meaning: { en: 'away, gone', nl: 'weg' },
        example: { gr: 'Wie goan vot.', en: "We're leaving.", nl: 'We gaan weg.' }
    },
    {
        id: 'zunder',
        word: 'Zunder',
        meaning: { en: 'without', nl: 'zonder' },
        example: { gr: 'Thee zunder suker.', en: 'Tea without sugar.', nl: 'Thee zonder suiker.' }
    },
    {
        id: 'zuneg',
        word: 'Zuneg',
        meaning: { en: 'frugal, thrifty', nl: 'zuinig' },
        example: { gr: 'Grunnegers binnen zuneg, zeggen ze.', en: 'Groningers are frugal, they say.', nl: 'Groningers zijn zuinig, zeggen ze.' }
    },
    {
        id: 'nuver',
        word: 'Nuver',
        meaning: { en: 'nice, pleasant', nl: 'leuk, aardig, fijn' },
        example: { gr: "'t Is nuver weer vandoag.", en: "It's lovely weather today.", nl: 'Het is fijn weer vandaag.' }
    },
    {
        id: 'puut',
        word: 'Puut',
        meaning: { en: 'bag', nl: 'zak, tas' },
        example: { gr: 'n Puut appels van de maarkt.', en: 'A bag of apples from the market.', nl: 'Een zak appels van de markt.' }
    },
    {
        id: 'hail',
        word: 'Hail',
        meaning: { en: 'very, whole', nl: 'heel' },
        example: { gr: 'Dat is hail mooi.', en: 'That is very nice.', nl: 'Dat is heel mooi.' }
    },
    {
        id: 'wotter',
        word: 'Wotter',
        meaning: { en: 'water', nl: 'water' },
        example: { gr: 'n Glas wotter, asjeblieft.', en: 'A glass of water, please.', nl: 'Een glas water, alsjeblieft.' }
    },
    {
        id: 'pronkjewail',
        word: 'Pronkjewail',
        meaning: { en: 'showpiece, jewel', nl: 'pronkjuweel' },
        example: { gr: 'Ain pronkjewail in golden raand.', en: 'A jewel in a golden frame.', nl: 'Een pronkjuweel in gouden rand.' },
        note: { en: 'A line from the provincial anthem, "Grönnens Laid". The jewel is Groningen.', nl: 'Een regel uit het Grönnens Laid, het provincievolkslied. Het juweel is Groningen.' }
    },
    {
        id: 'joa',
        word: 'Joa',
        meaning: { en: 'yes', nl: 'ja' },
        example: { gr: 'Joa, dat kin.', en: "Yes, that's possible.", nl: 'Ja, dat kan.' }
    },
    {
        id: 'kop-dr-veur',
        word: "Kop d'r veur",
        meaning: { en: 'chin up, go for it', nl: 'kop op, ervoor gaan' },
        example: { gr: "Kop d'r veur, jongens!", en: 'Go for it, lads!', nl: 'Ervoor gaan, jongens!' },
        note: { en: 'The FC Groningen rallying cry, painted on the stadium and sung from the stands.', nl: 'De strijdkreet van FC Groningen, op het stadion geschilderd en vanaf de tribune gezongen.' }
    },
    {
        id: 'sunnemeerten',
        word: 'Sunnemeerten',
        meaning: { en: "Saint Martin's, the 11 November lantern evening", nl: 'Sint-Maarten, 11 november' },
        example: { gr: 'Mit Sunnemeerten lopen de kinder mit lampions.', en: 'At Saint Martin\'s the children walk with lanterns.', nl: 'Met Sint-Maarten lopen de kinderen met lampionnen.' },
        note: { en: 'Children go door to door singing for sweets. Keep a bowl by the door on the 11th.', nl: 'Kinderen gaan zingend langs de deuren voor snoep. Zet op de 11e een bak klaar bij de deur.' }
    },
    {
        id: 'nijjoar',
        word: 'Nijjoar',
        meaning: { en: 'New Year', nl: 'nieuwjaar' },
        example: { gr: 'Gelukkig Nijjoar!', en: 'Happy New Year!', nl: 'Gelukkig nieuwjaar!' }
    },
    {
        id: 'eerappel',
        word: 'Eerappel',
        meaning: { en: 'potato', nl: 'aardappel' },
        example: { gr: 'Eerappels, mous en worst.', en: 'Potatoes, kale and sausage.', nl: 'Aardappels, boerenkool en worst.' }
    },
    {
        id: 'mous',
        word: 'Mous',
        meaning: { en: 'kale', nl: 'boerenkool' },
        example: { gr: 'Mous mit worst in de winter.', en: 'Kale with sausage in winter.', nl: 'Boerenkool met worst in de winter.' }
    },
    {
        id: 'knien',
        word: 'Knien',
        meaning: { en: 'rabbit', nl: 'konijn' },
        example: { gr: 'n Knien in de toen.', en: 'A rabbit in the garden.', nl: 'Een konijn in de tuin.' }
    },
    {
        id: 'peerd',
        word: 'Peerd',
        meaning: { en: 'horse', nl: 'paard' },
        example: { gr: "'t Peerd lopt in 't laand.", en: 'The horse walks in the field.', nl: 'Het paard loopt in het land.' }
    },
    {
        id: 'kou',
        word: 'Kou',
        meaning: { en: 'cow', nl: 'koe' },
        example: { gr: "De kou staait in 't laand.", en: 'The cow is standing in the field.', nl: 'De koe staat in het land.' }
    },
    {
        id: 'hoast',
        word: 'Hoast',
        meaning: { en: 'almost', nl: 'bijna' },
        example: { gr: 'Ik bin hoast kloar.', en: "I'm almost ready.", nl: 'Ik ben bijna klaar.' }
    },
    {
        id: 'zun',
        word: 'Zun',
        meaning: { en: 'sun', nl: 'zon' },
        example: { gr: 'De zun schient boven Stad.', en: 'The sun shines over the city.', nl: 'De zon schijnt boven de stad.' }
    },
    {
        id: 'oavend',
        word: 'Oavend',
        meaning: { en: 'evening', nl: 'avond' },
        example: { gr: 'Vanoavend goan wie oet.', en: "Tonight we're going out.", nl: 'Vanavond gaan we uit.' }
    },
    {
        id: 'toorn',
        word: 'Toorn',
        meaning: { en: 'tower', nl: 'toren' },
        example: { gr: 'De Martinitoorn is 97 meter hoog.', en: 'The Martini Tower is 97 metres tall.', nl: 'De Martinitoren is 97 meter hoog.' }
    },
    {
        id: 'loat',
        word: 'Loat',
        meaning: { en: 'let, leave (it)', nl: 'laat' },
        example: { gr: 'Loat mor.', en: 'Never mind.', nl: 'Laat maar.' }
    },
    {
        id: 'bliede',
        word: 'Bliede',
        meaning: { en: 'happy, glad', nl: 'blij' },
        example: { gr: 'Ik bin der bliede mit.', en: "I'm happy with it.", nl: 'Ik ben er blij mee.' }
    },
    {
        id: 'ol',
        word: 'Ol',
        meaning: { en: 'old', nl: 'oud' },
        example: { gr: 'n Olle fiets.', en: 'An old bike.', nl: 'Een oude fiets.' }
    },
    {
        id: 'nij',
        word: 'Nij',
        meaning: { en: 'new', nl: 'nieuw' },
        example: { gr: 'n Nij hoes in Reitdiephaven.', en: 'A new house in Reitdiephaven.', nl: 'Een nieuw huis in Reitdiephaven.' }
    },
    {
        id: 'dorp',
        word: 'Dörp',
        meaning: { en: 'village', nl: 'dorp' },
        example: { gr: 'Elk dörp het n kerk.', en: 'Every village has a church.', nl: 'Elk dorp heeft een kerk.' }
    },
    {
        id: 'mien',
        word: 'Mien',
        meaning: { en: 'my', nl: 'mijn' },
        example: { gr: 'Dat is mien fiets.', en: "That's my bike.", nl: 'Dat is mijn fiets.' }
    },
    {
        id: 'knoal',
        word: 'Knoal',
        meaning: { en: 'Stadskanaal, a town in the province', nl: 'Stadskanaal' },
        example: { gr: 'Hai komt oet Knoal.', en: "He's from Stadskanaal.", nl: 'Hij komt uit Stadskanaal.' }
    },
    {
        id: 'doun',
        word: 'Doun',
        meaning: { en: 'to do', nl: 'doen' },
        example: { gr: 'Wat mout ik doun?', en: 'What should I do?', nl: 'Wat moet ik doen?' }
    },
    {
        id: 'goan',
        word: 'Goan',
        meaning: { en: 'to go', nl: 'gaan' },
        example: { gr: 'Goan we?', en: 'Shall we go?', nl: 'Gaan we?' }
    },
    {
        id: 'mout',
        word: 'Mout',
        meaning: { en: 'must, have to', nl: 'moet' },
        example: { gr: 'Dat mout zo.', en: 'It has to be like that.', nl: 'Dat moet zo.' }
    }
];

// Answers given so far, keyed by Groningen calendar day: { "2026-11-08": { id, correct } }.
// Local only, like the rest of the app's unsynced preferences.
const WORD_PROGRESS_KEY = 'moiCheckWords';

// Whole days since 1970-01-01 for an ISO YYYY-MM-DD, so consecutive days walk the
// list in order and every word gets its turn before any repeats. Computed in UTC
// from the parts: the date is already Groningen's calendar day (todayInGroningen),
// so no timezone may touch it again.
function dayNumber(dateKey) {
    const [year, month, day] = dateKey.split('-').map(Number);
    return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

// FNV-1a, 32-bit. Not for security; it only has to spread strings evenly and give
// the same number on every device for the same input.
function hashString(str) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash >>> 0;
}

function wordForDate(dateKey, words = GRONINGS_WORDS) {
    const index = ((dayNumber(dateKey) % words.length) + words.length) % words.length;
    return words[index];
}

// Three answers in a fixed order for the day: the right one plus two meanings
// borrowed from other words. Borrowed rather than written, so adding a word is
// one entry and not three. A borrowed meaning that reads the same as the right
// answer (or as the other borrowed one) is skipped, otherwise two buttons would
// both be correct. The order is seeded by the day, the word and the language, so
// the right answer is not always in the same slot and does not move on reload.
function quizOptionsFor(word, lang, dateKey, words = GRONINGS_WORDS) {
    const seed = `${dateKey}|${word.id}|${lang}`;
    const answer = word.meaning[lang];
    const normalise = text => text.trim().toLowerCase();

    const taken = new Set([normalise(answer)]);
    const distractors = [];
    const others = words
        .filter(other => other.id !== word.id)
        .sort((a, b) => hashString(`${seed}|${a.id}`) - hashString(`${seed}|${b.id}`));
    for (const other of others) {
        const text = other.meaning[lang];
        if (taken.has(normalise(text))) continue;
        taken.add(normalise(text));
        distractors.push({ text, correct: false });
        if (distractors.length === 2) break;
    }

    const options = distractors;
    options.splice(hashString(seed) % (options.length + 1), 0, { text: answer, correct: true });
    return options;
}

// The stored answers, or an empty record when there are none or the value cannot
// be trusted (a hand edit, a write cut short).
function readWordProgress() {
    try {
        const stored = JSON.parse(localStorage.getItem(WORD_PROGRESS_KEY));
        if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return {};
        return stored;
    } catch {
        return {};
    }
}

// Records an answer and hands back the whole record, so the caller can keep
// rendering from it even when the write itself is refused (private browsing,
// storage full): the answer then holds for this page view and is simply not
// there tomorrow, which costs nothing worth guarding against.
//
// `progress` is the caller's copy, read once at page load. The store is shared
// between tabs and that copy is not, so a tab left open across midnight would
// otherwise write back a record missing whatever another tab saved since. Same
// shape as saveItems: the stored value wins for every day this tab did not
// answer, this tab's copy wins for the days it did (a day is answered once, so
// the two never disagree), and the answers it holds from refused writes ride
// along to the next write that goes through.
function recordWordAnswer(dateKey, wordId, correct, progress = {}) {
    const merged = { ...readWordProgress(), ...progress, [dateKey]: { id: wordId, correct } };
    try {
        localStorage.setItem(WORD_PROGRESS_KEY, JSON.stringify(merged));
    } catch {
        // See above: the in-memory record is the fallback.
    }
    return merged;
}

// Whether the card shows at all: 'on' (the default, and the stored value when
// nothing or anything unexpected is there) or 'off', chosen in Settings.
const WORD_SETTING_KEY = 'moiCheckWordOfDay';

function readWordSetting() {
    try {
        return localStorage.getItem(WORD_SETTING_KEY) === 'off' ? 'off' : 'on';
    } catch {
        return 'on';
    }
}

function saveWordSetting(value) {
    try {
        localStorage.setItem(WORD_SETTING_KEY, value === 'off' ? 'off' : 'on');
    } catch {
        // A refused write only means the choice lasts for this page view.
    }
}
