// Application Core - Main UI Orchestration & Event Dispatching

// State
let completedItems = JSON.parse(localStorage.getItem('moiCheckState')) || {};
// Validated on read, not just on write: a stored value that is not a language we
// ship ('undefined' from an older build, a hand-edited key, 'constructor' and
// friends off the prototype) otherwise reaches UI_TRANSLATIONS[currentLang] and
// throws during init, which renders an empty page rather than a wrong language.
const storedLang = localStorage.getItem('moiCheckLang');
let currentLang = ALLOWED_LANGS.includes(storedLang) ? storedLang : 'en';
let currentFilter = 'All';
let currentView = 'list';
let selectedItemId = null;
// null = no explicit choice yet, so the section auto-collapses once it grows.
let completedCollapsedPref = localStorage.getItem('moiCheckCompletedCollapsed');
let resortTimer = null;
let listNeedsResort = false;
let leafletMap = null;
let markersGroup = null;

// BUCKET_LIST is static, so it is indexed once at load and the lookups below read
// from these maps. Each category's array keeps BUCKET_LIST order, which renderList's
// todo/done partition relies on.
const itemsByCategory = BUCKET_LIST.reduce((acc, item) => {
    const cat = item.category.en;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
}, {});

// Lookup by id. Null-prototype: ids reaching this map come from persisted state
// (localStorage and the cloud sync), so a stale key like "constructor" must miss
// rather than inherit.
const itemsById = BUCKET_LIST.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
}, Object.create(null));

// The list, the map pins and the filter pills all narrow to the same set.
function getFilteredItems(filter) {
    return filter === 'All' ? BUCKET_LIST : (itemsByCategory[filter] || []);
}

// DOM Elements
const listContainer = document.getElementById('listContainer');
const mapWrapper = document.getElementById('mapWrapper');
const filterPills = document.querySelectorAll('.filter-pill');
const progressCount = document.getElementById('progressCount');
const progressFill = document.getElementById('progressFill');
const currentMilestone = document.getElementById('currentMilestone');
const langBtns = document.querySelectorAll('.lang-option-btn');
const listViewBtn = document.getElementById('listViewBtn');
const mapViewBtn = document.getElementById('mapViewBtn');

// Detail Modal Elements
const detailModal = document.getElementById('detailModal');
const modalCategory = document.getElementById('modalCategory');
const modalTitle = document.getElementById('modalTitle');
const modalTip = document.getElementById('modalTip');
const memoryNote = document.getElementById('memoryNote');
const modalCheckBtn = document.getElementById('modalCheckBtn');
const modalUncheckBtn = document.getElementById('modalUncheckBtn');
const closeDetailModalBtn = document.getElementById('closeDetailModal');

// Profile Modal Elements
const profileModal = document.getElementById('profileModal');
const profileBtn = document.getElementById('profileBtn');
const closeProfileModalBtn = document.getElementById('closeProfileModal');
const shareBtn = document.getElementById('shareBtn');
const profileMilestone = document.getElementById('profileMilestone');
const profileProgressText = document.getElementById('profileProgressText');
const completedList = document.getElementById('completedList');
const accountDangerZone = document.getElementById('accountDangerZone');
const deleteAccountBtn = document.getElementById('deleteAccountBtn');
const signOutBtn = document.getElementById('signOutBtn');

// Delete Account Modal Elements
const deleteAccountModal = document.getElementById('deleteAccountModal');
const closeDeleteAccountModalBtn = document.getElementById('closeDeleteAccountModal');
const confirmDeleteAccountBtn = document.getElementById('confirmDeleteAccountBtn');
const cancelDeleteAccountBtn = document.getElementById('cancelDeleteAccountBtn');
const deleteAccountError = document.getElementById('deleteAccountError');

// Sign-out Modal Elements
const signOutModal = document.getElementById('signOutModal');
const closeSignOutModalBtn = document.getElementById('closeSignOutModal');
const confirmSignOutBtn = document.getElementById('confirmSignOutBtn');
const cancelSignOutBtn = document.getElementById('cancelSignOutBtn');

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

function init() {
    initTheme();
    updateLanguageUI();
    renderList();
    updateProgress();
    setupEventListeners();
    initAuth();
}

function renderFilterPills() {
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
        const label = categoryKeys[cat];
        if (!label) return;

        const items = getFilteredItems(cat);
        const remaining = items.filter(i => !completedItems[i.id]).length;

        let labelEl = pill.querySelector('.filter-pill-label');
        let countEl = pill.querySelector('.filter-pill-count');

        if (!labelEl || !countEl) {

            labelEl = document.createElement('span');
            labelEl.className = 'filter-pill-label';
            pill.appendChild(labelEl);

            countEl = document.createElement('span');
            countEl.className = 'filter-pill-count';
            // The badge on its own reads as a bare number; the pill's aria-label below
            // says what it counts, so hide this from the accessibility tree.
            countEl.setAttribute('aria-hidden', 'true');
            pill.replaceChildren(labelEl, countEl);
        }

        if (labelEl.textContent !== label) {
            labelEl.textContent = label;
        }

        const countText = remaining > 0 ? remaining : '✓';
        if (countEl.textContent !== String(countText)) {
            countEl.textContent = countText;
        }

        const status = remaining > 0
            ? t.remainingCount.replace('{count}', remaining)
            : t.allDone;
        pill.setAttribute('aria-label', `${label}, ${status}`);
    });
}

function updateLanguageUI() {
    const t = UI_TRANSLATIONS[currentLang];

    langBtns.forEach(btn => {
        const isCurrent = btn.dataset.lang === currentLang;
        btn.classList.toggle('active', isCurrent);
        btn.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
    });

    document.getElementById('txtListView').textContent = t.viewList;
    document.getElementById('txtMapView').textContent = t.viewMap;

    document.querySelector('.memory-section h3').textContent = t.addMemory;
    memoryNote.placeholder = t.memoryPlaceholder;
    modalUncheckBtn.textContent = t.markNotDone;
    document.querySelector('#profileModal h2').textContent = t.yourJourney;
    document.getElementById('txtCompletedMemories').textContent = t.completedMemories;
    const txtCatBadges = document.getElementById('txtCategoryBadges');
    if (txtCatBadges) txtCatBadges.textContent = t.achievementBadges;
    shareBtn.textContent = t.shareMilestone;

    const txtAccountHeader = document.getElementById('txtAccountHeader');
    if (txtAccountHeader) txtAccountHeader.textContent = t.accountHeader;
    const txtDeleteAccountNotice = document.getElementById('txtDeleteAccountNotice');
    if (txtDeleteAccountNotice) txtDeleteAccountNotice.textContent = t.deleteAccountNotice;
    if (deleteAccountBtn) deleteAccountBtn.textContent = t.deleteAccountBtn;

    const deleteModalTitle = document.getElementById('deleteModalTitle');
    if (deleteModalTitle) deleteModalTitle.textContent = t.deleteModalTitle;
    const deleteModalWarning = document.getElementById('deleteModalWarning');
    if (deleteModalWarning) deleteModalWarning.textContent = t.deleteModalWarning;
    const deleteModalLocalNote = document.getElementById('deleteModalLocalNote');
    if (deleteModalLocalNote) deleteModalLocalNote.textContent = t.deleteModalLocalNote;
    if (confirmDeleteAccountBtn) confirmDeleteAccountBtn.textContent = t.confirmDelete;
    if (cancelDeleteAccountBtn) cancelDeleteAccountBtn.textContent = t.cancel;
    if (closeDeleteAccountModalBtn) closeDeleteAccountModalBtn.setAttribute('aria-label', t.closeDialog);

    const signOutModalTitle = document.getElementById('signOutModalTitle');
    if (signOutModalTitle) signOutModalTitle.textContent = t.signOutModalTitle;
    const signOutModalWarning = document.getElementById('signOutModalWarning');
    if (signOutModalWarning) signOutModalWarning.textContent = t.signOutModalWarning;
    if (confirmSignOutBtn) confirmSignOutBtn.textContent = t.confirmSignOut;
    if (cancelSignOutBtn) cancelSignOutBtn.textContent = t.cancel;
    if (closeSignOutModalBtn) closeSignOutModalBtn.setAttribute('aria-label', t.closeDialog);

    // Contact modal translations
    document.getElementById('contactModalTitle').textContent = t.contactTitle;
    document.getElementById('contactModalSubtitle').textContent = t.contactSubtitle;
    document.getElementById('lblContactName').textContent = t.contactName;
    document.getElementById('lblContactEmail').textContent = t.contactEmail;
    document.getElementById('lblContactSubject').textContent = t.contactSubject;
    document.getElementById('lblContactMessage').textContent = t.contactMessage;
    document.getElementById('contactSubmitBtn').textContent = t.sendMessage;
    document.getElementById('contactBtn').textContent = t.contactBtnText;
    document.getElementById('contactPrivacyNote').innerHTML = t.contactPrivacyNote;
    document.getElementById('contactSuccessTitle').textContent = t.successTitle;
    document.getElementById('contactSuccessText').textContent = t.successText;
    contactSuccessClose.textContent = t.closeDialog;

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
    const txtLanguageHeader = document.getElementById('txtLanguageHeader');
    if (txtLanguageHeader) txtLanguageHeader.textContent = t.languageHeader;

    const footerPrivacyLink = document.getElementById('footerPrivacyLink');
    if (footerPrivacyLink) footerPrivacyLink.textContent = t.footerPrivacy;

    // Auth modal & header translations
    document.getElementById('authModalTitle').textContent = t.authTitle;
    document.getElementById('authModalSubtitle').textContent = t.authSubtitle;
    document.getElementById('authPrivacyNote').innerHTML = t.authPrivacyNote;
    document.getElementById('txtGoogleBtn').textContent = t.continueGoogle;
    document.getElementById('txtAuthOr').textContent = t.orText;
    document.getElementById('lblMagicEmail').textContent = t.contactEmail;
    document.getElementById('magicLinkSubmitBtn').textContent = t.sendMagicLink;
    document.getElementById('magicSuccessTitle').textContent = t.magicTitle;
    document.getElementById('magicSuccessText').textContent = t.magicText;
    document.getElementById('magicSuccessClose').textContent = t.gotIt;
    document.getElementById('magicFinishTitle').textContent = t.magicFinishTitle;
    document.getElementById('magicFinishText').textContent = t.magicFinishText;
    const magicFinishBtn = document.getElementById('magicFinishBtn');
    if (!magicFinishBtn.disabled) {
        magicFinishBtn.textContent = magicFinishBtn.dataset.retry ? t.magicFinishRetry : t.magicFinishBtn;
    }
    // The error line is only ever shown in the retry state; keep it in step
    // with the language switch too.
    if (magicFinishBtn.dataset.retry) {
        document.getElementById('magicFinishError').textContent = t.magicFinishExpired;
    }

    updateAuthBtnState(!!currentUser);
}

function setLanguage(lang) {
    if (!ALLOWED_LANGS.includes(lang) || lang === currentLang) return;
    currentLang = lang;
    localStorage.setItem('moiCheckLang', currentLang);
    updateLanguageUI();
    renderList();
    updateProgress();
    // The pins carry no text, and popups are built on open, so the map needs
    // nothing here beyond closing a popup that is already showing the old
    // language. renderList re-syncs the markers themselves when the map is up.
    if (leafletMap) leafletMap.closePopup();
    
    if (detailModal.classList.contains('active') && selectedItemId) {
        persistOpenNote();
        const item = itemsById[selectedItemId];
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
        if (listNeedsResort) {
            listNeedsResort = false;
            renderList();
        }
    } else {
        mapViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        listContainer.style.display = 'none';
        mapWrapper.style.display = 'block';
        // initOrUpdateMap awaits the Leaflet load, so anything that throws past
        // it — Leaflet itself failing to build the map, say — would come back as
        // an unhandled rejection rather than the plain console error it was
        // while this ran synchronously.
        initOrUpdateMap().catch(err => console.error('Map view failed to open:', err));
    }
}

// Leaflet is only needed once someone opens the map, so its stylesheet and
// script are fetched on first use rather than on every page load. A visitor who
// never leaves the list view makes no request to unpkg at all.
const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const LEAFLET_CSS_SRI = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
const LEAFLET_JS_SRI = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';

let leafletLoad = null;

function loadLeaflet() {
    if (window.L) return Promise.resolve();
    if (leafletLoad) return leafletLoad;

    const styles = document.createElement('link');
    styles.rel = 'stylesheet';
    styles.href = LEAFLET_CSS_URL;
    styles.integrity = LEAFLET_CSS_SRI;
    styles.crossOrigin = '';
    // Leaflet lays the map out from its stylesheet, so the map is built only
    // once that has settled — the head tags this replaced gave the same
    // ordering for free. A stylesheet that never arrives shouldn't cost the
    // visitor the map itself, though, so failure here settles rather than
    // throws and the map comes up unstyled instead of not at all.
    const stylesSettled = new Promise(settle => {
        styles.onload = settle;
        styles.onerror = settle;
    });
    document.head.appendChild(styles);

    const script = document.createElement('script');
    script.src = LEAFLET_JS_URL;
    script.integrity = LEAFLET_JS_SRI;
    script.crossOrigin = '';
    const scriptLoaded = new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = () => {
            // Take the dead tags back out. Re-opening the map appends a fresh
            // pair, and against a blocked CDN that would otherwise stack up a
            // link and a script in the head on every attempt.
            styles.remove();
            script.remove();
            reject(new Error('Leaflet failed to load'));
        };
    });
    document.head.appendChild(script);

    leafletLoad = Promise.all([stylesSettled, scriptLoaded]).then(() => undefined);
    leafletLoad.catch(() => {
        // Forget the failed attempt so re-opening the map tries again, the way
        // a reload used to after a blocked or dropped CDN request.
        leafletLoad = null;
    });

    return leafletLoad;
}

async function initOrUpdateMap() {
    try {
        await loadLeaflet();
    } catch {
        // Same outcome as the old `if (!window.L) return`: no map, but the rest
        // of the app carries on working.
        return;
    }

    // The script can land after the visitor has gone back to the list; building
    // the map into a hidden container measures nothing useful, so leave it for
    // the next time they open the map.
    if (currentView !== 'map') return;

    if (!leafletMap) {
        leafletMap = L.map('mapContainer').setView([53.2194, 6.5665], 13);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(leafletMap);

        markersGroup = L.layerGroup().addTo(leafletMap);
    }

    // The container is only sized once mapWrapper is visible, so re-measure
    // before any bounds maths runs off a stale (or zero) size.
    leafletMap.invalidateSize();

    // Opening the map always reframes it: the filter may well have changed while
    // the list was up, and the previous view could be pointing anywhere.
    renderMapMarkers({ refit: true });

    // Some browsers report the final container size only after layout settles,
    // which would leave that first fit framed off the old size.
    setTimeout(() => {
        if (!leafletMap) return;
        leafletMap.invalidateSize();
        fitMapToVisibleMarkers();
    }, 100);
}

// ⚡ Bolt Performance Optimization:
// Cache L.divIcon instances to prevent O(N) memory allocations per render cycle.
// Impact: Reduces garbage collection pressure and speeds up map rendering significantly
// when toggling completed status or switching filters.
const cachedMapIcons = {
    todo: null,
    done: null
};

function getMapIcon(isCompleted) {
    const cacheKey = isCompleted ? 'done' : 'todo';
    if (!cachedMapIcons[cacheKey]) {
        const pinColor = isCompleted ? '#047857' : '#B45309';
        cachedMapIcons[cacheKey] = L.divIcon({
            className: 'custom-map-pin',
            html: `<div style="background-color: ${pinColor}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                    ${isCompleted ? '✓' : '•'}
                   </div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });
    }
    return cachedMapIcons[cacheKey];
}

// Markers are built once per item and kept for the life of the map. Leaflet
// destroys a marker's pin element whenever the marker leaves the map, so
// clearing the group on every render rebuilt all 33 pins just to recolour the
// single one that was toggled.
const mapMarkers = new Map();

// Popup content is built when the popup opens rather than up front, so the DOM
// is only paid for on the pins that are actually opened and a card cannot hold
// text in a language the user has since switched away from. Leaflet calls this
// each time it fills the popup.
function buildMapPopup(item) {
    const t = UI_TRANSLATIONS[currentLang];

    const popupContent = document.createElement('div');
    popupContent.className = 'map-popup-card';
    popupContent.innerHTML = `
        <span class="card-category">${item.category[currentLang]}</span>
        <h3>${item.title[currentLang]}</h3>
        <p>${item.tip[currentLang]}</p>
        <button class="map-popup-btn">${t.viewDetails}</button>
    `;

    popupContent.querySelector('.map-popup-btn').addEventListener('click', () => {
        openDetailModal(item);
    });

    return popupContent;
}

function getMapMarker(item) {
    let marker = mapMarkers.get(item.id);
    if (!marker) {
        marker = L.marker(item.coords, { icon: getMapIcon(!!completedItems[item.id]) });
        marker.bindPopup(() => buildMapPopup(item));
        mapMarkers.set(item.id, marker);
    }
    return marker;
}

// getMapIcon hands back one of two shared instances, so comparing against the
// marker's current icon is enough to tell whether the pin needs repainting.
function setMarkerIcon(marker, isCompleted) {
    const icon = getMapIcon(isCompleted);
    if (marker.options.icon !== icon) {
        marker.setIcon(icon);
    }
}

// Keeps every visible pin on screen. Padding leaves room for the pin graphic and
// the popup nub at the edges of the container, and the zoom cap keeps a filter
// that matches a single item from slamming the map into street level.
const MAP_FIT_PADDING = [48, 48];
const MAP_FIT_MAX_ZOOM = 15;

function fitMapToVisibleMarkers() {
    if (!leafletMap || !markersGroup) return;

    const bounds = L.latLngBounds([]);
    markersGroup.eachLayer(marker => bounds.extend(marker.getLatLng()));

    // A filter with nothing left to show has no bounds to fit; leave the view
    // where it is rather than throwing the user somewhere arbitrary.
    if (!bounds.isValid()) return;

    leafletMap.fitBounds(bounds, {
        padding: MAP_FIT_PADDING,
        maxZoom: MAP_FIT_MAX_ZOOM
    });
}

// The set of pins the map was last framed around. Refitting is tied to this
// changing rather than to every render, so ticking an item off or switching
// language repaints pins without yanking the map away from wherever the user
// has panned it.
let fittedMarkerKey = null;

// Brings the map in line with the current filter and completion state: adds and
// removes only the markers whose visibility changed, and repaints only the pins
// whose colour is wrong. Whenever that changes which pins are on the map, the
// view is refitted so the whole filtered set stays in frame.
function renderMapMarkers({ refit = false } = {}) {
    if (!leafletMap || !markersGroup) return;

    const visibleIds = new Set();

    getFilteredItems(currentFilter).forEach(item => {
        visibleIds.add(item.id);
        const marker = getMapMarker(item);
        setMarkerIcon(marker, !!completedItems[item.id]);
        if (!markersGroup.hasLayer(marker)) {
            markersGroup.addLayer(marker);
        }
    });

    mapMarkers.forEach((marker, id) => {
        if (!visibleIds.has(id) && markersGroup.hasLayer(marker)) {
            markersGroup.removeLayer(marker);
        }
    });

    const markerKey = [...visibleIds].join('|');
    if (refit || markerKey !== fittedMarkerKey) {
        fittedMarkerKey = markerKey;
        fitMapToVisibleMarkers();
    }
}

// Toggling an item repaints exactly one pin, so the rest of the map is left
// untouched. A no-op until the map has been opened and the marker exists.
function updateMapMarker(id) {
    const marker = mapMarkers.get(id);
    if (marker) {
        setMarkerIcon(marker, !!completedItems[id]);
    }
}

function isCompletedCollapsed(count) {
    if (completedCollapsedPref === null) return count > 2;
    return completedCollapsedPref === 'true';
}

// ⚡ Bolt Performance Optimization:
// Cache DOM nodes for bucket cards based on id and language.
// Impact: Prevents rebuilding identical DOM nodes on every render/filter/toggle,
// drastically reducing memory allocation, garbage collection, and render time.
const cardCache = new Map();

function buildCard(item) {
    const cacheKey = `${item.id}_${currentLang}`;
    const isCompleted = !!completedItems[item.id];

    let card = cardCache.get(cacheKey);

    if (!card) {
        card = document.createElement('div');
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
                <h2 class="card-title">${item.title[currentLang]}</h2>
                <p class="card-tip">${item.tip[currentLang]}</p>
            </div>
        `;
        cardCache.set(cacheKey, card);
    } else {
        const wasCompleted = card.classList.contains('completed');
        if (wasCompleted !== isCompleted) {
            card.classList.toggle('completed', isCompleted);
        }
    }

    return card;
}

function buildCompletedDivider(count, collapsed) {
    const t = UI_TRANSLATIONS[currentLang];

    const divider = document.createElement('button');
    divider.type = 'button';
    divider.className = `completed-divider ${collapsed ? 'collapsed' : ''}`;
    divider.setAttribute('aria-expanded', String(!collapsed));
    divider.innerHTML = `
        <span class="completed-divider-label">
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            ${t.completedSection}
        </span>
        <span class="completed-divider-count">${count}</span>
        <svg aria-hidden="true" class="completed-divider-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
    `;

    divider.addEventListener('click', () => {
        completedCollapsedPref = String(!collapsed);
        localStorage.setItem('moiCheckCompletedCollapsed', completedCollapsedPref);
        renderList();
    });

    return divider;
}

function renderList() {

    
    const filteredList = getFilteredItems(currentFilter);

    // ⚡ Bolt Performance Optimization:
    // Replace two sequential O(N) filter passes with a single O(N) partitioning loop.
    // Impact: Halves the iterations over the filtered list array on every UI re-render,
    // reducing processing time when changing categories or marking items done.
    const todo = [];
    const done = [];
    for (let i = 0; i < filteredList.length; i++) {
        if (completedItems[filteredList[i].id]) {
            done.push(filteredList[i]);
        } else {
            todo.push(filteredList[i]);
        }
    }

    // ⚡ Bolt Performance Optimization:
    // Use a DocumentFragment to batch all DOM insertions.
    // Impact: Reduces browser reflows/repaints from O(N) to O(1) when rendering the list,
    // improving render speed.
    const fragment = document.createDocumentFragment();

    todo.forEach(item => fragment.appendChild(buildCard(item)));

    if (done.length > 0) {
        const collapsed = isCompletedCollapsed(done.length);
        fragment.appendChild(buildCompletedDivider(done.length, collapsed));
        if (!collapsed) {
            done.forEach(item => fragment.appendChild(buildCard(item)));
        }
    }

    listContainer.replaceChildren(fragment);

    if (currentView === 'map' && leafletMap) {
        renderMapMarkers();
    }
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

    renderFilterPills();
}

// The checked card stays put while the confetti plays, then re-sorts into (or out
// of) the completed section. Deliberately not immediate: a card that teleports away
// mid-celebration reads as if the app lost it. Rapid toggles coalesce into one render.
function scheduleListResort() {
    clearTimeout(resortTimer);
    listNeedsResort = true;
    resortTimer = setTimeout(() => {
        resortTimer = null;
        if (currentView !== 'list') return;
        listNeedsResort = false;
        renderList();
    }, 700);
}

function toggleComplete(id, event = null) {
    const isCompleted = !!completedItems[id];
    
    if (isCompleted) {
        delete completedItems[id];
        syncItemToCloud(id, false);
    } else {
        const isEditingThisItem = detailModal.classList.contains('active') && selectedItemId === id;
        const noteVal = isEditingThisItem ? (memoryNote.value || '') : '';
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
    scheduleListResort();
    updateMapMarker(id);

    updateProgress();
    
    if (detailModal.classList.contains('active') && selectedItemId === id) {
        updateModalButtonState(!isCompleted);
    }
}

function checkBadgeUnlocks(itemId, wasCompleted) {
    if (wasCompleted) return;
    const item = itemsById[itemId];
    if (!item) return;

    const categoryName = item.category.en;
    const badge = CATEGORY_BADGES.find(b => b.category === categoryName);
    if (!badge) return;

    const categoryItems = itemsByCategory[categoryName] || [];
    const total = categoryItems.length;
    const completedCount = categoryItems.filter(i => !!completedItems[i.id]).length;

    if (total > 0 && completedCount === total) {
        showBadgeToast(badge);
    }
}

function renderBadges() {
    const badgesGrid = document.getElementById('badgesGrid');
    if (!badgesGrid) return;
    const fragment = document.createDocumentFragment();
    const t = UI_TRANSLATIONS[currentLang];

    // ⚡ Bolt Performance Optimization:
    // Use replaceChildren(fragment) instead of innerHTML = '' + appendChild in a loop
    // Impact: Avoids multiple reflows/repaints, HTML parser overhead, and intermediate empty DOM states.
    CATEGORY_BADGES.forEach(badge => {
        const categoryItems = itemsByCategory[badge.category] || [];
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
        fragment.appendChild(card);
    });
    badgesGrid.replaceChildren(fragment);
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
        const linkEl = document.createElement('a');
        linkEl.href = item.url;
        linkEl.target = '_blank';
        linkEl.rel = 'noopener noreferrer';
        linkEl.className = 'item-link-btn';
        linkEl.textContent = `${linkText} ↗`;
        modalLinkContainer.replaceChildren(linkEl);
    } else {
        modalLinkContainer.replaceChildren();
    }
    
    if (isCompleted) {
        memoryNote.value = completedItems[item.id].note || '';
    } else {
        memoryNote.value = '';
    }
    
    updateModalButtonState(isCompleted);
    detailModal.classList.add('active');
}

// A note only belongs to an item that is already completed; for anything else the
// textarea is a draft that the "Mark as Complete" path picks up. Called on every way
// out of the modal so typing is never silently discarded.
function persistOpenNote() {
    if (!selectedItemId) return;
    const entry = completedItems[selectedItemId];
    if (!entry) return;

    const note = memoryNote.value;
    if (note === (entry.note || '')) return;

    entry.note = note;
    saveState();
    syncItemToCloud(selectedItemId, true, note);
}

function closeDetailModal() {
    persistOpenNote();
    detailModal.classList.remove('active');
    selectedItemId = null;
    memoryNote.value = '';
}

function updateModalButtonState(isCompleted) {
    const t = UI_TRANSLATIONS[currentLang];
    modalCheckBtn.textContent = isCompleted ? t.saveNote : t.markComplete;
    modalUncheckBtn.style.display = isCompleted ? 'block' : 'none';
}

function memoryTimestamp(value) {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

// ⚡ Bolt Performance Optimization:
// Cache Intl.DateTimeFormat instances. toLocaleDateString recreates these internally
// on every call, which is very slow in loops (like rendering the memory list).
const dateFormatters = {
    en: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    nl: new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
};

function formatMemoryDate(value) {
    if (!value) return '';
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return '';
    // currentLang comes from localStorage, so a keyed lookup could walk the prototype
    // chain ('constructor' etc.) and return a non-formatter. Branch explicitly instead.
    const formatter = currentLang === 'nl' ? dateFormatters.nl : dateFormatters.en;
    return formatter.format(parsed);
}

function openProfileModal() {
    // ⚡ Bolt Performance Optimization:
    // Use replaceChildren() instead of completedList.innerHTML = ''
    // Impact: More efficient DOM clearing and appending, bypassing HTML parser.
    const t = UI_TRANSLATIONS[currentLang];
    
    renderBadges();
    
    // ⚡ Bolt Performance Optimization:
    // Pre-compute parsed date timestamps during .map() (Schwartzian transform)
    // instead of calling memoryTimestamp() repeatedly within the .sort() comparator.
    // Impact: Reduces new Date() allocations and O(N log N) date parsings, speeding up sort.
    const completedArr = Object.entries(completedItems).map(([id, data]) => {
        const item = itemsById[id];
        if (!item) return null;
        const merged = { ...item, ...data };
        return { merged, _parsedTimestamp: memoryTimestamp(merged.date) };
    })
    .filter(Boolean)
    .sort((a, b) => b._parsedTimestamp - a._parsedTimestamp)
    .map(wrapper => wrapper.merged);
    
    if (completedArr.length === 0) {
        const p = document.createElement('p');
        p.style.color = 'var(--text-light)';
        p.style.textAlign = 'center';
        p.style.padding = '2rem';
        p.textContent = t.noMemories;
        completedList.replaceChildren(p);
    } else {
        const fragment = document.createDocumentFragment();
        completedArr.forEach(item => {
            const div = document.createElement('div');
            div.className = 'completed-item';

            const title = document.createElement('h4');
            title.textContent = item.title[currentLang];
            div.appendChild(title);

            const dateLabel = formatMemoryDate(item.date);
            if (dateLabel) {
                const dateEl = document.createElement('span');
                dateEl.className = 'completed-date';
                dateEl.textContent = dateLabel;
                div.appendChild(dateEl);
            }

            if (item.note) {
                const noteEl = document.createElement('p');
                noteEl.textContent = `"${item.note}"`;
                div.appendChild(noteEl);
            }

            fragment.appendChild(div);
        });
        completedList.replaceChildren(fragment);
    }
    
    if (accountDangerZone) {
        accountDangerZone.style.display = (currentUser && supabaseClient) ? 'block' : 'none';
    }
    profileModal.removeAttribute('inert');
    profileModal.classList.add('active');
}

function closeProfileModal() {
    const hadFocus = profileModal.contains(document.activeElement);
    profileModal.classList.remove('active');
    profileModal.setAttribute('inert', '');
    if (hadFocus || document.activeElement === document.body) profileBtn.focus();
}

function setupEventListeners() {
    // ⚡ Bolt Performance Optimization:
    // Event delegation on listContainer reduces memory usage by attaching one event listener
    // instead of creating new listeners for every card and checkbox on every render.
    listContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.bucket-card');
        if (!card) return;

        const id = card.dataset.id;

        const checkbox = e.target.closest('.checkbox');
        if (checkbox) {
            toggleComplete(id, e);
            return;
        }

        const item = itemsById[id];
        if (item) {
            openDetailModal(item);
        }
    });

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
    authBtn.addEventListener('click', () => {
        authActions.style.display = 'block';
        magicLinkSuccess.style.display = 'none';
        document.getElementById('magicFinish').style.display = 'none';
        authModal.classList.add('active');
    });

    // Sign-out confirmation modal controls
    let signOutModalReturnFocus = null;
    let signOutModalUserId = null;
    let signOutBusy = false;

    const setSignOutBusy = (busy) => {
        signOutBusy = busy;
        if (confirmSignOutBtn) {
            confirmSignOutBtn.setAttribute('aria-disabled', busy ? 'true' : 'false');
            confirmSignOutBtn.setAttribute('aria-busy', busy ? 'true' : 'false');
        }
        if (cancelSignOutBtn) cancelSignOutBtn.disabled = busy;
        if (closeSignOutModalBtn) closeSignOutModalBtn.disabled = busy;
    };

    const closeSignOutModal = () => {
        if (signOutBusy) return;
        signOutModalUserId = null;
        if (signOutModal) {
            signOutModal.classList.remove('active');
            signOutModal.setAttribute('inert', '');
        }
        if (profileModal && profileModal.classList.contains('active')) {
            profileModal.removeAttribute('inert');
        }
        const canTakeFocus = el => !!el && typeof el.focus === 'function' && el.isConnected
            && !el.disabled && el.getClientRects().length > 0;
        let target = signOutModalReturnFocus;
        if (!canTakeFocus(target)) {
            target = profileModal.classList.contains('active') ? closeProfileModalBtn : profileBtn;
        }
        if (target) target.focus();
        signOutModalReturnFocus = null;
    };

    if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
            if (!supabaseClient || !currentUser) return;
            signOutModalUserId = currentUser.id;
            signOutModalReturnFocus = document.activeElement;
            if (profileModal) {
                profileModal.setAttribute('inert', '');
            }
            if (signOutModal) {
                signOutModal.removeAttribute('inert');
                signOutModal.classList.add('active');
            }
            if (cancelSignOutBtn) cancelSignOutBtn.focus();
        });
    }

    if (signOutModal) {
        signOutModal.addEventListener('keydown', (e) => {
            if (!signOutModal.classList.contains('active')) return;
            if (e.key === 'Escape') {
                e.preventDefault();
                closeSignOutModal();
                return;
            }
            if (e.key !== 'Tab') return;
            const focusables = Array.from(signOutModal.querySelectorAll('button:not([disabled])'));
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        });
    }

    if (cancelSignOutBtn) cancelSignOutBtn.addEventListener('click', closeSignOutModal);
    if (closeSignOutModalBtn) closeSignOutModalBtn.addEventListener('click', closeSignOutModal);

    if (confirmSignOutBtn) {
        confirmSignOutBtn.addEventListener('click', async () => {
            if (!supabaseClient || signOutBusy) return;
            if (!currentUser || currentUser.id !== signOutModalUserId) {
                signOutModalReturnFocus = profileBtn;
                closeSignOutModal();
                closeProfileModal();
                return;
            }

            setSignOutBusy(true);
            try {
                const { error } = await supabaseClient.auth.signOut({ scope: 'local' });
                if (error) throw error;
                setSignOutBusy(false);
                closeSignOutModal();
                closeProfileModal();
            } catch (err) {
                console.error('Sign-out failed:', err);
                setSignOutBusy(false);
                alert(UI_TRANSLATIONS[currentLang].signOutError);
            }
        });
    }

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
                // The page URL without its query or fragment. After a
                // callback the browser keeps an empty "#" (the library
                // clears the hash by assignment), and passing that back
                // would make Supabase produce "##access_token=...", which it
                // cannot parse; a stale magic-link query (?token_hash=...)
                // should not ride along either.
                redirectTo: window.location.origin + window.location.pathname
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
            // A magic link failure is almost always server-side (Supabase email
            // delivery or a database error creating the user), and error.message
            // alone hides the status and code needed to tell those apart. Pull
            // both out for readability, then log the error itself so nothing —
            // stack included — is lost behind the summary.
            console.error('Magic link sign-in failed:', {
                status: error.status,
                code: error.code,
                message: error.message
            }, error);
            alert(describeMagicLinkError(error));
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
            setLanguage(e.currentTarget.dataset.lang);
        });
    });

    // Filters
    filterPills.forEach(pill => {
        pill.addEventListener('click', () => {
            // Bind to the pill itself, not the event target: the label and count
            // are child spans, so e.target is often not the button.
            filterPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter = pill.dataset.filter;
            renderList();
        });
    });
    
    // Modals
    closeDetailModalBtn.addEventListener('click', closeDetailModal);
    
    closeProfileModalBtn.addEventListener('click', closeProfileModal);

    // Account deletion modal controls
    let deleteModalReturnFocus = null;
    let deleteModalUserId = null;
    let deletionBusy = false;

    const setDeletionBusy = (busy) => {
        deletionBusy = busy;
        if (confirmDeleteAccountBtn) {
            confirmDeleteAccountBtn.setAttribute('aria-disabled', busy ? 'true' : 'false');
            confirmDeleteAccountBtn.setAttribute('aria-busy', busy ? 'true' : 'false');
        }
        if (cancelDeleteAccountBtn) cancelDeleteAccountBtn.disabled = busy;
        if (closeDeleteAccountModalBtn) closeDeleteAccountModalBtn.disabled = busy;
    };

    const closeDeleteAccountModal = () => {
        if (deletionBusy) return;
        deleteModalUserId = null;
        if (deleteAccountModal) {
            deleteAccountModal.classList.remove('active');
            deleteAccountModal.setAttribute('inert', '');
        }
        if (profileModal && profileModal.classList.contains('active')) {
            profileModal.removeAttribute('inert');
        }
        const canTakeFocus = el => !!el && typeof el.focus === 'function' && el.isConnected
            && !el.disabled && el.getClientRects().length > 0;
        let target = deleteModalReturnFocus;
        if (!canTakeFocus(target)) {
            target = profileModal.classList.contains('active') ? closeProfileModalBtn : profileBtn;
        }
        if (target) target.focus();
        deleteModalReturnFocus = null;
    };

    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', () => {
            if (!currentUser) return;
            if (deleteAccountError) deleteAccountError.textContent = '';
            deleteModalUserId = currentUser.id;
            deleteModalReturnFocus = document.activeElement;
            if (profileModal) {
                profileModal.setAttribute('inert', '');
            }
            if (deleteAccountModal) {
                deleteAccountModal.removeAttribute('inert');
                deleteAccountModal.classList.add('active');
            }
            if (cancelDeleteAccountBtn) cancelDeleteAccountBtn.focus();
        });
    }

    if (deleteAccountModal) {
        deleteAccountModal.addEventListener('keydown', (e) => {
            if (!deleteAccountModal.classList.contains('active')) return;
            if (e.key === 'Escape') {
                e.preventDefault();
                closeDeleteAccountModal();
                return;
            }
            if (e.key !== 'Tab') return;
            const focusables = Array.from(deleteAccountModal.querySelectorAll('button:not([disabled])'));
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        });
    }

    if (cancelDeleteAccountBtn) cancelDeleteAccountBtn.addEventListener('click', closeDeleteAccountModal);
    if (closeDeleteAccountModalBtn) closeDeleteAccountModalBtn.addEventListener('click', closeDeleteAccountModal);

    if (confirmDeleteAccountBtn) {
        confirmDeleteAccountBtn.addEventListener('click', async () => {
            if (deletionBusy) return;
            const t = UI_TRANSLATIONS[currentLang];

            if (!currentUser || currentUser.id !== deleteModalUserId) {
                deleteModalReturnFocus = profileBtn;
                closeDeleteAccountModal();
                closeProfileModal();
                return;
            }
            const targetUserId = deleteModalUserId;

            setDeletionBusy(true);
            confirmDeleteAccountBtn.textContent = t.deleting;
            if (deleteAccountError) deleteAccountError.textContent = '';

            try {
                await deleteUserAccountAndData(targetUserId);
                setDeletionBusy(false);
                deleteModalReturnFocus = profileBtn;
                closeDeleteAccountModal();
                closeProfileModal();
                alert(t.deleteSuccess);
            } catch (err) {
                console.error('Account deletion failed:', err);
                setDeletionBusy(false);
                const code = err && err.code;
                if (deleteAccountError) {
                    deleteAccountError.textContent = code === 'DELETE_NOT_CONFIGURED'
                        ? t.deleteNotConfigured
                        : t.deleteError;
                }
            } finally {
                confirmDeleteAccountBtn.textContent = UI_TRANSLATIONS[currentLang].confirmDelete;
            }
        });
    }
    
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
        const t = UI_TRANSLATIONS[currentLang];
        submitBtn.disabled = true;
        submitBtn.textContent = '...';

        const nameVal = document.getElementById('contactName').value;
        const emailVal = document.getElementById('contactEmail').value;
        const subjectVal = document.getElementById('contactSubject').value;
        const messageVal = document.getElementById('contactMessage').value;

        // Bots fill this; people never see it. Sent along so the function can
        // drop the submission silently.
        const websiteVal = document.getElementById('contactWebsite').value;

        try {
            if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
                throw new Error('Supabase is not configured, so the contact function is unreachable');
            }

            const response = await fetch(`${SUPABASE_URL}/functions/v1/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'apikey': SUPABASE_ANON_KEY
                },
                body: JSON.stringify({
                    name: nameVal,
                    email: emailVal,
                    subject: subjectVal,
                    message: messageVal,
                    website: websiteVal
                })
            });
            if (!response.ok) {
                throw new Error(`Contact function failed with status ${response.status}`);
            }

            contactForm.style.display = 'none';
            contactSuccess.style.display = 'block';
        } catch (err) {
            console.error('Email delivery failed:', err);
            alert(t.contactError);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
    
    [detailModal, profileModal, contactModal, authModal, settingsModal, deleteAccountModal, signOutModal].forEach(modal => {
        if (!modal) return;
        modal.addEventListener('click', (e) => {
            if (e.target !== modal) return;
            if (modal === detailModal) {
                closeDetailModal();
            } else if (modal === deleteAccountModal) {
                closeDeleteAccountModal();
            } else if (modal === signOutModal) {
                closeSignOutModal();
            } else if (modal === profileModal) {
                closeProfileModal();
            } else {
                modal.classList.remove('active');
            }
        });
    });
    
    modalCheckBtn.addEventListener('click', () => {
        if (!selectedItemId) return;
        
        const isCompleted = !!completedItems[selectedItemId];
        if (isCompleted) {
            closeDetailModal();
        } else {
            const rect = modalCheckBtn.getBoundingClientRect();
            toggleComplete(selectedItemId, { clientX: rect.left + rect.width/2, clientY: rect.top });
            setTimeout(closeDetailModal, 600);
        }
    });

    modalUncheckBtn.addEventListener('click', () => {
        if (!selectedItemId || !completedItems[selectedItemId]) return;
        toggleComplete(selectedItemId);
        closeDetailModal();
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

init();
