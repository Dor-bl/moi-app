// Auth Module - Shared Global Exports: SUPABASE_URL, SUPABASE_ANON_KEY, supabaseClient, currentUser, updateAuthBtnState, initAuth, onUserLoggedIn, onUserLoggedOut, syncCloudProgress, syncItemToCloud, describeMagicLinkError, finishMagicLinkSignIn, deleteUserAccountAndData
// Dependencies: Expects UI_TRANSLATIONS, currentLang, completedItems, renderList, updateProgress, saveState.

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

// Bumped on every sign-in, sign-out and account deletion. Cloud sync waits on
// the network, and whatever it fetched must not be applied once the account it
// was fetched for is no longer the current one: a slow response could otherwise
// repopulate local storage after a sign-out or deletion had cleared it.
let authGeneration = 0;

// Cloud writes that have left the browser but not yet completed. Account
// deletion waits for these: an upsert landing after the fallback row delete
// would quietly recreate the row, and one landing inside the RPC's transaction
// would make the auth delete fail on the foreign key.
const pendingCloudWrites = new Set();

function trackCloudWrite(request) {
    const promise = Promise.resolve(request);
    pendingCloudWrites.add(promise);
    const done = () => pendingCloudWrites.delete(promise);
    promise.then(done, done);
    return promise;
}

function updateAuthBtnState(isLoggedIn) {
    const t = UI_TRANSLATIONS[currentLang];
    const authBtn = document.getElementById('authBtn');
    const userAccountBadge = document.getElementById('userAccountBadge');
    const userAccountEmail = document.getElementById('userAccountEmail');
    const accountDangerZone = document.getElementById('accountDangerZone');

    if (!authBtn) return;

    // The delete-account section only makes sense with a cloud account to delete.
    if (accountDangerZone) {
        accountDangerZone.style.display = (isLoggedIn && currentUser) ? 'block' : 'none';
    }

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

        // The account changed (sign-out, deletion, another sign-in) while the
        // request was in flight: this data belongs to a session that is over.
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
                    await trackCloudWrite(supabaseClient.from('user_progress').upsert({
                        user_id: currentUser.id,
                        item_id: itemId,
                        note: localData.note || '',
                        date: localData.date || new Date().toISOString()
                    }));
                }
            }
        }
    } catch (err) {
        console.log('Sync note:', err);
    }
}

// PostgREST answers a call to a function that does not exist with PGRST202;
// Postgres itself says 42883 (undefined_function). Either means the project
// has not run the delete_user() snippet from the README yet, which is a
// different situation from the function existing and failing.
function isMissingRpcError(error) {
    return !!error && (error.code === 'PGRST202' || error.code === '42883');
}

// GDPR Art. 17: remove everything we hold for the signed-in person. The
// delete_user() RPC (README) removes the cloud rows and the auth record
// together, then the local copy is cleared and the session ended. Throws on
// any failure before anything local is touched, so the session stays intact
// and the person can simply try again.
// Resolves to { authDeleted } — false when the project has no delete_user()
// function, in which case only the progress rows are gone.
async function deleteUserAccountAndData() {
    if (!supabaseClient || !currentUser) {
        throw new Error('Not signed in');
    }

    const userId = currentUser.id;

    // From here on nothing fetched for this account may land in local state: a
    // cloud sync still waiting on the network would otherwise restore the list
    // after the wipe below, or start new upserts behind the RPC's back.
    authGeneration++;

    // Writes already on the wire cannot be cancelled, so let them finish
    // before anything is deleted (see pendingCloudWrites).
    await Promise.allSettled([...pendingCloudWrites]);

    // The RPC removes the progress rows and the auth record in one transaction,
    // so either everything goes or nothing does. Only a project that has not
    // created delete_user() yet falls back to deleting the rows directly (RLS
    // scopes that to the caller's own rows); its auth record then stays.
    let authDeleted = true;
    const { error: rpcError } = await supabaseClient.rpc('delete_user');
    if (rpcError) {
        if (!isMissingRpcError(rpcError)) throw rpcError;
        authDeleted = false;
        console.warn('delete_user() RPC is not configured; deleting progress rows only. See README.');
        const { error: rowsError } = await supabaseClient
            .from('user_progress')
            .delete()
            .eq('user_id', userId);
        if (rowsError) throw rowsError;
    }

    // Wipe the local copy before signing out: the SIGNED_OUT handler re-renders
    // the list and should find it already empty. Leaving it would also make
    // syncCloudProgress() upload it all again on the next sign-in.
    completedItems = {};
    saveState();

    // supabase-js still calls /auth/v1/logout here, and the server answers 403
    // because the user no longer exists. The browser logs that failed request
    // in the console; nothing else is wrong. The library treats 401/403/404 on
    // logout as "already signed out", clears the local session and fires
    // SIGNED_OUT, which puts the UI back into guest mode. Local scope just
    // avoids asking the server to revoke other sessions that are already gone.
    const { error: signOutError } = await supabaseClient.auth.signOut({ scope: 'local' });
    if (signOutError) {
        // Anything other than the 401/403/404 the library swallows (a network
        // error, say) leaves the session in storage and currentUser set while
        // the account is already gone. Drop the session ourselves rather than
        // report success with the UI still signed in.
        console.warn('Sign-out after account deletion failed; clearing the stored session directly:', signOutError.message);
        clearLocalSession();
    }

    return { authDeleted };
}

// Last resort when supabase-js could not sign out: remove its persisted session
// (stored under sb-<project-ref>-auth-token) and put the UI into guest mode.
function clearLocalSession() {
    try {
        Object.keys(localStorage)
            .filter(key => key.startsWith('sb-') && key.endsWith('-auth-token'))
            .forEach(key => localStorage.removeItem(key));
    } catch (err) {
        console.warn('Could not clear the stored session:', err);
    }
    if (currentUser) {
        currentUser = null;
        onUserLoggedOut();
    }
}

async function syncItemToCloud(itemId, isCompleted, note = '') {
    if (!supabaseClient || !currentUser) return;

    try {
        if (isCompleted) {
            // Keep the original completion date: this also runs when only the note
            // is edited, and a fresh timestamp would overwrite it in the cloud.
            const existing = completedItems[itemId];
            await trackCloudWrite(supabaseClient.from('user_progress').upsert({
                user_id: currentUser.id,
                item_id: itemId,
                note: note,
                date: (existing && existing.date) || new Date().toISOString()
            }));
        } else {
            await trackCloudWrite(supabaseClient.from('user_progress')
                .delete()
                .eq('user_id', currentUser.id)
                .eq('item_id', itemId));
        }
    } catch (err) {
        console.log('Cloud update note:', err);
    }
}
