const BUCKET_LIST = [
    {
        id: '1',
        coords: [53.2192, 6.5670],
        category: { en: 'Food & Drink', nl: 'Eten & Drinken' },
        title: { en: 'Eat your first Groninger Eierbal', nl: 'Eet je eerste Groningse Eierbal' },
        tip: { en: 'Grab one hot from a snackbar or the automatic wall (automatiek).', nl: 'Haal er een warm uit de snackbar of uit de automatiek.' }
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
        title: { en: 'Buy Kruidkoek or Groninger Koek', nl: 'Koop Kruidkoek of Groninger Koek' },
        tip: { en: 'A spiced local slice, great with butter alongside coffee.', nl: 'Een gekruide lokale koek, heerlijk met boter bij de koffie.' }
    },
    {
        id: '5',
        coords: [53.2195, 6.5684],
        category: { en: 'Culture & Sights', nl: 'Cultuur & Bezienswaardigheden' },
        title: { en: 'Climb the Martinitoren (d\'Olle Grieze)', nl: 'Beklim de Martinitoren (d\'Olle Grieze)' },
        tip: { en: '300+ steps to the top for the best view over the province.', nl: '300+ treden naar de top voor het beste uitzicht over de provincie.' }
    },
    {
        id: '6',
        coords: [53.2384, 6.5332],
        category: { en: 'Culture & Sights', nl: 'Cultuur & Bezienswaardigheden' },
        title: { en: 'Explore the colorful houses at Reitdiephaven', nl: 'Ontdek de kleurrijke huizen bij Reitdiephaven' },
        tip: { en: 'The classic postcard photo spot on the city’s edge.', nl: 'De bekende ansichtkaart fotospot aan de rand van de stad.' }
    },
    {
        id: '7',
        coords: [53.2190, 6.5701],
        category: { en: 'Culture & Sights', nl: 'Cultuur & Bezienswaardigheden' },
        title: { en: 'Visit the Forum Groningen rooftop', nl: 'Bezoek het dakterras van Forum Groningen' },
        tip: { en: 'Free panoramic view, great library, and open terrace.', nl: 'Gratis panoramisch uitzicht, een bibliotheek en een open terras.' }
    },
    {
        id: '8',
        coords: [53.2124, 6.5663],
        category: { en: 'Culture & Sights', nl: 'Cultuur & Bezienswaardigheden' },
        title: { en: 'Tour the Groninger Museum', nl: 'Bezoek het Groninger Museum' },
        tip: { en: 'Distinctive postmodern architecture right opposite the central station.', nl: 'Opvallende postmoderne architectuur recht tegenover het hoofdstation.' }
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
        tip: { en: 'Quintessential Dutch practical way to furnish a flat.', nl: 'De praktische Nederlandse manier om je woning in te richten.' }
    },
    {
        id: '15',
        coords: [53.4070, 6.1950],
        category: { en: 'Groningen Classics', nl: 'Groningse Klassiekers' },
        title: { en: 'Take a day trip to Schiermonnikoog or Ameland', nl: 'Maak een dagtocht naar Schiermonnikoog of Ameland' },
        tip: { en: 'Catch the bus to Lauwersoog and take the ferry to the Wadden Islands.', nl: 'Neem de bus naar Lauwersoog en de boot naar de Waddeneilanden.' }
    },
    {
        id: '16',
        coords: [53.0069, 7.1919],
        category: { en: 'Groningen Classics', nl: 'Groningse Klassiekers' },
        title: { en: 'Visit the star fortress town of Bourtange', nl: 'Bezoek het vestingstadje Bourtange' },
        tip: { en: 'A restored 16th-century fortified village near the German border.', nl: 'Een gerestaureerde 16e-eeuwse vestingstad nabij de Duitse grens.' }
    },
    {
        id: '17',
        coords: [53.2188, 6.5678],
        category: { en: 'Groningen Classics', nl: 'Groningse Klassiekers' },
        title: { en: 'Grab an evening beer at the Drie Gezusters', nl: 'Drink een biertje bij De Drie Gezusters' },
        tip: { en: 'One of the largest pub complexes in Europe on the Grote Markt.', nl: 'Een van de grootste cafécomplexen van Europa op de Grote Markt.' }
    },
    {
        id: '18',
        coords: [53.2064, 6.5917],
        category: { en: 'Groningen Classics', nl: 'Groningse Klassiekers' },
        title: { en: 'Watch an FC Groningen match at the Euroborg', nl: 'Bezoek een wedstrijd van FC Groningen in de Euroborg' },
        tip: { en: 'Experience local football pride with the Green-White Army.', nl: 'Beleef de lokale voetbaltrots in het stadion van de Trots van het Noorden.' }
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
    }
];

const MILESTONES = [
    { threshold: 0, title: { en: 'Newcomer', nl: 'Nieuwkomer' } },
    { threshold: 5, title: { en: 'Stadjer in Training', nl: 'Stadjer in Opleiding' } },
    { threshold: 10, title: { en: 'Halfway Groninger', nl: 'Halverwege Groninger' } },
    { threshold: 15, title: { en: 'Local Expert', nl: 'Lokale Expert' } },
    { threshold: 22, title: { en: 'Real Groninger', nl: 'Echte Groninger' } }
];

const UI_TRANSLATIONS = {
    en: {
        filterAll: 'All',
        filterFood: 'Food',
        filterCulture: 'Culture',
        filterDaily: 'Daily Life',
        filterClassics: 'Classics',
        completedText: '{completed} of {total} completed',
        whyLocals: 'Why locals do it:',
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
        courseLink: 'Free Dutch Course (UG) 🎓'
    },
    nl: {
        filterAll: 'Alles',
        filterFood: 'Eten',
        filterCulture: 'Cultuur',
        filterDaily: 'Dagelijks',
        filterClassics: 'Klassiekers',
        completedText: '{completed} van de {total} voltooid',
        whyLocals: 'Waarom locals dit doen:',
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
        courseLink: 'Gratis Cursus Nederlands (RUG) 🎓'
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

function init() {
    updateLanguageUI();
    renderList();
    updateProgress();
    setupEventListeners();
}

function updateLanguageUI() {
    const t = UI_TRANSLATIONS[currentLang];

    const categoryKeys = {
        'All': t.filterAll,
        'Food & Drink': t.filterFood,
        'Culture & Sights': t.filterCulture,
        'Daily Life': t.filterDaily,
        'Groningen Classics': t.filterClassics
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
        // Initialize map centered at Groningen City Center
        leafletMap = L.map('mapContainer').setView([53.2194, 6.5665], 13);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            subdomains: 'abcd',
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
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
        
        // Custom SVG icon pin
        const pinColor = isCompleted ? '#10B981' : '#F59E0B';
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
        
        listContainer.appendChild(card);
    });

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
    } else {
        completedItems[id] = {
            date: new Date().toISOString(),
            note: memoryNote.value || ''
        };
        if (event) createConfetti(event.clientX, event.clientY);
    }
    
    saveState();
    renderList();
    updateProgress();
    
    if (detailModal.classList.contains('active') && selectedItemId === id) {
        updateModalButtonState(!isCompleted);
    }
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
    document.querySelector('.modal-tip strong').textContent = t.whyLocals;

    const modalLinkContainer = document.getElementById('modalLinkContainer');
    if (item.url) {
        modalLinkContainer.innerHTML = `<a href="${item.url}" target="_blank" rel="noopener noreferrer" class="item-link-btn">${t.courseLink} ↗</a>`;
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

        // Save submission locally for backup
        const submissions = JSON.parse(localStorage.getItem('moiCheckMessages')) || [];
        submissions.push({
            date: new Date().toISOString(),
            name: nameVal,
            email: emailVal,
            subject: subjectVal,
            message: messageVal
        });
        localStorage.setItem('moiCheckMessages', JSON.stringify(submissions));

        // Send email via FormSubmit AJAX endpoint securely
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
    
    [detailModal, profileModal, contactModal].forEach(modal => {
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
        
        const text = t.shareText
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
