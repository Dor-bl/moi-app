// Application Core - Main UI Orchestration & Event Dispatching

// State
let completedItems = JSON.parse(localStorage.getItem('moiCheckState')) || {};
let currentLang = localStorage.getItem('moiCheckLang') || 'en';
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

        pill.innerHTML = '';

        const labelEl = document.createElement('span');
        labelEl.textContent = label;
        pill.appendChild(labelEl);

        const countEl = document.createElement('span');
        countEl.className = 'filter-pill-count';
        countEl.textContent = remaining > 0 ? remaining : '✓';
        // The badge on its own reads as a bare number; the pill's aria-label below
        // says what it counts, so hide this from the accessibility tree.
        countEl.setAttribute('aria-hidden', 'true');
        pill.appendChild(countEl);

        const status = remaining > 0
            ? t.remainingCount.replace('{count}', remaining)
            : t.allDone;
        pill.setAttribute('aria-label', `${label}, ${status}`);
    });
}

function updateLanguageUI() {
    const t = UI_TRANSLATIONS[currentLang];

    langBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === currentLang);
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

    updateAuthBtnState(!!currentUser);
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
    const filteredList = getFilteredItems(currentFilter);

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

function isCompletedCollapsed(count) {
    if (completedCollapsedPref === null) return count > 2;
    return completedCollapsedPref === 'true';
}

const cardCache = new Map();

function buildCard(item) {
    const isCompleted = !!completedItems[item.id];
    let card = cardCache.get(item.id);

    if (!card) {
        card = document.createElement('div');
        card.dataset.id = item.id;
        card.innerHTML = `
            <div class="checkbox-container">
                <div class="checkbox" data-id="${item.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
            </div>
            <div class="card-content">
                <span class="card-category"></span>
                <h3 class="card-title"></h3>
                <p class="card-tip"></p>
            </div>
        `;
        cardCache.set(item.id, card);
    }

    card.className = `bucket-card ${isCompleted ? 'completed' : ''}`;

    if (card.dataset.lang !== currentLang) {
        card.querySelector('.card-category').textContent = item.category[currentLang];
        card.querySelector('.card-title').textContent = item.title[currentLang];
        card.querySelector('.card-tip').textContent = item.tip[currentLang];
        card.dataset.lang = currentLang;
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
    listContainer.innerHTML = '';
    
    const filteredList = getFilteredItems(currentFilter);

    // Completed items sink below a divider, keeping what is left to do at the top.
    // Both partitions keep the original BUCKET_LIST order.
    const todo = filteredList.filter(item => !completedItems[item.id]);
    const done = filteredList.filter(item => !!completedItems[item.id]);

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

    listContainer.appendChild(fragment);

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
    badgesGrid.innerHTML = '';
    const t = UI_TRANSLATIONS[currentLang];

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
        badgesGrid.appendChild(card);
    });
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

function formatMemoryDate(value) {
    if (!value) return '';
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString(currentLang === 'nl' ? 'nl-NL' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function openProfileModal() {
    completedList.innerHTML = '';
    const t = UI_TRANSLATIONS[currentLang];
    
    renderBadges();
    
    const completedArr = Object.entries(completedItems).map(([id, data]) => {
        const item = itemsById[id];
        return item ? { ...item, ...data } : null;
    }).filter(Boolean).sort((a, b) => memoryTimestamp(b.date) - memoryTimestamp(a.date));
    
    if (completedArr.length === 0) {
        completedList.innerHTML = `<p style="color: var(--text-light); text-align: center; padding: 2rem;">${t.noMemories}</p>`;
    } else {
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

            completedList.appendChild(div);
        });
    }
    
    profileModal.classList.add('active');
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
        const t = UI_TRANSLATIONS[currentLang];
        submitBtn.disabled = true;
        submitBtn.textContent = '...';

        const nameVal = document.getElementById('contactName').value;
        const emailVal = document.getElementById('contactEmail').value;
        const subjectVal = document.getElementById('contactSubject').value;
        const messageVal = document.getElementById('contactMessage').value;

        const targetEmail = atob('ZGJsYXl6ZXJAZ21haWwuY29t');
        
        try {
            const response = await fetch(`https://formsubmit.co/ajax/${targetEmail}`, {
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
            if (!response.ok) {
                throw new Error(`FormSubmit request failed with status ${response.status}`);
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
    
    [detailModal, profileModal, contactModal, authModal, settingsModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target !== modal) return;
            if (modal === detailModal) {
                closeDetailModal();
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
