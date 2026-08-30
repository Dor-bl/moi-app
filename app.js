// Supabase Configuration
const SUPABASE_URL = (typeof window !== 'undefined' && window.SUPABASE_URL) ? window.SUPABASE_URL : '';
const SUPABASE_ANON_KEY = (typeof window !== 'undefined' && window.SUPABASE_ANON_KEY) ? window.SUPABASE_ANON_KEY : '';

let supabaseClient = null;
if (window.supabase && SUPABASE_URL && !SUPABASE_URL.includes('YOUR_SUPABASE_PROJECT_ID')) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'implicit'
        }
    });
}
let currentUser = null;

const BUCKET_LIST = [
    {
        id: '1',
        coords: [53.2192, 6.5670],
        category: { en: 'Food & Drink', nl: 'Eten & Drinken' },
        title: { en: 'Eat your first Groninger Eierbal (Aaierbal)', nl: 'Eet je eerste Groningse Eierbal (Aaierbal)' },
        tip: { en: 'Grab one hot from a snackbar or the automatic wall (automatiek). Aaierbal is eierbal in Gronings.', nl: 'Haal er een warm uit de snackbar of uit de automatiek. Aaierbal is eierbal in het Gronings.' }
    },
    {
        id: '2',
        coords: [53.2168, 6.5645],
        category: { en: 'Food & Drink', nl: 'Eten & Drinken' },
        title: { en: 'Order Patat Oorlog at the Vismarkt', nl: 'Bestel Patat Oorlog op de Vismarkt' },
        tip: { en: 'Fries with mayo, peanut satay sauce, and raw diced onions.', nl: 'Friet met mayo, pindasaus en gesnipperde uitjes.' }
    },
    {
        id: '3',
        coords: [53.2170, 6.5648],
        category: { en: 'Food & Drink', nl: 'Eten & Drinken' },
        title: { en: 'Try fresh Stroopwafels at the Tuesday/Saturday market', nl: 'Probeer verse Stroopwafels op de markt' },
        tip: { en: 'Get them warm and fresh from the market stall at Vismarkt.', nl: 'Haal ze warm en vers bij de kraam op de Vismarkt.' }
    },
    {
        id: '4',
        coords: [53.2172, 6.5639],
        category: { en: 'Food & Drink', nl: 'Eten & Drinken' },
        title: { en: 'Buy Kruidkoek or Groninger Koek (Grunneger kouk)', nl: 'Koop Kruidkoek of Groninger Koek (Grunneger kouk)' },
        tip: { en: 'A spiced local cake (Grunneger kouk is Groninger koek), great with butter alongside coffee.', nl: 'Een gekruide lokale koek (Grunneger kouk is Groninger koek), heerlijk met boter bij de koffie.' }
    },
    {
        id: '5',
        coords: [53.2195, 6.5684],
        category: { en: 'Culture & Sights', nl: 'Cultuur & Bezienswaardigheden' },
        title: { en: 'Climb the Martinitoren (d\'Olle Grieze)', nl: 'Beklim de Martinitoren (d\'Olle Grieze)' },
        tip: { en: '300+ steps to the top for the best view over the province.', nl: '300+ treden naar de top voor het beste uitzicht over de provincie.' },
        url: 'https://www.visitgroningen.nl/nl/locaties/2176611183/martinitoren',
        urlLabel: { en: 'Martinitoren Info & Tickets 🎟️', nl: 'Martinitoren Info & Tickets 🎟️' }
    },
    {
        id: '6',
        coords: [53.2384, 6.5332],
        category: { en: 'Culture & Sights', nl: 'Cultuur & Bezienswaardigheden' },
        title: { en: 'Explore the colorful houses at Reitdiephaven', nl: 'Ontdek de kleurrijke huizen bij Reitdiephaven' },
        tip: { en: 'The classic postcard photo spot on the city’s edge.', nl: 'De bekende ansichtkaart fotospot aan de rand van de stad.' },
        url: 'https://www.visitgroningen.nl/nl/locaties/2778627751/reitdiephaven',
        urlLabel: { en: 'Reitdiephaven Visitor Guide ⚓', nl: 'Reitdiephaven Bezoekersgids ⚓' }
    },
    {
        id: '7',
        coords: [53.2190, 6.5701],
        category: { en: 'Culture & Sights', nl: 'Cultuur & Bezienswaardigheden' },
        title: { en: 'Visit the Forum Groningen rooftop', nl: 'Bezoek het dakterras van Forum Groningen' },
        tip: { en: 'Free panoramic view, great library, and open terrace.', nl: 'Gratis panoramisch uitzicht, een bibliotheek en een open terras.' },
        url: 'https://forum.nl',
        urlLabel: { en: 'Forum Groningen Website 🏛️', nl: 'Forum Groningen Website 🏛️' }
    },
    {
        id: '8',
        coords: [53.2124, 6.5663],
        category: { en: 'Culture & Sights', nl: 'Cultuur & Bezienswaardigheden' },
        title: { en: 'Tour the Groninger Museum', nl: 'Bezoek het Groninger Museum' },
        tip: { en: 'Distinctive postmodern architecture right opposite the central station.', nl: 'Opvallende postmoderne architectuur recht tegenover het hoofdstation.' },
        url: 'https://www.groningermuseum.nl',
        urlLabel: { en: 'Groninger Museum Exhibitions 🎨', nl: 'Groninger Museum Tentoonstellingen 🎨' }
    },
    {
        id: '9',
        coords: [53.2241, 6.5540],
        category: { en: 'Culture & Sights', nl: 'Cultuur & Bezienswaardigheden' },
        title: { en: 'Have a picnic at Noorderplantsoen', nl: 'Ga picknicken in het Noorderplantsoen' },
        tip: { en: 'The social heart of the city during sunny spring and summer days.', nl: 'Het sociale hart van de stad tijdens zonnige lente- en zomerdagen.' }
    },
    {
        id: '10',
        coords: [53.2110, 6.5640],
        category: { en: 'Daily Life', nl: 'Dagelijks Leven' },
        title: { en: 'Say "Moi!" to a bus driver or neighbor', nl: 'Zeg "Moi!" tegen een buschauffeur of buurman' },
        tip: { en: 'The quintessential universal northern greeting.', nl: 'De iconische en universele Noorderse begroeting.' }
    },
    {
        id: '11',
        coords: [53.2192, 6.5668],
        category: { en: 'Daily Life', nl: 'Dagelijks Leven' },
        title: { en: 'Navigate the Grote Markt intersection on a bicycle', nl: 'Fiets over het drukke kruispunt op de Grote Markt' },
        tip: { en: 'Master the art of free-flowing Dutch bike traffic.', nl: 'Meester de kunst van het vrije Nederlandse fietsverkeer.' }
    },
    {
        id: '12',
        coords: [53.2114, 6.5647],
        category: { en: 'Daily Life', nl: 'Dagelijks Leven' },
        title: { en: 'Park in the underground bike garage at Central Station', nl: 'Parkeer je fiets in de fietsenstalling bij het Station' },
        tip: { en: 'Experience multi-level bicycle infrastructure firsthand.', nl: 'Ervaar de indrukwekkende ondergrondse fietsinfrastructuur.' }
    },
    {
        id: '13',
        coords: [53.2200, 6.5600],
        category: { en: 'Daily Life', nl: 'Dagelijks Leven' },
        title: { en: 'Bike in the rain wearing full waterproof gear (regenpak)', nl: 'Fiets door de regen in een echt regenpak' },
        tip: { en: 'The ultimate rite of passage for Dutch daily commuting.', nl: 'De ultieme inwijding voor het dagelijkse Nederlandse fietsen.' }
    },
    {
        id: '14',
        coords: [53.2185, 6.5780],
        category: { en: 'Daily Life', nl: 'Dagelijks Leven' },
        title: { en: 'Visit a Kringloop (thrift store) for home items', nl: 'Bezoek een Kringloopwinkel voor spullen in huis' },
        tip: { en: 'Quintessential Dutch practical way to furnish a flat.', nl: 'De praktische Nederlandse manier om je woning in te richten.' },
        url: 'https://www.mamamini.nl',
        urlLabel: { en: 'Mamamini Thrift Stores ♻️', nl: 'Mamamini Kringloopwinkels ♻️' }
    },
    {
        id: '15',
        coords: [53.4070, 6.1950],
        category: { en: 'Groningen Classics', nl: 'Groningse Klassiekers' },
        title: { en: 'Take a day trip to Schiermonnikoog or Ameland', nl: 'Maak een dagtocht naar Schiermonnikoog of Ameland' },
        tip: { en: 'Catch the bus to Lauwersoog and take the ferry to the Wadden Islands.', nl: 'Neem de bus naar Lauwersoog en de boot naar de Waddeneilanden.' },
        url: 'https://www.wpd.nl',
        urlLabel: { en: 'Wagenborg Ferry Timetable ⛴️', nl: 'Wagenborg Dienstregeling Boot ⛴️' }
    },
    {
        id: '16',
        coords: [53.0069, 7.1919],
        category: { en: 'Groningen Classics', nl: 'Groningse Klassiekers' },
        title: { en: 'Visit the star fortress town of Bourtange', nl: 'Bezoek het vestingstadje Bourtange' },
        tip: { en: 'A restored 16th-century fortified village near the German border.', nl: 'Een gerestaureerde 16e-eeuwse vestingstad nabij de Duitse grens.' },
        url: 'https://www.bourtange.nl',
        urlLabel: { en: 'Vesting Bourtange Info 🏰', nl: 'Vesting Bourtange Info 🏰' }
    },
    {
        id: '17',
        coords: [53.2188, 6.5678],
        category: { en: 'Groningen Classics', nl: 'Groningse Klassiekers' },
        title: { en: 'Grab an evening beer at the Drie Gezusters', nl: 'Drink een biertje bij De Drie Gezusters' },
        tip: { en: 'One of the largest pub complexes in Europe on the Grote Markt.', nl: 'Een van de grootste cafécomplexen van Europa op de Grote Markt.' },
        url: 'https://dedriegezusters.nl',
        urlLabel: { en: 'De Drie Gezusters Website 🍺', nl: 'De Drie Gezusters Website 🍺' }
    },
    {
        id: '18',
        coords: [53.2064, 6.5917],
        category: { en: 'Groningen Classics', nl: 'Groningse Klassiekers' },
        title: { en: 'Watch an FC Groningen match at the Euroborg', nl: 'Bezoek een wedstrijd van FC Groningen in de Euroborg' },
        tip: { en: 'Experience local football pride with the Green-White Army.', nl: 'Beleef de lokale voetbaltrots in het stadion van de Trots van het Noorden.' },
        url: 'https://www.fcgroningen.nl',
        urlLabel: { en: 'FC Groningen Matches & Tickets ⚽', nl: 'FC Groningen Wedstrijden & Tickets ⚽' }
    },
    {
        id: '19',
        coords: [53.2163, 6.5675],
        category: { en: 'Groningen Classics', nl: 'Groningse Klassiekers' },
        title: { en: 'Walk around the historic Gasthuizen courtyards', nl: 'Wandel langs de historische Gasthuizen en hofjes' },
        tip: { en: 'Peaceful hidden medieval courtyards tucked behind city streets.', nl: 'Rustige verborgen middeleeuwse hofjes achter de drukke winkelstraten.' }
    },
    {
        id: '20',
        coords: [53.2166, 6.5652],
        category: { en: 'Groningen Classics', nl: 'Groningse Klassiekers' },
        title: { en: 'Do grocery shopping at the open-air market', nl: 'Doe boodschappen op de openluchtmarkt op de Vismarkt' },
        tip: { en: 'Buy fresh cheese, vegetables, and fish at the Vismarkt.', nl: 'Koop verse kaas, groenten en vis op de Vismarkt.' }
    },
    {
        id: '21',
        coords: [53.2192, 6.5630],
        category: { en: 'Daily Life', nl: 'Dagelijks Leven' },
        title: { en: 'Enroll in the free "Introduction to Dutch" course', nl: 'Volg de gratis online cursus "Introduction to Dutch"' },
        tip: { en: 'A popular free online course by the University of Groningen to learn basic Dutch.', nl: 'Een populaire gratis online cursus van de Rijksuniversiteit Groningen om de basis van de Nederlandse taal te leren.' },
        url: 'https://www.futurelearn.com/courses/dutch'
    },
    {
        id: '22',
        coords: [53.2185, 6.5672],
        category: { en: 'Food & Drink', nl: 'Eten & Drinken' },
        title: { en: 'Taste authentic Groninger Mosterdsoep', nl: 'Proef authentieke Groningse Mosterdsoep' },
        tip: { en: 'A rich, creamy local specialty made with coarse Groninger mustard and crispy bacon bits (spekjes).', nl: 'Een rijke, romige lokale specialiteit gemaakt met grove Groningse mosterd en knapperige spekjes.' }
    },
    {
        id: '23',
        coords: [53.2301, 6.5435],
        category: { en: 'Food & Drink', nl: 'Eten & Drinken' },
        title: { en: 'Try the famous Broodje Kip Cowboy at Slagerij Oosterhof', nl: 'Eet een Broodje Kip Cowboy bij Slagerij Oosterhof' },
        tip: { en: 'A legendary local specialty in Winkelcentrum Paddepoel: tender warm seasoned chicken thigh fillet on a fresh roll with lettuce and sauce.', nl: 'Een legendarische lokale favoriet in Winkelcentrum Paddepoel: malse warme gekruide kipdijfilet op een vers broodje met sla en saus.' },
        url: 'https://www.slagerijoosterhof.nl/',
        urlLabel: { en: 'Slagerij Oosterhof Website 🥪', nl: 'Slagerij Oosterhof Website 🥪' }
    },
    {
        id: '24',
        coords: [53.3211, 6.8576],
        category: { en: 'Culture & Sights', nl: 'Cultuur & Bezienswaardigheden' },
        title: { en: 'See the Hangende Keukens in Appingedam', nl: 'Bekijk de Hangende keukens in Appingedam' },
        tip: { en: 'Famous historic kitchens suspended over the Damsterdiep canal in Appingedam.', nl: 'Beroemde historische keukens die boven het water van het Damsterdiep in Appingedam zweven.' },
        url: 'https://www.visitgroningen.nl/nl/locaties/196787074/hangende-keukens',
        urlLabel: { en: 'Hangende Keukens Info 🏛️', nl: 'Hangende Keukens Info 🏛️' }
    },
    {
        id: '25',
        coords: [53.3622, 6.3860],
        category: { en: 'Culture & Sights', nl: 'Cultuur & Bezienswaardigheden' },
        title: { en: 'Explore Landgoed Borg Verhildersum in Leens', nl: 'Bezoek Landgoed Borg Verhildersum in Leens' },
        tip: { en: 'A historic 19th-century estate, mansion, and gardens showcasing Groninger estate life.', nl: 'Een prachtig historisch landgoed met borg, tuinen en museum in het Hoogeland.' },
        url: 'https://www.verhildersum.nl',
        urlLabel: { en: 'Borg Verhildersum Website 🏰', nl: 'Borg Verhildersum Website 🏰' }
    },
    {
        id: '26',
        coords: [53.2185, 6.7725],
        category: { en: 'Culture & Sights', nl: 'Cultuur & Bezienswaardigheden' },
        title: { en: 'Visit Landgoed Fraeylemaborg in Slochteren', nl: 'Bezoek Landgoed Fraeylemaborg in Slochteren' },
        tip: { en: 'An impressive historic estate surrounded by a large English-style park in Slochteren.', nl: 'Een indrukwekkende historische borg omgeven door een groot park in Engelse landschapsstijl.' },
        url: 'https://fraeylemaborg.nl',
        urlLabel: { en: 'Fraeylemaborg Website 🏰', nl: 'Fraeylemaborg Website 🏰' }
    },
    {
        id: '27',
        coords: [53.4068, 6.6713],
        category: { en: 'Culture & Sights', nl: 'Cultuur & Bezienswaardigheden' },
        title: { en: 'Tour the Menkemaborg in Uithuizen', nl: 'Bezoek de Menkemaborg in Uithuizen' },
        tip: { en: 'One of the best-preserved Groninger borgen with 18th-century interiors and beautiful gardens.', nl: 'Een van de best bewaarde Groninger borgen met een prachtig ingericht interieur en baroktuinen.' },
        url: 'https://www.menkemaborg.nl',
        urlLabel: { en: 'Menkemaborg Website 🏰', nl: 'Menkemaborg Website 🏰' }
    },
    {
        id: '28',
        coords: [53.2064, 6.5917],
        category: { en: 'Groningen Classics', nl: 'Groningse Klassiekers' },
        title: { en: 'Get an FC Groningen T-shirt or jersey', nl: 'Scoor een FC Groningen T-shirt of shirt' },
        tip: { en: 'Show your green-and-white pride around town or at the Euroborg stadium.', nl: 'Laat je groen-witte trots zien in de stad of in het Euroborg stadion.' },
        url: 'https://webshop.fcgroningen.nl',
        urlLabel: { en: 'FC Groningen Fanstore 🟢⚪', nl: 'FC Groningen Fanstore 🟢⚪' }
    },
    {
        id: '29',
        coords: [53.2107852, 6.5740967],
        category: { en: 'Food & Drink', nl: 'Eten & Drinken' },
        title: { en: 'Get fries at Friet van Piet on the Meeuwerderweg', nl: 'Haal friet bij Friet van Piet aan de Meeuwerderweg' },
        tip: { en: 'A beloved neighbourhood friettent in the Oosterpoort — fresh, hand-cut fries worth the queue.', nl: 'Een geliefde buurtfriettent in de Oosterpoort — verse friet waar je best even voor in de rij staat.' }
    },
    {
        id: '30',
        coords: [53.2340, 6.6040],
        category: { en: 'Nature & Wildlife', nl: 'Natuur & Dieren' },
        title: { en: 'Spot herons and waterfowl at Kardinge', nl: 'Spot reigers en watervogels bij Kardinge' },
        tip: { en: 'A short bike ride northeast of downtown; the reedbeds around Kardingerplas are home to grey herons, great white egrets, grebes, and geese year-round.', nl: 'Een korte fietstocht ten noordoosten van het centrum; het rietland rond de Kardingerplas is het hele jaar door thuis aan blauwe reigers, grote zilverreigers, futen en ganzen.' },
        url: 'https://www.natuurmonumenten.nl/natuurgebieden/kardinge',
        urlLabel: { en: 'Kardinge Nature Area Info 🦢', nl: 'Natuurgebied Kardinge Info 🦢' }
    },
    {
        id: '31',
        coords: [53.3710, 6.2380],
        category: { en: 'Nature & Wildlife', nl: 'Natuur & Dieren' },
        title: { en: 'Go birdwatching in Nationaal Park Lauwersmeer', nl: 'Ga vogels kijken in Nationaal Park Lauwersmeer' },
        tip: { en: 'Hides like Ezumakeeg and Jaap Deensgat draw spoonbills, geese, and birds of prey — best in autumn and winter when migratory flocks pass through.', nl: 'Vogelkijkhutten zoals Ezumakeeg en Jaap Deensgat trekken lepelaars, ganzen en roofvogels — het mooist in herfst en winter tijdens de vogeltrek.' },
        url: 'https://www.np-lauwersmeer.nl/doen-zien/vogels-kijken/',
        urlLabel: { en: 'Lauwersmeer Birdwatching Guide 🦅', nl: 'Lauwersmeer Vogels Kijken Gids 🦅' }
    }
];

const MILESTONES = [
    { threshold: 0, title: { en: 'Newcomer', nl: 'Nieuwkomer' } },
    { threshold: 5, title: { en: 'Stadjer in Training', nl: 'Stadjer in Opleiding' } },
    { threshold: 12, title: { en: 'Halfway Groninger', nl: 'Halverwege Groninger' } },
    { threshold: 19, title: { en: 'Local Expert', nl: 'Lokale Expert' } },
    { threshold: 31, title: { en: 'Real Groninger', nl: 'Echte Groninger' } }
];

const CATEGORY_BADGES = [
    {
        id: 'food_expert',
        category: 'Food & Drink',
        icon: '🍟',
        title: { en: 'Groninger Foodie', nl: 'Groninger Fijnproever' },
        desc: { 
            en: 'Tasted all classic Groningen delicacies & snacks!', 
            nl: 'Alle klassieke Groningse lekkernijen geproefd!' 
        }
    },
    {
        id: 'culture_lover',
        category: 'Culture & Sights',
        icon: '🏛️',
        title: { en: 'Culture Explorer', nl: 'Cultuurkenner' },
        desc: { 
            en: 'Explored all iconic sights, museums, and towers!', 
            nl: 'Alle iconische bezienswaardigheden en torens ontdekt!' 
        }
    },
    {
        id: 'daily_life_hero',
        category: 'Daily Life',
        icon: '🚴‍♂️',
        title: { en: 'True Stadjer', nl: 'Echte Stadjer' },
        desc: { 
            en: 'Mastered daily Dutch bike traffic, rain riding & greetings!', 
            nl: 'Het dagelijkse Nederlandse fiets- en stadsleven gemeesterd!' 
        }
    },
    {
        id: 'classics_master',
        category: 'Groningen Classics',
        icon: '👑',
        title: { en: 'Groningen Legend', nl: 'Groningse Legende' },
        desc: {
            en: 'Completed every historic expedition & classic tradition!',
            nl: 'Elke historische expeditie en klassieke traditie voltooid!'
        }
    },
    {
        id: 'nature_spotter',
        category: 'Nature & Wildlife',
        icon: '🦭',
        title: { en: 'Wadden Wildlife Spotter', nl: 'Waddennatuur Spotter' },
        desc: {
            en: 'Spotted all the wildlife the Groningen countryside and coast have to offer!',
            nl: 'Alle natuur en dieren van het Groningse landschap en de kust gespot!'
        }
    }
];

const UI_TRANSLATIONS = {
    en: {
        filterAll: 'All',
        filterFood: 'Food',
        filterCulture: 'Culture',
        filterDaily: 'Daily Life',
        filterClassics: 'Classics',
        filterNature: 'Nature',
        completedText: '{completed} of {total} completed',
        tipLabel: 'Local tip:',
        addMemory: 'Add a Memory',
        memoryPlaceholder: 'How was it? Who were you with?',
        markComplete: 'Mark as Complete',
        completedBtn: 'Completed',
        yourJourney: 'Your Journey',
        shareMilestone: 'Share Milestone',
        completedMemories: 'Completed Memories',
        noMemories: 'No memories yet. Go explore Groningen!',
        copied: 'Copied to Clipboard!',
        shareText: "I just unlocked '{milestone}' status on MoiCheck! I've completed {completed}/{total} classic Groningen experiences.",
        shareTextInitial: "I just started my Groningen journey as a '{milestone}' on MoiCheck! I've completed {completed}/{total} classic Groningen experiences.",
        contactTitle: 'Contact Us',
        contactSubtitle: 'Have a tip for a Groningen bucket list item, feedback, or just want to say Moi?',
        contactName: 'Name',
        contactEmail: 'Email',
        contactSubject: 'Subject',
        contactMessage: 'Message',
        sendMessage: 'Send Message',
        contactBtnText: 'Contact & Suggestions',
        successTitle: 'Moi! Bedankt!',
        successText: 'Thanks for your message! We appreciate your input on making Groningen awesome for expats.',
        optSuggest: 'Suggest a Groningen Item 💡',
        optFeedback: 'General Feedback 💬',
        optBug: 'Report an Issue 🐛',
        optMoi: 'Just saying Moi! 👋',
        viewList: 'List',
        viewMap: 'Map',
        viewDetails: 'View Details',
        courseLink: 'Free Dutch Course (UG) 🎓',
        signIn: 'Sign In',
        signOut: 'Sign Out',
        authTitle: 'Sign In / Sign Up',
        authSubtitle: 'Sync your Groningen memories & progress across all your devices.',
        continueGoogle: 'Continue with Google',
        orText: 'OR',
        sendMagicLink: 'Send Magic Sign-In Link ✨',
        magicTitle: 'Check Your Inbox!',
        magicText: "We've sent a magic sign-in link to your email. Click it to log in instantly on this device.",
        gotIt: 'Got It',
        achievementBadges: 'Achievement Badges',
        badgeUnlockedTag: 'BADGE UNLOCKED! 🎉',
        unlockedTag: 'Unlocked ✓',
        settingsTitle: 'Settings',
        settingsSubtitle: 'Customize your app preferences.',
        themeAppearance: 'Appearance',
        themeLight: 'Light',
        themeDark: 'Dark',
        themeSystem: 'System'
    },
    nl: {
        filterAll: 'Alles',
        filterFood: 'Eten',
        filterCulture: 'Cultuur',
        filterDaily: 'Dagelijks',
        filterClassics: 'Klassiekers',
        filterNature: 'Natuur',
        completedText: '{completed} van de {total} voltooid',
        tipLabel: 'Tip van locals:',
        addMemory: 'Herinnering toevoegen',
        memoryPlaceholder: 'Hoe was het? Met wie was je?',
        markComplete: 'Markeer als voltooid',
        completedBtn: 'Voltooid',
        yourJourney: 'Jouw Reis',
        shareMilestone: 'Mijlpaal Delen',
        completedMemories: 'Voltooide Herinneringen',
        noMemories: 'Nog geen herinneringen. Ga Groningen ontdekken!',
        copied: 'Gekopieerd naar klembord!',
        shareText: "Ik heb net de status '{milestone}' ontgrendeld op MoiCheck! Ik heb {completed}/{total} klassieke Groningse ervaringen voltooid.",
        shareTextInitial: "Ik ben net begonnen aan mijn Groningen-reis als '{milestone}' op MoiCheck! Ik heb {completed}/{total} klassieke Groningse ervaringen voltooid.",
        contactTitle: 'Contact',
        contactSubtitle: 'Heb je een tip voor een Groningse bucketlist ervaring, feedback of wil je gewoon Moi zeggen?',
        contactName: 'Naam',
        contactEmail: 'E-mailadres',
        contactSubject: 'Onderwerp',
        contactMessage: 'Bericht',
        sendMessage: 'Verstuur Bericht',
        contactBtnText: 'Contact & Suggesties',
        successTitle: 'Moi! Bedankt!',
        successText: 'Bedankt voor je bericht! We waarderen je input om Groningen geweldig te maken voor expats.',
        optSuggest: 'Tip een Gronings item 💡',
        optFeedback: 'Algemene feedback 💬',
        optBug: 'Meld een probleem 🐛',
        optMoi: 'Zeg gewoon Moi! 👋',
        viewList: 'Lijst',
        viewMap: 'Kaart',
        viewDetails: 'Bekijk Details',
        courseLink: 'Gratis Cursus Nederlands (RUG) 🎓',
        signIn: 'Inloggen',
        signOut: 'Uitloggen',
        authTitle: 'Inloggen / Registreren',
        authSubtitle: 'Synchroniseer je Groningse herinneringen & voortgang op al je apparaten.',
        continueGoogle: 'Verder met Google',
        orText: 'OF',
        sendMagicLink: 'Stuur Magische Inloglink ✨',
        magicTitle: 'Check Je Inbox!',
        magicText: 'We hebben een magische inloglink naar je e-mail gestuurd. Klik erop om direct in te loggen op dit apparaat.',
        gotIt: 'Begrepen',
        achievementBadges: 'Prestatiebadges',
        badgeUnlockedTag: 'BADGE ONTGRENDELD! 🎉',
        unlockedTag: 'Ontgrendeld ✓',
        settingsTitle: 'Instellingen',
        settingsSubtitle: 'Pas je app-voorkeuren aan.',
        themeAppearance: 'Weergave',
        themeLight: 'Licht',
        themeDark: 'Donker',
        themeSystem: 'Systeem'
    }
};

// State
let completedItems = JSON.parse(localStorage.getItem('moiCheckState')) || {};
let currentLang = localStorage.getItem('moiCheckLang') || 'en';
let currentFilter = 'All';
let currentView = 'list';
let selectedItemId = null;
let leafletMap = null;
let markersGroup = null;

// DOM Elements
const listContainer = document.getElementById('listContainer');
const mapWrapper = document.getElementById('mapWrapper');
const filterPills = document.querySelectorAll('.filter-pill');
const progressCount = document.getElementById('progressCount');
const progressFill = document.getElementById('progressFill');
const currentMilestone = document.getElementById('currentMilestone');
const langBtns = document.querySelectorAll('.lang-btn');
const listViewBtn = document.getElementById('listViewBtn');
const mapViewBtn = document.getElementById('mapViewBtn');

// Detail Modal Elements
const detailModal = document.getElementById('detailModal');
const modalCategory = document.getElementById('modalCategory');
const modalTitle = document.getElementById('modalTitle');
const modalTip = document.getElementById('modalTip');
const memoryNote = document.getElementById('memoryNote');
const modalCheckBtn = document.getElementById('modalCheckBtn');
const closeDetailModalBtn = document.getElementById('closeDetailModal');

// Profile Modal Elements
const profileModal = document.getElementById('profileModal');
const profileBtn = document.getElementById('profileBtn');
const closeProfileModalBtn = document.getElementById('closeProfileModal');
const shareBtn = document.getElementById('shareBtn');
const profileMilestone = document.getElementById('profileMilestone');
const profileProgressText = document.getElementById('profileProgressText');
const completedList = document.getElementById('completedList');

// Contact Modal Elements
const contactModal = document.getElementById('contactModal');
const contactBtn = document.getElementById('contactBtn');
const closeContactModalBtn = document.getElementById('closeContactModal');
const contactForm = document.getElementById('contactForm');
const contactSuccess = document.getElementById('contactSuccess');
const contactSuccessClose = document.getElementById('contactSuccessClose');

// Auth Modal Elements
const authModal = document.getElementById('authModal');
const authBtn = document.getElementById('authBtn');
const closeAuthModalBtn = document.getElementById('closeAuthModal');
const googleAuthBtn = document.getElementById('googleAuthBtn');
const magicLinkForm = document.getElementById('magicLinkForm');
const magicLinkSuccess = document.getElementById('magicLinkSuccess');
const magicSuccessClose = document.getElementById('magicSuccessClose');
const authActions = document.getElementById('authActions');

// Settings Modal Elements
const settingsModal = document.getElementById('settingsModal');
const settingsBtn = document.getElementById('settingsBtn');
const closeSettingsModalBtn = document.getElementById('closeSettingsModal');
const themeOptionBtns = document.querySelectorAll('.theme-option-btn');

const ALLOWED_THEMES = ['light', 'dark', 'system'];

function applyTheme(themeOption) {
    const validTheme = ALLOWED_THEMES.includes(themeOption) ? themeOption : 'system';
    if (validTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else if (validTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        document.documentElement.removeAttribute('data-theme');
    }
    updateThemeButtonsUI(validTheme);
}

function updateThemeButtonsUI(currentOption) {
    themeOptionBtns.forEach(btn => {
        const option = btn.dataset.themeOption;
        btn.classList.toggle('active', option === currentOption);
    });
}

function initTheme() {
    let savedTheme = localStorage.getItem('moiCheckTheme');
    if (!savedTheme) {
        savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            localStorage.setItem('moiCheckTheme', savedTheme);
            localStorage.removeItem('theme');
        }
    }
    if (!ALLOWED_THEMES.includes(savedTheme)) {
        savedTheme = 'system';
    }
    applyTheme(savedTheme);
}

function setTheme(themeOption) {
    const validTheme = ALLOWED_THEMES.includes(themeOption) ? themeOption : 'system';
    localStorage.setItem('moiCheckTheme', validTheme);
    applyTheme(validTheme);
}

function init() {
    initTheme();
    updateLanguageUI();
    renderList();
    updateProgress();
    setupEventListeners();
    initAuth();
}

function updateLanguageUI() {
    const t = UI_TRANSLATIONS[currentLang];

    const categoryKeys = {
        'All': t.filterAll,
        'Food & Drink': t.filterFood,
        'Culture & Sights': t.filterCulture,
        'Daily Life': t.filterDaily,
        'Groningen Classics': t.filterClassics,
        'Nature & Wildlife': t.filterNature
    };

    filterPills.forEach(pill => {
        const cat = pill.dataset.filter;
        if (categoryKeys[cat]) pill.textContent = categoryKeys[cat];
    });

    langBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLang);
    });

    document.getElementById('txtListView').textContent = t.viewList;
    document.getElementById('txtMapView').textContent = t.viewMap;

    document.querySelector('.memory-section h3').textContent = t.addMemory;
    memoryNote.placeholder = t.memoryPlaceholder;
    document.querySelector('#profileModal h2').textContent = t.yourJourney;
    document.querySelector('#profileModal h3').textContent = t.completedMemories;
    const txtCatBadges = document.getElementById('txtCategoryBadges');
    if (txtCatBadges) txtCatBadges.textContent = t.achievementBadges;
    shareBtn.textContent = t.shareMilestone;

    // Contact modal translations
    document.getElementById('contactModalTitle').textContent = t.contactTitle;
    document.getElementById('contactModalSubtitle').textContent = t.contactSubtitle;
    document.getElementById('lblContactName').textContent = t.contactName;
    document.getElementById('lblContactEmail').textContent = t.contactEmail;
    document.getElementById('lblContactSubject').textContent = t.contactSubject;
    document.getElementById('lblContactMessage').textContent = t.contactMessage;
    document.getElementById('contactSubmitBtn').textContent = t.sendMessage;
    document.getElementById('contactBtn').textContent = t.contactBtnText;
    document.getElementById('contactSuccessTitle').textContent = t.successTitle;
    document.getElementById('contactSuccessText').textContent = t.successText;

    const select = document.getElementById('contactSubject');
    select.options[0].text = t.optSuggest;
    select.options[1].text = t.optFeedback;
    select.options[2].text = t.optBug;
    select.options[3].text = t.optMoi;

    // Settings modal translations
    if (settingsBtn) {
        settingsBtn.setAttribute('aria-label', t.settingsTitle);
    }
    document.getElementById('settingsModalTitle').textContent = t.settingsTitle;
    document.getElementById('settingsModalSubtitle').textContent = t.settingsSubtitle;
    document.getElementById('txtThemeHeader').textContent = t.themeAppearance;
    document.getElementById('txtThemeLight').textContent = t.themeLight;
    document.getElementById('txtThemeDark').textContent = t.themeDark;
    document.getElementById('txtThemeSystem').textContent = t.themeSystem;

    // Auth modal & header translations
    document.getElementById('authModalTitle').textContent = t.authTitle;
    document.getElementById('authModalSubtitle').textContent = t.authSubtitle;
    document.getElementById('txtGoogleBtn').textContent = t.continueGoogle;
    document.getElementById('txtAuthOr').textContent = t.orText;
    document.getElementById('lblMagicEmail').textContent = t.contactEmail;
    document.getElementById('magicLinkSubmitBtn').textContent = t.sendMagicLink;
    document.getElementById('magicSuccessTitle').textContent = t.magicTitle;
    document.getElementById('magicSuccessText').textContent = t.magicText;
    document.getElementById('magicSuccessClose').textContent = t.gotIt;

    updateAuthBtnState(!!currentUser);
}

function updateAuthBtnState(isLoggedIn) {
    const t = UI_TRANSLATIONS[currentLang];
    const userAccountBadge = document.getElementById('userAccountBadge');
    const userAccountEmail = document.getElementById('userAccountEmail');

    if (isLoggedIn && currentUser) {
        const shortEmail = currentUser.email ? currentUser.email.split('@')[0] : 'User';
        authBtn.textContent = `${shortEmail} (${t.signOut})`;
        authBtn.classList.add('user-logged-in');
        if (userAccountBadge && userAccountEmail) {
            userAccountBadge.style.display = 'flex';
            userAccountEmail.textContent = `☁️ Synced as ${currentUser.email || shortEmail}`;
        }
    } else {
        authBtn.textContent = t.signIn;
        authBtn.classList.remove('user-logged-in');
        if (userAccountBadge) {
            userAccountBadge.style.display = 'none';
        }
    }
}

async function initAuth() {
    if (!supabaseClient) return;

    try {
        // Detect if an error was passed back in hash or query parameters (e.g. expired link)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        const errorDesc = hashParams.get('error_description') || queryParams.get('error_description');
        if (errorDesc) {
            console.error('Supabase auth error:', errorDesc);
            alert('Sign In Notice: ' + errorDesc);
        }

        // Fetch existing active session
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session && session.user) {
            currentUser = session.user;
            await onUserLoggedIn();
        }

        // Listen for auth state changes
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            console.log('Supabase auth event:', event, session?.user?.email);
            if (session && session.user) {
                currentUser = session.user;
                await onUserLoggedIn();
                // Clean hash from URL bar if access token was passed in hash
                if (window.location.hash && window.location.hash.includes('access_token')) {
                    window.history.replaceState(null, '', window.location.pathname + window.location.search);
                }
            } else if (event === 'SIGNED_OUT') {
                if (currentUser) {
                    currentUser = null;
                    onUserLoggedOut();
                }
            }
        });
    } catch (err) {
        console.error('Auth init error:', err);
    }
}

async function onUserLoggedIn() {
    updateAuthBtnState(true);
    await syncCloudProgress();
    renderList();
    updateProgress();
}

function onUserLoggedOut() {
    updateAuthBtnState(false);
    renderList();
    updateProgress();
}

async function syncCloudProgress() {
    if (!supabaseClient || !currentUser) return;

    try {
        const { data, error } = await supabaseClient
            .from('user_progress')
            .select('*')
            .eq('user_id', currentUser.id);

        if (error) {
            console.log('Cloud sync note:', error.message);
            return;
        }

        if (data) {
            data.forEach(row => {
                completedItems[row.item_id] = {
                    date: row.date || new Date().toISOString(),
                    note: row.note || ''
                };
            });
            saveState();

            const localEntries = Object.entries(completedItems);
            for (let [itemId, localData] of localEntries) {
                const cloudMatch = data.find(d => d.item_id === itemId);
                if (!cloudMatch) {
                    await supabaseClient.from('user_progress').upsert({
                        user_id: currentUser.id,
                        item_id: itemId,
                        note: localData.note || '',
                        date: localData.date || new Date().toISOString()
                    });
                }
            }
        }
    } catch (err) {
        console.log('Sync note:', err);
    }
}

async function syncItemToCloud(itemId, isCompleted, note = '') {
    if (!supabaseClient || !currentUser) return;

    try {
        if (isCompleted) {
            await supabaseClient.from('user_progress').upsert({
                user_id: currentUser.id,
                item_id: itemId,
                note: note,
                date: new Date().toISOString()
            });
        } else {
            await supabaseClient.from('user_progress')
                .delete()
                .eq('user_id', currentUser.id)
                .eq('item_id', itemId);
        }
    } catch (err) {
        console.log('Cloud update note:', err);
    }
}

function setLanguage(lang) {
    if (lang === currentLang) return;
    currentLang = lang;
    localStorage.setItem('moiCheckLang', currentLang);
    updateLanguageUI();
    renderList();
    updateProgress();
    if (currentView === 'map' && leafletMap) {
        renderMapMarkers();
    }
    
    if (detailModal.classList.contains('active') && selectedItemId) {
        const item = BUCKET_LIST.find(i => i.id === selectedItemId);
        if (item) openDetailModal(item);
    }
}

function switchView(view) {
    currentView = view;
    if (view === 'list') {
        listViewBtn.classList.add('active');
        mapViewBtn.classList.remove('active');
        listContainer.style.display = 'grid';
        mapWrapper.style.display = 'none';
    } else {
        mapViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        listContainer.style.display = 'none';
        mapWrapper.style.display = 'block';
        initOrUpdateMap();
    }
}

function initOrUpdateMap() {
    if (!window.L) return;

    if (!leafletMap) {
        leafletMap = L.map('mapContainer').setView([53.2194, 6.5665], 13);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(leafletMap);

        markersGroup = L.layerGroup().addTo(leafletMap);
    }

    setTimeout(() => {
        leafletMap.invalidateSize();
    }, 100);

    renderMapMarkers();
}

function renderMapMarkers() {
    if (!leafletMap || !markersGroup) return;
    markersGroup.clearLayers();

    const t = UI_TRANSLATIONS[currentLang];
    const filteredList = currentFilter === 'All' 
        ? BUCKET_LIST 
        : BUCKET_LIST.filter(item => item.category.en === currentFilter);

    filteredList.forEach(item => {
        const isCompleted = !!completedItems[item.id];
        
        const pinColor = isCompleted ? '#047857' : '#B45309';
        const customIcon = L.divIcon({
            className: 'custom-map-pin',
            html: `<div style="background-color: ${pinColor}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                    ${isCompleted ? '✓' : '•'}
                   </div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });

        const marker = L.marker(item.coords, { icon: customIcon });

        const popupContent = document.createElement('div');
        popupContent.className = 'map-popup-card';
        popupContent.innerHTML = `
            <span class="card-category">${item.category[currentLang]}</span>
            <h4>${item.title[currentLang]}</h4>
            <p>${item.tip[currentLang]}</p>
            <button class="map-popup-btn">${t.viewDetails}</button>
        `;

        popupContent.querySelector('.map-popup-btn').addEventListener('click', () => {
            openDetailModal(item);
        });

        marker.bindPopup(popupContent);
        markersGroup.addLayer(marker);
    });
}

function renderList() {
    listContainer.innerHTML = '';
    
    const filteredList = currentFilter === 'All' 
        ? BUCKET_LIST 
        : BUCKET_LIST.filter(item => item.category.en === currentFilter);

    // ⚡ Bolt Performance Optimization:
    // Use a DocumentFragment to batch all DOM insertions.
    // Impact: Reduces browser reflows/repaints from O(N) to O(1) when rendering the list,
    // improving render speed.
    const fragment = document.createDocumentFragment();

    filteredList.forEach(item => {
        const isCompleted = !!completedItems[item.id];
        
        const card = document.createElement('div');
        card.className = `bucket-card ${isCompleted ? 'completed' : ''}`;
        card.dataset.id = item.id;
        
        card.innerHTML = `
            <div class="checkbox-container">
                <div class="checkbox" data-id="${item.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
            </div>
            <div class="card-content">
                <span class="card-category">${item.category[currentLang]}</span>
                <h3 class="card-title">${item.title[currentLang]}</h3>
                <p class="card-tip">${item.tip[currentLang]}</p>
            </div>
        `;
        
        const checkbox = card.querySelector('.checkbox');
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleComplete(item.id, e);
        });

        card.addEventListener('click', () => openDetailModal(item));
        
        fragment.appendChild(card);
    });

    listContainer.appendChild(fragment);

    if (currentView === 'map' && leafletMap) {
        renderMapMarkers();
    }
}

function getMilestoneObj(count) {
    let current = MILESTONES[0];
    for (let milestone of MILESTONES) {
        if (count >= milestone.threshold) {
            current = milestone;
        }
    }
    return current;
}

function updateProgress() {
    const t = UI_TRANSLATIONS[currentLang];
    const completedCount = Object.keys(completedItems).length;
    const totalCount = BUCKET_LIST.length;
    const percentage = (completedCount / totalCount) * 100;
    
    progressCount.textContent = t.completedText.replace('{completed}', completedCount).replace('{total}', totalCount);
    progressFill.style.width = `${percentage}%`;
    
    const milestoneObj = getMilestoneObj(completedCount);
    const milestoneTitle = milestoneObj.title[currentLang];
    
    currentMilestone.textContent = milestoneTitle;
    profileMilestone.textContent = milestoneTitle;
    profileProgressText.textContent = t.completedText.replace('{completed}', completedCount).replace('{total}', totalCount);
}

function toggleComplete(id, event = null) {
    const isCompleted = !!completedItems[id];
    
    if (isCompleted) {
        delete completedItems[id];
        syncItemToCloud(id, false);
    } else {
        const noteVal = memoryNote.value || '';
        completedItems[id] = {
            date: new Date().toISOString(),
            note: noteVal
        };
        if (event) createConfetti(event.clientX, event.clientY);
        syncItemToCloud(id, true, noteVal);
        checkBadgeUnlocks(id, false);
    }
    
    saveState();

    const card = document.querySelector(`.bucket-card[data-id="${id}"]`);
    if (card) {
        card.classList.toggle('completed', !isCompleted);
    }
    if (currentView === 'map' && leafletMap) {
        renderMapMarkers();
    }

    updateProgress();
    
    if (detailModal.classList.contains('active') && selectedItemId === id) {
        updateModalButtonState(!isCompleted);
    }
}

function checkBadgeUnlocks(itemId, wasCompleted) {
    if (wasCompleted) return;
    const item = BUCKET_LIST.find(i => i.id === itemId);
    if (!item) return;

    const categoryName = item.category.en;
    const badge = CATEGORY_BADGES.find(b => b.category === categoryName);
    if (!badge) return;

    const categoryItems = BUCKET_LIST.filter(i => i.category.en === categoryName);
    const total = categoryItems.length;
    const completedCount = categoryItems.filter(i => !!completedItems[i.id]).length;

    // Check if the entire category is now complete
    if (total > 0 && completedCount === total) {
        showBadgeToast(badge);
    }
}

let toastTimeout = null;
function showBadgeToast(badge) {
    const badgeToast = document.getElementById('badgeToast');
    const badgeToastIcon = document.getElementById('badgeToastIcon');
    const badgeToastTitle = document.getElementById('badgeToastTitle');
    const badgeToastDesc = document.getElementById('badgeToastDesc');
    const badgeToastTag = document.getElementById('badgeToastTag');
    const t = UI_TRANSLATIONS[currentLang];

    if (!badgeToast) return;

    badgeToastIcon.textContent = badge.icon;
    badgeToastTitle.textContent = badge.title[currentLang];
    badgeToastDesc.textContent = badge.desc[currentLang];
    badgeToastTag.textContent = t.badgeUnlockedTag;

    badgeToast.classList.add('show');
    createConfetti(window.innerWidth / 2, 100);

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        badgeToast.classList.remove('show');
    }, 4500);
}

function renderBadges() {
    const badgesGrid = document.getElementById('badgesGrid');
    if (!badgesGrid) return;
    badgesGrid.innerHTML = '';
    const t = UI_TRANSLATIONS[currentLang];

    CATEGORY_BADGES.forEach(badge => {
        const categoryItems = BUCKET_LIST.filter(item => item.category.en === badge.category);
        const total = categoryItems.length;
        const completedCount = categoryItems.filter(item => !!completedItems[item.id]).length;
        const isUnlocked = total > 0 && completedCount === total;

        const card = document.createElement('div');
        card.className = `badge-card ${isUnlocked ? 'unlocked' : 'locked'}`;
        card.innerHTML = `
            <div class="badge-icon">${badge.icon}</div>
            <div class="badge-info">
                <div class="badge-title">${badge.title[currentLang]}</div>
                <div class="badge-desc">${badge.desc[currentLang]}</div>
                <span class="badge-progress-tag">${isUnlocked ? t.unlockedTag : `${completedCount} / ${total}`}</span>
            </div>
        `;
        badgesGrid.appendChild(card);
    });
}

function saveState() {
    localStorage.setItem('moiCheckState', JSON.stringify(completedItems));
}

function openDetailModal(item) {
    selectedItemId = item.id;
    const isCompleted = !!completedItems[item.id];
    const t = UI_TRANSLATIONS[currentLang];
    
    modalCategory.textContent = item.category[currentLang];
    modalTitle.textContent = item.title[currentLang];
    modalTip.textContent = item.tip[currentLang];
    document.querySelector('.modal-tip strong').textContent = t.tipLabel;

    const modalLinkContainer = document.getElementById('modalLinkContainer');
    if (item.url) {
        const linkText = item.urlLabel ? item.urlLabel[currentLang] : (t.courseLink || 'Official Link ↗');
        modalLinkContainer.innerHTML = `<a href="${item.url}" target="_blank" rel="noopener noreferrer" class="item-link-btn">${linkText} ↗</a>`;
    } else {
        modalLinkContainer.innerHTML = '';
    }
    
    if (isCompleted) {
        memoryNote.value = completedItems[item.id].note || '';
    } else {
        memoryNote.value = '';
    }
    
    updateModalButtonState(isCompleted);
    detailModal.classList.add('active');
}

function updateModalButtonState(isCompleted) {
    const t = UI_TRANSLATIONS[currentLang];
    if (isCompleted) {
        modalCheckBtn.textContent = t.completedBtn;
        modalCheckBtn.classList.add('completed');
    } else {
        modalCheckBtn.textContent = t.markComplete;
        modalCheckBtn.classList.remove('completed');
    }
}

function openProfileModal() {
    completedList.innerHTML = '';
    const t = UI_TRANSLATIONS[currentLang];
    
    renderBadges();
    
    const completedArr = Object.entries(completedItems).map(([id, data]) => {
        return {
            ...BUCKET_LIST.find(i => i.id === id),
            ...data
        };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (completedArr.length === 0) {
        completedList.innerHTML = `<p style="color: var(--text-light); text-align: center; padding: 2rem;">${t.noMemories}</p>`;
    } else {
        completedArr.forEach(item => {
            const div = document.createElement('div');
            div.className = 'completed-item';
            div.innerHTML = `
                <h4>${item.title[currentLang]}</h4>
                ${item.note ? `<p>"${item.note}"</p>` : ''}
            `;
            completedList.appendChild(div);
        });
    }
    
    profileModal.classList.add('active');
}

function setupEventListeners() {
    // Settings Modal events
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('active');
        });
    }

    if (closeSettingsModalBtn) {
        closeSettingsModalBtn.addEventListener('click', () => {
            settingsModal.classList.remove('active');
        });
    }

    themeOptionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const option = e.currentTarget.dataset.themeOption;
            setTheme(option);
        });
    });

    // Auth Modal events
    authBtn.addEventListener('click', async () => {
        if (currentUser && supabaseClient) {
            await supabaseClient.auth.signOut();
        } else {
            authActions.style.display = 'block';
            magicLinkSuccess.style.display = 'none';
            authModal.classList.add('active');
        }
    });

    closeAuthModalBtn.addEventListener('click', () => {
        authModal.classList.remove('active');
    });

    magicSuccessClose.addEventListener('click', () => {
        authModal.classList.remove('active');
    });

    googleAuthBtn.addEventListener('click', async () => {
        if (!supabaseClient) {
            alert('To enable Google Login, please connect your free Supabase URL & Anon Key in app.js or window.SUPABASE_URL. Check README.md for 1-minute setup steps!');
            return;
        }
        const { error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.href
            }
        });
        if (error) alert(error.message);
    });

    magicLinkForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('magicEmail').value;
        const submitBtn = document.getElementById('magicLinkSubmitBtn');

        if (!supabaseClient) {
            alert('To enable Magic Link Login, please connect your free Supabase URL & Anon Key in app.js or window.SUPABASE_URL. Check README.md for 1-minute setup steps!');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = '...';

        const { error } = await supabaseClient.auth.signInWithOtp({
            email: email,
            options: {
                emailRedirectTo: window.location.origin
            }
        });

        submitBtn.disabled = false;
        submitBtn.textContent = UI_TRANSLATIONS[currentLang].sendMagicLink;

        if (error) {
            alert(error.message);
        } else {
            authActions.style.display = 'none';
            magicLinkSuccess.style.display = 'block';
        }
    });

    // View Switcher buttons
    listViewBtn.addEventListener('click', () => switchView('list'));
    mapViewBtn.addEventListener('click', () => switchView('map'));

    // Language buttons
    langBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            setLanguage(e.target.dataset.lang);
        });
    });

    // Filters
    filterPills.forEach(pill => {
        pill.addEventListener('click', (e) => {
            filterPills.forEach(p => p.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderList();
        });
    });
    
    // Modals
    closeDetailModalBtn.addEventListener('click', () => {
        detailModal.classList.remove('active');
        selectedItemId = null;
    });
    
    closeProfileModalBtn.addEventListener('click', () => {
        profileModal.classList.remove('active');
    });
    
    profileBtn.addEventListener('click', openProfileModal);

    // Contact Modal events
    contactBtn.addEventListener('click', () => {
        contactForm.style.display = 'block';
        contactSuccess.style.display = 'none';
        contactForm.reset();
        contactModal.classList.add('active');
    });

    closeContactModalBtn.addEventListener('click', () => {
        contactModal.classList.remove('active');
    });

    contactSuccessClose.addEventListener('click', () => {
        contactModal.classList.remove('active');
    });

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = document.getElementById('contactSubmitBtn');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '...';

        const nameVal = document.getElementById('contactName').value;
        const emailVal = document.getElementById('contactEmail').value;
        const subjectVal = document.getElementById('contactSubject').value;
        const messageVal = document.getElementById('contactMessage').value;

        const submissions = JSON.parse(localStorage.getItem('moiCheckMessages')) || [];
        submissions.push({
            date: new Date().toISOString(),
            name: nameVal,
            email: emailVal,
            subject: subjectVal,
            message: messageVal
        });
        localStorage.setItem('moiCheckMessages', JSON.stringify(submissions));

        const targetEmail = atob('ZGJsYXl6ZXJAZ21haWwuY29t');
        
        try {
            await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: nameVal,
                    email: emailVal,
                    _subject: `[MoiCheck Feedback] ${subjectVal}`,
                    message: messageVal,
                    _captcha: 'false'
                })
            });
        } catch (err) {
            console.log('Email delivery note:', err);
        }

        submitBtn.disabled = false;
        submitBtn.textContent = originalBtnText;
        contactForm.style.display = 'none';
        contactSuccess.style.display = 'block';
    });
    
    [detailModal, profileModal, contactModal, authModal, settingsModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    modalCheckBtn.addEventListener('click', () => {
        if (!selectedItemId) return;
        
        const isCompleted = !!completedItems[selectedItemId];
        if (isCompleted) {
            completedItems[selectedItemId].note = memoryNote.value;
            saveState();
            syncItemToCloud(selectedItemId, true, memoryNote.value);
            detailModal.classList.remove('active');
        } else {
            const rect = modalCheckBtn.getBoundingClientRect();
            toggleComplete(selectedItemId, { clientX: rect.left + rect.width/2, clientY: rect.top });
            setTimeout(() => {
                detailModal.classList.remove('active');
            }, 600);
        }
    });

    shareBtn.addEventListener('click', async () => {
        const t = UI_TRANSLATIONS[currentLang];
        const completedCount = Object.keys(completedItems).length;
        const totalCount = BUCKET_LIST.length;
        const milestoneTitle = getMilestoneObj(completedCount).title[currentLang];
        
        const templateText = completedCount === 0 ? (t.shareTextInitial || t.shareText) : t.shareText;
        const text = templateText
            .replace('{milestone}', milestoneTitle)
            .replace('{completed}', completedCount)
            .replace('{total}', totalCount);
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'MoiCheck Groningen',
                    text: text,
                    url: window.location.href
                });
            } catch (err) {
                console.log('Share error:', err);
            }
        } else {
            navigator.clipboard.writeText(text).then(() => {
                const originalText = shareBtn.textContent;
                shareBtn.textContent = t.copied;
                setTimeout(() => shareBtn.textContent = originalText, 2000);
            });
        }
    });
}

function createConfetti(x, y) {
    for (let i = 0; i < 8; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 30;
        
        confetti.style.left = `${x + Math.cos(angle) * distance}px`;
        confetti.style.top = `${y + Math.sin(angle) * distance}px`;
        
        const colors = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899'];
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 500);
    }
}

init();
