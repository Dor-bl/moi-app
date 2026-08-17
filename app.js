const BUCKET_LIST = [
    { id: '1', category: 'Food & Drink', title: 'Eat your first Groninger Eierbal', tip: 'Grab one hot from a snackbar or the automatic wall (automatiek).' },
    { id: '2', category: 'Food & Drink', title: 'Order Patat Oorlog at the Vismarkt', tip: 'Fries with mayo, peanut satay sauce, and raw diced onions.' },
    { id: '3', category: 'Food & Drink', title: 'Try fresh Stroopwafels at the Tuesday/Saturday market', tip: 'Get them warm and fresh from the market stall at Vismarkt.' },
    { id: '4', category: 'Food & Drink', title: 'Buy Kruidkoek or Groninger Koek', tip: 'A spiced local slice, great with butter alongside coffee.' },
    { id: '5', category: 'Culture & Sights', title: 'Climb the Martinitoren (d\'Olle Grieze)', tip: '300+ steps to the top for the best view over the province.' },
    { id: '6', category: 'Culture & Sights', title: 'Explore the colorful houses at Reitdiephaven', tip: 'The classic postcard photo spot on the city’s edge.' },
    { id: '7', category: 'Culture & Sights', title: 'Visit the Forum Groningen rooftop', tip: 'Free panoramic view, great library, and open terrace.' },
    { id: '8', category: 'Culture & Sights', title: 'Tour the Groninger Museum', tip: 'Distinctive postmodern architecture right opposite the central station.' },
    { id: '9', category: 'Culture & Sights', title: 'Have a picnic at Noorderplantsoen', tip: 'The social heart of the city during sunny spring and summer days.' },
    { id: '10', category: 'Daily Life', title: 'Say "Moi!" to a bus driver or neighbor', tip: 'The quintessential universal northern greeting.' },
    { id: '11', category: 'Daily Life', title: 'Navigate the Grote Markt intersection on a bicycle', tip: 'Master the art of free-flowing Dutch bike traffic.' },
    { id: '12', category: 'Daily Life', title: 'Park in the underground bike garage at Central Station', tip: 'Experience multi-level bicycle infrastructure firsthand.' },
    { id: '13', category: 'Daily Life', title: 'Bike in the rain wearing full waterproof gear (regenpak)', tip: 'The ultimate rite of passage for Dutch daily commuting.' },
    { id: '14', category: 'Daily Life', title: 'Visit a Kringloop (thrift store) for home items', tip: 'Quintessential Dutch practical way to furnish a flat.' },
    { id: '15', category: 'Groningen Classics', title: 'Take a day trip to Schiermonnikoog or Ameland', tip: 'Catch the bus to Lauwersoog and take the ferry to the Wadden Islands.' },
    { id: '16', category: 'Groningen Classics', title: 'Visit the star fortress town of Bourtange', tip: 'A restored 16th-century fortified village near the German border.' },
    { id: '17', category: 'Groningen Classics', title: 'Grab an evening beer at the Drie Gezusters', tip: 'One of the largest pub complexes in Europe on the Grote Markt.' },
    { id: '18', category: 'Groningen Classics', title: 'Watch an FC Groningen match at the Euroborg', tip: 'Experience local football pride with the Green-White Army.' },
    { id: '19', category: 'Groningen Classics', title: 'Walk around the historic Gasthuizen courtyards', tip: 'Peaceful hidden medieval courtyards tucked behind city streets.' },
    { id: '20', category: 'Groningen Classics', title: 'Do grocery shopping at the open-air market', tip: 'Buy fresh cheese, vegetables, and fish at the Vismarkt.' }
];

const MILESTONES = [
    { threshold: 0, title: 'Newcomer' },
    { threshold: 5, title: 'Stadjer in Training' },
    { threshold: 10, title: 'Halfway Groninger' },
    { threshold: 15, title: 'Local Expert' },
    { threshold: 20, title: 'Real Groninger' }
];

// State
let completedItems = JSON.parse(localStorage.getItem('moiCheckState')) || {};
let currentFilter = 'All';
let selectedItemId = null;

// DOM Elements
const listContainer = document.getElementById('listContainer');
const filterPills = document.querySelectorAll('.filter-pill');
const progressCount = document.getElementById('progressCount');
const progressFill = document.getElementById('progressFill');
const currentMilestone = document.getElementById('currentMilestone');

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

function init() {
    renderList();
    updateProgress();
    setupEventListeners();
}

function renderList() {
    listContainer.innerHTML = '';
    
    const filteredList = currentFilter === 'All' 
        ? BUCKET_LIST 
        : BUCKET_LIST.filter(item => item.category === currentFilter);

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
                <span class="card-category">${item.category}</span>
                <h3 class="card-title">${item.title}</h3>
                <p class="card-tip">${item.tip}</p>
            </div>
        `;
        
        // Prevent modal opening if checkbox is clicked directly
        const checkbox = card.querySelector('.checkbox');
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleComplete(item.id, e);
        });

        card.addEventListener('click', () => openDetailModal(item));
        
        listContainer.appendChild(card);
    });
}

function getMilestone(count) {
    let current = MILESTONES[0];
    for (let milestone of MILESTONES) {
        if (count >= milestone.threshold) {
            current = milestone;
        }
    }
    return current.title;
}

function updateProgress() {
    const completedCount = Object.keys(completedItems).length;
    const totalCount = BUCKET_LIST.length;
    const percentage = (completedCount / totalCount) * 100;
    
    progressCount.textContent = `${completedCount} of ${totalCount} completed`;
    progressFill.style.width = `${percentage}%`;
    
    const milestone = getMilestone(completedCount);
    currentMilestone.textContent = milestone;
    profileMilestone.textContent = milestone;
    profileProgressText.textContent = `${completedCount} of ${totalCount} completed`;
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
    
    // Update modal button state if open
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
    
    modalCategory.textContent = item.category;
    modalTitle.textContent = item.title;
    modalTip.textContent = item.tip;
    
    if (isCompleted) {
        memoryNote.value = completedItems[item.id].note || '';
    } else {
        memoryNote.value = '';
    }
    
    updateModalButtonState(isCompleted);
    detailModal.classList.add('active');
}

function updateModalButtonState(isCompleted) {
    if (isCompleted) {
        modalCheckBtn.textContent = 'Completed';
        modalCheckBtn.classList.add('completed');
    } else {
        modalCheckBtn.textContent = 'Mark as Complete';
        modalCheckBtn.classList.remove('completed');
    }
}

function openProfileModal() {
    completedList.innerHTML = '';
    
    const completedArr = Object.entries(completedItems).map(([id, data]) => {
        return {
            ...BUCKET_LIST.find(i => i.id === id),
            ...data
        };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (completedArr.length === 0) {
        completedList.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 2rem;">No memories yet. Go explore Groningen!</p>';
    } else {
        completedArr.forEach(item => {
            const div = document.createElement('div');
            div.className = 'completed-item';
            div.innerHTML = `
                <h4>${item.title}</h4>
                ${item.note ? `<p>"${item.note}"</p>` : ''}
            `;
            completedList.appendChild(div);
        });
    }
    
    profileModal.classList.add('active');
}

function setupEventListeners() {
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
    
    // Modal background click to close
    [detailModal, profileModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Check from modal
    modalCheckBtn.addEventListener('click', (e) => {
        if (!selectedItemId) return;
        
        // Save note if already completed and button clicked to update note
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

    // Share functionality
    shareBtn.addEventListener('click', async () => {
        const completedCount = Object.keys(completedItems).length;
        const totalCount = BUCKET_LIST.length;
        const milestone = getMilestone(completedCount);
        const text = `I just unlocked '${milestone}' status on MoiCheck! I've completed ${completedCount}/${totalCount} classic Groningen experiences.`;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My Groningen Bucket List',
                    text: text,
                    url: window.location.href
                });
            } catch (err) {
                console.log('Share error:', err);
            }
        } else {
            // Fallback for desktop/unsupported browsers
            navigator.clipboard.writeText(text).then(() => {
                const originalText = shareBtn.textContent;
                shareBtn.textContent = 'Copied to Clipboard!';
                setTimeout(() => shareBtn.textContent = originalText, 2000);
            });
        }
    });
}

function createConfetti(x, y) {
    for (let i = 0; i < 8; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        
        // Random position around the click
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 30;
        
        confetti.style.left = `${x + Math.cos(angle) * distance}px`;
        confetti.style.top = `${y + Math.sin(angle) * distance}px`;
        
        // Random colors
        const colors = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899'];
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
            confetti.remove();
        }, 500);
    }
}

// Initialize the app
init();
