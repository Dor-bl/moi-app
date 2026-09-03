// Auth Module - Shared Global Exports: SUPABASE_URL, SUPABASE_ANON_KEY, GOOGLE_CLIENT_ID, supabaseClient, currentUser, updateAuthBtnState, initAuth, onUserLoggedIn, onUserLoggedOut, syncCloudProgress, syncItemToCloud, describeMagicLinkError, finishMagicLinkSignIn, initGoogleSignIn, renderGoogleButton, deleteUserAccountAndData
// Dependencies: Expects UI_TRANSLATIONS, currentLang, completedItems, renderList, updateProgress, saveState.

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

function updateAuthBtnState(isLoggedIn) {
    const t = UI_TRANSLATIONS[currentLang];
    const authBtn = document.getElementById('authBtn');
    const userAccountBadge = document.getElementById('userAccountBadge');
    const userAccountEmail = document.getElementById('userAccountEmail');
    const accountDangerZone = document.getElementById('accountDangerZone');

    if (accountDangerZone) {
        accountDangerZone.style.display = (isLoggedIn && currentUser) ? 'block' : 'none';
    }

    if (!authBtn) return;

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
// ties the token to this page load: Google embeds the SHA-256 of the value
// we give it, Supabase hashes the raw value we send back and compares.
// With no client ID configured the redirect-based button stays in place, so
// this ships safely before the dashboard side is set up.
let googleNonce = '';

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

async function initGoogleSignIn() {
    if (!supabaseClient || !GOOGLE_CLIENT_ID) return;
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
        // Script blocked or failed: leave the redirect-based button as it is.
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

    // Not awaited: the button swaps in when Google's script arrives, and the
    // rest of auth setup should not wait on a third-party download.
    initGoogleSignIn();

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
    authGeneration++;
    updateAuthBtnState(true);
    await syncCloudProgress();
    renderList();
    updateProgress();
}

function onUserLoggedOut() {
    authGeneration++;
    updateAuthBtnState(false);
    renderList();
    updateProgress();
}

async function syncCloudProgress() {
    if (!supabaseClient || !currentUser) return;

    const generation = authGeneration;
    const stale = () => generation !== authGeneration;

    try {
        const { data, error } = await supabaseClient
            .from('user_progress')
            .select('*')
            .eq('user_id', currentUser.id);

        if (stale()) return;

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
                if (stale()) return;
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

    try {
        if (isCompleted) {
            // Keep the original completion date: this also runs when only the note
            // is edited, and a fresh timestamp would overwrite it in the cloud.
            const existing = completedItems[itemId];
            await supabaseClient.from('user_progress').upsert({
                user_id: currentUser.id,
                item_id: itemId,
                note: note,
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

