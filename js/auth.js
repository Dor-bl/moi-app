// Auth Module - Shared Global Exports: SUPABASE_URL, SUPABASE_ANON_KEY, GOOGLE_CLIENT_ID, supabaseClient, currentUser, authGeneration, updateAuthBtnState, initAuth, onUserLoggedIn, onUserLoggedOut, syncCloudProgress, syncItemToCloud, describeMagicLinkError, finishMagicLinkSignIn, initGoogleSignIn, renderGoogleButton, deleteUserAccountAndData, buildAccountExport, exportMissesLocalChanges
// Dependencies: Expects UI_TRANSLATIONS, BUCKET_LIST, currentLang, completedItems, renderList, updateProgress, saveState.

// Supabase Configuration
const SUPABASE_URL = (typeof window !== 'undefined' && window.SUPABASE_URL) ? window.SUPABASE_URL : '';
const SUPABASE_ANON_KEY = (typeof window !== 'undefined' && window.SUPABASE_ANON_KEY) ? window.SUPABASE_ANON_KEY : '';
// Public OAuth client ID (the same one pasted into Supabase's Google provider).
// Optional: without it the app falls back to Supabase's redirect flow.
const GOOGLE_CLIENT_ID = (typeof window !== 'undefined' && window.GOOGLE_CLIENT_ID) ? window.GOOGLE_CLIENT_ID : '';

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
let authGeneration = 0;

// The user this tab itself last synced as. The marker in storage cannot say it: when
// another tab switches the browser to a different account, that tab moves the marker
// to the new user first, so by the time this tab receives the sign-in the marker
// already matches and nothing looks out of place. Null when this tab holds no
// account's progress (a fresh load, or after a sign-out), so guest ticks still merge.
let heldUserId = null;

// Which account the progress in this browser was last synced with. It lets us
// tell genuine guest progress (no marker) apart from another account's
// leftovers (marker belongs to somebody else), so signing in never re-uploads
// the previous user's ticks and notes under the new user's id. See issue #52.
const SYNCED_USER_KEY = 'moiCheckSyncedUser';

// user_progress.note has a server-side check (char_length <= 1000, see README).
// The textarea's maxlength stops new notes going over it, but notes written
// before that cap (#204) can still be longer, and one rejected row fails a
// whole batch upsert. Clamp by code point, which is what char_length counts,
// so the cut never splits an emoji into a lone surrogate.
const NOTE_MAX_LENGTH = 1000;
function clampNote(note) {
    const chars = Array.from(note || '');
    return chars.length > NOTE_MAX_LENGTH ? chars.slice(0, NOTE_MAX_LENGTH).join('') : (note || '');
}

function updateAuthBtnState(isLoggedIn) {
    const t = UI_TRANSLATIONS[currentLang];
    const authBtn = document.getElementById('authBtn');
    const userAccountBadge = document.getElementById('userAccountBadge');
    const userAccountEmail = document.getElementById('userAccountEmail');
    const accountDangerZone = document.getElementById('accountDangerZone');
    const signOutBtn = document.getElementById('signOutBtn');

    if (accountDangerZone) {
        accountDangerZone.style.display = (isLoggedIn && currentUser) ? 'block' : 'none';
    }
    // A failed export's message belongs to the session that saw it; don't let
    // it greet whoever signs in next.
    if (!(isLoggedIn && currentUser)) {
        const exportDataError = document.getElementById('exportDataError');
        if (exportDataError) exportDataError.textContent = '';
        const exportDataNotice = document.getElementById('exportDataNotice');
        if (exportDataNotice) exportDataNotice.textContent = '';
    }
    if (signOutBtn) signOutBtn.textContent = t.signOut;

    if (!authBtn) return;

    // Signed in, the header button goes away and signing out happens in the
    // profile modal (reached through the avatar). Keeping it here meant the
    // header grew by the width of an email address the moment someone logged
    // in, which is what crowded the row out on a phone.
    if (isLoggedIn && currentUser) {
        const shortEmail = currentUser.email ? currentUser.email.split('@')[0] : t.accountNameFallback;
        authBtn.hidden = true;
        if (userAccountBadge && userAccountEmail) {
            userAccountBadge.style.display = 'flex';
            userAccountEmail.textContent = t.syncedAs.replace('{account}', currentUser.email || shortEmail);
        }
    } else {
        authBtn.hidden = false;
        authBtn.textContent = t.signIn;
        if (userAccountBadge) {
            userAccountBadge.style.display = 'none';
        }
    }
}

// Turn a Supabase sign-in error into something a visitor can act on. A 5xx here
// means the request reached Supabase and failed inside it, so telling the user to
// check their email address (what the raw message often implies) sends them the
// wrong way; see README "Magic links fail with a 500" for the project-side fixes.
function describeMagicLinkError(error) {
    const status = error && error.status;

    if (status === 429) {
        return 'Too many sign-in attempts. Please wait a minute and try again.';
    }

    if (status >= 500) {
        return 'Sign-in is temporarily unavailable — the email could not be sent. This is on our side, not yours. Please try again later.';
    }

    return (error && error.message) || 'Could not send the magic link. Please try again.';
}

// Magic links no longer point at Supabase's verify endpoint. Mail scanners
// (Outlook, Office 365, most corporate filters) prefetch every link in a
// message, and that first fetch used up the one-time token before the person
// ever tapped it. The email template now links here with a token hash instead
// (see README), and nothing is verified until the visitor presses the button —
// a scanner fetching this page gets HTML and consumes nothing.
function getPendingMagicLink() {
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get('token_hash');
    if (!tokenHash) return null;
    return { tokenHash, type: params.get('type') || 'email' };
}

function clearMagicLinkFromUrl() {
    const url = new URL(window.location.href);
    url.searchParams.delete('token_hash');
    url.searchParams.delete('type');
    window.history.replaceState(null, '', url.pathname + url.search + url.hash);
}

function finishMagicLinkSignIn(pending) {
    const authModal = document.getElementById('authModal');
    const authActions = document.getElementById('authActions');
    const magicLinkSuccess = document.getElementById('magicLinkSuccess');
    const finish = document.getElementById('magicFinish');
    const finishBtn = document.getElementById('magicFinishBtn');
    const finishError = document.getElementById('magicFinishError');
    if (!authModal || !finish || !finishBtn) return;

    const t = () => UI_TRANSLATIONS[currentLang];

    authActions.style.display = 'none';
    magicLinkSuccess.style.display = 'none';
    finishError.textContent = '';
    delete finishBtn.dataset.retry;
    finishBtn.disabled = false;
    finishBtn.textContent = t().magicFinishBtn;
    finish.style.display = 'block';
    authModal.classList.add('active');

    finishBtn.onclick = async () => {
        // After a failed attempt the button turns into "request a new link":
        // the hash is single-use, so retrying the same one cannot succeed.
        if (finishBtn.dataset.retry) {
            finish.style.display = 'none';
            authActions.style.display = 'block';
            return;
        }

        finishBtn.disabled = true;
        finishBtn.textContent = '...';

        const { error } = await supabaseClient.auth.verifyOtp({
            token_hash: pending.tokenHash,
            type: pending.type
        });

        finishBtn.disabled = false;

        if (error) {
            console.error('Magic link verification failed:', {
                status: error.status,
                code: error.code,
                message: error.message
            }, error);
            finishError.textContent = t().magicFinishExpired;
            finishBtn.dataset.retry = '1';
            finishBtn.textContent = t().magicFinishRetry;
            return;
        }

        // onAuthStateChange picks up the new session; just put the modal back.
        finish.style.display = 'none';
        authActions.style.display = 'block';
        authModal.classList.remove('active');
    };
}

// Google sign-in runs on this origin instead of bouncing through Supabase's
// OAuth callback, so Google's consent screen names this site and the app
// rather than "<project>.supabase.co". Google Identity Services hands the
// browser an ID token; Supabase verifies it in signInWithIdToken. The nonce
// ties the token to this page load: we hash it ONCE here and give Google the
// SHA-256, which Google embeds in the token unchanged; we send Supabase the
// raw value, and Supabase hashes it to compare. Do not hash it again anywhere.
// With no client ID configured the redirect-based button stays in place, so
// this ships safely before the dashboard side is set up.
let googleNonce = '';
let googleSignInStarted = false;

function randomHex(byteLength) {
    const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(text) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
}

function googleIdentityReady() {
    return !!(window.google && window.google.accounts && window.google.accounts.id);
}

function loadGoogleIdentity() {
    return new Promise((resolve, reject) => {
        if (googleIdentityReady()) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Google Identity Services script failed to load'));
        document.head.appendChild(script);
    });
}

// Called when the sign-in dialog opens, not on page load: fetching Google's
// script contacts Google (IP address, its cookies), and the privacy policy
// says that happens only when someone goes to sign in. Idempotent, since the
// dialog opens more than once.
async function initGoogleSignIn() {
    if (!supabaseClient || !GOOGLE_CLIENT_ID) return;
    if (googleSignInStarted) return;
    googleSignInStarted = true;
    // crypto.subtle only exists in secure contexts (https and localhost); the
    // redirect flow still works everywhere else.
    if (!window.crypto || !window.crypto.subtle) return;

    const container = document.getElementById('googleSignInContainer');
    const fallbackBtn = document.getElementById('googleAuthBtn');
    if (!container || !fallbackBtn) return;

    try {
        await loadGoogleIdentity();
        googleNonce = randomHex(32);
        const hashedNonce = await sha256Hex(googleNonce);
        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            nonce: hashedNonce,
            callback: onGoogleCredential
        });
        renderGoogleButton();
        fallbackBtn.style.display = 'none';
        container.style.display = 'flex';
    } catch (err) {
        // Script blocked or failed: leave the redirect-based button as it is,
        // and allow another attempt next time the dialog opens.
        googleSignInStarted = false;
        console.warn('Google sign-in on this origin unavailable, using redirect flow:', err);
    }
}

// Idempotent: called on init and again on language or theme changes, since
// Google renders the button with a fixed locale and colour scheme.
function renderGoogleButton() {
    const container = document.getElementById('googleSignInContainer');
    if (!container || !googleIdentityReady()) return;

    const root = document.documentElement;
    const dark = root.getAttribute('data-theme') === 'dark'
        || (!root.hasAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);

    container.innerHTML = '';
    window.google.accounts.id.renderButton(container, {
        type: 'standard',
        theme: dark ? 'filled_black' : 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'left',
        locale: currentLang === 'nl' ? 'nl' : 'en'
    });
}

async function onGoogleCredential(response) {
    if (!response || !response.credential) return;

    const { error } = await supabaseClient.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
        nonce: googleNonce
    });

    if (error) {
        console.error('Google sign-in failed:', {
            status: error.status,
            code: error.code,
            message: error.message
        }, error);
        alert(error.message);
        return;
    }

    // onAuthStateChange picks up the session; just put the modal away.
    const authModal = document.getElementById('authModal');
    if (authModal) authModal.classList.remove('active');
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

        // Take the hash out of the address bar straight away — it is a
        // bearer credential and should not sit there to be copied, bookmarked
        // or sent as a Referer. The tap verifies from memory.
        const pendingMagicLink = getPendingMagicLink();
        if (pendingMagicLink) {
            clearMagicLinkFromUrl();
            finishMagicLinkSignIn(pendingMagicLink);
        }

        // Fetch existing active session
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session && session.user) {
            currentUser = session.user;
            await onUserLoggedIn();
        } else if (localStorage.getItem(SYNCED_USER_KEY)) {
            // Signed in on an earlier visit but there is no session now: it
            // expired, or sign-out happened while this tab was closed. Clear
            // that account's progress out of the browser. A tick made since
            // the session died is lost here unless its cloud write went
            // through at the time (syncItemToCloud is fire-and-forget: a
            // write that failed, offline say, is not retried).
            onUserLoggedOut();
        }

        // Listen for auth state changes
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            console.log('Supabase auth event:', event, session?.user?.email);
            if (session && session.user) {
                currentUser = session.user;
                await onUserLoggedIn();
                // Take the callback's fragment out of the address bar. The
                // library has usually cleared it already, but by assignment,
                // which leaves a bare "#" behind; drop that too, so nothing
                // is left to be fed back to the next sign-in.
                if (window.location.hash || window.location.href.endsWith('#')) {
                    window.history.replaceState(null, '', window.location.pathname + window.location.search);
                }
            } else if (event === 'SIGNED_OUT') {
                // Also reached when this tab never set currentUser (another tab
                // signed out, or the session was restored then dropped); the
                // marker is what says there is still progress left to clear.
                if (currentUser || localStorage.getItem(SYNCED_USER_KEY)) {
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
    authGeneration++;
    updateAuthBtnState(true);
    await syncCloudProgress();
    renderList();
    updateProgress();
}

// Sign-out leaves no progress from the signed-out account in this browser, so
// the next person to sign in on a shared device cannot inherit it. Preferences
// (moiCheckLang, moiCheckTheme, moiCheckCompletedCollapsed) are device settings
// rather than personal data and are deliberately kept.
function onUserLoggedOut() {
    // Clearing after the generation bump: any sync response still in flight is
    // already stale by the time it lands and will not write back into
    // completedItems.
    authGeneration++;
    completedItems = {};
    saveState();
    localStorage.removeItem(SYNCED_USER_KEY);
    heldUserId = null;
    updateAuthBtnState(false);
    renderList();
    updateProgress();
}

async function syncCloudProgress() {
    if (!supabaseClient || !currentUser) return;

    // Runs before the first await so nothing can interleave: if the progress
    // sitting in this browser was last synced with a different account, drop it
    // instead of uploading it under this user's id. A missing marker means
    // genuine guest progress, which still merges into the account as intended.
    // Sign-out already clears both, so this only catches the paths where it
    // never ran - a crashed tab, a session that expired, storage half-cleared.
    const lastSyncedUser = localStorage.getItem(SYNCED_USER_KEY);
    if (lastSyncedUser && lastSyncedUser !== currentUser.id) {
        completedItems = {};
        saveState();
    } else if (heldUserId !== null && heldUserId !== currentUser.id) {
        // This tab itself holds another user's progress: another tab switched the
        // browser's account without a sign-out here (see heldUserId). That tab has already
        // moved the marker to this user, so the stored progress is this user's own, and
        // may include ticks and notes that never reached the cloud. Take it in place of
        // this tab's copy and leave the store alone; wiping it would lose them if the
        // cloud read below fails. An unreadable store falls back to empty.
        let stored = null;
        try {
            stored = JSON.parse(localStorage.getItem('moiCheckState'));
        } catch {
            stored = null;
        }
        completedItems = (stored && typeof stored === 'object' && !Array.isArray(stored)) ? stored : {};
        // Every value has to be an object too, not just the container. The upload
        // below reads .note and .date off each one, and a single malformed entry
        // throws there, inside the try that only logs - dropping every pending
        // upsert and losing the unsynced progress this branch exists to keep.
        // Dropped in place rather than copied into a fresh object, so a stored
        // '__proto__' key stays the own property JSON.parse made it.
        for (const itemId of Object.keys(completedItems)) {
            const value = completedItems[itemId];
            if (!value || typeof value !== 'object' || Array.isArray(value)) {
                delete completedItems[itemId];
            }
        }
        // Written back now, not left to the save further down: a failed cloud read
        // returns before that one, and the bad entry would stay in storage to be loaded
        // as it is on the next page load.
        saveState();
    }
    localStorage.setItem(SYNCED_USER_KEY, currentUser.id);
    heldUserId = currentUser.id;

    const generation = authGeneration;
    const stale = () => generation !== authGeneration;

    try {
        const { data, error } = await supabaseClient
            .from('user_progress')
            .select('*')
            .eq('user_id', currentUser.id);

        if (stale()) return;

        // The marker was set to this user before the query. If it names someone else now,
        // another tab switched the browser to that account while the query was in flight;
        // if it is gone, another tab signed out and emptied the store. Either way this
        // tab's auth listener has not run yet (so stale() cannot see it) and the store is
        // no longer ours: writing this tab's copy over it, or uploading from it, would
        // hand one account's progress to the other or leave it behind after sign-out.
        if (localStorage.getItem(SYNCED_USER_KEY) !== currentUser.id) return;

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
            // saveState(), not saveItems(), on purpose. This path ends in a full upload of
            // completedItems under currentUser.id, so it must hold only this tab's own
            // view. saveItems() would first adopt whatever another tab has put in the
            // shared store while the query above was in flight: after an account switch
            // there, that is a different account's private progress, and the upload below
            // would hand it to this one. Overwriting is the safe direction here.
            saveState();

            // ⚡ Bolt Performance Optimization:
            // Batching API Calls & O(1) Set Lookup
            // Impact: Converts O(N) sequential HTTP requests and O(N) array scans into a single
            // O(1) HTTP request and O(1) Set lookups. Drastically improves login speed for
            // users syncing many local guest items to their new cloud account.
            const cloudItemIds = new Set(data.map(d => d.item_id));
            const localEntries = Object.entries(completedItems);
            const missingInCloud = [];

            for (let [itemId, localData] of localEntries) {
                if (stale()) return;
                if (!cloudItemIds.has(itemId)) {
                    missingInCloud.push({
                        user_id: currentUser.id,
                        item_id: itemId,
                        note: clampNote(localData.note),
                        date: localData.date || new Date().toISOString()
                    });
                }
            }

            if (missingInCloud.length > 0) {
                if (stale()) return;
                const { error: upsertError } = await supabaseClient.from('user_progress').upsert(missingInCloud);
                if (stale()) return;

                if (upsertError) {
                    console.log('Cloud sync upsert note:', upsertError.message);
                }
            }
        }
    } catch (err) {
        console.log('Sync note:', err);
    }
}

// PostgREST returns PGRST202 for undefined functions; PostgreSQL returns 42883.
// Only treat 42883 as missing RPC when the error message specifically refers to delete_user.
function isMissingRpcError(error) {
    if (!error) return false;
    if (error.code === 'PGRST202') return true;
    if (error.code === '42883' && typeof error.message === 'string' && error.message.includes('delete_user')) {
        return true;
    }
    return false;
}

// GDPR Art. 20 (#89): everything we hold about the signed-in account, as a plain
// object ready to download. Reads user_progress at call time rather than using
// completedItems, so the file never depends on whether background sync finished.
// Returns null if the account changed while the request was in flight (the
// generation counter), and throws if the read fails, so the caller can show an
// error rather than hand over an incomplete file.
async function buildAccountExport() {
    if (!supabaseClient || !currentUser) throw new Error('Not signed in');
    const generation = authGeneration;
    const user = currentUser;
    const { data, error } = await supabaseClient
        .from('user_progress')
        .select('item_id, date, note')
        .eq('user_id', user.id);
    if (generation !== authGeneration) return null;
    if (error) throw error;
    // Google sign-in stores the profile name and picture here; magic-link
    // accounts have neither, and get nulls rather than invented values.
    const meta = user.user_metadata || {};
    // app_metadata.provider is only the method the account was created with;
    // providers lists every method linked since (an email sign-up that later
    // used Google has both), so that is what the file reports.
    const appMeta = user.app_metadata || {};
    const providers = Array.isArray(appMeta.providers) && appMeta.providers.length
        ? appMeta.providers
        : (appMeta.provider ? [appMeta.provider] : []);
    return {
        exported_at: new Date().toISOString(),
        account: {
            id: user.id,
            email: user.email,
            name: meta.full_name || meta.name || null,
            avatar_url: meta.avatar_url || null,
            sign_in_providers: providers,
            created_at: user.created_at || null,
            last_sign_in_at: user.last_sign_in_at || null
        },
        // Oldest first, so the file reads as a timeline rather than in
        // whatever order the database returned the rows.
        completed_items: (data || [])
            .slice()
            .sort((a, b) => (Date.parse(a.date) || 0) - (Date.parse(b.date) || 0))
            .map(row => {
                const item = BUCKET_LIST.find(i => String(i.id) === String(row.item_id));
                return { item_id: row.item_id, title: item ? item.title[currentLang] : null, date: row.date, note: row.note || '' };
            })
    };
}

// True when this browser shows completions or notes the exported cloud rows
// lack (or the reverse), i.e. a background save has not reached the cloud.
// The export stays cloud-only; this only lets the page warn that the file may
// be missing recent changes. Dates are not compared: the cloud may format them
// differently from the local copy.
function exportMissesLocalChanges(exportedItems, localItems) {
    const cloud = new Map((exportedItems || []).map(i => [String(i.item_id), i.note || '']));
    const localIds = Object.keys(localItems || {});
    if (localIds.length !== cloud.size) return true;
    return localIds.some(id => !cloud.has(id) || cloud.get(id) !== (localItems[id].note || ''));
}

// GDPR Art. 17: Delete account and cloud data for the signed-in user.
// Calls delete_user() RPC which atomically deletes progress rows and the auth.users record.
// If the RPC has not been installed on the Supabase project yet, throws DELETE_NOT_CONFIGURED
// so the user is informed and their local data stays intact.
async function deleteUserAccountAndData(targetUserId) {
    if (!supabaseClient || !currentUser) {
        throw new Error('Not signed in');
    }

    if (targetUserId && currentUser.id !== targetUserId) {
        throw new Error('User changed');
    }

    // Bump authGeneration so any in-flight cloud sync responses are discarded immediately
    authGeneration++;

    // Timeout safeguard (15s): actively abort the in-flight request if the connection hangs
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let rpcResult;
    try {
        const query = supabaseClient.rpc('delete_user');
        rpcResult = await (typeof query.abortSignal === 'function'
            ? query.abortSignal(controller.signal)
            : query);
    } catch (err) {
        if (controller.signal.aborted || (err && err.name === 'AbortError')) {
            const timeoutErr = new Error('Deletion request timed out');
            timeoutErr.code = 'DELETE_ERROR';
            throw timeoutErr;
        }
        throw err;
    } finally {
        clearTimeout(timeoutId);
    }

    const { error: rpcError } = rpcResult;
    if (rpcError) {
        if (controller.signal.aborted) {
            const timeoutErr = new Error('Deletion request timed out');
            timeoutErr.code = 'DELETE_ERROR';
            throw timeoutErr;
        }
        if (isMissingRpcError(rpcError)) {
            const err = new Error('delete_user() RPC is not configured');
            err.code = 'DELETE_NOT_CONFIGURED';
            throw err;
        }
        const err = new Error(rpcError.message || 'Deletion failed');
        err.code = 'DELETE_ERROR';
        throw err;
    }

    // Clear local progress in this browser
    completedItems = {};
    saveState();

    // Sign out of Supabase cleanly.
    // Note: supabase-js may receive 403 on the server logout call because auth.users is already deleted,
    // but it clears the local session and triggers SIGNED_OUT.
    try {
        await supabaseClient.auth.signOut({ scope: 'local' });
    } catch (signOutErr) {
        console.warn('Sign-out note after deletion:', signOutErr);
    }

    currentUser = null;
    onUserLoggedOut();

    return { authDeleted: true };
}

async function syncItemToCloud(itemId, isCompleted, note = '') {
    if (!supabaseClient || !currentUser) return;
    // The same ownership check as saveItems() and syncCloudProgress(): if another tab
    // switched accounts or signed out and this tab has not heard yet, do not send. RLS
    // would reject the write anyway (the token is no longer this user's); this just
    // keeps a stale tab from trying.
    if (localStorage.getItem(SYNCED_USER_KEY) !== currentUser.id) return;

    try {
        if (isCompleted) {
            // Keep the original completion date: this also runs when only the note
            // is edited, and a fresh timestamp would overwrite it in the cloud.
            const existing = completedItems[itemId];
            await supabaseClient.from('user_progress').upsert({
                user_id: currentUser.id,
                item_id: itemId,
                note: clampNote(note),
                date: (existing && existing.date) || new Date().toISOString()
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

