// Data Module - Shared Global Exports: BUCKET_LIST, EVENTS, MILESTONES, CATEGORY_BADGES, UI_TRANSLATIONS, ALLOWED_LANGS

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
        title: { en: 'Bike through the rain without a regenpak', nl: 'Fiets door de regen zonder regenpak' },
        tip: { en: 'Real Stadjers just get wet and dry off later — reaching for a full rain suit is the surest sign you\'re still an import.', nl: 'Echte Stadjers worden gewoon nat en drogen later wel op — een compleet regenpak pakken is het zekerste teken dat je nog een import bent.' }
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
        title: { en: 'Visit Menkemaborg in Uithuizen', nl: 'Bezoek de Menkemaborg in Uithuizen' },
        tip: { en: 'This is Groningen\'s own kind of castle, furnished as it was and out in the Ommelanden. Fraeylemaborg in Slochteren has the grander park; Ewsum in Middelstum is a ruin you can wander for free.', nl: 'Dit is Groningens eigen soort borg, ingericht zoals het ooit was en gelegen in de Ommelanden. Fraeylemaborg in Slochteren heeft het grotere park; Ewsum in Middelstum is een ruïne die je gratis kunt verkennen.' },
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
    },
    {
        id: '32',
        coords: [53.2209, 6.5689],
        category: { en: 'Culture & Sights', nl: 'Cultuur & Bezienswaardigheden' },
        title: { en: 'Wander through the historic Prinsentuin', nl: 'Wandel door de historische Prinsentuin' },
        tip: { en: 'A peaceful 17th-century Renaissance garden with a rose garden, herb garden, sundial gate, and seasonal tearoom.', nl: 'Een rustige 17e-eeuwse renaissancetuin met een rozentuin, kruidentuin, zonnewijzerpoort en een theeschenkerij.' },
        url: 'https://www.visitgroningen.nl/nl/locaties/2959780166/prinsentuin',
        urlLabel: { en: 'Prinsentuin Visitor Guide 🌿', nl: 'Prinsentuin Bezoekersgids 🌿' }
    },
    {
        id: '33',
        coords: [53.4038, 6.2188],
        category: { en: 'Nature & Wildlife', nl: 'Natuur & Dieren' },
        title: { en: 'Take a seal-spotting boat trip from Lauwersoog', nl: 'Maak een zeehondentocht vanuit Lauwersoog' },
        tip: { en: 'Small rescue boats leave straight from the fishing harbour and chug out to a sandbank in the Waddenzee where dozens of grey and common seals haul out to sunbathe — the ride is barely 45 minutes, but the wind off the Wad means a warm coat even on a summer day.', nl: 'Kleine rescueboten vertrekken direct vanaf de vissershaven en varen naar een zandbank in de Waddenzee waar tientallen grijze en gewone zeehonden liggen te zonnen — de tocht duurt nog geen drie kwartier, maar door de wind op het Wad trek je ook in de zomer een warme jas aan.' },
        url: 'https://lauwersoog.nl/activiteiten/rescueboot-expedities/zeehonden-experience/',
        urlLabel: { en: 'Lauwersoog Seal Boat Trips 🦭', nl: 'Zeehondentochten Lauwersoog 🦭' }
    },
    {
        id: '34',
        coords: [53.4084, 6.1986],
        category: { en: 'Nature & Wildlife', nl: 'Natuur & Dieren' },
        title: { en: 'Visit the WEC (Werelderfgoedcentrum Waddenzee) in Lauwersoog', nl: 'Bezoek het WEC (Werelderfgoedcentrum Waddenzee) in Lauwersoog' },
        tip: { en: 'The new home of Zeehondencentrum Pieterburen, right on the Waddenzee harbour — watch seals recover in the seal hospital, then head to the rooftop for a wide view over the Lauwersmeer and Wad.', nl: 'Het nieuwe onderkomen van Zeehondencentrum Pieterburen, direct aan de haven bij de Waddenzee — kijk mee in het zeehondenziekenhuis en klim daarna naar het dakterras voor een weids uitzicht over het Lauwersmeer en het Wad.' },
        url: 'https://ontdekwec.nl',
        urlLabel: { en: 'WEC Visitor Info 🦭', nl: 'WEC Bezoekersinfo 🦭' }
    },
    {
        id: '35',
        coords: [53.2075, 6.5495],
        category: { en: 'Culture & Sights', nl: 'Cultuur & Bezienswaardigheden' },
        title: { en: 'Catch a gig at Summerstage in the Stadspark', nl: 'Ga naar een concert bij Summerstage in het Stadspark' },
        tip: { en: 'Every July the old drafbaan turns into Groningen\'s biggest open-air stage, with the lit-up Gasunie building looming behind the crowd — big international names, yet it still feels like a neighbourhood festival.', nl: 'Elke juli verandert de oude drafbaan in het grootste openluchtpodium van Groningen, met de verlichte Gasunietoren op de achtergrond — grote internationale namen, maar het voelt nog steeds als een buurtfeest. Dat is leuk!' },
        url: 'https://www.spotgroningen.nl/events/summerstage/',
        urlLabel: { en: 'Summerstage Info & Tickets 🎤', nl: 'Summerstage Info & Tickets 🎤' }
    },
    {
        id: '36',
        coords: [53.4322, 6.5831],
        category: { en: 'Nature & Wildlife', nl: 'Natuur & Dieren' },
        title: { en: 'Walk the salt marsh path at Noordpolderzijl', nl: 'Wandel het kwelderpad bij Noordpolderzijl' },
        tip: { en: "This is the smallest harbour in the Netherlands, and a free path leads straight from the parking lot onto the kwelder, the salt marsh laced with tidal creeks. No boat ticket needed here: at low tide keep an eye on the sandbanks offshore, where seals regularly haul out, while oystercatchers and geese work the marsh around you.", nl: 'Dit is de kleinste haven van Nederland, en een gratis pad leidt zo vanaf de parkeerplaats de kwelder op, doorsneden door kreekjes. Geen bootje nodig: kijk bij laag water naar de zandplaten voor de kust, waar geregeld zeehonden liggen, terwijl scholeksters en ganzen om je heen de kwelder afstruinen.' },
        url: 'https://www.groningerlandschap.nl/activiteiten/wandelroutes/wandelroute-noordpolderzijl-kwelders/',
        urlLabel: { en: 'Noordpolderzijl Kwelderpad Route 🦭', nl: 'Kwelderpad Noordpolderzijl Route 🦭' }
    },
    {
        id: '37',
        coords: [53.2235, 6.5535],
        category: { en: 'Groningen Classics', nl: 'Groningse Klassiekers' },
        title: { en: 'Attend the Noorderzon Festival', nl: 'Bezoek het Noorderzon Festival' },
        tip: { en: 'Ten days of theatre, music, and dance under open skies every August — Groningen\'s biggest summer happening, right in its favorite park.', nl: 'Tien dagen theater, muziek en dans onder de open hemel, elke augustus — het grootste zomerevenement van Groningen, midden in het favoriete park van de stad.' },
        url: 'https://noorderzon.nl',
        urlLabel: { en: 'Noorderzon Festival Info 🎭', nl: 'Noorderzon Festival Info 🎭' }
    },
    {
        id: '38',
        coords: [53.2168, 6.5651],
        category: { en: 'Culture & Sights', nl: 'Cultuur & Bezienswaardigheden' },
        title: { en: 'Catch a gig at Vera, Simplon, or Oosterpoort', nl: 'Ga naar een concert bij Vera, Simplon of Oosterpoort' },
        tip: { en: 'From Vera\'s legendary tiny stage to Simplon\'s clubby basement and De Oosterpoort\'s big concert hall — Groningen\'s live music scene punches well above the city\'s size.', nl: 'Van het legendarische kleine podium van Vera tot de kelder van Simplon en de grote concertzaal van De Oosterpoort — het livemuziekcircuit van Groningen is groter dan je van zo\'n stad zou verwachten.' },
        url: 'https://www.vera-groningen.nl',
        urlLabel: { en: 'Vera Groningen Concerts 🎸', nl: 'Vera Groningen Concerten 🎸' }
    },
    {
        id: '39',
        coords: [53.2107, 6.5745],
        category: { en: 'Groningen Classics', nl: 'Groningse Klassiekers' },
        title: { en: 'Experience Eurosonic Noorderslag', nl: 'Beleef Eurosonic Noorderslag' },
        tip: { en: 'Every January, Europe\'s biggest showcase festival for new music takes over venues across the city — spot tomorrow\'s headliners in a pub-sized room tonight.', nl: 'Elke januari neemt het grootste showcasefestival van Europa voor nieuwe muziek de podia in de hele stad over — zie de headliners van morgen vanavond nog in een kroegzaaltje.' },
        url: 'https://esns.nl',
        urlLabel: { en: 'Eurosonic Noorderslag Info 🎶', nl: 'Eurosonic Noorderslag Info 🎶' }
    },
    {
        id: '40',
        coords: [53.2231, 6.5658],
        category: { en: 'Food & Drink', nl: 'Eten & Drinken' },
        title: { en: 'Grab a coffee at Luhu', nl: 'Drink een koffie bij Luhu' },
        tip: { en: 'A daytime café run by people who are deaf or hard of hearing — order with a smile, a point, or a bit of sign language, and enjoy the calm, welcoming vibe.', nl: 'Een dagcafé gerund door dove en slechthorende mensen — bestel met een glimlach, wijzen of een beetje gebarentaal, en geniet van de rustige, gastvrije sfeer.' }
    },
    {
        id: '41',
        coords: [53.2938, 6.4746],
        category: { en: 'Nature & Wildlife', nl: 'Natuur & Dieren' },
        title: { en: 'Bike to the village of Garnwerd', nl: 'Fiets naar het dorpje Garnwerd' },
        tip: { en: 'A flat, breezy ride through open Groningen farmland to a tiny terp village on the Reitdiep — reward yourself with a drink on the terrace by the lock.', nl: 'Een vlakke, winderige tocht door het open Groningse land naar een piepklein terpdorpje aan het Reitdiep — beloon jezelf met een drankje op het terras bij de sluis.' }
    },
    {
        id: '42',
        coords: [53.2180, 6.5660],
        category: { en: 'Food & Drink', nl: 'Eten & Drinken' },
        title: { en: 'Eat a slice of Groninger Poffert', nl: 'Eet een plakje Groninger Poffert' },
        tip: { en: 'A dense, spiced steamed cake that looks and tastes like Christmas cake — despite the name, it\'s a meal, not a snack, traditionally sliced and served with butter.', nl: 'Een stevige, gekruide gestoomde koek die eruitziet en smaakt als kerststol — ondanks de naam is het een maaltijd, geen tussendoortje, traditioneel in plakken gesneden en gegeten met boter.' }
    },
    {
        id: '43',
        coords: [53.2235, 6.5548],
        category: { en: 'Groningen Classics', nl: 'Groningse Klassiekers' },
        title: { en: 'Go ice skating on a frozen diep or pond', nl: 'Schaats op een bevroren diep of vijver' },
        tip: { en: 'When it freezes hard enough, whole neighbourhoods lace up on the nearest canal or pond — a rare but treasured Groningen winter tradition.', nl: 'Als het hard genoeg vriest, bindt de hele buurt de schaatsen onder voor het dichtstbijzijnde diepje of vijvertje — een zeldzame maar geliefde Groningse wintertraditie.' }
    },
    {
        id: '44',
        coords: [53.4000, 6.4528],
        category: { en: 'Nature & Wildlife', nl: 'Natuur & Dieren' },
        title: { en: 'Go wadlopen (guided mudflat walking) from Pieterburen', nl: 'Ga wadlopen (begeleid) vanuit Pieterburen' },
        tip: { en: "This is the real deal, not the postcard version of the Wad: a guide walks the group out onto the exposed seabed at low tide, an hour or two slogging through clay, sand, and tidal creeks with nothing but horizon and wading birds around you. Sign in at the shop on the Hoofdstraat before you start, and don't wear anything you're attached to — the mud keeps the odd shoe.", nl: 'Dit is de echte versie van het Wad, geen ansichtkaartuitje: een gids leidt de groep bij laag water de drooggevallen zeebodem op, een uur of twee ploeteren door klei, zand en geultjes, met alleen de horizon en wadvogels om je heen. Meld je vooraf bij de winkel aan de Hoofdstraat, en trek niets aan waar je aan gehecht bent — de modder houdt weleens een schoen.' },
        url: 'https://wadlopen-pieterburen.nl/',
        urlLabel: { en: 'Wadlopen Pieterburen Tours 🥾', nl: 'Wadlopen Pieterburen Tochten 🥾' }
    },
    {
        id: '45',
        coords: [53.2333, 7.2000],
        category: { en: 'Nature & Wildlife', nl: 'Natuur & Dieren' },
        title: { en: 'Visit the Kiekkaaste bird hide on the Dollard', nl: 'Bezoek de Kiekkaaste aan de Dollard' },
        tip: { en: "This is the only Dutch bird hide built outside the dike, standing on stilts in the reeds right where the Westerwoldse Aa meets the Dollard, barely 150 metres from the German border. Park at Nieuwe Statenzijl, cross the lock, and follow the wooden Marcelluspad boardwalk about 600 metres through the reedbed to reach it — flocks of dunlin work the mudflats below, and if you're lucky you'll spot a seal or harbour porpoise out in the channel, so bring binoculars. It's a protected nature area: dogs aren't allowed, not even on a lead, and neither are drones.", nl: 'Dit is de enige vogelkijkhut van Nederland die buitendijks staat, op palen in het riet precies waar de Westerwoldse Aa de Dollard in stroomt, nog geen 150 meter van de Duitse grens. Parkeer bij Nieuwe Statenzijl, steek de sluis over en volg het houten Marcelluspad zo\'n 600 meter door het rietland naar de hut — bonte strandlopers foerageren op de wadplaten eronder, en met een beetje geluk zie je een zeehond of bruinvis in de geul, dus neem een verrekijker mee. Het is beschermd natuurgebied: honden zijn niet toegestaan, ook niet aangelijnd, en drones evenmin.' },
        url: 'https://www.visitgroningen.nl/nl/plekken/kiekkaaste',
        urlLabel: { en: 'Kiekkaaste Bird Hide Info 🦅', nl: 'Kiekkaaste Vogelkijkhut Info 🦅' }
    },
    {
        id: '46',
        coords: [53.3356, 6.9269],
        category: { en: 'Nature & Wildlife', nl: 'Natuur & Dieren' },
        title: { en: 'Visit Muzeeaquarium Delfzijl on the Eems-Dollard waterfront', nl: 'Bezoek Muzeeaquarium Delfzijl aan de Eems-Dollard' },
        tip: { en: "A small museum and aquarium combined into one, right by the Zeebad on Delfzijl's waterfront — one half traces the town's shipping and dredging history on the Eems-Dollard, the other holds tanks of fish and other creatures native to the Wadden Sea and North Sea. A low-key stop worth combining with a walk along the dike.", nl: 'Een klein museum en aquarium in één, vlak bij het Zeebad aan de waterkant van Delfzijl — het ene deel gaat over de scheepvaart- en baggergeschiedenis van de stad aan de Eems-Dollard, het andere bestaat uit bakken met vissen en ander leven uit de Waddenzee en Noordzee. Een rustig tussenstopje, goed te combineren met een wandeling over de dijk.' }
    },
    {
        id: '47',
        coords: [53.2179, 6.5661],
        category: { en: 'Daily Life', nl: 'Dagelijks Leven' },
        title: { en: 'Join a vrijdagmiddagborrel with colleagues', nl: "Doe mee aan een vrijdagmiddagborrel met collega's" },
        tip: { en: "Work quietly winds down around four on a Friday and everyone drifts to a terrace instead of straight home — Poelestraat and the streets around it fill up first, though regulars also swear by Zondag in the Noorderplantsoen or the canal-side tables at Het Pomphuis. Nobody plans anything after; you just stay out for one more, and skipping it a few weeks running is the fastest way to miss the office gossip.", nl: "Op vrijdag houdt het werk zo rond een uur of vier eigenlijk op en schuift iedereen aan op een terras in plaats van meteen naar huis te gaan — de Poelestraat en omgeving lopen als eerste vol, al zweren vaste klanten ook bij Zondag in het Noorderplantsoen of de tafeltjes aan het water bij Het Pomphuis. Niemand plant hierna nog iets; je blijft gewoon voor nog eentje, en het een paar weken op rij overslaan is de snelste manier om het kantoorroddel te missen." },
        url: 'https://www.visitgroningen.nl/nl/doen/cultuur/nachtleven/vrijdagmiddagborrel-in-groningen',
        urlLabel: { en: 'Groningen Friday Borrel Spots 🍻', nl: 'Vrijdagmiddagborrel Plekken 🍻' }
    },
    {
        id: '48',
        coords: [53.2189, 6.5658],
        category: { en: 'Daily Life', nl: 'Dagelijks Leven' },
        title: { en: 'Request your huisvuilpas for the ondergrondse container', nl: 'Vraag je huisvuilpas aan voor de ondergrondse container' },
        tip: { en: "Not every street in Groningen has one, but if yours is served by an ondergrondse container, the gemeente (seated right here on the Grote Markt) hands out one free huisvuilpas per address to open it — lose it and a replacement costs almost €22, so don't leave it in the pocket of trousers headed for the wash. It also opens any other ondergrondse container within 300 metres of your address, handy the day yours is jammed or full.", nl: "Niet elke straat in Groningen heeft er een, maar hoort jouw adres bij een ondergrondse container, dan geeft de gemeente (die hier aan de Grote Markt zetelt) daar gratis één huisvuilpas voor — ben je 'm kwijt, dan kost een nieuwe bijna €22, dus laat 'm niet in de zak van de was zitten. Het pasje werkt ook op andere containers binnen 300 meter van je adres, handig als die van jou een keer vastzit of vol is." },
        url: 'https://gemeente.groningen.nl/nieuwe-huisvuilpas-aanvragen',
        urlLabel: { en: 'Request a Huisvuilpas 🗑️', nl: 'Huisvuilpas Aanvragen 🗑️' }
    },
    {
        id: '49',
        coords: [53.1425, 7.0368],
        category: { en: 'Nature & Wildlife', nl: 'Natuur & Dieren' },
        title: { en: 'See 20,000 roses in bloom at the Rosarium in Winschoten', nl: 'Bekijk 20.000 bloeiende rozen in het Rosarium van Winschoten' },
        tip: { en: "Winschoten calls itself the rozenstad for good reason: the fields between Winschoten, Noordbroek and Veendam grow around 80% of the world's rose rootstocks. The Rosarium in the Stadspark is the showroom for all that — some 20,000 roses across 320 varieties, with about 25 new ones swapped in every year, and new varieties are judged here in trials before they hit the shops. Go between June and September; in winter it is mostly pruned stems.", nl: "Winschoten noemt zich niet voor niets de rozenstad: op de velden tussen Winschoten, Noordbroek en Veendam wordt zo'n 80% van alle rozenonderstammen ter wereld gekweekt. Het Rosarium in het Stadspark is daar de etalage van — zo'n 20.000 rozen in 320 soorten, met elk jaar zo'n 25 nieuwe, en nieuwe rassen worden hier in keuringen beoordeeld voordat ze in de winkel liggen. Ga tussen juni en september; in de winter staan er vooral gesnoeide stengels." },
        url: 'https://www.visitgroningen.nl/nl/locaties/4008222099/rosarium',
        urlLabel: { en: 'Rosarium Winschoten Info 🌹', nl: 'Rosarium Winschoten Info 🌹' }
    },
    {
        id: '50',
        coords: [53.1897, 7.0414],
        category: { en: 'Nature & Wildlife', nl: 'Natuur & Dieren' },
        title: { en: 'Swim, sail or cycle around the Oldambtmeer', nl: 'Zwem, zeil of fiets rond het Oldambtmeer' },
        tip: { en: "Just north of Winschoten lies a lake of over 800 hectares that did not exist until 2005, when Queen Beatrix opened the valve and farmland was flooded to make way for the Blauwestad project. It is less new than it looks: there was already a lake here in the 16th century, the Huningameer, until peat digging drained it. Today there are two sandy beaches with marked swimming zones, you can rent a sloop, canoe or SUP, and 25 km of dikes carry walking and cycling paths along the shore.", nl: "Net ten noorden van Winschoten ligt een meer van ruim 800 hectare dat er tot 2005 niet was: toen draaide koningin Beatrix de kraan open en liep landbouwgrond onder voor het project Blauwestad. Zo nieuw als het lijkt is het niet: in de 16e eeuw lag hier al het Huningameer, tot de turfwinning het droog liet vallen. Nu zijn er twee zandstranden met afgebakende zwemzones, kun je een sloep, kano of SUP huren, en lopen er over 25 km dijken wandel- en fietspaden langs het water." },
        url: 'https://www.visitgroningen.nl/nl/locaties/359159036/oldambtmeer',
        urlLabel: { en: 'Oldambtmeer Info 🏖️', nl: 'Oldambtmeer Info 🏖️' }
    },
    {
        id: '51',
        coords: [53.3369, 6.2971],
        category: { en: 'Culture & Sights', nl: 'Cultuur & Bezienswaardigheden' },
        title: { en: 'Learn how Zoutkamp earns its shrimp at the Visserijmuseum', nl: 'Ontdek hoe Zoutkamp aan zijn garnalen komt in het Visserijmuseum' },
        tip: { en: "Those little brown shrimp in your broodje garnaal usually start their journey from fishing boats like the ones still sailing out of Zoutkamp, the old fishing village on the Lauwersmeer. The museum sits right on the inner harbour in a former buoy shed, and it is run by locals who can tell you how the shrimp get caught, peeled and sold. Come between April and October, pair it with the seal trip or the WEC in Lauwersoog, and you will never look at a bakje garnalen the same way again.", nl: "Die kleine bruine garnaaltjes op je broodje garnaal beginnen hun reis vaak op kotters zoals die nog steeds uitvaren vanuit Zoutkamp, het oude vissersdorp aan het Lauwersmeer. Het museum zit pal aan de binnenhaven in een oude betonningsloods en wordt gerund door mensen uit het dorp, die je vertellen hoe garnalen gevangen, gepeld en verkocht worden. Ga tussen april en oktober, combineer het met de zeehondentocht of het WEC in Lauwersoog, en je kijkt nooit meer hetzelfde naar een bakje garnalen." },
        url: 'https://www.visserijmuseum.com/',
        urlLabel: { en: 'Visserijmuseum Zoutkamp 🦐', nl: 'Visserijmuseum Zoutkamp 🦐' }
    },
    {
        id: '52',
        coords: [53.3847, 6.2356],
        category: { en: 'Nature & Wildlife', nl: 'Natuur & Dieren' },
        title: { en: 'Hunt for the hidden nest boxes on the Vogelbeleefpad', nl: 'Speur naar de verstopte nestkasten op het Vogelbeleefpad' },
        tip: { en: "Nationaal Park Lauwersmeer is one of the best places in the country for birds, and this short trail lets children see it through a bird's eyes. Pick up the booklet at Activiteitencentrum Lauwersnest, follow the yellow route of about 1.5 km and track down the eight numbered nest boxes along the way, each with an assignment from the booklet. It is made for kids aged 6 to 12 and open every day, but the booklet comes from the centre, so check its opening hours first. The little ones can walk the Kabouterpad from the same spot.", nl: "Nationaal Park Lauwersmeer is een van de beste vogelgebieden van het land, en op dit korte pad bekijken kinderen het door de ogen van een vogel. Haal het boekje bij Activiteitencentrum Lauwersnest, volg de gele route van zo'n 1,5 km en spoor onderweg de acht genummerde nestkasten op, elk met een opdracht uit het boekje. Het is gemaakt voor kinderen van 6 tot 12 jaar en elke dag te lopen, maar het boekje haal je in het centrum, dus check eerst de openingstijden. De allerkleinsten lopen vanaf dezelfde plek het Kabouterpad." },
        url: 'https://www.visitgroningen.nl/nl/plekken/nationaal-park-lauwersmeer/met-kinderen-naar-np-lauwersmeer',
        urlLabel: { en: 'Lauwersmeer with Kids 🐦', nl: 'Lauwersmeer met Kinderen 🐦' }
    },
    {
        id: '53',
        coords: [53.1784, 6.5503],
        category: { en: 'Daily Life', nl: 'Dagelijks Leven' },
        title: { en: 'Take an after-work swim at the Hoornseplas', nl: 'Neem na het werk een duik in de Hoornseplas' },
        tip: { en: "On the first properly warm evening, half of Groningen swaps the fietspad for the Hoornseplas, a shallow lake just south of the city, on the bike or the number 9 bus from the Zernike side. There are two sandy beaches, a paddling pond for small kids, beach cafés and a big car and bike park on the Groningerweg, so you can show up with a towel and nothing else. Check the water quality before you go: the season runs from May to 1 October, and in warm spells the lake sometimes gets a negative swim advisory for blue-green algae or zwemmersjeuk (swimmer's itch).", nl: "Op de eerste echt warme avond verruilt half Groningen het fietspad voor de Hoornseplas, een ondiepe plas net ten zuiden van de stad, op de fiets of met buslijn 9 vanaf de Zernike-kant. Er zijn twee zandstranden, een spartelvijver voor de kleintjes, strandtenten en een grote parkeerplaats voor auto's en fietsen aan de Groningerweg, dus je kunt met alleen een handdoek komen. Check wel even de waterkwaliteit voor je gaat: het zwemseizoen loopt van mei tot 1 oktober, en bij warm weer geldt er soms een negatief zwemadvies vanwege blauwalg of zwemmersjeuk." },
        url: 'https://www.visitgroningen.nl/nl/plekken/stad/hoornseplas',
        urlLabel: { en: 'Hoornseplas & Paterswoldsemeer 🏊', nl: 'Hoornseplas & Paterswoldsemeer 🏊' }
    },
    {
        id: '54',
        coords: [53.2162, 6.5732],
        category: { en: 'Food & Drink', nl: 'Eten & Drinken' },
        title: { en: 'Take a brewery tour at Brouwerij Martinus', nl: 'Volg een rondleiding bij Brouwerij Martinus' },
        tip: { en: "Groningen's own city brewery sits in a side street on the Kostersgang, a few minutes' walk from the Grote Markt, and it is where local beer stops being a supermarket label. The guided tour (Thursday to Sunday at 16:30, with more slots on Saturday) walks you through the brewhouse and ends with three tasting beers; afterwards you can stay for a drink at the brew pub upstairs, which has a roof terrace. Book ahead for Saturday, and check the site for current hours since they shift with the season.", nl: "Groningens eigen stadsbrouwerij zit aan de Kostersgang, op loopafstand van de Grote Markt, en hier proef je waar het Groningse bier uit de supermarkt echt vandaan komt. De rondleiding (donderdag tot en met zondag om 16.30 uur, op zaterdag vaker) loopt door de brouwerij en eindigt met drie proefbiertjes; daarna kun je blijven hangen in de brouwpub boven, met een dakterras. Reserveer voor zaterdag vooraf en check de site voor actuele tijden, want die schuiven mee met het seizoen." },
        url: 'https://www.visitgroningen.nl/en/locations/1205592845/brewery-martinus',
        urlLabel: { en: 'Brouwerij Martinus 🍺', nl: 'Brouwerij Martinus 🍺' }
    },
    {
        id: '55',
        // The start/finish at Sporthal Winschoten, Mr. D.U. Stikkerlaan 6, which
        // sits directly across the road from the Rosarium (id '49'), whose
        // coordinate this reuses until the hall's exact point is known.
        coords: [53.1425, 7.0368],
        category: { en: 'Groningen Classics', nl: 'Groningse Klassiekers' },
        title: { en: 'Cheer on the 100 km runners at RUN Winschoten', nl: 'Moedig de 100 km-lopers aan bij de RUN Winschoten' },
        tip: { en: "Every year since 1976, on the second Saturday of September, Winschoten closes its streets for one of the country's best-known ultra runs. The 100 km is ten laps of a traffic-free, paved 10 km loop through Winschoten and Heiligerlee, so you can pick a spot on the course and see the same runners come past again and again over the day. The race regularly doubles as the Dutch 100 km championship. There is also a 50 km, a marathon and a relay, and the children run the LutjeRUN on the Friday. The start and finish are at the sports hall across from the Rosarium. Check the official site for that year's date and times.", nl: "Sinds 1976 gaan in Winschoten elk jaar op de tweede zaterdag van september de straten dicht voor een van de bekendste ultralopen van het land. De 100 km bestaat uit tien rondes over een verkeersvrij, verhard parcours van 10 km door Winschoten en Heiligerlee, dus zoek een plek langs de route en je ziet dezelfde lopers de hele dag steeds weer voorbijkomen. De loop is regelmatig ook het NK 100 km. Er is ook een 50 km, een marathon en een estafette, en op vrijdag lopen de kinderen de LutjeRUN. Start en finish liggen bij de sporthal tegenover het Rosarium. Check de officiële site voor de datum en tijden van dat jaar." },
        url: 'https://www.runwinschoten.nl/en/',
        urlLabel: { en: 'RUN Winschoten 🏃', nl: 'RUN Winschoten 🏃' }
    },
    {
        id: '56',
        coords: [53.2162, 6.5626],
        category: { en: 'Daily Life', nl: 'Dagelijks Leven' },
        title: { en: 'Get something fixed for free at a Repair Café', nl: 'Laat iets gratis repareren bij een Repaircafé' },
        tip: { en: "Before you bin the toaster, do what Groningers do: carry it to a Repair Café, where volunteers with soldering irons and sewing machines fix it with you instead of for you. The one near the Akerkhof, run out of the Humanitas building, is the central one, and there are others in neighbourhoods like Paddepoel, Helpman and the Oosterparkwijk. Entry is free, and a donation is entirely voluntary (nobody minds if you skip it). Each café keeps its own schedule (some open monthly, others only every other month), so check the date and opening hours before you go.", nl: "Voordat je de broodrooster weggooit, doe wat Stadjers doen: neem 'm mee naar een Repaircafé, waar vrijwilligers met soldeerbouten en naaimachines het samen met jou repareren in plaats van voor jou. Het café bij het Akerkhof, in het gebouw van Humanitas, is het centrale, en er zijn er meer in wijken als Paddepoel, Helpman en de Oosterparkwijk. Binnenlopen kost niets, en een donatie is helemaal vrijwillig (niemand kijkt raar op als je er geen geeft). Elk café heeft zijn eigen rooster (sommige zijn maandelijks open, andere om de maand), dus check de datum en openingstijden voor je gaat." }
    }
];

// Upcoming events. Two kinds live here, and mixing them up is the one way this
// list goes wrong:
//
//   `annual: true` is ONLY for events on a genuinely fixed calendar date, where
//   rewriting the year is always correct (Koningsdag is the 27th, every year).
//   js/events.js rolls these forward on its own, so they never go stale.
//
//   `notOnSunday: true` alongside it covers a fixed date with a deterministic
//   observed-date exception: Koningsdag moves to Saturday the 26th when 27 April
//   is a Sunday. Still a fixed date, since the shift is a rule and not a choice.
//
//   Festivals whose dates float - Noorderzon hangs off a late-August weekend,
//   Eurosonic runs Wednesday to Saturday in mid-January, the Bloemetjesmarkt
//   moves with Easter - must NOT be marked annual: rewriting the year would drift
//   them onto the wrong weekdays and advertise dates that were never real. They
//   carry explicit dates, verified against the official page, and get refreshed
//   once a year. A lapsed one drops off the page by itself rather than lying.
//
//   `startTime`/`endTime` (HH:MM, Groningen wall-clock) are only for events with
//   an actual published start time. They narrow "Happening now" to those hours
//   instead of the whole day, on every day of a multi-day run. Leave both off
//   rather than guessing a time.
//
//   `hours` is for a multi-day run whose hours differ by day: it maps each ISO
//   day to [start, end] and overrides startTime/endTime on the days it lists.
//   The keys are full dates, so it is for non-annual entries only.
const EVENTS = [
    {
        id: 'koningsdag',
        date: '2026-04-27',
        annual: true,
        // Moved to Saturday the 26th in years when the 27th is a Sunday, which is
        // the law rather than a local variation: 2031 and 2036 next, 2014 last.
        notOnSunday: true,
        free: true,
        publicHoliday: true,
        title: { en: "King's Day", nl: 'Koningsdag' },
        location: { en: 'Across the city', nl: 'Door de hele stad' },
        tip: { en: 'The whole city turns orange and the vrijmarkt takes over the pavements, with half of Groningen selling the other half their old stuff. Wear something orange or you will feel underdressed.', nl: 'De hele stad kleurt oranje en de vrijmarkt neemt de stoepen over, waarbij half Groningen zijn oude spullen aan de andere helft verkoopt. Trek iets oranjes aan, anders voel je je ondergekleed.' }
    },
    {
        id: 'bevrijdingsdag',
        date: '2026-05-05',
        annual: true,
        free: true,
        publicHoliday: true,
        title: { en: 'Liberation Day Festival', nl: 'Bevrijdingsfestival' },
        location: { en: 'Stadspark', nl: 'Stadspark' },
        tip: { en: 'A free open-air festival in the Stadspark marking the end of the occupation. Go for the afternoon: the line-up is genuinely good and nobody pays in.', nl: 'Een gratis openluchtfestival in het Stadspark dat het einde van de bezetting markeert. Ga in de middag: de line-up is echt goed en niemand betaalt entree.' },
        url: 'https://bevrijdingsfestivalgroningen.nl',
        // Centred on the Drafbaan, the festival terrain rather than the park's
        // centroid — the Stadspark is ~140 hectares and its far end is nowhere
        // near the stages. 600m covers the grounds and the approach from the
        // Laan Corpus den Hoorn side without reaching the city centre.
        //
        // Only events with a genuine point belong here. A city-wide entry
        // (Koningsdag's vrijmarkt, Bommen Berend) has no coordinate to stand
        // near, so it carries no checkIn block and shows no button.
        checkIn: { coords: [53.2026, 6.5540], radius: 600 },
        badge: {
            icon: '🕊️',
            title: { en: 'Stadspark Liberator', nl: 'Stadspark Bevrijder' },
            desc: {
                en: 'Checked in at the Bevrijdingsfestival, in the Stadspark, on Liberation Day itself!',
                nl: 'Ingecheckt op het Bevrijdingsfestival, in het Stadspark, op Bevrijdingsdag zelf!'
            }
        }
    },
    {
        id: 'bommen-berend',
        date: '2026-08-28',
        annual: true,
        free: true,
        title: { en: 'Bommen Berend (Gronings Ontzet)', nl: 'Bommen Berend (Gronings Ontzet)' },
        location: { en: 'City centre', nl: 'Binnenstad' },
        tip: { en: 'Groningen celebrates driving off the bishop of Munster in 1672, and has done every year since. This is the most Groninger day of the year: a city holiday nobody outside the province has heard of.', nl: 'Groningen viert dat het in 1672 de bisschop van Munster verjoeg, en doet dat sindsdien elk jaar. Dit is de meest Groningse dag van het jaar: een stadsfeest waar niemand buiten de provincie van heeft gehoord.' }
    },
    {
        id: 'sint-maarten',
        date: '2026-11-11',
        annual: true,
        kidFriendly: true,
        free: true,
        title: { en: 'Sint Maarten', nl: 'Sint Maarten' },
        location: { en: 'Doorstep to doorstep', nl: 'Van deur tot deur' },
        tip: { en: 'Children go door to door after dark with paper lanterns, singing for sweets. In the north this is a proper institution rather than a curiosity, so buy candy in advance and answer the doorbell.', nl: 'Kinderen gaan na het donker met lampionnen langs de deuren en zingen voor snoep. In het noorden is dit een echt instituut en geen curiositeit, dus koop op tijd snoep en doe open.' }
    },
    {
        id: 'carbidschieten',
        date: '2026-12-31',
        annual: true,
        free: true,
        title: { en: 'Carbidschieten', nl: 'Carbidschieten' },
        location: { en: 'Villages around the province', nl: 'Dorpen in de provincie' },
        tip: { en: 'Milk churns, calcium carbide, and a very loud bang across the fields on New Year\'s Eve. A northern tradition you have to drive out of the city to see properly.', nl: 'Melkbussen, carbid en een enorme knal over het land op oudejaarsdag. Een noordelijke traditie waarvoor je de stad uit moet om het goed mee te maken.' }
    },
    {
        id: 'lego-fabuland-expositie',
        date: '2026-02-14',
        endDate: '2027-01-31',
        kidFriendly: true,
        title: { en: 'LEGO Fabuland Exhibition', nl: 'LEGO Fabuland Expositie' },
        location: { en: 'LEGiO-museum, Grootegast', nl: 'LEGiO-museum, Grootegast' },
        tip: { en: 'A historical overview of LEGO Fabuland sets from 1979–1989, built around anthropomorphic animal characters aimed at kids aged two to six. See a diorama put together by Henk Roede and rare pieces from the theme — a good rainy-day trip out of the city with young kids.', nl: 'Een historisch overzicht van LEGO Fabuland-sets uit 1979–1989, gebouwd rond antropomorfe dierenfiguren voor kinderen van twee tot zes jaar. Bekijk een diorama van Henk Roede en zeldzame stukken uit het thema — een leuk uitje buiten de stad voor een regenachtige dag met jonge kinderen.' },
        url: 'https://www.visitgroningen.nl/nl/doen/uitgaan/2114731788/lego-fabuland-expositie',
        // The LEGiO-museum, Legolaan 1C, Grootegast, at the coordinate the
        // visitgroningen.nl listing publishes. It is one building, so 300m is
        // plenty while still allowing for an unchecked point and a weak fix.
        checkIn: { coords: [53.2130, 6.2678], radius: 300 },
        badge: {
            icon: '🧱',
            title: { en: 'Fabuland Visitor', nl: 'Fabuland-bezoeker' },
            desc: {
                en: 'Checked in at the LEGO Fabuland exhibition in the LEGiO-museum, Grootegast!',
                nl: 'Ingecheckt bij de LEGO Fabuland-expositie in het LEGiO-museum in Grootegast!'
            }
        }
    },
    {
        id: 'aigrunn-hackathon-2026',
        date: '2026-11-11',
        endDate: '2026-11-12',
        title: { en: 'aiGrunn Hackathon', nl: 'aiGrunn Hackathon' },
        location: { en: 'Niemeyer, Groningen', nl: 'Niemeyer, Groningen' },
        tip: { en: 'Two days of building in the run-up to the aiGrunn Conference, in two parallel streams. Explore is open to anyone curious about AI, no experience needed: pick a technology or an idea and tinker. The Challenge stream, run with Green Business Challenge, puts teams of 18–30-year-olds with a Dutch address on a concrete problem. Food and drinks are provided, selected winners may present on the conference stage on 13 November, and participants get a discounted conference ticket. Spots are limited, so apply online.', nl: 'Twee dagen bouwen in aanloop naar de aiGrunn Conferentie, in twee parallelle stromen. Explore staat open voor iedereen die nieuwsgierig is naar AI, ervaring is niet nodig: kies een technologie of idee en ga experimenteren. De Challenge-stroom, samen met Green Business Challenge, zet teams van 18- tot 30-jarigen met een Nederlands adres op een concreet vraagstuk. Eten en drinken zijn geregeld, geselecteerde winnaars mogen mogelijk op 13 november op het podium van de conferentie presenteren en deelnemers krijgen korting op een conferentiekaartje. Er zijn beperkt plekken, dus meld je online aan.' },
        url: 'https://www.aigrunn.org/hackathon'
    },
    {
        id: 'aigrunn-2026',
        date: '2026-11-13',
        title: { en: 'aiGrunn Conference', nl: 'aiGrunn Conferentie' },
        location: { en: 'City centre', nl: 'Binnenstad' },
        tip: { en: 'The North\'s biggest AI gathering, from the people behind the PyGrunn Python conference: more than 1,000 professionals and talks across eight tracks, from tech to business and government. A good way into Groningen\'s tech scene if you work in or near AI. Tickets are sold online.', nl: 'De grootste AI-bijeenkomst van het Noorden, van de makers van de Python-conferentie PyGrunn: ruim 1000 professionals en talks verdeeld over acht tracks, van tech tot business en overheid. Een goede ingang tot de Groningse techscene als je in of rond AI werkt. Kaartjes koop je online.' },
        url: 'https://www.aigrunn.org/'
    },
    {
        id: 'winterstad-2026',
        date: '2026-11-27',
        endDate: '2027-01-03',
        title: { en: 'Winterstad Groningen', nl: 'Winterstad Groningen' },
        location: { en: 'Grote Markt, city centre', nl: 'Grote Markt, binnenstad' },
        tip: { en: 'For five weeks the Grote Markt turns into a winter fair: a big covered ice rink, a Ferris wheel, a Christmas train, market stalls and a winter café. Wandering around is free; skating and the rides are paid. Weekend afternoons get busy, so go early or on a weekday evening.', nl: 'Vijf weken lang verandert de Grote Markt in een winterplein: een grote overdekte ijsbaan, een reuzenrad, een kersttrein, marktkraampjes en een wintercafé. Rondlopen is gratis; schaatsen en de attracties kosten geld. In het weekend is het \'s middags druk, dus ga vroeg of op een doordeweekse avond.' },
        url: 'https://winterstadgroningen.nl/',
        // Open daily per winterstadgroningen.nl/openingstijden: everything opens
        // at 11:00, and the café and Ferris wheel run until midnight; 23:59
        // keeps the last minute inside the same day.
        startTime: '11:00',
        endTime: '23:59'
    },
    {
        id: 'winterwelvaart-2026',
        date: '2026-12-11',
        endDate: '2026-12-13',
        free: true,
        title: { en: 'WinterWelVaart', nl: 'WinterWelVaart' },
        location: { en: 'A-kwartier, city centre', nl: 'A-kwartier, binnenstad' },
        tip: { en: 'Around twenty historic ships light up the quays of the A-kwartier for a long December weekend, with an arts trail through the old warehouses, live music and glühwein against the old harbour houses. Free to wander and easily the most atmospheric way to do Christmas in Groningen.', nl: 'Zo\'n twintig historische schepen verlichten de kades van het A-kwartier tijdens een lang decemberweekend, met een kunstroute door de oude pakhuizen, muziek en glühwein tegen de gevels van de vroegere haven. Gratis toegankelijk en veruit de sfeervolste manier om kerst in Groningen te beleven.' },
        url: 'https://winterwelvaart.nl/'
    },
    {
        id: 'esns-2027',
        date: '2027-01-13',
        endDate: '2027-01-16',
        title: { en: 'Eurosonic Noorderslag (ESNS)', nl: 'Eurosonic Noorderslag (ESNS)' },
        location: { en: 'Venues across the city centre', nl: 'Podia door de hele binnenstad' },
        tip: { en: 'Europe\'s leading showcase festival for new music fills dozens of venues across town for four days. Most nights need an industry badge, but the closing Saturday, Noorderslag, sells public tickets, so it is worth planning around if you like discovering bands early.', nl: 'Het toonaangevende Europese showcasefestival voor nieuwe muziek vult dagenlang tientallen podia door de hele stad. De meeste avonden zijn voor badgehouders, maar op de afsluitende zaterdag, Noorderslag, zijn er gewoon kaartjes te koop, dus die avond is de moeite waard als je van nieuwe bands houdt.' },
        url: 'https://esns.nl/en/'
    },
    {
        id: 'wijnfestival-groningen-2026',
        date: '2026-09-25',
        endDate: '2026-09-27',
        // Different hours each day, per the official listing.
        hours: {
            '2026-09-25': ['17:00', '23:30'],
            '2026-09-26': ['16:00', '23:30'],
            '2026-09-27': ['15:00', '20:00']
        },
        title: { en: 'Wijnfestival Groningen (Wine Festival)', nl: 'Wijnfestival Groningen' },
        location: { en: 'A-kerk, city centre', nl: 'A-kerk, binnenstad' },
        tip: { en: 'This 10th edition turns the atmospheric A-kerk into a three-day wine tasting, with 20+ exhibitors pouring 250+ wines from around the world, food pairings, and live music. Open Friday 17:00–23:30, Saturday 16:00–23:30 and Sunday 15:00–20:00. Book online in advance for a cheaper ticket than at the door.', nl: 'Dit tiende jaar verandert de sfeervolle A-kerk drie dagen lang in een wijnproeverij, met ruim 20 exposanten en 250+ wijnen uit de hele wereld, hapjes erbij en livemuziek. Open op vrijdag van 17:00 tot 23:30, zaterdag van 16:00 tot 23:30 en zondag van 15:00 tot 20:00 uur. Koop je kaartje van tevoren online, dat is goedkoper dan aan de deur.' },
        url: 'https://www.visitgroningen.nl/nl/doen/uitgaan/440554054/wijnfestival-groningen-7'
    },
    {
        id: 'eureka-2026',
        date: '2026-09-25',
        // Runs until midnight; 23:59 keeps the last minute inside the same day.
        startTime: '19:30',
        endTime: '23:59',
        title: { en: 'Eureka! Science Festival', nl: 'Eureka! Wetenschapsfestival' },
        location: { en: 'Forum Groningen, Nieuwe Markt 1', nl: 'Forum Groningen, Nieuwe Markt 1' },
        tip: { en: 'The festival formerly known as European Researchers\' Night takes over the whole of Forum for an evening of science battles, talks, installations, workshops and music, this year around the theme "Resilience in Times of Change". Runs 19:30 until midnight; tickets are €8.50.', nl: 'Het festival dat vroeger European Researchers\' Night heette, neemt een avond lang heel het Forum over met wetenschapsbattles, lezingen, installaties, workshops en muziek, dit jaar rond het thema "Resilience in Times of Change". Van 19:30 tot middernacht; kaartjes kosten €8,50.' },
        url: 'https://forum.nl/nl/agenda/talks-events/eureka-10048470'
    },
    {
        id: 'culinair-haren-2026',
        date: '2026-10-02',
        endDate: '2026-10-04',
        // Different hours each day, per the official listing. Saturday runs until
        // midnight; 23:59 keeps the last minute inside the same day.
        hours: {
            '2026-10-02': ['17:00', '23:00'],
            '2026-10-03': ['16:00', '23:59'],
            '2026-10-04': ['15:00', '21:00']
        },
        title: { en: 'Culinair Haren (Food Festival)', nl: 'Culinair Haren' },
        location: { en: 'Around the Dorpskerk, Haren', nl: 'Rond de Dorpskerk, Haren' },
        tip: { en: 'Heerlijk Haren: for one weekend, local restaurants and caterers set up around the village church with small plates, finger food, seasonal dishes and wine and beer bars, while hay bales, heaters and string lights keep it cosy into the October evening. Open Friday 17:00–23:00, Saturday 16:00–midnight and Sunday 15:00–21:00. An easy bike ride south of the city and a good excuse to see Haren.', nl: 'Heerlijk Haren: een weekend lang staan lokale restaurants en cateraars rond de Dorpskerk met kleine gerechten, fingerfood, seizoensgerechten en wijn- en bierbars, terwijl hooibalen, heaters en lichtjes het ook op een oktoberavond gezellig houden. Open op vrijdag van 17:00 tot 23:00, zaterdag van 16:00 tot middernacht en zondag van 15:00 tot 21:00 uur. Een makkelijk fietstochtje ten zuiden van de stad en een mooi excuus om Haren te ontdekken.' },
        url: 'https://www.ervaarharen.nl/event/culinair-haren/',
        // Centred on the Dorpskerk, Kerkstraat 2: the stalls fill the grounds
        // around the church. The point is a published coordinate that has not
        // been checked on site, so the radius errs generous — 400m covers the
        // churchyard and the village centre around it without reaching the
        // Hortus or the station.
        checkIn: { coords: [53.1726, 6.6051], radius: 400 },
        badge: {
            icon: '🍽️',
            title: { en: 'Heerlijk Haren Foodie', nl: 'Heerlijk Haren Fijnproever' },
            desc: {
                en: 'Checked in at Culinair Haren, eating your way around the Dorpskerk!',
                nl: 'Ingecheckt op Culinair Haren, al proevend rond de Dorpskerk!'
            }
        }
    },
    {
        id: 'groninger-marktendag-2026',
        date: '2026-10-03',
        startTime: '09:00',
        endTime: '17:00',
        kidFriendly: true,
        free: true,
        title: { en: 'Groninger Marktendag (Market Day)', nl: 'Groninger Marktendag' },
        location: { en: 'City centre, incl. Waagstraat and the A-kerk', nl: 'Binnenstad, o.a. Waagstraat en bij de A-kerk' },
        tip: { en: 'The biggest one-day market in the north: 400+ stalls spread over seven themed markets — vintage, handmade, interior and lifestyle, regional products, antiques and curiosities, books and vinyl, and a goods market — winding about a kilometre through the old centre, with live music, a children\'s programme and a food court next to the A-kerk. Entry is free. It falls on German Unity Day, so expect plenty of German day-trippers: come by bike and come early.', nl: 'De grootste eendaagse markt van het Noorden: ruim 400 kramen verdeeld over zeven themamarkten — vintage, handgemaakt, interieur en lifestyle, streekproducten, antiek en curiosa, boeken en vinyl, en een warenmarkt — zo\'n kilometer lang door de oude binnenstad, met livemuziek, een kinderprogramma en een foodplein naast de A-kerk. De toegang is gratis. Het valt op de Duitse Dag van de Eenheid, dus reken op veel Duitse dagjesmensen: kom op de fiets en kom vroeg.' },
        url: 'https://groningermarktendag.nl/'
    },
    {
        id: 'pompoen-plukdagen-2026',
        date: '2026-10-03',
        endDate: '2026-10-04',
        kidFriendly: true,
        free: true,
        title: { en: 'Pumpkin Picking Days', nl: 'Pompoen Plukdagen' },
        location: { en: 'Nieuwlandse Akker, Huningaweg 19, Oostwold', nl: 'Nieuwlandse Akker, Huningaweg 19, Oostwold' },
        tip: { en: 'Put your boots on and walk into the Oldambt clay to cut your own pumpkin, from giant Halloween ones to odd little decorative gourds. Around the field there is a market of local growers and makers, and activities for children as part of Oktober Kindermaand. Field and market are free — you pay only for what you carry home. Bring a crate: the drive back from Oostwold is not the moment to discover your bike basket is too small.', nl: 'Trek je laarzen aan en het Oldambtster land op om zelf je pompoen te plukken, van kolossale halloweenpompoenen tot rare kleine sierkalebassen. Rond het veld staat een markt met lokale telers en makers, en er zijn kinderactiviteiten in het kader van Oktober Kindermaand. Het veld en de markt zijn gratis — je betaalt alleen wat je meeneemt. Neem een kist mee: onderweg terug uit Oostwold is een te kleine fietstas een vervelende ontdekking.' },
        url: 'https://www.visitgroningen.nl/nl/doen/uitgaan/4140262387/pompoen-plukdagen-4',
        // Sunday's 10:30–16:00 is from the official listing's schedule, which by
        // the time this was added only showed the last day. Saturday's hours are
        // assumed to match, not confirmed.
        hours: {
            '2026-10-03': ['10:30', '16:00'],
            '2026-10-04': ['10:30', '16:00']
        },
        // The published coordinate for Huningaweg 19, Oostwold. Like Culinair
        // Haren's it has not been checked on site, and the picking field spreads
        // out behind the farmyard, so 400m covers the field and the market around
        // it without reaching the village.
        checkIn: { coords: [53.2037, 7.0353], radius: 400 },
        badge: {
            icon: '🎃',
            title: { en: 'Oldambt Pumpkin Picker', nl: 'Oldambtster Pompoenplukker' },
            desc: {
                en: 'Checked in at the Pompoen Plukdagen, cutting your own pumpkin in the Oostwold clay!',
                nl: 'Ingecheckt op de Pompoen Plukdagen, je eigen pompoen geplukt in de Oostwolder klei!'
            }
        }
    },
    {
        id: 'magisch-samhain-2026',
        date: '2026-10-31',
        endDate: '2026-11-01',
        kidFriendly: true,
        title: { en: 'Magisch Samhain (Bourtange)', nl: 'Magisch Samhain (Bourtange)' },
        location: { en: 'Vesting Bourtange, Westerwolde', nl: 'Vesting Bourtange, Westerwolde' },
        tip: { en: 'The star-shaped fortress fills with ghosts, time travellers, pirates and fire shows for the Celtic new year, which is where Halloween actually comes from. Stilt walkers between the ramparts, fortune tellers, a wishing tree, and a crowd that mostly turns up in costume. It is an hour from the city by car and worth the trip — but check the ticket page first, because earlier editions sold out on the day.', nl: 'De stervormige vesting loopt vol met geesten, tijdreizigers, piraten en vuurshows voor het Keltische nieuwjaar, waar Halloween eigenlijk vandaan komt. Steltlopers tussen de wallen, waarzeggers, een wensboom en publiek dat grotendeels verkleed komt. Een uur rijden vanuit de stad en dat dubbel en dwars waard — kijk wel eerst op de ticketpagina, want eerdere edities zaten op de dag zelf vol.' },
        url: 'https://www.visitgroningen.nl/nl/doen/uitgaan/4161137856/magisch-samhain-1',
        // 11:00–18:00 both days, per the listing's schedule.
        hours: {
            '2026-10-31': ['11:00', '18:00'],
            '2026-11-01': ['11:00', '18:00']
        },
        // The listing's published coordinate, inside the fortress. The star
        // with its ramparts is roughly 500m across, so 500m covers all of it
        // without reaching the next village.
        checkIn: { coords: [53.0092, 7.1874], radius: 500 },
        badge: {
            icon: '🔥',
            title: { en: 'Samhain at the Fortress', nl: 'Samhain in de Vesting' },
            desc: {
                en: 'Checked in at Magisch Samhain, among the ghosts and fire shows of Vesting Bourtange!',
                nl: 'Ingecheckt op Magisch Samhain, tussen de geesten en vuurshows van Vesting Bourtange!'
            }
        }
    },
    {
        id: 'plantsoenloop-2026',
        date: '2026-11-07',
        startTime: '09:00',
        endTime: '16:00',
        title: { en: 'Plantsoenloop (running race)', nl: 'Plantsoenloop' },
        location: { en: 'Noorderplantsoen', nl: 'Noorderplantsoen' },
        tip: { en: 'The oldest running race in Groningen, now in its 68th edition, loops through the surprisingly hilly Noorderplantsoen. There are four distances and races run from 09:00 until the last 8 km start at 15:15, so it works whether you are training for something or just want an excuse to run through the park in its autumn colours. Entry is about €17 and you need to sign up online beforehand. If you are not running, it is still worth walking over to cheer.', nl: 'De oudste hardloopwedstrijd van Groningen, dit jaar voor de 68ste keer, gaat dwars door het verrassend heuvelachtige Noorderplantsoen. Er zijn vier afstanden en de wedstrijden lopen van 09:00 tot de laatste start van de 8 km om 15:15, dus of je nu ergens voor traint of gewoon een excuus zoekt om door het park in herfstkleuren te rennen, er zit er een voor je bij. Inschrijven doe je vooraf online, voor zo\'n €17. Loop je zelf niet mee, dan is het nog steeds de moeite waard om te komen aanmoedigen.' },
        url: 'https://plantsoenloop.nl/',
        // The same Noorderplantsoen point the bucket list uses. The park is
        // long and narrow and the course loops all of it, so 400m covers the
        // route and the start area without reaching the Grote Markt.
        checkIn: { coords: [53.2241, 6.5540], radius: 400 },
        badge: {
            icon: '🏃',
            title: { en: 'Plantsoen Runner', nl: 'Plantsoenloper' },
            desc: {
                en: 'Checked in at the Plantsoenloop, the oldest race in Groningen!',
                nl: 'Ingecheckt bij de Plantsoenloop, de oudste hardloopwedstrijd van Groningen!'
            }
        }
    },
    {
        id: 'sint-martinusoptocht-2026',
        date: '2026-11-07',
        startTime: '16:00',
        endTime: '18:00',
        kidFriendly: true,
        free: true,
        title: { en: 'Sint Martinus Parade and Children\'s Festival', nl: 'Sint Martinusoptocht en Kinderfestival' },
        location: { en: 'Hereplein to the Martinikerk', nl: 'Hereplein naar de Martinikerk' },
        tip: { en: 'Children carry home-made lanterns (beet or not!) behind Sint Martinus on horseback and his Roman soldiers, from the Hereplein to the Martinikerk. Meet at the Hereplein at 16:15; the parade leaves at 16:30. Inside the church there is a trail of lights, a lantern contest, a story, songs and hot chocolate, and it wraps up around 17:30. Free, and a good warm-up for Sint Maarten on Wednesday.', nl: 'Kinderen lopen met zelfgemaakte lampionnen (biet of niet!) achter Sint Martinus te paard en zijn Romeinse soldaten aan, van het Hereplein naar de Martinikerk. Verzamelen om 16.15 uur op het Hereplein; de stoet vertrekt om 16.30 uur. In de kerk wacht een spoor van lichtjes, een lampionnenwedstrijd, een verhaal, liedjes en warme chocolademelk. Rond half 6 is het afgelopen. Gratis, en een mooie opwarmer voor Sint Maarten op woensdag.' },
        url: 'https://www.visitgroningen.nl/nl/doen/uitgaan/2305993411/sint-martinusoptocht-en-kinderfestival'
    },
    {
        id: 'sunnemeerten-parade-2026',
        date: '2026-11-07',
        startTime: '18:00',
        endTime: '19:30',
        title: { en: 'Sunnemeerten Parade', nl: 'Sunnemeerten Parade' },
        location: { en: 'City centre', nl: 'Binnenstad' },
        tip: { en: 'A light parade through the city centre where people from the city and the surrounding villages carry light sculptures they built themselves in September and October. This is the second edition and the theme is "Rituelen" (rituals). It is short, 18:00 to 19:30, so wrap up warm and go early.', nl: 'Een lichtparade door de binnenstad waarin inwoners van stad en ommeland zelfgebouwde lichtsculpturen meedragen, die ze in september en oktober maakten. Dit is de tweede editie en het thema is "Rituelen". Het is kort, van 18.00 tot 19.30 uur, dus kleed je warm aan en kom op tijd.' },
        url: 'https://www.visitgroningen.nl/nl/doen/uitgaan/1588269624/sunnemeerten-parade-1'
    },
    {
        id: 'aclo-vitalis-run-2026',
        date: '2026-10-07',
        // Only the start is published; there is no end time to narrow to.
        startTime: '18:00',
        free: true,
        title: { en: 'ACLO-Vitalis Run (autumn edition)', nl: 'ACLO-Vitalis Run (najaarseditie)' },
        location: { en: 'ACLO Sports Centre, Zernike', nl: 'Sportcentrum ACLO, Zernike' },
        tip: { en: 'The student sports centre ACLO and the student athletics club Vitalis put on this evening run twice a year, in spring and autumn. Choose 3.5 km or 6.2 km. It is open to everyone, beginners included, and it is free. The start is at 18:00 at the ACLO Sports Centre, and you collect your race number at the entrance between 17:00 and 17:45. Sign up through the form on the ACLO page.', nl: 'Studentensportcentrum ACLO en studentenatletiekvereniging Vitalis organiseren deze avondloop twee keer per jaar, in het voorjaar en in het najaar. Je kiest tussen 3,5 en 6,2 km. Iedereen mag meedoen, ook beginners, en deelname is gratis. De start is om 18:00 bij Sportcentrum ACLO; je startnummer haal je tussen 17:00 en 17:45 op bij de ingang. Aanmelden doe je via het formulier op de pagina van ACLO.' },
        url: 'https://www.aclosport.nl/en/evenementen/aclo-vitalis-run/'
    },
    {
        id: 'popronde-groningen-2026',
        date: '2026-10-08',
        free: true,
        title: { en: 'Popronde Groningen', nl: 'Popronde Groningen' },
        location: { en: 'Venues across the city centre', nl: 'Podia door de hele binnenstad' },
        tip: { en: 'Popronde is a free travelling festival that visits about 40 Dutch cities every autumn, putting a new generation of Dutch bands and artists on stage in cafés, clubs, record shops and theatres. In Groningen it is one evening of hopping between venues, Vera included. Most shows are free, so it is an easy night to discover your new favourite band.', nl: 'De Popronde is een gratis reizend festival dat elk najaar zo\'n 40 Nederlandse steden aandoet, met een nieuwe lichting Nederlandse bands en artiesten in cafés, clubs, platenzaken en theaters. In Groningen is het één avond van podium naar podium, van Vera tot de kroeg om de hoek. De meeste optredens zijn gratis, dus een makkelijke avond om je nieuwe favoriete band te ontdekken.' },
        url: 'https://popronde.nl/steden/groningen'
    },
    {
        id: 'vier-mijl-2026',
        date: '2026-10-11',
        startTime: '10:00',
        endTime: '16:00',
        title: { en: 'Menzis 4 Mijl van Groningen (running race)', nl: 'Menzis 4 Mijl van Groningen' },
        location: { en: 'Haren to the Vismarkt', nl: 'Van Haren naar de Vismarkt' },
        tip: { en: 'The biggest running party in the north: tens of thousands of runners cover 6.4 km (four miles) from Haren to the Vismarkt, held every second weekend of October since 1987. Start numbers tend to sell out fast, so sign up early if you want to run. Otherwise find a spot along the route or at the finish: thousands of people come out to cheer, and there is music along the way.', nl: 'Het grootste loopfeest van Noord-Nederland: tienduizenden lopers leggen de 6,4 km (vier mijl) van Haren naar de Vismarkt af, al sinds 1987 elk tweede weekend van oktober. De startbewijzen zijn meestal snel uitverkocht, dus schrijf je op tijd in als je mee wilt lopen. Anders zoek je een plekje langs de route of bij de finish: duizenden toeschouwers komen aanmoedigen en onderweg is er muziek.' },
        url: 'https://www.4mijl.nl/',
        // The finish on the Vismarkt, from the bucket list's own Vismarkt
        // points: the visitgroningen geocode sits ~400m east, past the
        // Martinitoren. 400m takes in the finish straight and the crowd at
        // the Grote Markt end without reaching the start in Haren.
        checkIn: { coords: [53.2167, 6.5648], radius: 400 },
        badge: {
            icon: '🏅',
            // Spectators are inside the radius too, so the badge records being
            // there on the day, not having run.
            title: { en: '4 Mijl Day', nl: '4 Mijl-dag' },
            desc: {
                en: 'Checked in at the Vismarkt finish of the Menzis 4 Mijl, the biggest running party in the north, whether you ran it or cheered!',
                nl: 'Ingecheckt bij de finish van de Menzis 4 Mijl op de Vismarkt, het grootste loopfeest van het Noorden, of je nu meeliep of aanmoedigde!'
            }
        }
    },
    {
        id: 'oktofest-groningen-2026',
        date: '2026-10-16',
        endDate: '2026-10-17',
        // Taps close at midnight; 23:59 keeps the last minute inside the same day.
        hours: {
            '2026-10-16': ['19:00', '23:59'],
            '2026-10-17': ['18:00', '23:59']
        },
        title: { en: 'Oktofest (Oktoberfest at Stadslab)', nl: 'Oktofest (Oktoberfest in Stadslab)' },
        location: { en: 'Stadslab, Suikerunieterrein', nl: 'Stadslab, Suikerunieterrein' },
        tip: { en: 'Groningen\'s own Oktoberfest takes over Stadslab on the old sugar factory site for two evenings, with long beer tables, litre mugs, bratwurst, schlager and live acts. It starts at 19:00 on Friday and 18:00 on Saturday, doors open half an hour earlier, and the taps close at midnight. Dirndl and lederhosen are very much encouraged. Buy tickets online in advance, and if you are going with a group, a whole table is the better deal.', nl: 'Het Groningse Oktoberfest neemt twee avonden het Stadslab op het oude Suikerunieterrein over, met lange biertafels, literpullen, braadworst, schlagers en live-acts. Vrijdag gaat het om 19:00 uur los en zaterdag om 18:00 uur, de deuren gaan een halfuur eerder open en om middernacht gaat de tap dicht. Dirndl en lederhosen worden zeer gewaardeerd. Koop je kaartjes vooraf online, en ga je met een groep, dan is een hele tafel de betere deal.' },
        url: 'https://oktofest.nl/',
        // Stadslab, Suikerlaan 15, per its visitgroningen geocode; EM2 two
        // doors down geocodes ~130m away, which agrees. Not checked on site,
        // so the radius is generous and covers the whole Stadslab terrain.
        checkIn: { coords: [53.2111, 6.5388], radius: 400 },
        badge: {
            icon: '🍺',
            title: { en: 'Oktofest Night', nl: 'Oktofestavond' },
            desc: {
                en: 'Checked in at Oktofest, Groningen\'s own Oktoberfest at Stadslab on the old sugar factory site!',
                nl: 'Ingecheckt op Oktofest, het Groningse Oktoberfest in Stadslab op het oude Suikerunieterrein!'
            }
        }
    },
    {
        id: 'bierrun-groningen-2026',
        date: '2026-10-17',
        startTime: '13:00',
        endTime: '17:00',
        title: { en: 'Bierrun Groningen (beer run)', nl: 'Bierrun Groningen' },
        location: { en: 'Start and finish at Folkingebrew The Pub, Boterdiep', nl: 'Start en finish bij Folkingebrew The Pub, Boterdiep' },
        tip: { en: 'A social fun run of about 8 km past four Groningen breweries, with five tasting glasses of local craft beer on the way and a beer sommelier telling stories about the city. Nobody times you, and you run together as a group, so all you need is enough fitness to run 8 km with beer in between. Tickets are €27.50 and you book online.', nl: 'Een gezellige funrun van zo\'n 8 km langs vier Groningse brouwerijen, met onderweg vijf proefglazen lokaal speciaalbier en een biersommelier die verhalen over de stad vertelt. Er is geen tijdsregistratie en je loopt samen als groep, dus je moet vooral 8 km kunnen rennen met bier tussendoor. Een kaartje kost €27,50 en je boekt online.' },
        url: 'https://www.visitgroningen.nl/nl/doen/uitgaan/1515269094/bierrun-groningen-1'
    },
    {
        id: 'nacht-van-de-nacht-2026',
        date: '2026-10-24',
        startTime: '20:00',
        endTime: '21:30',
        title: { en: 'Nacht van de Nacht (Night of the Night)', nl: 'Nacht van de Nacht' },
        location: { en: 'Molen Wilhelmina, Noorderhogebrug', nl: 'Molen Wilhelmina, Noorderhogebrug' },
        tip: { en: 'Once a year, the Netherlands celebrates darkness with night walks, stargazing and lights switched off. Just outside the city, a walk leaves from the windmill at Noorderhogebrug into the old Reitdiep landscape: across meadows and ditches under the stars, past the Groninger Landschap visitor centre and back to the mill, which opens its doors for you. Adults pay €6 and children walk free. Sign up in advance.', nl: 'Eén keer per jaar viert Nederland het donker, met nachtwandelingen, sterrenkijken en lampen die uitgaan. Net buiten de stad vertrekt een wandeling vanaf de molen in Noorderhogebrug het oude Reitdieplandschap in: onder de sterren door weilanden en over sloten, langs het bezoekerscentrum van Het Groninger Landschap en terug naar de molen, die zijn deuren voor je openzet. Volwassenen betalen €6, kinderen lopen gratis mee. Meld je vooraf aan.' },
        url: 'https://www.visitgroningen.nl/nl/doen/uitgaan/2449763556/wandeling-nacht-van-de-nacht-7'
    },
    {
        id: 'de-boer-op-midden-groningen-2026',
        date: '2026-10-10',
        startTime: '11:00',
        endTime: '15:30',
        kidFriendly: true,
        free: true,
        title: { en: 'De Boer Op! (open farm day in Midden-Groningen)', nl: 'De boer op! in Midden-Groningen' },
        location: { en: 'Farms across Midden-Groningen, including Boerderij Arkema in Noordbroek', nl: 'Boerderijen in heel Midden-Groningen, waaronder Boerderij Arkema in Noordbroek' },
        tip: { en: 'Farmers, growers and farm shops across Midden-Groningen open their doors for one day, as part of the national Week van ons Eten. Look at cows, sheep and alpacas, pick your own apples in Noordbroek, taste cheese and stock up at the stalls along the road. Two routes take you past the farms by bike or car, or you plan your own. Most activities are free, some workshops cost a little, and you pay for what you buy. Hours can differ per farm.', nl: 'Boeren, tuinders en streekwinkels in heel Midden-Groningen zetten één dag hun deuren open, als onderdeel van de landelijke Week van ons Eten. Kijk bij de koeien, schapen en alpaca\'s, pluk zelf appels in Noordbroek, proef kaas en sla je boodschappen in bij de kraampjes langs de weg. Twee routes brengen je per fiets of auto langs de bedrijven, of je stippelt zelf een route uit. De meeste activiteiten zijn gratis, aan sommige workshops zijn kosten verbonden en je betaalt voor wat je koopt. Openingstijden kunnen per deelnemer verschillen.' },
        url: 'https://www.visitgroningen.nl/nl/doen/uitgaan/533848868/de-boer-op'
    },
    {
        id: 'star-kindermaand-2026-10-11',
        date: '2026-10-11',
        startTime: '10:00',
        endTime: '16:00',
        kidFriendly: true,
        title: { en: 'Steam train adventure on Museumspoorlijn STAR', nl: 'Op avontuur met de stoomtrein van Museumspoorlijn STAR' },
        location: { en: 'Museumspoorlijn STAR, Stadskanaal–Veendam', nl: 'Museumspoorlijn STAR, Stadskanaal–Veendam' },
        tip: { en: 'The STAR heritage steam train runs between Stadskanaal and Veendam on the Sundays and the Wednesday of the autumn holiday. For Oktober Kindermaand, children up to 12 ride free; anyone 13 and older pays €16. On board there is a railway quiz and a teddy-bear hunt, and the museum at Stadskanaal station shows how trains used to run in the region. Buy tickets online or at the stations.', nl: 'De stoomtrein van Museumspoorlijn STAR rijdt op de zondagen en de woensdag van de herfstvakantie tussen Stadskanaal en Veendam. Omdat het Oktober Kindermaand is, rijden kinderen tot en met 12 jaar gratis mee; vanaf 13 jaar betaal je €16. In de trein is er een spoorquiz en een berenjacht, en in het museum bij station Stadskanaal leer je hoe de treinen hier vroeger reden. Kaartjes koop je online of op de stations.' },
        url: 'https://www.visitgroningen.nl/nl/doen/uitgaan/2140334573/oktober-kindermaand-stadskanaal-rail'
    },
    {
        id: 'cinekid-forum-2026',
        date: '2026-10-12',
        endDate: '2026-10-16',
        kidFriendly: true,
        title: { en: 'Cinekid films at Forum', nl: 'Cinekid-films in Forum' },
        location: { en: 'Forum Groningen, Nieuwe Markt', nl: 'Forum Groningen, Nieuwe Markt' },
        tip: { en: 'Cinekid is the biggest film and media festival for children, and during the autumn holiday Forum screens a week of its films, each with an age label so you can pick one that fits. Screening times differ per film and day, and a ticket is about €12. Check the programme and book ahead.', nl: 'Cinekid is het grootste film- en mediafestival voor kinderen, en in de herfstvakantie draait Forum een week lang films uit het festival, elk met een leeftijdsaanduiding zodat je makkelijk iets passends kiest. De aanvangstijden verschillen per film en per dag, en een kaartje kost ongeveer €12. Bekijk het programma en reserveer vooraf.' },
        url: 'https://forum.nl/nl/film/cinekid'
    },
    {
        id: 'kwelderexcursie-pieterburen-2026-10-13',
        date: '2026-10-13',
        startTime: '13:30',
        endTime: '16:00',
        kidFriendly: true,
        free: true,
        title: { en: 'Covered-wagon trip to the salt marsh', nl: 'Huifkartocht en kwelderexcursie' },
        location: { en: 'Bezoekerscentrum Waddenkust, Pieterburen', nl: 'Bezoekerscentrum Waddenkust, Pieterburen' },
        tip: { en: 'Het Groninger Landschap takes children aged 8 to 12 by covered wagon to the muddy salt marsh behind the dike, hunting for plants and creepy-crawlies, with guides who explain what they find. It leaves at 13:30 from the visitor centre and is back around 16:00. It is free as part of Oktober Kindermaand, but there are only 20 places in the wagon, so sign up early. Wear shoes that can get wet and dirty; boots can get stuck in the mud.', nl: 'Het Groninger Landschap neemt kinderen van 8 t/m 12 jaar met de huifkar mee naar de modderige kwelder achter de dijk, op zoek naar plantjes en kriebelbeestjes, met gidsen die alles over je vondsten vertellen. Vertrek om 13:30 vanaf het bezoekerscentrum, terug rond 16:00. Het is gratis als onderdeel van Oktober Kindermaand, maar er zijn maar 20 plekken in de huifkar, dus meld je snel aan. Trek schoenen aan die nat en vies mogen worden; laarzen kunnen vastzuigen in de modder.' },
        url: 'https://www.visitgroningen.nl/nl/doen/uitgaan/3026866992/kwelderexcusie'
    },
    {
        id: 'springkussen-festival-martiniplaza-2026',
        date: '2026-10-13',
        endDate: '2026-10-16',
        startTime: '10:00',
        endTime: '17:00',
        kidFriendly: true,
        title: { en: 'Mega Indoor Bouncy Castle Festival', nl: 'Mega Indoor Springkussen Festival' },
        location: { en: 'Martiniplaza, Leonard Springerlaan', nl: 'Martiniplaza, Leonard Springerlaan' },
        tip: { en: 'For four days of the autumn holiday Martiniplaza turns into one big indoor playground of bouncy castles, slides, climbing towers and a rodeo bull. Open 10:00 to 17:00. Children pay to get in; parents and children up to 2 go free. Buy tickets online.', nl: 'Vier dagen lang in de herfstvakantie verandert Martiniplaza in één grote overdekte speeltuin met springkussens, glijbanen, klimtorens en een rodeostier. Open van 10:00 tot 17:00. Kinderen betalen entree; ouders en kinderen t/m 2 jaar mogen gratis naar binnen. Kaartjes koop je online.' },
        url: 'https://www.visitgroningen.nl/nl/doen/uitgaan/3935609718/mega-indoor-springkussen-festival-3'
    },
    {
        id: 'star-kindermaand-2026-10-14',
        date: '2026-10-14',
        startTime: '10:00',
        endTime: '16:00',
        kidFriendly: true,
        title: { en: 'Steam train adventure on Museumspoorlijn STAR', nl: 'Op avontuur met de stoomtrein van Museumspoorlijn STAR' },
        location: { en: 'Museumspoorlijn STAR, Stadskanaal–Veendam', nl: 'Museumspoorlijn STAR, Stadskanaal–Veendam' },
        tip: { en: 'The STAR heritage steam train runs between Stadskanaal and Veendam on the Sundays and the Wednesday of the autumn holiday. For Oktober Kindermaand, children up to 12 ride free; anyone 13 and older pays €16. On board there is a railway quiz and a teddy-bear hunt, and the museum at Stadskanaal station shows how trains used to run in the region. Buy tickets online or at the stations.', nl: 'De stoomtrein van Museumspoorlijn STAR rijdt op de zondagen en de woensdag van de herfstvakantie tussen Stadskanaal en Veendam. Omdat het Oktober Kindermaand is, rijden kinderen tot en met 12 jaar gratis mee; vanaf 13 jaar betaal je €16. In de trein is er een spoorquiz en een berenjacht, en in het museum bij station Stadskanaal leer je hoe de treinen hier vroeger reden. Kaartjes koop je online of op de stations.' },
        url: 'https://www.visitgroningen.nl/nl/doen/uitgaan/2140334573/oktober-kindermaand-stadskanaal-rail'
    },
    {
        id: 'natuur-knutselmiddag-coendersborg-2026',
        date: '2026-10-14',
        startTime: '14:00',
        endTime: '15:30',
        kidFriendly: true,
        free: true,
        title: { en: 'Nature craft afternoon for kids', nl: 'Natuurknutselmiddag voor kinderen' },
        location: { en: 'Coendersborg, Nuis', nl: 'Coendersborg, Nuis' },
        tip: { en: 'Children aged 6 to 12 collect what the trees have dropped around the Coendersborg estate and turn it into autumn decorations and other creations, with Het Groninger Landschap. It is free for children and adults, from 14:00 to 15:30. Sign up in advance.', nl: 'Kinderen van 6 tot 12 jaar verzamelen wat de bomen rond landgoed Coendersborg hebben laten vallen en maken er herfstige bloemstukjes en andere creaties van, met Het Groninger Landschap. Gratis voor kinderen en volwassenen, van 14:00 tot 15:30. Meld je vooraf aan.' },
        url: 'https://www.visitgroningen.nl/nl/doen/uitgaan/213522102/natuur-knutselmiddag-voor-kinderen-van-6-tot-12-jaar'
    },
    {
        id: 'kwelderexcursie-pieterburen-2026-10-16',
        date: '2026-10-16',
        startTime: '13:30',
        endTime: '16:00',
        kidFriendly: true,
        free: true,
        title: { en: 'Covered-wagon trip to the salt marsh', nl: 'Huifkartocht en kwelderexcursie' },
        location: { en: 'Bezoekerscentrum Waddenkust, Pieterburen', nl: 'Bezoekerscentrum Waddenkust, Pieterburen' },
        tip: { en: 'Het Groninger Landschap takes children aged 8 to 12 by covered wagon to the muddy salt marsh behind the dike, hunting for plants and creepy-crawlies, with guides who explain what they find. It leaves at 13:30 from the visitor centre and is back around 16:00. It is free as part of Oktober Kindermaand, but there are only 20 places in the wagon, so sign up early. Wear shoes that can get wet and dirty; boots can get stuck in the mud.', nl: 'Het Groninger Landschap neemt kinderen van 8 t/m 12 jaar met de huifkar mee naar de modderige kwelder achter de dijk, op zoek naar plantjes en kriebelbeestjes, met gidsen die alles over je vondsten vertellen. Vertrek om 13:30 vanaf het bezoekerscentrum, terug rond 16:00. Het is gratis als onderdeel van Oktober Kindermaand, maar er zijn maar 20 plekken in de huifkar, dus meld je snel aan. Trek schoenen aan die nat en vies mogen worden; laarzen kunnen vastzuigen in de modder.' },
        url: 'https://www.visitgroningen.nl/nl/doen/uitgaan/3026866992/kwelderexcusie'
    },
    {
        id: 'star-teddyberendag-2026',
        date: '2026-10-18',
        startTime: '10:00',
        endTime: '16:00',
        kidFriendly: true,
        title: { en: 'Teddy Bear Day on Museumspoorlijn STAR', nl: 'Teddyberendag bij Museumspoorlijn STAR' },
        location: { en: 'Museumspoorlijn STAR, Stadskanaal–Veendam', nl: 'Museumspoorlijn STAR, Stadskanaal–Veendam' },
        tip: { en: 'On the last Sunday of the autumn holiday the STAR steam railway is all about its youngest visitors: every child rides free if they bring their own cuddly toy, and there is a teddy-bear doctor. At Stadskanaal station there is face painting, a train quiz and old Dutch games like stilt walking, plus rides on the pump trolley and a shunting locomotive. The museum is open and the train makes two return trips to Veendam. Anyone 13 and older pays €16.', nl: 'De laatste zondag van de herfstvakantie staat Museumspoorlijn STAR helemaal in het teken van de jongste bezoekers: alle kinderen mogen gratis mee als ze hun eigen knuffel meenemen, en de berendokter is er ook. Op het station in Stadskanaal kun je je laten schminken, meedoen aan de treinquiz en oudhollandse spelletjes spelen zoals stelten lopen, en meerijden op de pomplorrie of een rangeerlocomotief. Het museum is open en de trein rijdt twee keer op en neer naar Veendam. Vanaf 13 jaar betaal je €16.' },
        url: 'https://www.visitgroningen.nl/nl/doen/uitgaan/2140334573/oktober-kindermaand-stadskanaal-rail'
    },
    {
        id: 'paddenstoelenfestival-ennemaborg-2026',
        date: '2026-10-18',
        startTime: '11:00',
        endTime: '17:00',
        kidFriendly: true,
        free: true,
        title: { en: 'Mushroom Festival at Ennemaborg', nl: 'Paddenstoelenfestival bij de Ennemaborg' },
        location: { en: 'Landgoed Ennemaborg, Midwolda', nl: 'Landgoed Ennemaborg, Midwolda' },
        tip: { en: 'More than 250 kinds of mushroom are spotted on the Ennemaborg estate every year, and for one day Het Groninger Landschap turns it into a festival for families with children aged 4 to 12. Explore the woods on your own and join activities like dissecting owl pellets or baking your own bread. Entry is free; a €3.50 stamp card covers the bread, a lemonade and a spin on the prize wheel. Sign up in advance.', nl: 'Op landgoed Ennemaborg worden elk jaar meer dan 250 soorten paddenstoelen gespot, en één dag lang maakt Het Groninger Landschap er een festival van voor gezinnen met kinderen van 4 t/m 12 jaar. Verken zelf het bos en doe mee aan activiteiten zoals braakballen uitpluizen of je eigen brood bakken. De toegang is gratis; met een stempelkaart van €3,50 bak je een broodje, haal je limonade en draai je aan het Rad van Fortuin. Meld je vooraf aan.' },
        url: 'https://www.visitgroningen.nl/nl/doen/uitgaan/2394352863/paddenstoelenfestival-2'
    },
    {
        id: 'celtic-folk-halloween-2026',
        date: '2026-10-31',
        // The organiser's page: 17:00 doors and dinner, Baked Beans 19:00, Rapalje
        // 20:30, Scrum 22:15. It gives no end time, so 23:30 is Visit Groningen's.
        startTime: '17:00',
        endTime: '23:30',
        title: { en: 'Celtic Folk Festival: Halloween Edition', nl: 'Celtic Folk Festival: Halloween Edition' },
        location: { en: 'EM2, Suikerlaan 6', nl: 'EM2, Suikerlaan 6' },
        tip: { en: 'For one night EM2 turns into a spooky venue: you walk through a spook tunnel to get in, then find a well-stocked bar, pizza, creepy decorations and live music from Baked Beans, Rapalje and Scrum. Doors open at 17:00 with dinner together (not included), Baked Beans start at 19:00, Rapalje play at 20:30 and Scrum at 22:15. Costumes are encouraged but not required. Tickets are €27.50, and when it is full, it is full.', nl: 'EM2 verandert voor één avond in een griezelige plek: je loopt eerst door een spooktunnel naar binnen, en daar wachten een goed gevulde bar, pizza\'s, griezelige decoraties en livemuziek van Baked Beans, Rapalje en Scrum. De deuren gaan om 17:00 open met een gezamenlijk diner (niet inbegrepen), Baked Beans beginnen om 19:00, Rapalje speelt om 20:30 en Scrum om 22:15. Verkleden hoeft niet, maar wordt aangemoedigd. Kaarten kosten €27,50, en vol = vol.' },
        url: 'https://celticfolkfestival.com/'
    },
    {
        id: 'halloween-horror-marathon-2026',
        date: '2026-10-31',
        endDate: '2026-11-01',
        // An overnight run: 18:30 on the 31st until 02:05 on the 1st. 23:59 keeps
        // the first night's last minute inside its own day.
        hours: {
            '2026-10-31': ['18:30', '23:59'],
            '2026-11-01': ['00:00', '02:05']
        },
        title: { en: 'Halloween Horror Marathon', nl: 'Halloween Horror Marathon' },
        location: { en: 'Forum Groningen', nl: 'Forum Groningen' },
        tip: { en: 'An all-night horror marathon at Forum, running from 18:30 until 02:05 with two breaks and hot dogs, meat and vegetarian, to go with the beer. The programme is Victorian Psycho, The Texas Chain Saw Massacre (50th anniversary), Colony and The Cycle, which the page bills as three previews of brand-new horror films plus the mother of all horror classics. The whole marathon is English friendly, so no Dutch is needed. Tickets are listed at €40.', nl: 'Een horrormarathon van 18:30 tot 02:05 in Forum, met twee pauzes en hotdogs (vlees en vega) bij het bier. Op het programma staan Victorian Psycho, The Texas Chain Saw Massacre (50e verjaardag), Colony en The Cycle: volgens de pagina drie voorpremières van gloednieuwe horrorfilms plus de moeder aller horrorklassiekers. De hele marathon is English friendly, dus ook te volgen zonder Nederlands. Kaarten staan op €40.' },
        url: 'https://forum.nl/nl/agenda/film/halloween-horror-marathon'
    },
    {
        id: 'ghostbusters-halloween-experience-2026',
        date: '2026-10-31',
        // Only the start is published; the film at 20:15 has no end time.
        startTime: '15:00',
        title: { en: 'Ghostbusters Halloween Experience', nl: 'Ghostbusters Halloween Experience' },
        location: { en: 'Stadsschouwburg (SPOT) and the Grote Markt', nl: 'Stadsschouwburg (SPOT) en de Grote Markt' },
        tip: { en: 'A Halloween flashmob built around the original Ghostbusters. There is a dance workshop with professional dancers in the Stadsschouwburg from 15:00, then at 18:00 you dance on the Grote Markt and through the centre alongside ghosts, witches, zombies and Ghostbusters, and at 20:15 everyone watches the film together. No dance experience is needed: after signing up you get a practice video. The break from 17:00 to 18:00 is bring-your-own dinner. A ticket for the dance and the film is €7.50, and you can come for the film only for €6.', nl: 'Een Halloween-flashmob rond de originele Ghostbusters. Vanaf 15:00 is er een dansworkshop met professionele dansers in de Stadsschouwburg, om 18:00 dans je op de Grote Markt en door de binnenstad tussen spoken, heksen, zombies en Ghostbusters, en om 20:15 kijkt iedereen samen de film. Danservaring is niet nodig: na je aanmelding krijg je een instructievideo om thuis te oefenen. De pauze van 17:00 tot 18:00 is bring your own diner. Een ticket voor dans en film kost €7,50; alleen voor de film komen kan ook, voor €6.' },
        url: 'https://tickets.spotgroningen.nl/mtTicket/performance?id=110038'
    },
    {
        id: 'halloweenfeest-wonderwereld-2026',
        date: '2026-10-31',
        startTime: '13:00',
        endTime: '16:00',
        // Not `free`: children get in free, adults pay €11 unless dressed as a creep.
        kidFriendly: true,
        title: { en: 'Halloween Party at Wonderwereld', nl: 'Halloweenfeest in Wonderwereld' },
        location: { en: 'Wonderwereld, Ruiten A Kanaal Noord 1, Ter Apel', nl: 'Wonderwereld, Ruiten A Kanaal Noord 1, Ter Apel' },
        tip: { en: 'For one afternoon Wonderwereld in Ter Apel goes fully Halloween, with a scavenger hunt, Halloween crafts and a contest at 15:30 for the biggest and funniest creep. It is meant for children aged 4 to 12 and you do not need to book. Children get in free and adults pay €11, unless they come dressed as a creepy figure, in which case they get in free too. It is part of Oktober Kindermaand, when children can join in on activities across the province for free.', nl: 'Een middag lang staat Wonderwereld in Ter Apel helemaal in het teken van Halloween, met een speurtocht, Halloween knutselen en om 15:30 de verkiezing van de grootste en leukste griezel. Het is bedoeld voor kinderen van 4 tot 12 jaar en reserveren is niet nodig. Kinderen mogen gratis naar binnen en volwassenen betalen €11, behalve als ze verkleed als griezelfiguur komen: dan mogen ze ook gratis naar binnen. Het is onderdeel van Oktober Kindermaand, de maand waarin kinderen gratis kunnen meedoen aan activiteiten in de hele provincie.' },
        url: 'https://www.kindermaand.nl/activiteiten/halloweenfeest'
    },
    {
        id: 'google-family-stem-day-2026',
        date: '2026-10-31',
        startTime: '10:30',
        endTime: '16:00',
        kidFriendly: true,
        free: true,
        title: { en: 'Google Family STEM Day (Halloween edition)', nl: 'Google Family STEM Day (Halloween-editie)' },
        location: { en: 'Academiegebouw (University of Groningen), Broerstraat 5', nl: 'Academiegebouw (Rijksuniversiteit Groningen), Broerstraat 5' },
        tip: { en: 'Google runs a free hands-on STEM day at the Academiegebouw for children aged 8 to 12 (groups 5 to 8) and their families, together with NEMO Science Museum, Mad Science and Young Engineers Groningen. Children learn to program robots and try science experiments, there is a costume contest for the best Halloween outfit, and lunch is included. Registration is required and places are limited, so sign up through the registration page before you plan around it.', nl: 'Google organiseert samen met NEMO Science Museum, Mad Science en Young Engineers Groningen een gratis, interactieve STEM-dag in het Academiegebouw voor kinderen van 8 tot 12 jaar (groep 5 tot en met 8) en hun gezinnen. Kinderen leren programmeren met robots en doen wetenschappelijke proefjes, er is een kostuumwedstrijd voor de best verklede deelnemer en de lunch is inbegrepen. Aanmelden is verplicht en het aantal plekken is beperkt, dus meld je aan via de aanmeldpagina voordat je er plannen omheen maakt.' },
        url: 'https://rsvp.withgoogle.com/events/google-family-stem-day_2b81c7'
    },
    {
        id: 'spooktocht-zeerijp-2026',
        date: '2026-11-13',
        endDate: '2026-11-14',
        title: { en: 'Ghost walks in Zeerijp (Spooktocht Zeerijp)', nl: 'Spooktocht Zeerijp' },
        location: { en: 'Zeerijp village hall (Dorpshuis), Borgweg 9', nl: 'Dorpshuis Zeerijp, Borgweg 9' },
        tip: { en: 'The ghost walks of Zeerijp have grown into an institution in the north, with more than 1,100 people from far and wide taking part. You walk an evening route through and around the village in groups of about ten that are put together for you, with actors along the way to give you a fright. They have been fully booked for years in a row, so if you want in, sign up through the form on the organisers\' website as soon as you can, or join as a volunteer, which is also possible. You choose a start slot when you sign up. Tickets are €12.50 (€10 up to age 12), paid at the village hall when you arrive, and you should be there 15 minutes before your start. Everyone must be 12 or older, or come with someone aged 18 or over.', nl: 'De spooktochten van Zeerijp zijn een begrip geworden in het noorden, met ruim 1100 deelnemers die van heinde en verre komen. Je loopt in de avond in vooraf ingedeelde groepen van ongeveer tien personen een route door en rond het dorp, met onderweg acts die zorgen voor spanning en schrikeffecten. Ze zijn al jaren op rij volgeboekt, dus wil je erbij zijn, meld je dan zo snel mogelijk aan via het inschrijfformulier op de website van de organisatie. Meedoen als vrijwilliger kan ook. Je kiest bij het inschrijven een starttijd. Een kaartje kost €12,50 (€10 t/m 12 jaar), te betalen bij binnenkomst in het dorpshuis, en je moet er 15 minuten voor je start zijn. Deelnemers zijn 12 jaar of ouder, of komen met iemand van 18 jaar of ouder.' },
        url: 'https://spooktochtzeerijp.nl/'
    },
    {
        id: 'microscopiedag-hortus-haren-2026',
        date: '2026-11-14',
        startTime: '12:00',
        endTime: '15:30',
        kidFriendly: true,
        title: { en: 'Microscopy Day at the Hortus (Mini-natuur uitvergroot)', nl: 'Mini-natuur uitvergroot in de Hortus (Microscopiedag)' },
        location: { en: 'Hortus Botanicus Haren, Kerklaan 34, Haren', nl: 'Hortus Botanicus Haren, Kerklaan 34, Haren' },
        tip: { en: 'Once a year dozens of places across Groningen and Drenthe set up microscopes for anyone who wants to look, and the Hortus in Haren joins in for the fourth year running. In the Plantage from 12:00 to 15:30 you can peer at tiny mushrooms, wafer-thin slices of a leaf and all kinds of sand, bring something small from home, or go on a mini expedition through the garden to collect your own specimen. Adults pay the normal garden entry; children up to 17 get in free. The Reitdiep visitor centre on the Wolddijk takes part the same afternoon, 14:00 to 16:00, and that one is free for everyone.', nl: 'Eén keer per jaar staan er op tientallen plekken in Groningen en Drenthe microscopen klaar voor iedereen die wil kijken, en de Hortus in Haren doet voor het vierde jaar op rij mee. In de Plantage kun je van 12.00 tot 15.30 uur minipaddenstoelen, flinterdunne plakjes boomblad en allerlei soorten zand bekijken, iets kleins van thuis meenemen, of op mini-expeditie door de tuin om zelf iets te verzamelen. Volwassenen betalen de gewone entree; kinderen tot en met 17 jaar mogen gratis naar binnen. Bezoekerscentrum Reitdiep aan de Wolddijk doet dezelfde middag mee, van 14.00 tot 16.00 uur, en daar is het voor iedereen gratis.' },
        url: 'https://www.hortusharen.nl/agenda/mini-natuur-uitvergroot-in-de-hortus/'
    },
    {
        id: 'sinterklaasintocht-groningen-2026',
        date: '2026-11-14',
        // Date, 13:00 - 15:30, "Gratis" and the parade route were read off the
        // organiser's page (volksvermakengroningen.nl) by the repo owner on
        // 9 November 2026; the intermediate times in the tip (boat 13:00,
        // Zuiderhaven 13:30, parade 14:10, Grote Markt 15:00, children's
        // programme 14:30 - 15:30) come from search snippets of the same page.
        startTime: '13:00',
        endTime: '15:30',
        kidFriendly: true,
        free: true,
        title: { en: 'Sinterklaas arrives in Groningen (Sinterklaasintocht)', nl: 'Intocht van Sinterklaas in Stad' },
        location: { en: 'Zuiderhaven and Praediniussingel through the city centre to the Grote Markt', nl: 'Zuiderhaven en Praediniussingel door de binnenstad naar de Grote Markt' },
        tip: { en: 'The Dutch winter really starts when Sinterklaas sails in, and in Groningen that has been organised by the Koninklijke Vereeniging voor Volksvermaken since 1947. The steamboat comes up the Reitdiep at 13:00 and is received at the Zuiderhaven around 13:30; the parade on horseback leaves the Praediniussingel at 14:10 and reaches the Grote Markt at 15:00, where the mayor welcomes him from the steps of the Stadhuis. The route runs via the Museumbrug, Westerhaven, Astraat, Brugstraat and Gedempte Zuiderdiep to the Grote Markt, then loops through the Oude Ebbingestraat, Oude Boteringestraat, Broerstraat and Zwanestraat back to the Grote Markt. There is a children\'s programme on the Grote Markt from 14:30 to 15:30. Free, and busy: find a spot along the route early. If you are new to the country, this is the afternoon the pepernoten start making sense.', nl: 'De Nederlandse winter begint pas echt als Sinterklaas aankomt, en in Groningen regelt de Koninklijke Vereeniging voor Volksvermaken dat al sinds 1947. De stoomboot komt om 13.00 uur over het Reitdiep binnen en wordt rond 13.30 uur ontvangen in de Zuiderhaven; de optocht te paard vertrekt om 14.10 uur vanaf de Praediniussingel en komt om 15.00 uur aan op de Grote Markt, waar de burgemeester hem verwelkomt vanaf de trappen van het Stadhuis. De route gaat via de Museumbrug, Westerhaven, Astraat, Brugstraat en het Gedempte Zuiderdiep naar de Grote Markt, en maakt daarna een lus door de Oude Ebbingestraat, Oude Boteringestraat, Broerstraat en Zwanestraat terug naar de Grote Markt. Van 14.30 tot 15.30 uur is er een kinderprogramma op de Grote Markt. Gratis, en druk: zoek op tijd een plekje langs de route. Ben je nieuw in Nederland, dan is dit de middag waarop de pepernoten ineens logisch worden.' },
        url: 'https://volksvermakengroningen.nl/evenementen/intocht-sinterklaas/'
    },
    {
        id: 'museumnacht-westerwolde-2026',
        date: '2026-11-14',
        // The organiser says 19.00 - 24.00; 23:59 keeps the last minute inside
        // the same day. Read on www.museumnachtwesterwolde.nl's public WordPress
        // API on 9 November 2026 (the apex is refused by the egress proxy).
        startTime: '19:00',
        endTime: '23:59',
        title: { en: 'Museum Night Westerwolde', nl: 'Museumnacht Westerwolde' },
        location: { en: 'Vesting Bourtange and six other museums in Westerwolde', nl: 'Vesting Bourtange en zes andere musea in Westerwolde' },
        tip: { en: 'Westerwolde is one of the few places in the Netherlands where it still gets properly dark, and for one night the seven museums in the municipality lean into that: Vesting Bourtange, Kamp de Beetse, Museum Klooster Ter Apel, Vestingmuseum Oudeschans, Het Dinosaurium, Burcht Wedde and Het MOW in Bellingwolde all open from 19:00 to midnight with their own programme of stories, music and light, for the second edition. Go on your own with a passe-partout (€12.50, bought online, you get a wristband at your first museum) or single tickets at the door (prices vary; Bourtange is €8, children up to 11 €5), or book the night bus (€22.50): two oldtimer buses, each with its own route, programme and stories told along the way, both leaving at 19:00 from the Vesting Bourtange car park, so bus passengers start there. The night mayor, singer Wim van der Kuip, tours all seven with a song written for the occasion. Bring a torch and warm clothes, and plan the drive: this is the far south-east of the province.', nl: 'Westerwolde is een van de weinige plekken in Nederland waar het nog echt donker wordt, en één nacht per jaar spelen de zeven musea in de gemeente daarop in: Vesting Bourtange, Kamp de Beetse, Museum Klooster Ter Apel, Vestingmuseum Oudeschans, Het Dinosaurium, Burcht Wedde en Het MOW in Bellingwolde zijn van 19.00 tot 24.00 uur open met elk een eigen programma van verhalen, muziek en licht, voor de tweede editie. Ga op eigen gelegenheid met een passe-partout (€12,50, vooraf online, bij je eerste museum krijg je een polsbandje) of met losse kaartjes aan de deur (de prijs verschilt per museum; Bourtange vraagt €8, kinderen t/m 11 jaar €5), of boek de Nachtbus (€22,50): twee oldtimerbussen met elk een eigen route, programma en verhalen onderweg, die allebei om 19.00 uur vertrekken vanaf de parkeerplaats van Vesting Bourtange, dus busreizigers beginnen daar. Nachtburgemeester Wim van der Kuip toert met een speciaal geschreven lied langs alle zeven. Neem een zaklamp en warme kleren mee en plan de rit: dit is het uiterste zuidoosten van de provincie.' },
        url: 'https://museumnachtwesterwolde.nl/'
    },
    {
        id: 'jonge-harten-2026',
        date: '2026-11-14',
        endDate: '2026-11-21',
        // Per jongeharten.nl: the Festivalhart (Bloemstraat 38) opens 15:00 daily
        // and closes 01:00 on Friday and Saturday, 00:00 the other days; 23:59
        // keeps each day's last minute inside the same day, as for Winterstad.
        // The programme starts earlier on two days (a 14:30 showing on the 14th,
        // a 14:00 talk on the 21st), which `hours` carries for those days.
        startTime: '15:00',
        endTime: '23:59',
        hours: {
            '2026-11-14': ['14:30', '23:59'],
            '2026-11-21': ['14:00', '23:59']
        },
        title: { en: 'Jonge Harten Festival (theatre for young people)', nl: 'Jonge Harten Festival' },
        location: { en: 'Festival heart at Bloemstraat 38; shows at the Stadsschouwburg, Grand Theatre, De Kunstwerf and Studio X', nl: 'Festivalhart aan de Bloemstraat 38; voorstellingen in de Stadsschouwburg, het Grand Theatre, De Kunstwerf en Studio X' },
        tip: { en: 'Eight days of theatre, performance, dance and workshops made for and often by young people, one of the festivals Groningen is known for in the Dutch theatre world. The idea is that theatre makers, not politicians or multinationals, set the agenda for the future, and that you cannot shape a future without the people who will live in it; this year\'s theme is "Practice the Possible". The festival heart at Bloemstraat 38 is free to walk into and open from 15:00 every day, until 01:00 on Friday and Saturday and midnight otherwise, with live music, a daily live podcast, an opening party on the 14th and the box office (17:00 to 23:00). The shows themselves play at the Stadsschouwburg, the Grand Theatre, De Kunstwerf and Studio X and are ticketed, nearly all with a youth price up to age 29; under-29s can also buy a passe-partout for unlimited shows, and a second youth ticket is half price. The programme marks each show\'s language, so look for the ones that work without Dutch.', nl: 'Acht dagen theater, performance, dans en workshops voor en vaak door jongeren, een van de festivals waar Groningen in theaterland om bekendstaat. Het idee: op Jonge Harten bepalen theatermakers de agenda, niet politici of multinationals, en de toekomst vormgeven zonder jongeren kan niet; het thema van dit jaar is "Practice the Possible". Het Festivalhart aan de Bloemstraat 38 is gratis toegankelijk en elke dag open vanaf 15.00 uur, op vrijdag en zaterdag tot 01.00 uur en anders tot middernacht, met livemuziek, dagelijks een live-podcast, een openingsfeest op de 14e en de kassa (17.00 tot 23.00 uur). De voorstellingen zelf spelen in de Stadsschouwburg, het Grand Theatre, De Kunstwerf en Studio X en zijn met kaartje, bijna allemaal met een jongerenprijs t/m 29 jaar; wie jonger is dan 29 kan ook een passe-partout kopen voor onbeperkt voorstellingen, en het tweede jongerenkaartje is voor de helft. Het programma geeft per voorstelling de taal aan, dus zoek de voorstellingen die ook zonder Nederlands te volgen zijn.' },
        url: 'https://www.jongeharten.nl'
    },
    {
        id: 'cinema-culinair-groningen-2026',
        date: '2026-11-19',
        endDate: '2026-11-22',
        // Two entries, one per block of show days, because the Groningen run has
        // no shows on 23, 24 and 25 November and a single span would show it as
        // happening on those days (the same reason the STAR train days are
        // separate entries). No startTime/endTime: the organiser publishes only
        // start times, which differ per show (brunch 11:30, early dinner 17:00,
        // dinner 18:00). Dates and shows read on 9 November 2026 from the
        // organiser's Agenda Groningen page through www.cinemaculinair.nl's
        // public WordPress API (its HTML is Cloudflare-gated and the apex is
        // refused by the egress proxy); the prices are the Visit Groningen
        // listing's, as the organiser keeps them in its ticket shop.
        title: { en: 'Cinema Culinair: eat what the film eats', nl: 'Cinema Culinair' },
        location: { en: 'Mediacentrale, Helperpark 272-298', nl: 'Mediacentrale, Helperpark 272-298' },
        tip: { en: 'A film where every dish the characters eat is served to you at the same second it appears on screen: "what you see is what you eat". After a sold-out first run, Cinema Culinair is back in the industrial Mediacentrale for ten shows over two long weekends. This first block: Chef with dinner on Thursday 19, Friday 20 and Saturday 21 November at 18:00, Chocolat with brunch on Saturday 21 at 11:30, and Julie & Julia with an early dinner on Sunday 22 at 17:00. Tickets are sold online only, with a €1.50 service fee each; the listing puts adult tickets at roughly €71 to €100 depending on the film and children\'s tickets from about €40. Because the dishes are timed to the film, the menu cannot be adapted for allergies, but you can pick the vegetarian or vegan version at checkout, and you can rebook once, free, up to three days before. Several shows are already sold out with a waiting list, so book early, and go hungry.', nl: 'Een film waarbij elk gerecht dat de personages eten op precies hetzelfde moment bij jou op tafel staat: "what you see is what you eat". Na een uitverkochte eerste editie strijkt Cinema Culinair opnieuw neer in de industriële Mediacentrale, met tien voorstellingen verdeeld over twee lange weekenden. Dit eerste blok: Chef met diner op donderdag 19, vrijdag 20 en zaterdag 21 november om 18.00 uur, Chocolat met brunch op zaterdag 21 om 11.30 uur en Julie & Julia met een early diner op zondag 22 om 17.00 uur. Kaarten zijn alleen online te koop, met €1,50 servicekosten per stuk; volgens de agenda kost een kaartje voor volwassenen zo\'n €71 tot €100, afhankelijk van de film, voor kinderen vanaf ongeveer €40. Omdat de gerechten op de film getimed zijn kan het menu niet worden aangepast voor allergieën, maar bij het afrekenen kies je wel de vegetarische of vegan variant, en tot drie dagen van tevoren kun je één keer gratis omboeken. Een aantal voorstellingen is al uitverkocht met wachtlijst, dus boek op tijd, en kom met honger.' },
        url: 'https://cinemaculinair.nl/agenda/groningen/'
    },
    {
        id: 'cinema-culinair-groningen-2026-11-26',
        date: '2026-11-26',
        endDate: '2026-11-29',
        // Second block of the same run; see the entry above for the sourcing.
        title: { en: 'Cinema Culinair: eat what the film eats', nl: 'Cinema Culinair' },
        location: { en: 'Mediacentrale, Helperpark 272-298', nl: 'Mediacentrale, Helperpark 272-298' },
        tip: { en: 'A film where every dish the characters eat is served to you at the same second it appears on screen: "what you see is what you eat". After a sold-out first run, Cinema Culinair is back in the industrial Mediacentrale for ten shows over two long weekends. This second block: Grease with dinner on Thursday 26 November at 18:00, The Menu with dinner on Friday 27 at 18:00, Ratatouille with brunch on Saturday 28 at 11:30 and with dinner at 18:00, and Ratatouille with an early dinner on Sunday 29 at 17:00. Tickets are sold online only, with a €1.50 service fee each; the listing puts adult tickets at roughly €71 to €100 depending on the film and children\'s tickets from about €40. Because the dishes are timed to the film, the menu cannot be adapted for allergies, but you can pick the vegetarian or vegan version at checkout, and you can rebook once, free, up to three days before. Several shows are already sold out with a waiting list, so book early, and go hungry.', nl: 'Een film waarbij elk gerecht dat de personages eten op precies hetzelfde moment bij jou op tafel staat: "what you see is what you eat". Na een uitverkochte eerste editie strijkt Cinema Culinair opnieuw neer in de industriële Mediacentrale, met tien voorstellingen verdeeld over twee lange weekenden. Dit tweede blok: Grease met diner op donderdag 26 november om 18.00 uur, The Menu met diner op vrijdag 27 om 18.00 uur, Ratatouille met brunch op zaterdag 28 om 11.30 uur en met diner om 18.00 uur, en Ratatouille met een early diner op zondag 29 om 17.00 uur. Kaarten zijn alleen online te koop, met €1,50 servicekosten per stuk; volgens de agenda kost een kaartje voor volwassenen zo\'n €71 tot €100, afhankelijk van de film, voor kinderen vanaf ongeveer €40. Omdat de gerechten op de film getimed zijn kan het menu niet worden aangepast voor allergieën, maar bij het afrekenen kies je wel de vegetarische of vegan variant, en tot drie dagen van tevoren kun je één keer gratis omboeken. Een aantal voorstellingen is al uitverkocht met wachtlijst, dus boek op tijd, en kom met honger.' },
        url: 'https://cinemaculinair.nl/agenda/groningen/'
    },
    {
        id: 'whisky-festival-groningen-2026',
        date: '2026-11-27',
        endDate: '2026-11-28',
        // Per www.whiskyfestivalgroningen.nl (read 9 November 2026): Friday has
        // one evening session (19:00 - 22:30), Saturday an afternoon session
        // (13:00 - 16:30) and an evening one (19:00 - 22:30), each preceded by
        // a separately ticketed tasting in the sacristy an hour earlier (18:00,
        // 12:00, 18:00). Each day's window runs from its first tasting to its
        // last session's end, so Saturday's includes the gap between sessions.
        hours: {
            '2026-11-27': ['18:00', '22:30'],
            '2026-11-28': ['12:00', '22:30']
        },
        title: { en: 'Whisky Festival Groningen', nl: 'Whisky Festival Groningen' },
        location: { en: 'Akerk (Der Aa-kerk), Akerkhof 2', nl: 'Akerk (Der Aa-kerk), Akerkhof 2' },
        tip: { en: 'A medieval church full of whisky: more than 30 stands from distilleries, importers and independent bottlers, over 2,000 whiskies to taste (plus some rum and cognac), and brand ambassadors from home and abroad to talk you through them. There are three sessions: Friday evening 19:00 to 22:30, Saturday afternoon 13:00 to 16:30 and Saturday evening 19:00 to 22:30, each with a separately ticketed small-group tasting in the sacristy an hour before the doors open and another an hour after. It is pitched at curious beginners as much as at collectors, so you do not need to know your Islay from your Speyside. Tickets are sold per session through the organiser\'s site; the rarer pours cost festival tokens (€1.25 each, at the till or ordered online beforehand), there is food inside, a €1 cloakroom and water points to rinse your glass. Strictly 18 and over. Leave the bike at home.', nl: 'Een middeleeuwse kerk vol whisky: ruim 30 stands van distilleerderijen, importeurs en onafhankelijke bottelaars, meer dan 2.000 whisky\'s om te proeven (en wat rum en cognac), en brand ambassadors uit binnen- en buitenland die je erdoorheen praten. Er zijn drie sessies: vrijdagavond 19.00 tot 22.30 uur, zaterdagmiddag 13.00 tot 16.30 uur en zaterdagavond 19.00 tot 22.30 uur, elk met een apart te boeken proeverij in kleine groep in de sacristie, een uur voor de deuren opengaan en nog een een uur erna. Het is net zo goed bedoeld voor nieuwsgierige beginners als voor kenners, dus je hoeft Islay en Speyside niet uit elkaar te houden. Kaarten gaan per sessie via de site van de organisatie; voor de bijzondere drams betaal je met festivalmunten (€1,25 per stuk, aan de kassa of vooraf online), er is eten binnen, een garderobe voor €1 en er zijn waterpunten om je glas te spoelen. Strikt 18+. Laat de fiets thuis.' },
        url: 'https://www.whiskyfestivalgroningen.nl'
    },
    {
        id: 'survivalrun-groningen-2026',
        date: '2026-11-29',
        // 09:00 is the first published start (the kids run, per the organiser's
        // start-times post); the organiser gives no end time, so 16:00 is the
        // Visit Groningen listing's.
        startTime: '09:00',
        endTime: '16:00',
        title: { en: 'Survivalrun Groningen (obstacle trail run)', nl: 'Survivalrun Groningen' },
        location: { en: 'ACLO sports centre, Blauwborgje 16, Zernike campus', nl: 'ACLO Sportcentrum, Blauwborgje 16, Zernike' },
        tip: { en: 'Survivalrun is a Dutch outdoor sport that mixes trail running with obstacles, and the 13th Groningen edition sends you round a mostly unpaved course on and around the Zernike campus, with the start and finish on the south side of the ACLO sports centre. There is a distance for almost everyone: competition classes, an 8.5 km and a 5 km recreational run (solo, in pairs or as a team), a youth class for ages 8 to 14, a parent-and-child run from age 8 and a 2 km mini run from age 6, and this year the Dutch student championship is held here too. Starts run from the kids run at 09:00 to the parent-and-child run at 13:20. It is heavier than an obstacle run: you hand in your wristband at any obstacle you fail, and the organisers expect some technique (monkey hang, cat crawl, swing-over), with training evenings on Wednesdays and Thursdays if you want to learn. Register in advance on the organiser\'s site; the listing gives the fee as €27.50. Spectators are explicitly welcome: follow the runners by bike along the marked route, and the start-finish area and the survival track at De Bunders are where most obstacles are in view.', nl: 'Survivalrun is een echte Nederlandse buitensport die hardlopen combineert met hindernissen, en de 13e Groningse editie stuurt je over een grotendeels onverhard parcours op en rond de Zernike Campus, met start en finish aan de zuidkant van sportcentrum ACLO. Er is voor bijna iedereen een afstand: wedstrijdklassen, een recreantenrun van 8,5 en van 5 km (alleen, als koppel of als team), een jeugdklasse van 8 tot 14 jaar, een ouder-kindrun vanaf 8 jaar en een minirun van 2 km vanaf 6 jaar, en dit jaar wordt hier ook het Nederlands Studenten Kampioenschap gehouden. De starts lopen van de kidsrun om 9.00 uur tot de ouder-kindrun om 13.20 uur. Het is zwaarder dan een obstacle run: bij elke hindernis die je niet haalt lever je je polsbandje in, en de organisatie verwacht enige techniek (apenhang, catcrawl, swingover); op woensdag- en donderdagavond kun je meetrainen om het te leren. Inschrijven doe je vooraf via de site van de organisatie; volgens de agenda kost het €27,50. Toeschouwers zijn uitdrukkelijk welkom: volg de lopers per fiets langs de uitgezette route, en bij het start-finishterrein en de survivalbaan aan De Bunders zie je de meeste hindernissen tegelijk.' },
        url: 'https://survivalrungroningen.nl/'
    }
];

const MILESTONES = [
    { threshold: 0, title: { en: 'Newcomer', nl: 'Nieuwkomer' } },
    { threshold: 5, title: { en: 'Stadjer in Training', nl: 'Stadjer in Opleiding' } },
    { threshold: 12, title: { en: 'Halfway Stadjer', nl: 'Halverwege Stadjer' } },
    { threshold: 19, title: { en: 'Local Expert', nl: 'Lokale Expert' } },
    // Derived so the top tier always means "every item done" — adding a BUCKET_LIST
    // item must never silently leave this badge unreachable.
    { threshold: BUCKET_LIST.length, title: { en: 'Real Groninger', nl: 'Echte Groninger' } }
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
        memoryPlaceholder: 'How was it? What do you want to remember?',
        memoryHintGuest: 'Notes stay in this browser. If you sign in, they are saved to your account on our servers.',
        memoryHintSignedIn: 'Notes are saved to your account on our servers, so they sync across your devices.',
        markComplete: 'Mark as Complete',
        completedSection: 'Completed',
        remainingCount: '{count} left',
        allDone: 'all done',
        saveNote: 'Save Note',
        markNotDone: 'Mark as not done',
        yourJourney: 'Your Journey',
        shareMilestone: 'Share Milestone',
        completedMemories: 'Completed Memories',
        recentMemories: 'Recent Memories',
        seeAllMemories: 'See all memories ({count})',
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
        viewEvents: 'Events',
        viewMemories: 'Memories',
        viewDetails: 'View Details',
        eventsHappeningNow: 'Happening now',
        eventsKidFriendly: 'Kid-friendly',
        eventsFilterKids: 'Kids',
        eventsFilterFree: 'Free',
        eventsFilterHoliday: 'Holiday',
        eventsFilterEmpty: 'No events match these filters right now. Try clearing one.',
        eventsMoreInfo: 'More info',
        eventsEmpty: 'Nothing on the calendar right now. Check back soon — the Groningen year fills up fast.',
        eventsCoverage: 'Events shown through {through}',
        eventsCheckIn: "I'm here 📍",
        eventsCheckInBusy: 'Checking…',
        eventsCheckInDone: 'You were there ✓',
        eventsCheckInEarnedOn: 'Earned {date}',
        eventsCheckInHint: 'Checks your location once to confirm you made it. The coordinates stay on your device — only the badge is saved.',
        eventsCheckInTooFar: 'That does not look like the event yet. Try again once you are there.',
        eventsCheckInImprecise: "Your location is not precise enough to confirm. Usually your browser app only has approximate location — that is a permission in your phone's settings, not on this page.",
        eventsCheckInDenied: 'No location, no badge — a fair trade, and nothing else changes.',
        eventsCheckInUnavailable: 'Your device could not work out a location just now.',
        eventsCheckInTimeout: 'That took too long. Outdoors it is usually quicker — try again.',
        eventsCheckInClosed: 'This event has finished, so the check-in has closed.',
        eventsCheckInSaveFailed: 'Your location checked out, but the badge could not be saved — this browser is blocking or out of storage. Private browsing usually does it.',
        eventsOngoing: 'Ongoing — go any time',
        eventsOngoingUntil: 'Until {date}',
        wordTag: 'Gronings word of the day',
        wordTagShort: 'Word of the day',
        wordPrompt: 'What does it mean?',
        wordCorrect: "Moi! That's right.",
        wordWrong: 'Not quite — {word} means "{meaning}".',
        wordExampleLabel: 'In a sentence',
        wordTomorrow: 'New word tomorrow. Try this one on a Stadjer today.',
        wordLearnedOne: '1 word learned',
        wordLearned: '{count} words learned',
        wordCollapse: "Put today's word away",
        wordExpand: "Show today's word again",
        wordVerdictRight: 'right',
        wordVerdictWrong: 'wrong',
        wordSettingShow: 'Show',
        wordSettingHide: 'Hide',
        wordNudge: 'Sign in to keep your bucket list progress and memories on every device.',
        courseLink: 'Free Dutch Course (UG) 🎓',
        signIn: 'Sign In',
        signOut: 'Sign Out',
        syncedAs: '☁️ Synced as {account}',
        accountNameFallback: 'User',
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
        achievementEventBadges: 'Event check-ins',
        badgeUnlockedTag: 'BADGE UNLOCKED! 🎉',
        unlockedTag: 'Unlocked ✓',
        settingsTitle: 'Settings',
        settingsSubtitle: 'Customize your app preferences.',
        themeAppearance: 'Appearance',
        themeLight: 'Light',
        themeDark: 'Dark',
        themeSystem: 'System',
        languageHeader: 'Language',
        footerPrivacy: 'Privacy Policy',
        accountHeader: 'Account',
        deleteAccountNotice: 'Deleting your account removes your cloud progress and notes for good.',
        exportDataBtn: 'Download my data',
        exportDataError: 'Could not load your data. Check your connection and try again.',
        exportDataUnsynced: 'Some recent changes have not reached the cloud yet, so this file may be missing them.',
        deleteAccountBtn: 'Delete my account & data',
        deleteModalTitle: 'Delete your account?',
        deleteModalWarning: 'This permanently deletes your account and every completed item and note stored in the cloud. It cannot be undone.',
        deleteModalLocalNote: 'Progress saved in this browser is cleared as well. Copies on other devices stay there until you clear that browser\'s site data.',
        cancel: 'Cancel',
        closeDialog: 'Close',
        signOutModalTitle: 'Sign out?',
        signOutModalWarning: "Progress saved in this browser will be cleared, and unsynced changes will be lost. You'll need to sign in again to restore your synced progress.",
        confirmSignOut: 'Yes, sign out',
        signOutError: 'Failed to sign out. Please try again.',
        confirmDelete: 'Yes, delete everything',
        deleting: 'Deleting…',
        deleteSuccess: "Your account, your cloud progress and notes, and the progress saved in this browser have been deleted. You're welcome back anytime. Moi, and thanks for using MoiCheck.",
        deleteNotConfigured: 'Account deletion is not configured on this installation; no data was removed. Please email us from the privacy policy page and we will delete your account manually.',
        deleteError: 'Could not complete the deletion. Your account is still active. Please try again or email us from the privacy policy page.'
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
        memoryPlaceholder: 'Hoe was het? Wat wil je onthouden?',
        memoryHintGuest: 'Notities blijven in deze browser. Als je inlogt, worden ze bij je account op onze servers opgeslagen.',
        memoryHintSignedIn: 'Notities worden bij je account op onze servers opgeslagen, zodat ze op al je apparaten beschikbaar zijn.',
        markComplete: 'Markeer als voltooid',
        completedSection: 'Voltooid',
        remainingCount: 'nog {count}',
        allDone: 'helemaal klaar',
        saveNote: 'Notitie opslaan',
        markNotDone: 'Markeer als niet gedaan',
        yourJourney: 'Jouw Reis',
        shareMilestone: 'Mijlpaal Delen',
        completedMemories: 'Voltooide Herinneringen',
        recentMemories: 'Recente Herinneringen',
        seeAllMemories: 'Alle herinneringen bekijken ({count})',
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
        viewEvents: 'Agenda',
        viewMemories: 'Herinneringen',
        viewDetails: 'Bekijk Details',
        eventsHappeningNow: 'Nu bezig',
        eventsKidFriendly: 'Kindvriendelijk',
        eventsFilterKids: 'Kinderen',
        eventsFilterFree: 'Gratis',
        eventsFilterHoliday: 'Feestdag',
        eventsFilterEmpty: 'Geen evenementen voldoen nu aan deze filters. Zet er één uit.',
        eventsMoreInfo: 'Meer info',
        eventsEmpty: 'Nog niets op de agenda. Kom snel weer terug — het Groningse jaar loopt snel vol.',
        eventsCoverage: 'Agenda toont evenementen tot en met {through}',
        eventsCheckIn: 'Ik ben hier 📍',
        eventsCheckInBusy: 'Controleren…',
        eventsCheckInDone: 'Je was erbij ✓',
        eventsCheckInEarnedOn: 'Behaald op {date}',
        eventsCheckInHint: 'Controleert je locatie één keer om te bevestigen dat je er bent. De coördinaten blijven op je apparaat — alleen de badge wordt opgeslagen.',
        eventsCheckInTooFar: 'Dit lijkt nog niet het evenement. Probeer het opnieuw als je er bent.',
        eventsCheckInImprecise: 'Je locatie is niet nauwkeurig genoeg om te bevestigen. Meestal heeft je browser-app alleen locatie bij benadering — dat is een toestemming in je telefooninstellingen, niet op deze pagina.',
        eventsCheckInDenied: 'Geen locatie, geen badge — een eerlijke ruil, en er verandert niets anders.',
        eventsCheckInUnavailable: 'Je apparaat kon nu geen locatie bepalen.',
        eventsCheckInTimeout: 'Dat duurde te lang. Buiten gaat het meestal sneller — probeer het opnieuw.',
        eventsCheckInClosed: 'Dit evenement is afgelopen, dus inchecken kan niet meer.',
        eventsCheckInSaveFailed: 'Je locatie klopte, maar de badge kon niet worden opgeslagen — deze browser blokkeert opslag of zit vol. Privénavigatie doet dit meestal.',
        eventsOngoing: 'Doorlopend — ga wanneer je wilt',
        eventsOngoingUntil: 'Tot en met {date}',
        wordTag: 'Gronings woord van de dag',
        wordTagShort: 'Woord van de dag',
        wordPrompt: 'Wat betekent het?',
        wordCorrect: 'Moi! Dat klopt.',
        wordWrong: 'Net niet — {word} betekent "{meaning}".',
        wordExampleLabel: 'In een zin',
        wordTomorrow: 'Morgen een nieuw woord. Probeer dit er vandaag uit op een Stadjer.',
        wordLearnedOne: '1 woord geleerd',
        wordLearned: '{count} woorden geleerd',
        wordCollapse: 'Woord van vandaag inklappen',
        wordExpand: 'Woord van vandaag weer tonen',
        wordVerdictRight: 'goed',
        wordVerdictWrong: 'fout',
        wordSettingShow: 'Tonen',
        wordSettingHide: 'Verbergen',
        wordNudge: 'Log in om je bucketlist-voortgang en herinneringen op al je apparaten te bewaren.',
        courseLink: 'Gratis Cursus Nederlands (RUG) 🎓',
        signIn: 'Inloggen',
        signOut: 'Uitloggen',
        syncedAs: '☁️ Gesynchroniseerd als {account}',
        accountNameFallback: 'Gebruiker',
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
        achievementEventBadges: 'Bij evenementen',
        badgeUnlockedTag: 'BADGE ONTGRENDELD! 🎉',
        unlockedTag: 'Ontgrendeld ✓',
        settingsTitle: 'Instellingen',
        settingsSubtitle: 'Pas je app-voorkeuren aan.',
        themeAppearance: 'Weergave',
        themeLight: 'Licht',
        themeDark: 'Donker',
        themeSystem: 'Systeem',
        languageHeader: 'Taal',
        footerPrivacy: 'Privacybeleid',
        accountHeader: 'Account',
        deleteAccountNotice: 'Als je je account verwijdert, worden je voortgang en notities in de cloud definitief gewist.',
        exportDataBtn: 'Download mijn gegevens',
        exportDataError: 'Je gegevens konden niet worden geladen. Controleer je verbinding en probeer het opnieuw.',
        exportDataUnsynced: 'Een paar recente wijzigingen staan nog niet in de cloud, dus ze kunnen in dit bestand ontbreken.',
        deleteAccountBtn: 'Verwijder mijn account & gegevens',
        deleteModalTitle: 'Je account verwijderen?',
        deleteModalWarning: 'Dit verwijdert je account en alle afgevinkte items en notities in de cloud permanent. Dit kan niet ongedaan worden gemaakt.',
        deleteModalLocalNote: 'Voortgang die in deze browser is opgeslagen wordt ook gewist. Kopieën op andere apparaten blijven staan totdat je daar de sitegegevens van de browser wist.',
        cancel: 'Annuleren',
        closeDialog: 'Sluiten',
        signOutModalTitle: 'Uitloggen?',
        signOutModalWarning: 'Voortgang die in deze browser is opgeslagen wordt gewist en niet-gesynchroniseerde wijzigingen gaan verloren. Je moet opnieuw inloggen om je gesynchroniseerde voortgang te herstellen.',
        confirmSignOut: 'Ja, uitloggen',
        signOutError: 'Uitloggen mislukt. Probeer het opnieuw.',
        confirmDelete: 'Ja, verwijder alles',
        deleting: 'Verwijderen…',
        deleteSuccess: 'Je account, je voortgang en notities in de cloud, en de voortgang in deze browser zijn verwijderd. Je bent altijd welkom terug. Moi, en bedankt voor het gebruiken van MoiCheck.',
        deleteNotConfigured: 'Accountverwijdering is op deze installatie nog niet beschikbaar, er is dus niets verwijderd. Mail ons via de privacybeleid-pagina en wij verwijderen je account handmatig.',
        deleteError: 'De verwijdering kon niet worden afgerond. Je account is nog actief. Probeer het opnieuw of mail ons via de privacybeleid-pagina.'
    }
};

// The languages the UI actually ships, derived from the translations above so a
// new locale needs no second edit here. Object.keys yields own enumerable keys
// only, so a stored value like 'constructor' can never pass as a language.
const ALLOWED_LANGS = Object.keys(UI_TRANSLATIONS);
