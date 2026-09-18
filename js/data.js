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
//   instead of the whole day. Leave both off rather than guessing a time.
const EVENTS = [
    {
        id: 'koningsdag',
        date: '2026-04-27',
        annual: true,
        // Moved to Saturday the 26th in years when the 27th is a Sunday, which is
        // the law rather than a local variation: 2031 and 2036 next, 2014 last.
        notOnSunday: true,
        title: { en: "King's Day", nl: 'Koningsdag' },
        location: { en: 'Across the city', nl: 'Door de hele stad' },
        tip: { en: 'The whole city turns orange and the vrijmarkt takes over the pavements, with half of Groningen selling the other half their old stuff. Wear something orange or you will feel underdressed.', nl: 'De hele stad kleurt oranje en de vrijmarkt neemt de stoepen over, waarbij half Groningen zijn oude spullen aan de andere helft verkoopt. Trek iets oranjes aan, anders voel je je ondergekleed.' }
    },
    {
        id: 'bevrijdingsdag',
        date: '2026-05-05',
        annual: true,
        title: { en: 'Liberation Day Festival', nl: 'Bevrijdingsfestival' },
        location: { en: 'Stadspark', nl: 'Stadspark' },
        tip: { en: 'A free open-air festival in the Stadspark marking the end of the occupation. Go for the afternoon: the line-up is genuinely good and nobody pays in.', nl: 'Een gratis openluchtfestival in het Stadspark dat het einde van de bezetting markeert. Ga in de middag: de line-up is echt goed en niemand betaalt entree.' },
        url: 'https://bevrijdingsfestivalgroningen.nl'
    },
    {
        id: 'bommen-berend',
        date: '2026-08-28',
        annual: true,
        title: { en: 'Bommen Berend (Gronings Ontzet)', nl: 'Bommen Berend (Gronings Ontzet)' },
        location: { en: 'City centre', nl: 'Binnenstad' },
        tip: { en: 'Groningen celebrates driving off the bishop of Munster in 1672, and has done every year since. This is the most Groninger day of the year: a city holiday nobody outside the province has heard of.', nl: 'Groningen viert dat het in 1672 de bisschop van Munster verjoeg, en doet dat sindsdien elk jaar. Dit is de meest Groningse dag van het jaar: een stadsfeest waar niemand buiten de provincie van heeft gehoord.' }
    },
    {
        id: 'sint-maarten',
        date: '2026-11-11',
        annual: true,
        title: { en: 'Sint Maarten', nl: 'Sint Maarten' },
        location: { en: 'Doorstep to doorstep', nl: 'Van deur tot deur' },
        tip: { en: 'Children go door to door after dark with paper lanterns, singing for sweets. In the north this is a proper institution rather than a curiosity, so buy candy in advance and answer the doorbell.', nl: 'Kinderen gaan na het donker met lampionnen langs de deuren en zingen voor snoep. In het noorden is dit een echt instituut en geen curiositeit, dus koop op tijd snoep en doe open.' }
    },
    {
        id: 'carbidschieten',
        date: '2026-12-31',
        annual: true,
        title: { en: 'Carbidschieten', nl: 'Carbidschieten' },
        location: { en: 'Villages around the province', nl: 'Dorpen in de provincie' },
        tip: { en: 'Milk churns, calcium carbide, and a very loud bang across the fields on New Year\'s Eve. A northern tradition you have to drive out of the city to see properly.', nl: 'Melkbussen, carbid en een enorme knal over het land op oudejaarsdag. Een noordelijke traditie waarvoor je de stad uit moet om het goed mee te maken.' }
    },
    {
        id: 'wijnwandeling-haren-2026',
        date: '2026-09-18',
        // Timed event: "Happening now" only shows between these hours, not for
        // the whole day. Wall-clock times in Groningen, HH:MM.
        startTime: '18:00',
        endTime: '21:00',
        title: { en: 'Wine Walk Haren', nl: 'Wijnwandeling Haren' },
        location: { en: 'Eemke van der Veenpad, Haren centre', nl: 'Eemke van der Veenpad, centrum Haren' },
        tip: { en: 'Runs 18:00–21:00: buy a glass at the Ervaar Haren food truck by the church, then walk between the shops and restaurants in Haren\'s centre tasting Spanish wines and snacks. It is the opening night of a new themed Friday series, not a standing yearly date, so this exact edition will not come back the same way next year.', nl: 'Van 18:00 tot 21:00 uur: koop een glas bij de foodtruck van Ervaar Haren voor de kerk en wandel langs de winkels en horeca in het centrum van Haren voor Spaanse wijnen en hapjes. Het is de aftrap van een nieuwe reeks thema-avonden, geen vaste jaarlijkse datum, dus deze editie komt volgend jaar niet zomaar op dezelfde manier terug.' },
        url: 'https://www.ervaarharen.nl/event/wijnloop-haren/'
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
        viewEvents: 'Events',
        viewDetails: 'View Details',
        eventsHappeningNow: 'Happening now',
        eventsMoreInfo: 'More info',
        eventsEmpty: 'Nothing on the calendar right now. Check back soon — the Groningen year fills up fast.',
        eventsCoverage: 'Events shown through {through}',
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
        viewEvents: 'Agenda',
        viewDetails: 'Bekijk Details',
        eventsHappeningNow: 'Nu bezig',
        eventsMoreInfo: 'Meer info',
        eventsEmpty: 'Nog niets op de agenda. Kom snel weer terug — het Groningse jaar loopt snel vol.',
        eventsCoverage: 'Agenda toont evenementen tot en met {through}',
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
