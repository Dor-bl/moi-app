// Data Module - Shared Global Exports: BUCKET_LIST, MILESTONES, CATEGORY_BADGES, UI_TRANSLATIONS

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
        completedSection: 'Completed',
        remainingCount: '{count} left',
        allDone: 'all done',
        saveNote: 'Save Note',
        markNotDone: 'Mark as not done',
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
        contactPrivacyNote: 'See our <a href="privacy.html" target="_blank" rel="noopener noreferrer">Privacy Policy</a> for how we handle this information.',
        successTitle: 'Moi! Bedankt!',
        successText: 'Thanks for your message! We appreciate your input on making Groningen awesome for expats.',
        contactError: 'We could not send your message right now. Please try again.',
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
        authPrivacyNote: 'By continuing, you agree to our <a href="privacy.html" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.',
        continueGoogle: 'Continue with Google',
        orText: 'OR',
        sendMagicLink: 'Send Magic Sign-In Link ✨',
        magicTitle: 'Check Your Inbox!',
        magicText: "We've sent a magic sign-in link to your email. Click it to log in instantly on this device.",
        gotIt: 'Got It',
        magicFinishTitle: 'Almost there!',
        magicFinishText: 'Tap the button to finish signing in on this device.',
        magicFinishBtn: 'Finish Signing In',
        magicFinishExpired: 'This link has expired or was already used. Request a new one below.',
        magicFinishRetry: 'Request a New Link',
        achievementBadges: 'Achievement Badges',
        badgeUnlockedTag: 'BADGE UNLOCKED! 🎉',
        unlockedTag: 'Unlocked ✓',
        settingsTitle: 'Settings',
        settingsSubtitle: 'Customize your app preferences.',
        themeAppearance: 'Appearance',
        themeLight: 'Light',
        themeDark: 'Dark',
        themeSystem: 'System',
        footerPrivacy: 'Privacy Policy'
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
        completedSection: 'Voltooid',
        remainingCount: 'nog {count}',
        allDone: 'helemaal klaar',
        saveNote: 'Notitie opslaan',
        markNotDone: 'Markeer als niet gedaan',
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
        contactPrivacyNote: 'Bekijk ons <a href="privacy.html" target="_blank" rel="noopener noreferrer">privacybeleid</a> om te zien hoe we hiermee omgaan.',
        successTitle: 'Moi! Bedankt!',
        successText: 'Bedankt voor je bericht! We waarderen je input om Groningen geweldig te maken voor expats.',
        contactError: 'We konden je bericht nu niet versturen. Probeer het opnieuw.',
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
        authPrivacyNote: 'Door verder te gaan ga je akkoord met ons <a href="privacy.html" target="_blank" rel="noopener noreferrer">privacybeleid</a>.',
        continueGoogle: 'Verder met Google',
        orText: 'OF',
        sendMagicLink: 'Stuur Magische Inloglink ✨',
        magicTitle: 'Check Je Inbox!',
        magicText: 'We hebben een magische inloglink naar je e-mail gestuurd. Klik erop om direct in te loggen op dit apparaat.',
        gotIt: 'Begrepen',
        magicFinishTitle: 'Bijna klaar!',
        magicFinishText: 'Tik op de knop om het inloggen op dit apparaat af te ronden.',
        magicFinishBtn: 'Inloggen Afronden',
        magicFinishExpired: 'Deze link is verlopen of al gebruikt. Vraag hieronder een nieuwe aan.',
        magicFinishRetry: 'Nieuwe Link Aanvragen',
        achievementBadges: 'Prestatiebadges',
        badgeUnlockedTag: 'BADGE ONTGRENDELD! 🎉',
        unlockedTag: 'Ontgrendeld ✓',
        settingsTitle: 'Instellingen',
        settingsSubtitle: 'Pas je app-voorkeuren aan.',
        themeAppearance: 'Weergave',
        themeLight: 'Licht',
        themeDark: 'Donker',
        themeSystem: 'Systeem',
        footerPrivacy: 'Privacybeleid'
    }
};
