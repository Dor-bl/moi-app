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
// deletion waits for these: an upsert landing inside the RPC's transaction
// would make the auth delete fail on the foreign key, and one landing after it
// would fail on that same key and surface as a stray error, so the RPC only
// starts once the wire is quiet.
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
        if (isDeletedUserSession(session)) {
            await discardDeletedUserSession(session.user.id);
        } else if (session && session.user) {
            if (deletedUserId()) localStorage.removeItem(DELETED_USER_KEY);
            currentUser = session.user;
            await onUserLoggedIn();
        } else if (deletedUserId()) {
            localStorage.removeItem(DELETED_USER_KEY);
        }

        // Listen for auth state changes
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            console.log('Supabase auth event:', event, session?.user?.email);
            if (isDeletedUserSession(session)) {
                // A refresh or restore of an account deleted from this browser.
                return;
            }
            if (session && session.user) {
                if (deletedUserId()) localStorage.removeItem(DELETED_USER_KEY);
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
    if (!supabaseClient || !currentUser || deletionInProgress) return;

    const generation = authGeneration;
    const stale = () => generation !== authGeneration || deletionInProgress;

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

// "The project has not run the delete_user() snippet from the README yet" is a
// different situation from the function existing and failing: the former gets
// a "not available here" message, the latter a "try again". PostgREST reports
// a function missing from its schema cache as PGRST202. Postgres reports 42883
// (undefined_function) too, but it raises the same code from inside a function
// body when *that* calls something undefined (a trigger, say), so 42883 only
// counts when the message names delete_user itself.
function isMissingRpcError(error) {
    if (!error) return false;
    if (error.code === 'PGRST202') return true;
    return error.code === '42883' && /\bdelete_user\b/.test(error.message || '');
}

// Errors that say nothing about whether the RPC ran: the request never got an
// answer (postgrest-js reports a failed or aborted fetch with an empty or
// non-string code) or a gateway answered in the database's place (5xx). The
// function may well have committed.
function isAmbiguousRpcError(error) {
    if (!error) return false;
    const code = error.code;
    if (typeof code !== 'string' || code === '') return true;
    if (/^5\d\d$/.test(code)) return true;
    return /abort/i.test(error.message || '');
}

// Other tabs of the same account keep their own in-memory copy and can write
// it back to storage after this tab has cleared it (a delayed sync, an edit).
// deletionInProgress and authGeneration only reach this tab, so the commit is
// announced on a channel and every listening tab of that account invalidates
// its sync, drops its copy and goes to guest mode.
const AUTH_CHANNEL_NAME = 'moicheck-auth';
const authChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(AUTH_CHANNEL_NAME) : null;

if (authChannel) {
    authChannel.onmessage = (event) => {
        const message = event && event.data;
        if (message && message.type === 'account-deleted' && message.userId) {
            handleAccountDeletedElsewhere(message.userId);
        }
    };
}

function announceAccountDeleted(userId) {
    if (!authChannel) return;
    try {
        authChannel.postMessage({ type: 'account-deleted', userId });
    } catch (err) {
        console.warn('Could not announce the deletion to other tabs:', err);
    }
}

async function handleAccountDeletedElsewhere(userId) {
    if (!currentUser || currentUser.id !== userId) return;
    console.warn('This account was deleted from another tab; clearing the local copy here.');
    authGeneration++;
    // Same decision as the deleting tab: another account may already hold
    // this device (its session stored by a third tab), in which case only
    // this tab's known items are quarantined from storage.
    const knownItemIds = Object.keys(completedItems);
    try {
        await clearLocalProgressUnlessTakenOver(userId, knownItemIds);
    } catch (err) {
        console.warn('Could not clear stored progress:', err);
        completedItems = {};
    }
    // Re-check after the await: this tab may itself have switched accounts.
    if (currentUser && currentUser.id === userId) {
        currentUser = null;
        onUserLoggedOut();
    }
}

function hasWebLocks() {
    return typeof navigator !== 'undefined' && !!navigator.locks && typeof navigator.locks.request === 'function';
}

// Each delete_user() attempt is bounded: fetch has no timeout of its own, and a
// stalled request would otherwise keep the dialog busy forever. A timed-out
// attempt counts as unanswered (it may still commit server-side).
const DELETE_ATTEMPT_TIMEOUT_MS = 15000;

function deleteAttemptTimeoutMs() {
    const override = typeof window !== 'undefined' ? window.MOICHECK_DELETE_TIMEOUT_MS : undefined;
    return Number.isFinite(override) && override > 0 ? override : DELETE_ATTEMPT_TIMEOUT_MS;
}

// Resolves true once `promise` settles, false if `ms` pass first. The promise
// itself is left running; the caller decides what a timeout means.
function settlesWithin(promise, ms) {
    return Promise.race([
        Promise.resolve(promise).then(() => true, () => true),
        new Promise(resolve => setTimeout(() => resolve(false), ms))
    ]);
}

// True while deleteUserAccountAndData() is running. Cloud sync and item writes
// must not start in that window: the auth listener calls onUserLoggedIn() for
// every session-bearing event, TOKEN_REFRESHED included, and the sync that
// would start there could send writes outside the awaited snapshot to race the
// RPC, or repopulate local storage from rows that are about to be deleted.
let deletionInProgress = false;

// GDPR Art. 17: remove everything we hold for the signed-in person. The
// delete_user() RPC (README) removes the cloud rows and the auth record
// together, then the local copy is cleared and the initiating session ended.
// Throws on any failure before anything local is touched, so the session
// stays intact and the person can simply try again; a project without the
// function throws with code DELETE_NOT_CONFIGURED and deletes nothing, since
// rows deleted while the account lives on would come straight back from any
// other device's local copy.
//
// expectedUserId is the account the confirmation dialog was opened for; the
// call is refused if this device has since switched to another account.
// Resolves to { sessionChanged }: true when another account took over this
// device during the deletion and was therefore left signed in.
async function deleteUserAccountAndData(expectedUserId) {
    if (!supabaseClient || !currentUser) {
        throw new Error('Not signed in');
    }
    if (expectedUserId && currentUser.id !== expectedUserId) {
        throw new Error('Session changed since the confirmation was opened');
    }
    if (deletionInProgress) {
        throw new Error('Account deletion already in progress');
    }

    const initiatorId = currentUser.id;
    const state = { committed: false, uncertain: false };
    deletionInProgress = true;
    try {
        return await performAccountDeletion(initiatorId, state);
    } finally {
        deletionInProgress = false;
        // Whoever is signed in now had their sync blocked or invalidated
        // while we ran: another account that took over this device (another
        // tab), or the initiator itself when the deletion failed before the
        // RPC committed. Rerun the sign-in sync for them. Never for the
        // initiator after a commit (that account no longer exists), nor when
        // we cannot tell (the message asks them to reload instead).
        const initiatorMayRemain = !state.committed && !state.uncertain;
        if (currentUser && (currentUser.id !== initiatorId || initiatorMayRemain)) {
            onUserLoggedIn();
        }
    }
}

// Every destructive request below goes through a client pinned to the
// initiating session's access token. The shared client reads its token from
// storage at request time, and another tab signing in as someone else in the
// meantime would swap it under us, so the RPC could delete the wrong account.
function clientForSession(session) {
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${session.access_token}` } },
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
            storageKey: 'moicheck-account-deletion'
        }
    });
}

async function currentSessionUserId() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session && session.user ? session.user.id : null;
}

// Where supabase-js persists the session: sb-<project ref>-auth-token.
function sessionStorageKey() {
    return `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;
}

// Durable marker for an account deleted from this browser. supabase-js
// restores an unexpired session from storage without checking that the user
// still exists, so where the stored entry could not be removed (no Web Locks,
// a lock that never came free) the next page load would show the deleted
// account as signed in until a token refresh failed. Start-up and the auth
// listener ignore a session whose user matches this marker, and remove that
// exact entry when they safely can. The marker is cleared once the stored
// session belongs to someone else or is gone.
const DELETED_USER_KEY = 'moiCheckDeletedUser';

function deletedUserId() {
    try {
        return localStorage.getItem(DELETED_USER_KEY);
    } catch (err) {
        console.warn('Could not read the deleted-user marker:', err);
        return null;
    }
}

function isDeletedUserSession(session) {
    return !!(session && session.user && session.user.id && session.user.id === deletedUserId());
}

// Take the session Web Lock for at most `timeoutMs`. Another tab's auth
// operation can hold it, and nothing after the commit may wait forever.
// Resolves { ran: true, result } or { ran: false, reason }.
async function withSessionLock(fn, timeoutMs) {
    if (!hasWebLocks()) return { ran: false, reason: 'no-locks' };
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const result = await navigator.locks.request(
            `lock:${sessionStorageKey()}`,
            { mode: 'exclusive', signal: controller.signal },
            async () => fn()
        );
        return { ran: true, result };
    } catch (err) {
        if (err && err.name === 'AbortError') return { ran: false, reason: 'timeout' };
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

// Remove the stored session entry only if it belongs to `userId`.
function removeStoredSessionIfUser(userId) {
    if (storedSessionUserId() !== userId) return false;
    localStorage.removeItem(sessionStorageKey());
    return true;
}

// On start-up: a stored session for an account deleted from this browser is
// ignored and, when the lock allows, removed. Never touches anyone else's.
async function discardDeletedUserSession(userId) {
    const { ran, result } = await withSessionLock(() => removeStoredSessionIfUser(userId), deleteAttemptTimeoutMs());
    if (ran && result) {
        localStorage.removeItem(DELETED_USER_KEY);
        console.warn('Removed the stored session of an account deleted from this browser.');
    } else {
        console.warn('Ignoring the stored session of an account deleted from this browser.');
    }
}

// Who holds this device's session, read straight from storage. Safe to call
// while holding the session lock (getSession() would take that lock again).
function storedSessionUserId() {
    try {
        const stored = JSON.parse(localStorage.getItem(sessionStorageKey()));
        return stored && stored.user ? stored.user.id : null;
    } catch (err) {
        console.warn('Could not read the stored session:', err);
        return null;
    }
}

// Clear local progress after a deletion, unless another account has signed in
// on this device meanwhile (another tab). The decision keys off the stored
// session and runs under the same Web Lock supabase-js takes to write it, so
// a replacement sign-in cannot slip in between the check and the clear; any
// write a signed-in replacement makes therefore comes after a holder check
// that already spares it, and guest writes were this device's to clear. Where
// Web Locks do not exist the check is best effort.
//
// On a takeover the stored value is not adopted into memory and the deleted
// account's items are quarantined out of it: local progress is not
// partitioned per account (#52), so whatever the replacement's tabs stored may
// still carry the deleted list, and a later sync (this tab's, or a reload's)
// would upload it under their name. `knownItemIds` are the items this tab held
// for the deleted account; exactly those are removed from storage, anything
// else (the replacement's own ticks) is left. Memory starts empty and the sync
// fills it from the replacement's cloud rows.
async function clearLocalProgressUnlessTakenOver(userId, knownItemIds) {
    const decide = () => {
        const holder = storedSessionUserId();
        if (holder !== null && holder !== userId) {
            console.warn('Another account holds this device; quarantining the deleted account\'s items from stored progress.');
            quarantineStoredItems(knownItemIds);
            completedItems = {};
            return false;
        }
        completedItems = {};
        saveState();
        return true;
    };
    const { ran, result, reason } = await withSessionLock(decide, deleteAttemptTimeoutMs());
    if (ran) return result;
    if (reason === 'no-locks') return decide();
    // The lock never came free: leave storage alone rather than guess, but
    // never keep the deleted list in memory.
    console.warn('Session lock unavailable; leaving stored progress untouched.');
    completedItems = {};
    return false;
}

function quarantineStoredItems(itemIds) {
    if (!itemIds || itemIds.length === 0) return;
    let stored;
    try {
        stored = JSON.parse(localStorage.getItem('moiCheckState')) || {};
    } catch (err) {
        console.warn('Could not read stored progress:', err);
        return;
    }
    let changed = false;
    itemIds.forEach(id => {
        if (Object.prototype.hasOwnProperty.call(stored, id)) {
            delete stored[id];
            changed = true;
        }
    });
    if (changed) localStorage.setItem('moiCheckState', JSON.stringify(stored));
}

// End the initiating session and nothing else. signOut() on the shared client
// would act on whatever session storage holds by then, which another tab may
// have replaced, so instead: revoke the captured token server-side (best
// effort; for a deleted user it just answers 403) and remove the stored
// session only if it still belongs to the initiator. The removal runs under
// the same Web Lock supabase-js uses for that storage key, so no tab can swap
// the entry between the check and the removal.
async function endInitiatingSession(asInitiator, session, userId) {
    // Bounded: this runs after the commit, and a stalled request must not
    // hold up the local cleanup. The request may still complete on its own.
    const revoke = asInitiator.auth.admin.signOut(session.access_token, 'local').then(
        ({ error }) => { if (error) console.warn('Server-side sign-out after deletion reported:', error.message); },
        err => console.warn('Server-side sign-out after deletion failed:', err)
    );
    if (!(await settlesWithin(revoke, deleteAttemptTimeoutMs()))) {
        console.warn('Server-side sign-out did not answer in time; continuing with local cleanup.');
    }

    // The marker goes first: whatever happens below, start-up will not
    // restore this account from storage.
    try {
        localStorage.setItem(DELETED_USER_KEY, userId);
    } catch (err) {
        console.warn('Could not record the deleted-user marker:', err);
    }
    // Without a cross-tab lock, or when it does not come free in time, the
    // check and the removal could straddle another tab installing a
    // different account, so storage is not touched: the marker keeps the
    // entry from being restored, and the library drops it at its next refresh.
    const { ran, result } = await withSessionLock(() => removeStoredSessionIfUser(userId), deleteAttemptTimeoutMs());
    const removed = ran && result;
    if (removed) {
        localStorage.removeItem(DELETED_USER_KEY);
    } else {
        console.warn('Stored session left in place; the deleted-user marker keeps it from being restored.');
    }

    if (currentUser && currentUser.id === userId) {
        currentUser = null;
        onUserLoggedOut();
    }
    return removed;
}

async function performAccountDeletion(userId, state) {
    // The items this tab holds for the account: exactly what gets quarantined
    // from shared storage if another account takes over this device.
    const knownItemIds = Object.keys(completedItems);
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session || !session.user || session.user.id !== userId) {
        throw new Error('Session changed before deletion started');
    }
    const asInitiator = clientForSession(session);

    // From here on nothing fetched for this account may land in local state: a
    // cloud sync still waiting on the network would otherwise restore the list
    // after the wipe below, or start new upserts behind the RPC's back.
    authGeneration++;

    // Writes already on the wire cannot be cancelled, so let them finish
    // before anything is deleted (see pendingCloudWrites). No new ones can
    // start meanwhile: deletionInProgress is already set. The wait is
    // bounded: a stalled write must not keep the dialog busy forever, so the
    // deletion gives up before the RPC (nothing deleted, retry later); the
    // write stays tracked and a retry waits for it again.
    const writesSettled = await settlesWithin(Promise.allSettled([...pendingCloudWrites]), deleteAttemptTimeoutMs());
    if (!writesSettled) {
        throw new Error('Cloud writes still pending after the wait; deletion not started');
    }

    // Last identity check before anything irreversible: if this device now
    // holds a different account, the person who confirmed is no longer the
    // one signed in here, so nothing is deleted.
    if ((await currentSessionUserId()) !== userId) {
        throw new Error('Session changed while waiting for pending writes');
    }

    // The RPC removes the progress rows and the auth record in one transaction,
    // so either everything goes or nothing does. Without the function there is
    // no honest partial: rows deleted while the account and its other sessions
    // live on would be re-uploaded from any other device's local copy, so the
    // person is told deletion is not available here and nothing is touched.
    // A lost response is not a rollback: the function may have committed and
    // only the answer gone missing. The call is idempotent (a second run
    // finds nothing left to delete and succeeds), so retry a couple of times
    // and only then give up as "unknown", never as "nothing happened".
    let rpcError = null;
    let sawAmbiguous = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), deleteAttemptTimeoutMs());
        try {
            ({ error: rpcError } = await asInitiator.rpc('delete_user').abortSignal(controller.signal));
        } finally {
            clearTimeout(timer);
        }
        if (!rpcError || !isAmbiguousRpcError(rpcError)) break;
        sawAmbiguous = true;
        console.warn(`delete_user() attempt ${attempt} got no usable answer:`, rpcError.message);
        if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 500 * attempt));
    }
    if (rpcError) {
        // A definite error on a retry only describes that retry: an earlier
        // unanswered attempt may already have committed (and, say, the token
        // then failed). Only a success can settle it; otherwise it is unknown.
        if (sawAmbiguous || isAmbiguousRpcError(rpcError)) {
            state.uncertain = true;
            const uncertain = new Error('Lost the connection while deleting the account; outcome unknown');
            uncertain.code = 'DELETE_UNCERTAIN';
            throw uncertain;
        }
        if (isMissingRpcError(rpcError)) {
            console.warn('delete_user() RPC is not configured; nothing deleted. See README.');
            const notConfigured = new Error('Account deletion is not configured on this project');
            notConfigured.code = 'DELETE_NOT_CONFIGURED';
            throw notConfigured;
        }
        throw rpcError;
    }
    state.committed = true;

    // The account is gone from here on. Nothing below may surface as "still
    // active": each cleanup step is best effort and isolated, and the result
    // is always a committed outcome.
    announceAccountDeleted(userId);
    try {
        // Clear the local copy: leaving it would make syncCloudProgress()
        // upload it all again on the next sign-in. Unless another account has
        // taken over this device meanwhile; see the helper.
        await clearLocalProgressUnlessTakenOver(userId, knownItemIds);
    } catch (err) {
        console.warn('Could not clear local progress after deletion:', err);
        // Memory must not keep the deleted list either way; storage is left
        // alone when it might now be someone else's.
        completedItems = {};
    }

    // End only the session that was just deleted. If another account signed in
    // on this device meanwhile (another tab), its stored session is left in
    // place; the caller re-runs its sign-in sync once the deletion flag clears.
    try {
        await endInitiatingSession(asInitiator, session, userId);
    } catch (err) {
        console.warn('Could not end the stored session after deletion:', err);
        if (currentUser && currentUser.id === userId) {
            currentUser = null;
            onUserLoggedOut();
        }
    }

    let sessionChanged = false;
    try {
        const holder = await currentSessionUserId();
        sessionChanged = holder !== null && holder !== userId;
    } catch (err) {
        console.warn('Could not read the session after deletion:', err);
    }
    if (sessionChanged) {
        console.warn('Another account signed in during deletion; leaving its session in place.');
    }

    return { sessionChanged };
}

async function syncItemToCloud(itemId, isCompleted, note = '') {
    if (!supabaseClient || !currentUser || deletionInProgress) return;

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
