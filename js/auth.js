// Auth Module - Shared Global Exports: SUPABASE_URL, SUPABASE_ANON_KEY, supabaseClient, currentUser, updateAuthBtnState, initAuth, onUserLoggedIn, onUserLoggedOut, syncCloudProgress, syncItemToCloud, describeMagicLinkError, finishMagicLinkSignIn, deleteUserAccountAndData, deletionOutcomeMessage, signOutCurrentUser
// Dependencies: Expects UI_TRANSLATIONS, currentLang, completedItems, renderList, updateProgress, saveState.

// Supabase Configuration
const SUPABASE_URL = (typeof window !== 'undefined' && window.SUPABASE_URL) ? window.SUPABASE_URL : '';
const SUPABASE_ANON_KEY = (typeof window !== 'undefined' && window.SUPABASE_ANON_KEY) ? window.SUPABASE_ANON_KEY : '';

// A sign-in coming back through the address bar: the implicit-flow OAuth
// callback (Google) carries its tokens in the hash. Captured before the
// library consumes and clears it, so the session the server verifies from
// it can settle a recorded deletion the way a verified magic link does (see
// initAuth); the library itself asks the server whose token it is before it
// emits the session, and this does the same.
// The stored session entry this browser signed out of without being able to
// remove it; see signOutCurrentUser and isSignedOutEntry. Declared before
// the client, whose adapter reads it.
const SIGNED_OUT_ENTRY_KEY = 'moiCheckSignedOutSession';
// One key per account this browser signed out of (see signOutCurrentUser):
// while it stands, no automatic write (a refresh in flight in some tab when
// the sign-out ran) stores that account's session again; an explicit
// sign-in of it does, and lifts it.
const SIGNED_OUT_USER_PREFIX = 'moiCheckSignedOut:';

// The sessions an explicit sign-in is storing right now, by access token
// (a magic link being installed, see finishMagicLinkSignIn; an OAuth
// callback being consumed, below): the one write that goes through the
// guards on its account (the sign-out guard above, a session read left
// running; see sessionWriteRefused), and no other write, not even another
// session of the same account landing meanwhile. Declared before the
// client, whose adapter reads it and whose start-up may store the
// callback's session.
const explicitSignIns = new Map();

function beginExplicitSignIn(accessToken) {
    explicitSignIns.set(accessToken, (explicitSignIns.get(accessToken) || 0) + 1);
}

function endExplicitSignIn(accessToken) {
    const left = (explicitSignIns.get(accessToken) || 0) - 1;
    if (left > 0) explicitSignIns.set(accessToken, left);
    else explicitSignIns.delete(accessToken);
}

// Whether a session value (as stored) is the one an explicit sign-in is
// storing.
function isExplicitSignIn(parsed) {
    return !!(parsed && typeof parsed.access_token === 'string' && explicitSignIns.has(parsed.access_token));
}

const oauthCallback = (() => {
    try {
        const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const accessToken = params.get('access_token');
        return accessToken ? { access_token: accessToken } : null;
    } catch {
        return null;
    }
})();
// The callback's session is stored by the library while it initialises
// (after asking the server whose token it is): an explicit sign-in,
// exempt from the guards on its account until then.
if (oauthCallback) beginExplicitSignIn(oauthCallback.access_token);

let supabaseClient = null;
if (window.supabase && SUPABASE_URL && !SUPABASE_URL.includes('YOUR_SUPABASE_PROJECT_ID')) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'implicit',
            // Session writes go through the lock account deletion holds for
            // its check-and-remove of the stored session; see the adapter.
            storage: sessionStorageAdapter()
        }
    });
    if (oauthCallback) {
        const initialized = supabaseClient.auth.initializePromise;
        const end = () => endExplicitSignIn(oauthCallback.access_token);
        if (initialized && typeof initialized.then === 'function') initialized.then(end, end);
        else end();
    }
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

        // Verified through a client that stores nothing, so the session is
        // in hand before anything is written: installing it into the shared
        // client is then the explicit sign-in of exactly that session (see
        // explicitSignIns), and no other write is exempted meanwhile.
        let { data, error } = await magicLinkClient().auth.verifyOtp({
            token_hash: pending.tokenHash,
            type: pending.type
        });
        const verified = !error && data && data.session && data.session.user ? data.session : null;
        if (!error && !verified) error = new Error('Verification returned no session');
        if (verified) {
            beginExplicitSignIn(verified.access_token);
            try {
                ({ error } = await supabaseClient.auth.setSession({
                    access_token: verified.access_token,
                    refresh_token: verified.refresh_token
                }));
            } finally {
                endExplicitSignIn(verified.access_token);
            }
        }

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

        // A deletion of this account may still be recorded as unanswered.
        // The listener refused the sign-in for that record; the session the
        // server just verified is what can settle it.
        if (hasUnsettledDeletion(verified.user.id)) await settleVerifiedSignIn(verified);
    };
}

// Whether a deletion of the account is recorded as unanswered: still
// pending, or settled without confirmation (see settleUnreachableDeletion).
// A session the server verified for that account exists only if the
// account still does, and is what can settle the record.
function hasUnsettledDeletion(userId) {
    const record = readDeletionRecord(userId);
    return !!(record && (record.phase === 'pending' || record.unconfirmed));
}

// A sign-in the server verified (a magic link, or an OAuth callback whose
// token the server named the owner of) for an account with an unsettled
// deletion: the RPC is called again with that session (see
// resolvePendingDeletion), so the account ends up deleted, or it stays
// unknown and the person is told. The listener refuses the session either
// way while the record stands.
async function settleVerifiedSignIn(verified) {
    const t = () => UI_TRANSLATIONS[currentLang];
    const record = readDeletionRecord(verified.user.id);
    if (!record) return;
    const outcome = await resolvePendingDeletion(record, verified);
    // Whatever account this page held in memory before, storage now holds
    // the verified session (or nothing, once the cleanup ran), so memory is
    // set from the outcome, never from what was there. Memory follows
    // whatever session storage holds once this is over: another account
    // that kept the entry (the verified one's write was refused while its
    // record stood) stays signed in, anything else is guest mode.
    const settleMemory = async () => {
        const remaining = storedSessionUser();
        if (remaining && remaining.id !== verified.user.id && !readDeletionRecord(remaining.id)) {
            currentUser = remaining;
            await onUserLoggedIn();
        } else {
            currentUser = null;
            // Memory follows the outcome, never what was there; storage may
            // be another account's, so nothing is written.
            completedItems = {};
            onUserLoggedOut();
        }
    };
    // Only an answer to this retry confirms the deletion: a record still
    // unconfirmed after it means the retry failed with a session the server
    // verified, so the outcome stays unknown.
    if (outcome && outcome.phase === 'committed' && !outcome.unconfirmed) {
        let cleanup = { localCleanupIncomplete: false };
        try {
            cleanup = await finishPendingDeletionCleanup(outcome);
        } catch (err) {
            // The account is gone either way; the record keeps what is left
            // for the next load, and the persisted step is what is reported.
            console.warn('Could not finish the deletion cleanup:', err);
            completedItems = {};
            const settled = progressStepSettled(verified.user.id);
            cleanup = { localCleanupIncomplete: !settled && !hasWebLocks(), localCleanupDeferred: !settled && hasWebLocks() };
        }
        await settleMemory();
        alert(deletionOutcomeMessage(false, cleanup));
    } else {
        await settleMemory();
        alert(t().deleteUncertain);
    }
}

// The session an OAuth callback carried, once the server has named the
// owner of its token (bounded: the read goes over the network). Null when
// it did not, or not in time.
async function verifiedOAuthSession(callback) {
    const read = supabaseClient.auth.getUser(callback.access_token)
        .then(({ data }) => (data && data.user && data.user.id) ? data.user : null, () => null);
    if (!(await settlesWithin(read, deleteAttemptTimeoutMs()))) return null;
    const user = await read;
    return user ? { access_token: callback.access_token, user } : null;
}

// What the person is told once a deletion has ended: confirmed by the
// server, or settled without confirmation (see settleUnreachableDeletion);
// with the browser copy cleared, or left for them to clear (no Web Locks).
function deletionOutcomeMessage(unconfirmed, cleanup) {
    const t = UI_TRANSLATIONS[currentLang];
    const incomplete = !!(cleanup && cleanup.localCleanupIncomplete);
    let message;
    if (unconfirmed) message = incomplete ? t.deleteUnconfirmedLocalPending : t.deleteUnconfirmed;
    else message = incomplete ? t.deleteSuccessLocalPending : t.deleteSuccess;
    // A clear the lock never came free for is done on the next load.
    if (cleanup && cleanup.localCleanupDeferred) message += ' ' + t.deleteLocalDeferred;
    return message;
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

        // A deletion started in this browser may not have finished: the page
        // closed while the RPC was out (outcome unknown), or right after the
        // commit, or the session lock was held. Settle what can be settled
        // before any session is restored.
        let deletionRecords = readDeletionRecords();
        sweepSignedOutGuards();
        // A Google sign-in coming back through the address bar for an
        // account with an unsettled deletion: the listener below would
        // refuse it like a stale session, but it is a session the server
        // verifies, and settles the record the way a verified magic link
        // does. Its account is then left out of the loop below (the retry
        // has run, and its cleanup with it).
        let settledByCallback = null;
        if (oauthCallback && Object.keys(deletionRecords).length > 0) {
            const verified = await verifiedOAuthSession(oauthCallback);
            if (verified && hasUnsettledDeletion(verified.user.id)) {
                await settleVerifiedSignIn(verified);
                settledByCallback = verified.user.id;
                deletionRecords = readDeletionRecords();
            }
        }
        let committedNow = false;
        let unconfirmedNow = false;
        let localCleanupIncomplete = false;
        let localCleanupDeferred = false;
        for (const recordedUserId of Object.keys(deletionRecords)) {
            if (recordedUserId === settledByCallback) continue;
            let committedThisRecord = false;
            try {
                let record = deletionRecords[recordedUserId];
                if (record.phase === 'pending') {
                    record = await resolvePendingDeletion(record);
                    // The unknown-outcome message promised to say how it
                    // ended: a commit is reported below, confirmed or not.
                    if (record && record.phase === 'committed') {
                        committedNow = true;
                        committedThisRecord = true;
                        if (record.unconfirmed) unconfirmedNow = true;
                    }
                }
                if (record && record.phase === 'committed' && record.done) {
                    // Finished earlier; only a session put back since then
                    // (a late refresh) is removed again.
                    await withSessionLock(() => removeStoredSessionIfUser(recordedUserId), deleteAttemptTimeoutMs());
                } else if (record && record.phase === 'committed') {
                    const cleanup = await finishPendingDeletionCleanup(record);
                    if (cleanup && cleanup.localCleanupIncomplete) localCleanupIncomplete = true;
                    if (cleanup && cleanup.localCleanupDeferred) localCleanupDeferred = true;
                }
            } catch (err) {
                // The record stays, so that account's session is still ignored.
                // A commit reported below must not read as a clean cleanup:
                // what the persisted step says is what is reported.
                console.warn('Could not finish the pending deletion cleanup:', err);
                if (committedThisRecord && !progressStepSettled(recordedUserId)) {
                    if (hasWebLocks()) localCleanupDeferred = true;
                    else localCleanupIncomplete = true;
                }
            }
        }
        if (committedNow) alert(deletionOutcomeMessage(unconfirmedNow, { localCleanupIncomplete, localCleanupDeferred }));

        // Fetch the existing session, with a bound: a refresh that never
        // answers must not keep start-up (and the guard below) from running.
        // The entry may also hold a recorded account the library could not
        // read just now (its refresh failed on the network, or in time): the
        // list this page loaded is treated the same. A session that arrives
        // later reaches the listener below.
        let session = await readSessionWithin(deleteAttemptTimeoutMs());
        // (Checked on its own: the adapter hides such an entry from the
        // library, so the read above already returned no session.)
        if (isSignedOutEntry()) {
            // Signed out here without the lock (see signOutCurrentUser):
            // removed now if the lock can be had, ignored either way.
            await withSessionLock(() => {
                if (rawStoredSession() === localStorage.getItem(SIGNED_OUT_ENTRY_KEY)) {
                    localStorage.removeItem(sessionStorageKey());
                    localStorage.removeItem(SIGNED_OUT_ENTRY_KEY);
                }
            }, deleteAttemptTimeoutMs());
            session = null;
        }
        if (isDeletedUserSession(session) || (!(session && session.user) && storedSessionIsRecorded())) {
            console.warn('Not restoring the stored session of an account deleted (or being deleted) from this browser.');
            // What app.js loaded from the shared store may be that account's
            // list: dropped from memory and redrawn, never written.
            completedItems = {};
            renderList();
            updateProgress();
        } else if (session && session.user) {
            if (hasDeletionRecords()) takeOverFromDeletedAccounts(session.user.id);
            currentUser = session.user;
            await onUserLoggedIn();
        }

        // Listen for auth state changes
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            console.log('Supabase auth event:', event, session?.user?.email);
            // The initiator's own session events while its deletion is out
            // (keyed to the initiator itself, not to whoever this tab is
            // signed in as by then: a replacement that took over meanwhile
            // must not be dropped by the initiator's late refresh): the
            // record it sees is this tab's own, the sync is already blocked
            // (deletionInProgress), and a definite failure afterwards must
            // find the tab still signed in, since the initiator's sync is
            // rerun then; the cleanup after a commit ends the session itself.
            if (deletingUserId !== null && session && session.user && session.user.id === deletingUserId) return;
            // An entry this browser signed out of without the lock (see
            // signOutCurrentUser) is no session.
            if (session && isSignedOutEntry()) return;
            // Nor is the session of an account this browser signed out of
            // (its guard stands): a refresh in flight when the sign-out ran
            // still emits its event after the adapter refused its write,
            // and must not sign the account back in here. An explicit
            // sign-in of the account lifts the guard before its event.
            if (session && session.user && signedOutGuardStands(session.user.id)) return;
            if (isDeletedUserSession(session)) {
                // The event does not say the account holds the entry: the
                // adapter may have refused its write because another,
                // unrecorded account holds it. That account is what this tab
                // keeps (or reconciles to, with memory emptied first, never
                // uploaded), rather than going to guest mode.
                const holder = storedSessionUserId();
                if (holder !== null && holder !== session.user.id && !readDeletionRecord(holder)) {
                    if (!(currentUser && currentUser.id === holder)) {
                        const replacement = storedSessionUser();
                        if (replacement) {
                            if (hasDeletionRecords()) takeOverFromDeletedAccounts(replacement.id);
                            completedItems = {};
                            currentUser = replacement;
                            await onUserLoggedIn();
                        }
                    }
                    return;
                }
                // A refresh or restore of an account deleted (or being
                // deleted) from this browser. SIGNED_IN is no proof of a
                // fresh sign-in either (the library re-emits it for an
                // existing session, on tab focus for one); the magic-link
                // flow settles a pending record itself, from the server's
                // answer. Storage now holds that account (or nothing), so
                // whatever account this page still had in memory is stale.
                // The list in memory may be that account's (a signed-out tab
                // keeps it too, #52); storage may be someone else's, so it
                // is dropped without being written, and the screen redrawn.
                currentUser = null;
                completedItems = {};
                onUserLoggedOut();
                return;
            }
            if (session && session.user) {
                if (hasDeletionRecords()) takeOverFromDeletedAccounts(session.user.id);
                currentUser = session.user;
                await onUserLoggedIn();
                // Clean hash from URL bar if access token was passed in hash
                if (window.location.hash && window.location.hash.includes('access_token')) {
                    window.history.replaceState(null, '', window.location.pathname + window.location.search);
                }
            } else if (event === 'SIGNED_OUT') {
                // The library also says this after a failed late refresh
                // whose removal the adapter refused (the entry now holds a
                // replacement, or the initiator itself): storage decides.
                if (currentUser && storedSessionUserId() !== currentUser.id) {
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
// non-string code) or a gateway answered in the database's place (an HTTP
// 5xx, whatever code its body carries; see attemptDeleteRpc). The function
// may well have committed.
function isAmbiguousRpcError(error) {
    if (!error) return false;
    if (typeof error.status === 'number' && error.status >= 500) return true;
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
        } else if (message && message.type === 'signed-out' && message.userId) {
            handleSignedOutElsewhere(message.userId);
        }
    };
}

// The explicit sign-out does not go through the library (see
// signOutCurrentUser), so the library tells no other tab about it: the
// sign-out announces itself here instead.
function announceSignedOut(userId) {
    if (!authChannel) return;
    try {
        authChannel.postMessage({ type: 'signed-out', userId });
    } catch (err) {
        console.warn('Could not announce the sign-out to other tabs:', err);
    }
}

// Another tab signed the account out: a tab signed in as it goes to guest
// mode, unless storage holds a live session of it again (an explicit
// sign-in since); a tab signed in as another account, or as nobody, is
// left alone. Memory keeps the list, as the local sign-out does (#52).
function handleSignedOutElsewhere(userId) {
    if (!currentUser || currentUser.id !== userId) return;
    if (storedSessionUserId() === userId && !isSignedOutEntry() && !signedOutGuardStands(userId)) return;
    console.warn('This account was signed out from another tab.');
    currentUser = null;
    onUserLoggedOut();
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
    // Only a tab busy with a different account stays out of it: a signed-out
    // tab still holds the list in memory (sign-out does not clear it, #52)
    // and would write it back to storage on its next edit.
    if (currentUser && currentUser.id !== userId) return;
    console.warn('This account was deleted from another tab; clearing the local copy here.');
    // A tab signed in as the account may have written the account's rows
    // to storage after the deleting tab cleared and settled the step (its
    // own sync answering before this message got through), so it clears
    // again on its first notification; a signed-out tab, whose sync could
    // not have run, only drops its memory once the step is settled.
    const wasSignedInAsAccount = !!(currentUser && currentUser.id === userId);
    authGeneration++;
    // Same decision as the deleting tab: another account may already hold
    // this device (its session stored by a third tab), in which case its
    // stored progress is left alone.
    try {
        await clearLocalProgressUnlessTakenOver(userId, { evenIfSettled: wasSignedInAsAccount });
    } catch (err) {
        console.warn('Could not clear stored progress:', err);
        completedItems = {};
    }
    // Re-check after the await: this tab may itself have switched accounts
    // (or been signed out) meanwhile. The clear emptied memory either way,
    // and a replacement's sync may already have finished before that, so a
    // replacement is synced again and a signed-out tab is redrawn.
    if (currentUser && currentUser.id === userId) {
        currentUser = null;
        onUserLoggedOut();
    } else if (currentUser) {
        await onUserLoggedIn();
    } else {
        renderList();
        updateProgress();
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
// The account whose deletion this tab is running, for that whole window
// (see the auth listener and sessionWriteRefused); null otherwise.
let deletingUserId = null;

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
// Resolves to { sessionChanged, localCleanupIncomplete, localCleanupDeferred }:
// sessionChanged is true when another account took over this device during
// the deletion and was therefore left signed in; localCleanupIncomplete is
// true when the browser copy of the progress could not be cleared and no
// later load will do it (no Web Locks); localCleanupDeferred is true when
// it could not be cleared now (the session lock never came free) and the
// next load does it. The dialog reports either instead of a plain success.
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
    deletingUserId = currentUser.id;
    try {
        return await performAccountDeletion(initiatorId, state);
    } finally {
        deletionInProgress = false;
        deletingUserId = null;
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

// A client that stores nothing (its session lives in memory), for a magic
// link's verification: the session it answers with is installed into the
// shared client by the caller (see finishMagicLinkSignIn).
function magicLinkClient() {
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
            storageKey: 'moicheck-magic-link'
        }
    });
}

// A session read left running after its bound: its refresh may still land
// in storage, long after whoever waited for it moved on (a deletion given
// up, a sign-out done). Until it settles, the account it read is guarded
// (see sessionWriteRefused): its session is not stored over another
// account's entry, and not at all after a sign-out (the guard turned
// strict), unless an explicit sign-in of that account is what stores it.
const outstandingReads = new Map();

function guardOutstandingRead(userId, promise, strict = false) {
    if (userId === null) return;
    const guard = outstandingReads.get(userId) || { count: 0, strict: false };
    guard.count++;
    if (strict) guard.strict = true;
    outstandingReads.set(userId, guard);
    promise.then(
        () => releaseOutstandingRead(userId),
        () => releaseOutstandingRead(userId)
    );
}

function releaseOutstandingRead(userId) {
    const guard = outstandingReads.get(userId);
    if (!guard) return;
    guard.count--;
    if (guard.count <= 0) outstandingReads.delete(userId);
}

function makeOutstandingReadStrict(userId) {
    const guard = outstandingReads.get(userId);
    if (guard) guard.strict = true;
}

// The session the shared client holds, read with a bound: getSession() first
// refreshes an expired token over the network, and fetch has no timeout of
// its own, so a stalled refresh would otherwise keep the dialog busy forever.
// Resolves { session, error }: the session (null when there is none) with
// the error it came with (a refresh the server refused, or could not be
// reached for), or undefined when it could not be read in time (the read
// itself is left running, and the account it started from guarded until it
// settles).
async function readSessionResultWithin(timeoutMs) {
    const holderAtStart = storedSessionUserId();
    const read = supabaseClient.auth.getSession().then(
        ({ data, error }) => ({ session: (data && data.session) || null, error: error || null }),
        (err) => ({ session: null, error: err || null })
    );
    if (!(await settlesWithin(read, timeoutMs))) {
        guardOutstandingRead(holderAtStart, read);
        return undefined;
    }
    return read;
}

// The same read, session only.
async function readSessionWithin(timeoutMs) {
    const result = await readSessionResultWithin(timeoutMs);
    return result === undefined ? undefined : result.session;
}

// The server refused the stored credentials for good: the refresh token is
// gone (it went with the account, or a sign-out everywhere revoked it), as
// opposed to a network failure, a server error or a rate limit (429), after
// which the same credentials may still work. auth-js answers the former
// with an API error carrying one of these statuses; the transient ones come
// as a retryable error, or as an API error with another status, and none of
// them settles anything (the adapter above keeps the stored session of an
// account whose deletion is unanswered whatever the library concludes).
const AUTH_REJECTION_STATUSES = [400, 401, 403, 404];

function isDefinitiveAuthRejection(error) {
    if (!error) return false;
    // auth-js turns the server's session_not_found (the session row is
    // gone: deleted with the account, or revoked) into this error.
    if (error.name === 'AuthSessionMissingError') return true;
    return error.name === 'AuthApiError' && AUTH_REJECTION_STATUSES.includes(error.status);
}

// Who holds the session the shared client sees: a user id, null for nobody,
// undefined when it could not be read in time.
async function currentSessionUserId() {
    const session = await readSessionWithin(deleteAttemptTimeoutMs());
    if (session === undefined) return undefined;
    return session && session.user ? session.user.id : null;
}

// Where supabase-js persists the session: sb-<project ref>-auth-token.
function sessionStorageKey() {
    return `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;
}

// supabase-js (auth-js 2.107 and later) no longer takes a Web Lock around its
// session writes, so a lock taken here alone would not keep another tab's
// sign-in from landing between "who holds the stored session?" and "remove
// it". Every tab runs the shared client with this storage adapter instead, so
// every write to the session entry, from any tab, waits for the same lock the
// cleanup below holds for its check-and-remove; reads are untouched. Without
// Web Locks the adapter writes straight through and the cleanup does not
// remove the entry (see endInitiatingSession).
function sessionStorageAdapter() {
    // The session entry as this tab's library last had it: what it loaded
    // with, then whatever it stored itself (a sign-in here, a refresh
    // here). The library removes the entry without saying whose session it
    // means, so its removal is honoured only while the entry still is that
    // (see sessionRemovalRefused): an entry another tab has rewritten since
    // (a replacement's sign-in, a fresh refresh of the same account) is
    // that tab's, whatever accounts this one is signed in as or has used.
    let entryAsLeft = null;
    try {
        entryAsLeft = localStorage.getItem(sessionStorageKey());
    } catch (err) {
        console.warn('Could not read the stored session:', err);
    }
    const locked = (key, write) => {
        if (!hasWebLocks()) {
            write();
            return undefined;
        }
        return navigator.locks.request(`lock:${key}`, { mode: 'exclusive' }, async () => write());
    };
    return {
        getItem: (key) => {
            const value = localStorage.getItem(key);
            // An entry this browser signed out of without the lock (see
            // signOutCurrentUser) is no session to the library either: it
            // must not refresh it into a new value that would outlive the
            // marker. A different value is a genuine session.
            if (key === sessionStorageKey() && value !== null && value === localStorage.getItem(SIGNED_OUT_ENTRY_KEY)) return null;
            return value;
        },
        setItem: (key, value) => locked(key, () => {
            // A refresh still in flight (this tab or another) must not put a
            // deleted account's session back after the cleanup removed it:
            // the record, kept for a while after the cleanup, refuses it.
            if (key === sessionStorageKey() && sessionWriteRefused(value)) {
                console.warn('Refusing to store the session of an account deleted from this browser.');
                return;
            }
            localStorage.setItem(key, value);
            if (key === sessionStorageKey()) {
                entryAsLeft = value;
                localStorage.removeItem(SIGNED_OUT_ENTRY_KEY);
                // The account is explicitly signed in again: its sign-out
                // guard (see signOutCurrentUser) has served.
                const parsed = parseSessionValue(value);
                if (isExplicitSignIn(parsed)) clearSignedOutGuard(parsed.user.id);
            }
        }),
        removeItem: (key) => locked(key, () => {
            // The library removes a session whose refresh the server
            // refused for good, and on a sign-out, without saying whose: it
            // is honoured only for the entry as this tab's library left it
            // (one another tab rewrote since is theirs), and never while a
            // deletion of that account is unanswered (see
            // sessionRemovalRefused).
            if (key === sessionStorageKey() && sessionRemovalRefused(entryAsLeft)) {
                console.warn('Keeping the stored session: not as this tab left it, or its deletion is still unanswered.');
                return;
            }
            localStorage.removeItem(key);
            if (key === sessionStorageKey()) entryAsLeft = null;
        })
    };
}

// A committed (or finished) account's session is never stored again. A
// pending account's session is stored only while nobody else holds the
// entry: its refresh still in flight could otherwise land after another
// tab signed in a replacement, and overwrite theirs. (The pending account's
// own credentials must stay storable while the entry is still its own, or
// nothing could settle its record later.)
function sessionWriteRefused(value) {
    try {
        const parsed = JSON.parse(value);
        const userId = parsed && parsed.user && parsed.user.id;
        if (!userId) return false;
        const explicit = isExplicitSignIn(parsed);
        // An account this browser signed out of (see signOutCurrentUser)
        // comes back only through an explicit sign-in of it: a refresh of
        // it still in flight in some tab when the sign-out ran (finished on
        // the server before the revoke, reaching storage after the removal)
        // would otherwise store it again, and its new token would be good
        // until it expires.
        if (!explicit && signedOutGuardStands(userId)) return true;
        const holder = storedSessionUserId();
        // The initiator's own late refresh, while its deletion is out, must
        // not replace a replacement account's entry either: the record that
        // refuses it below exists only once the RPC has been sent.
        if (deletingUserId === userId && holder !== null && holder !== userId) return true;
        // A read left running (see readSessionResultWithin) may be what
        // writes this: not over another account's entry, and not at all
        // after a sign-out, unless an explicit sign-in of this account is
        // writing.
        const guard = outstandingReads.get(userId);
        if (guard && !explicit) {
            if (guard.strict) return true;
            if (holder !== null && holder !== userId) return true;
        }
        const record = readDeletionRecord(userId);
        if (!record && deletingUserId !== userId) return false;
        if (record && record.phase === 'committed') return true;
        // Without Web Locks the library's read, its refresh and this write
        // are not one operation: a delayed write of such an account's
        // session is stored only over that account's own entry, never over
        // an empty or another account's one it could not have seen. (The
        // check and the write here are consecutive statements; that is the
        // limit of what can be had without a lock.)
        if (!hasWebLocks()) return holder !== userId;
        return holder !== null && holder !== userId;
    } catch {
        return false;
    }
}

// Whether the library's removal of the stored session entry is refused.
// The library removes it without knowing whose it is, so a refresh still in
// flight when another tab rewrote the entry (a replacement's sign-in, or a
// fresh refresh of the same account) would, on failing, remove what that
// tab stored (the lock orders the two writes, it does not tell them
// apart): the removal is honoured only while the entry is exactly what this
// tab's library loaded or last stored itself, whoever this tab is signed in
// as. And the entry of an account whose deletion is unanswered is removed
// only by that deletion (the cleanup after its commit, under the lock): a
// sign-out elsewhere, or a refresh the server refused, would otherwise take
// away the credentials the retry needs, and the record could never be
// settled from this browser.
function sessionRemovalRefused(entryAsLeft) {
    let current;
    try {
        current = localStorage.getItem(sessionStorageKey());
    } catch (err) {
        console.warn('Could not read the stored session:', err);
        return false;
    }
    if (current === null) return false;
    if (current !== entryAsLeft) return true;
    const holder = storedSessionUserId();
    const record = holder === null ? null : readDeletionRecord(holder);
    return !!(record && record.phase === 'pending');
}

// Durable, write-ahead record of a deletion. Written and read back before
// the RPC (phase 'pending': the outcome is unknown until the answer comes),
// rewritten the moment the RPC commits (phase 'committed', with which of the
// best-effort cleanup steps still have to settle), and removed after a
// definite pre-commit failure or once every step has settled. The page can
// close at any point in between, and each step can wait on a lock or the
// network, so nothing after the RPC is relied on to leave a trace. While the
// record exists, start-up and the auth listener never restore a session of
// that user (supabase-js restores an unexpired session from storage without
// checking that the user still exists): a committed deletion is finished
// under the lock, and a pending one is first resolved with the server, or
// left alone when that is not possible.
// One storage key per account for the committed record, and one per attempt
// for a pending one, so no two writers ever share a value: two tabs deleting
// two accounts write their own entries, and two tabs deleting the same
// account each keep their own attempt until it is answered. A definite
// error removes only its own attempt; a commit replaces them all with the
// committed record. Every cleanup step is idempotent, so a lost settle only
// repeats a step. The older formats (a single key holding a bare user id,
// one record or a map; a per-account record in phase pending) are migrated
// on first read.
const DELETED_USER_KEY = 'moiCheckDeletedUser';
const DELETION_RECORD_PREFIX = 'moiCheckDeletedUser:';
const DELETION_ATTEMPT_PREFIX = 'moiCheckDeletionAttempt:';
// One key per settled cleanup step of a committed record, written once and
// never unwritten, so two tabs settling different steps cannot undo each
// other's, and a stale writer cannot revive a finished tombstone. The
// record itself is never rewritten after the commit.
const DELETION_STEP_PREFIX = 'moiCheckDeletionStep:';
// A settled record stays as a tombstone for this long: a token refresh still
// in flight somewhere (a tab resumed from suspension, say) could otherwise
// put the deleted account's session back after the cleanup (see
// sessionStorageAdapter). A week is the longest access-token lifetime a
// Supabase project can be configured with, so no still-valid token of the
// deleted account outlives it.
const DELETION_TOMBSTONE_MS = 7 * 24 * 60 * 60 * 1000;
// A sign-out guard (see signOutCurrentUser) stands as long, for the same
// reason: no token issued to the account before the sign-out outlives it.
const SIGNED_OUT_GUARD_MS = DELETION_TOMBSTONE_MS;

function signedOutGuardKey(userId) {
    return SIGNED_OUT_USER_PREFIX + userId;
}

// Written before the sign-out touches anything, and read back: a write
// that did not land guards nothing.
function writeSignedOutGuard(userId) {
    try {
        localStorage.setItem(signedOutGuardKey(userId), String(Date.now()));
        return localStorage.getItem(signedOutGuardKey(userId)) !== null;
    } catch (err) {
        console.warn('Could not record the sign-out:', err);
        return false;
    }
}

function clearSignedOutGuard(userId) {
    try {
        localStorage.removeItem(signedOutGuardKey(userId));
    } catch (err) {
        console.warn('Could not clear a sign-out guard:', err);
    }
}

// Whether the account's sign-out guard stands. One past its time (or
// unreadable) is dropped on the way.
function signedOutGuardStands(userId) {
    try {
        const raw = localStorage.getItem(signedOutGuardKey(userId));
        if (raw === null) return false;
        const since = Number(raw);
        if (Number.isFinite(since) && Date.now() - since < SIGNED_OUT_GUARD_MS) return true;
        localStorage.removeItem(signedOutGuardKey(userId));
        return false;
    } catch {
        return false;
    }
}

function sweepSignedOutGuards() {
    storageKeysWithPrefix(SIGNED_OUT_USER_PREFIX).forEach(key => signedOutGuardStands(key.slice(SIGNED_OUT_USER_PREFIX.length)));
}

// A stored session value parsed, when it names a user; else null.
function parseSessionValue(value) {
    try {
        const parsed = JSON.parse(value);
        return parsed && parsed.user && parsed.user.id ? parsed : null;
    } catch {
        return null;
    }
}

function deletionRecordKey(userId) {
    return DELETION_RECORD_PREFIX + userId;
}

function deletionAttemptKey(userId, attempt) {
    return `${DELETION_ATTEMPT_PREFIX}${userId}:${attempt}`;
}

function deletionStepKey(userId, step) {
    return `${DELETION_STEP_PREFIX}${userId}:${step}`;
}

// When each cleanup step of an account's committed record settled, or null.
function readSettledSteps(userId) {
    const read = (step) => {
        try {
            const raw = localStorage.getItem(deletionStepKey(userId, step));
            const at = raw === null ? NaN : Number(raw);
            return Number.isFinite(at) ? at : null;
        } catch {
            return null;
        }
    };
    return { progress: read('progress'), session: read('session'), confirmed: read('confirmed') };
}

function markStepSettled(userId, step, at) {
    try {
        if (localStorage.getItem(deletionStepKey(userId, step)) === null) {
            localStorage.setItem(deletionStepKey(userId, step), String(at || Date.now()));
        }
    } catch (err) {
        console.warn('Could not record a settled cleanup step:', err);
    }
}

function normalizeDeletionRecord(userId, record) {
    if (!record || typeof record !== 'object') {
        return { userId, phase: 'committed', progressPending: true, sessionPending: true };
    }
    return Object.assign({}, record, { userId, phase: record.phase === 'pending' ? 'pending' : 'committed' });
}

// A stable list of the storage keys with a prefix, taken before anything
// below may remove one (pruning an expired tombstone shifts the indexes).
function storageKeysWithPrefix(prefix) {
    const keys = [];
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) keys.push(key);
        }
    } catch (err) {
        console.warn('Could not list storage keys:', err);
    }
    return keys;
}

// The legacy formats of the record key (a bare user id; one record; a map
// of records by user id), as they stand. Read as a fallback while the key
// stands: a migration whose writes did not land (storage full) leaves it,
// and what it records stays in force until every migrated value has been
// verified and the key can go (see migrateLegacyDeletionRecords).
function readLegacyDeletionRecords() {
    let raw;
    try {
        raw = localStorage.getItem(DELETED_USER_KEY);
    } catch {
        return {};
    }
    if (!raw) return {};
    let parsed = null;
    try {
        parsed = JSON.parse(raw);
    } catch {
        // A bare user id from the oldest format.
    }
    const legacy = {};
    if (!parsed || typeof parsed !== 'object') legacy[raw] = normalizeDeletionRecord(raw, null);
    else if (parsed.userId) legacy[parsed.userId] = normalizeDeletionRecord(parsed.userId, parsed);
    else Object.keys(parsed).forEach(userId => { legacy[userId] = normalizeDeletionRecord(userId, parsed[userId]); });
    return legacy;
}

function migrateLegacyDeletionRecords() {
    const legacy = readLegacyDeletionRecords();
    const userIds = Object.keys(legacy);
    if (userIds.length === 0) return;
    let verified = true;
    userIds.forEach(userId => {
        const record = legacy[userId];
        try {
            if (record.phase === 'pending') {
                const attempt = record.attempt || 'legacy';
                const value = JSON.stringify({ userId, attempt });
                localStorage.setItem(deletionAttemptKey(userId, attempt), value);
                if (localStorage.getItem(deletionAttemptKey(userId, attempt)) !== value) verified = false;
            } else if (!localStorage.getItem(deletionRecordKey(userId))) {
                const value = JSON.stringify(record);
                localStorage.setItem(deletionRecordKey(userId), value);
                if (localStorage.getItem(deletionRecordKey(userId)) !== value) verified = false;
            }
        } catch (err) {
            console.warn('Could not migrate a deletion record:', err);
            verified = false;
        }
    });
    // The key goes only once every record stands in the new format; until
    // then it is read as a fallback (see readDeletionRecord).
    if (!verified) return;
    try {
        localStorage.removeItem(DELETED_USER_KEY);
    } catch (err) {
        console.warn('Could not remove the legacy deletion record key:', err);
    }
}

// Take one account out of the legacy key (see readLegacyDeletionRecords):
// its record was removed, or, given `attempts`, one of those attempts was
// cleared and the legacy record stood for it.
function dropLegacyDeletionRecord(userId, attempts) {
    const legacy = readLegacyDeletionRecords();
    const record = legacy[userId];
    if (!record) return;
    if (attempts && !(record.phase === 'pending' && attempts.includes(record.attempt || 'legacy'))) return;
    delete legacy[userId];
    try {
        if (Object.keys(legacy).length === 0) localStorage.removeItem(DELETED_USER_KEY);
        else localStorage.setItem(DELETED_USER_KEY, JSON.stringify(legacy));
    } catch (err) {
        console.warn('Could not update the legacy deletion record key:', err);
    }
}

function readPendingAttempts(userId) {
    const prefix = `${DELETION_ATTEMPT_PREFIX}${userId}:`;
    return storageKeysWithPrefix(prefix).map(key => key.slice(prefix.length)).sort();
}

// The record of one account as it stands: the committed record if there is
// one (a tombstone past its expiry is pruned), else a pending record
// standing for every unanswered attempt, else null.
function readDeletionRecord(userId) {
    migrateLegacyDeletionRecords();
    let raw;
    try {
        raw = localStorage.getItem(deletionRecordKey(userId));
    } catch (err) {
        console.warn('Could not read a deletion record:', err);
        return null;
    }
    if (raw) {
        let record;
        try {
            record = normalizeDeletionRecord(userId, JSON.parse(raw));
        } catch {
            record = normalizeDeletionRecord(userId, null);
        }
        if (record.phase === 'pending') {
            // A per-account pending record from the previous format: it
            // becomes an attempt of its own. While the attempt key cannot
            // be written (storage full) the record stands for that attempt
            // itself, and goes with it (see removePendingAttempts).
            const attempt = record.attempt || 'legacy';
            try {
                localStorage.setItem(deletionAttemptKey(userId, attempt), JSON.stringify({ userId, attempt }));
                localStorage.removeItem(deletionRecordKey(userId));
            } catch (err) {
                console.warn('Could not migrate a pending record:', err);
            }
            const attempts = readPendingAttempts(userId);
            if (!attempts.includes(attempt)) attempts.push(attempt);
            attempts.sort();
            return { userId, phase: 'pending', attempt: attempts[0], attempts };
        } else {
            // Settled steps live in their own keys; flags a previous format
            // kept inside the record are carried over once.
            if (record.progressPending === false) markStepSettled(userId, 'progress', record.expiresAt ? record.expiresAt - DELETION_TOMBSTONE_MS : undefined);
            if (record.sessionPending === false) markStepSettled(userId, 'session', record.expiresAt ? record.expiresAt - DELETION_TOMBSTONE_MS : undefined);
            const steps = readSettledSteps(userId);
            const progressPending = steps.progress === null;
            const sessionPending = steps.session === null;
            const done = !progressPending && !sessionPending;
            // A record committed without confirmation (see
            // settleUnreachableDeletion) stays unconfirmed until a confirmed
            // commit marks its own write-once key: whichever of the two
            // published the record, a confirmation is never lost to it, and
            // an unconfirmed record never expires (the account may still
            // exist, and a sign-in of it is what finishes the deletion).
            const unconfirmed = record.unconfirmed === true && steps.confirmed === null;
            const settledAt = Math.max(steps.progress, steps.session, steps.confirmed || 0);
            const expiresAt = done && !unconfirmed ? settledAt + DELETION_TOMBSTONE_MS : undefined;
            // A tombstone past its expiry goes, unless the deleted account
            // still owns the stored session (put back by a late refresh, and
            // not yet removed): the record must keep refusing it until then.
            if (expiresAt !== undefined && expiresAt <= Date.now() && storedSessionUserId() !== userId) {
                removeDeletionRecord(userId);
                return null;
            }
            // Any attempt still beside a committed record is stale (written
            // in the moment between the commit and its sweep of attempts).
            removePendingAttempts(userId, readPendingAttempts(userId));
            return Object.assign({}, record, { phase: 'committed', progressPending, sessionPending, done, expiresAt, unconfirmed });
        }
    }
    const attempts = readPendingAttempts(userId);
    if (attempts.length > 0) return { userId, phase: 'pending', attempt: attempts[0], attempts };
    // The legacy key, while its migration has not landed (see
    // migrateLegacyDeletionRecords): its record is in force as it stands,
    // with the settled steps recorded since, and never expires from here.
    const legacy = readLegacyDeletionRecords()[userId];
    if (!legacy) return null;
    if (legacy.phase === 'pending') {
        const attempt = legacy.attempt || 'legacy';
        return { userId, phase: 'pending', attempt, attempts: [attempt] };
    }
    const steps = readSettledSteps(userId);
    const progressPending = steps.progress === null && legacy.progressPending !== false;
    const sessionPending = steps.session === null && legacy.sessionPending !== false;
    return Object.assign({}, legacy, {
        phase: 'committed',
        progressPending,
        sessionPending,
        done: !progressPending && !sessionPending,
        expiresAt: undefined,
        unconfirmed: legacy.unconfirmed === true && steps.confirmed === null
    });
}

// Every record, keyed by user id.
function readDeletionRecords() {
    migrateLegacyDeletionRecords();
    const userIds = new Set();
    Object.keys(readLegacyDeletionRecords()).forEach(userId => userIds.add(userId));
    storageKeysWithPrefix(DELETION_RECORD_PREFIX).forEach(key => userIds.add(key.slice(DELETION_RECORD_PREFIX.length)));
    storageKeysWithPrefix(DELETION_ATTEMPT_PREFIX).forEach(key => {
        const rest = key.slice(DELETION_ATTEMPT_PREFIX.length);
        const cut = rest.lastIndexOf(':');
        if (cut > 0) userIds.add(rest.slice(0, cut));
    });
    const records = {};
    userIds.forEach(userId => {
        const record = readDeletionRecord(userId);
        if (record) records[userId] = record;
    });
    return records;
}

function writeDeletionRecord(record) {
    try {
        localStorage.setItem(deletionRecordKey(record.userId), JSON.stringify(record));
    } catch (err) {
        console.warn('Could not write a deletion record:', err);
    }
}

function removeDeletionRecord(userId) {
    try {
        localStorage.removeItem(deletionRecordKey(userId));
        localStorage.removeItem(deletionStepKey(userId, 'progress'));
        localStorage.removeItem(deletionStepKey(userId, 'session'));
        localStorage.removeItem(deletionStepKey(userId, 'confirmed'));
    } catch (err) {
        console.warn('Could not remove a deletion record:', err);
    }
    removePendingAttempts(userId, readPendingAttempts(userId));
    dropLegacyDeletionRecord(userId);
}

function removePendingAttempts(userId, attempts) {
    try {
        attempts.forEach(attempt => localStorage.removeItem(deletionAttemptKey(userId, attempt)));
    } catch (err) {
        console.warn('Could not remove a deletion attempt:', err);
    }
    // A per-account pending record standing for one of these attempts (its
    // attempt key could not be written; see readDeletionRecord) goes with
    // it, as does the legacy key's record for it.
    try {
        const raw = localStorage.getItem(deletionRecordKey(userId));
        if (raw) {
            let record;
            try {
                record = normalizeDeletionRecord(userId, JSON.parse(raw));
            } catch {
                record = normalizeDeletionRecord(userId, null);
            }
            if (record.phase === 'pending' && attempts.includes(record.attempt || 'legacy')) localStorage.removeItem(deletionRecordKey(userId));
        }
    } catch (err) {
        console.warn('Could not remove a pending record:', err);
    }
    dropLegacyDeletionRecord(userId, attempts);
}

function hasDeletionRecords() {
    return Object.keys(readDeletionRecords()).length > 0;
}

// Whether the stored session entry belongs to an account with a record.
function storedSessionIsRecorded() {
    const holder = storedSessionUserId();
    return holder !== null && !!readDeletionRecord(holder);
}

function isDeletedUserSession(session) {
    return !!(session && session.user && session.user.id && readDeletionRecord(session.user.id));
}

// Before anything irreversible: record the attempt and prove the record is
// there. A browser that cannot keep it would not remember a commit either,
// so the deletion does not start. Each attempt has its own key: another
// tab's attempt for the same account may still be unanswered, and a definite
// error removes only the attempt it answers. A record that already says
// committed (another tab got there first) is never replaced: the caller
// finishes and reports that outcome. Resolves { attempt, existed } (existed:
// other attempts of this account are still unanswered, so one of them may
// yet commit), { alreadyCommitted: true }, or
// { writeFailed: true, existed } when the attempt could not be recorded.
function recordPendingDeletion(userId) {
    // A record committed without confirmation (see
    // settleUnreachableDeletion) is not a commit: the account may still
    // exist, and only a successful RPC confirms it.
    const earlier = readDeletionRecord(userId);
    if (earlier && earlier.phase === 'committed' && !earlier.unconfirmed) return { alreadyCommitted: true };
    const existed = !!(earlier && earlier.phase === 'pending');
    // A record settled without confirmation is a prior unknown outcome as
    // well: an attempt that cannot even be recorded over it must not be
    // reported as the account being active.
    const unknownStands = existed || !!(earlier && earlier.phase === 'committed' && earlier.unconfirmed);
    const attempt = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    try {
        localStorage.setItem(deletionAttemptKey(userId, attempt), JSON.stringify({ userId, attempt }));
        if (localStorage.getItem(deletionAttemptKey(userId, attempt)) === null) {
            // The key can also be gone because another tab committed and
            // swept the attempts in between: that is the commit, not a
            // failed write.
            const swept = readDeletionRecord(userId);
            if (swept && swept.phase === 'committed' && !swept.unconfirmed) return { alreadyCommitted: true };
            return { writeFailed: true, existed: unknownStands };
        }
    } catch (err) {
        console.warn('Could not record the deletion attempt:', err);
        return { writeFailed: true, existed: unknownStands };
    }
    // A commit published between the first look and this write would have
    // swept the attempts before this one existed: look again, and step back
    // if so.
    const now = readDeletionRecord(userId);
    if (now && now.phase === 'committed' && !now.unconfirmed) {
        removePendingAttempts(userId, [attempt]);
        return { alreadyCommitted: true };
    }
    return { attempt, existed: unknownStands };
}

function clearPendingDeletion(userId, attempt) {
    removePendingAttempts(userId, [attempt]);
}

// The RPC has committed: publish the committed record (never over one
// another tab already published, whose settled steps stay settled), prove
// it landed, and only then sweep the attempts, so an attempt written in
// between is swept too rather than left behind the record. If the record
// cannot be written, the attempts stay as they are: the next load retries
// the idempotent RPC, which finds nothing left, and finishes the cleanup
// from there. Resolves true once a committed record stands.
function commitDeletionRecord(userId, extra) {
    const unconfirmed = !!(extra && extra.unconfirmed);
    const current = readDeletionRecord(userId);
    if (!(current && current.phase === 'committed')) {
        writeDeletionRecord(Object.assign({ userId, phase: 'committed', at: Date.now() }, extra || {}));
    }
    const check = readDeletionRecord(userId);
    const ok = !!(check && check.phase === 'committed');
    if (ok) {
        // A confirmed commit is recorded in its own write-once key, so it
        // stands whichever writer published the record (an unconfirmed
        // settlement may have got there first, see readDeletionRecord).
        if (!unconfirmed) markStepSettled(userId, 'confirmed');
        removePendingAttempts(userId, readPendingAttempts(userId));
    } else {
        console.warn('Could not record the commit; the pending record stays and the next load finishes the job.');
    }
    return ok;
}

// Record which cleanup steps have settled, each in its own write-once key,
// so settling is monotonic across tabs. Once both have, the record stands
// as a tombstone (done, with an expiry) that keeps refusing that account's
// session for a while. Only a committed record has steps to settle; a
// pending one is left alone.
function settleDeletionRecord(userId, patch) {
    // Steps are only ever settled after a confirmed commit; when its record
    // could not be stored, the pending attempt still stands for the account,
    // and the step keys are what keep a later retry from redoing the clear
    // over progress saved since.
    const current = readDeletionRecord(userId);
    if (!current) return;
    if (patch.progressPending === false) markStepSettled(userId, 'progress');
    if (patch.sessionPending === false) markStepSettled(userId, 'session');
}

function progressStepSettled(userId) {
    return readSettledSteps(userId).progress !== null;
}

// Take the session Web Lock for at most `timeoutMs`. Another tab can hold it
// (its adapter write, or its own cleanup), and nothing after the commit may
// wait forever. Resolves { ran: true, result } or { ran: false, reason }.
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

// The stored session entry as stored (a string, or null), read straight
// from storage.
function rawStoredSession() {
    try {
        return localStorage.getItem(sessionStorageKey());
    } catch (err) {
        console.warn('Could not read the stored session:', err);
        return null;
    }
}

// A stored session entry this browser signed out of without being able to
// remove it (no session lock to be had): its value is kept here, and an
// entry still equal to it is treated as no session by start-up and the
// listener, until a different value replaces it (a new sign-in, a refresh).
function isSignedOutEntry() {
    try {
        const marker = localStorage.getItem(SIGNED_OUT_ENTRY_KEY);
        if (marker === null) return false;
        const current = rawStoredSession();
        if (current !== null && current === marker) return true;
        // The entry has changed (or gone): the marker has served.
        localStorage.removeItem(SIGNED_OUT_ENTRY_KEY);
        return false;
    } catch {
        return false;
    }
}

// The explicit sign-out. The library's own sign-out would revoke and remove
// whatever the entry holds by then, which another tab may have replaced
// with a different account, so nothing is done through it. The account is
// first signed out of this browser for good: its sign-out guard is written
// (no automatic write stores its session again, from any tab, until an
// explicit sign-in of it; see sessionWriteRefused), then its entry removed
// by a compare-and-remove under the session lock, or, without the lock
// (none to be had, or wedged), left as it is and marked signed out (see
// isSignedOutEntry; an unlocked check-and-remove could take a replacement's
// entry with it). Only once that holds is the session this tab is signed
// in as (read, bounded, first) revoked server-side, through a client
// pinned to its token (everywhere, as the library's sign-out would); once
// storage no longer holds that account, nothing is revoked. Resolves false
// when the entry could be neither removed nor marked: nothing has changed
// then, and the person stays signed in (the caller says so).
async function signOutCurrentUser() {
    if (!supabaseClient) return true;
    const userId = currentUser ? currentUser.id : null;
    const signedOutHere = () => {
        if (currentUser && currentUser.id === userId) {
            currentUser = null;
            onUserLoggedOut();
        }
    };
    if (userId === null) return true;
    // An account whose deletion is unanswered keeps its stored credentials:
    // the next load retries delete_user() with them (see
    // resolvePendingDeletion), and a revoke would end them. This tab goes to
    // guest mode without touching them.
    const record = readDeletionRecord(userId);
    if (record && record.phase === 'pending') {
        console.warn('Signing out locally only: a deletion of this account is still unanswered, and its credentials are kept for the retry.');
        signedOutHere();
        return true;
    }
    const session = await readSessionWithin(deleteAttemptTimeoutMs());
    // A read that did not answer keeps running: its refresh must not put
    // the account back after this sign-out (see readSessionResultWithin).
    if (session === undefined) makeOutstandingReadStrict(userId);
    // The guard first: a refresh landing between here and the removal is
    // refused already. Without it (storage full), the removal below still
    // signs the account out; only a refresh in flight elsewhere could
    // bring it back, as before the guard existed.
    const guarded = writeSignedOutGuard(userId);
    if (!guarded) console.warn('The sign-out could not be recorded; a refresh in flight elsewhere may restore the account.');
    // The entry as it stands with the guard written: only an explicit
    // sign-in of the account can replace it from here, and one that does
    // is newer than this sign-out, so it is neither removed, marked nor
    // revoked (this tab still goes to guest mode).
    const entry = rawStoredSession();
    const { ran, result: removed } = await withSessionLock(() => removeStoredSessionIfEntry(userId, entry), deleteAttemptTimeoutMs());
    // 'removed', 'marked', 'absent' (storage no longer holds the account,
    // or not as it stood), or null when neither the removal nor the
    // marking could be had.
    let outcome = null;
    if (ran) outcome = removed ? 'removed' : 'absent';
    else {
        outcome = markStoredSessionSignedOut(userId, entry);
        if (outcome === 'marked') console.warn('No session lock; the stored session is left and marked signed out.');
    }
    if (outcome === null) {
        if (guarded) clearSignedOutGuard(userId);
        console.warn('Could not sign out: the stored session could be neither removed nor marked signed out; staying signed in.');
        return false;
    }
    if (outcome === 'absent') {
        console.warn('Storage no longer holds this account as it stood; nothing to revoke.');
    } else if (session && session.user && session.user.id === userId && session.access_token) {
        try {
            const revoke = clientForSession(session).auth.admin.signOut(session.access_token, 'global');
            if (!(await settlesWithin(revoke, deleteAttemptTimeoutMs()))) {
                console.warn('Sign-out revoke did not answer in time; signed out locally.');
            } else {
                const { error } = await revoke;
                if (error) console.warn('Sign-out revoke failed (signed out locally):', error.message);
            }
        } catch (err) {
            console.warn('Sign-out revoke failed (signed out locally):', err);
        }
    } else {
        console.warn('No session of this account to revoke; signed out locally.');
    }
    // Other tabs signed in as the account learn of it only from here.
    announceSignedOut(userId);
    signedOutHere();
    return true;
}

// Mark the stored entry signed out, when it is the account's and still
// `entry` (see isSignedOutEntry), and read the marker back: one that did
// not land (storage full) would leave the account to be restored on the
// next load. 'marked', 'absent' (the entry is not this account's, or not
// as it stood), or null.
function markStoredSessionSignedOut(userId, entry) {
    try {
        const current = rawStoredSession();
        if (entry === null || current !== entry || storedSessionUserId() !== userId) return 'absent';
        localStorage.setItem(SIGNED_OUT_ENTRY_KEY, current);
        return localStorage.getItem(SIGNED_OUT_ENTRY_KEY) === current ? 'marked' : null;
    } catch (err) {
        console.warn('Could not mark the stored session signed out:', err);
        return null;
    }
}

// The user of the stored session, read straight from storage, or null.
function storedSessionUser() {
    try {
        const stored = JSON.parse(localStorage.getItem(sessionStorageKey()));
        return stored && stored.user && stored.user.id ? stored.user : null;
    } catch (err) {
        console.warn('Could not read the stored session:', err);
        return null;
    }
}

// Who holds this device's session, read straight from storage. Safe to call
// while holding the session lock (reads never take it).
function storedSessionUserId() {
    try {
        const stored = JSON.parse(localStorage.getItem(sessionStorageKey()));
        return stored && stored.user ? stored.user.id : null;
    } catch (err) {
        console.warn('Could not read the stored session:', err);
        return null;
    }
}

// Remove the stored session entry only if it belongs to `userId`. Must run
// under the session lock: every writer of that entry takes it (the adapter
// above), so nothing can swap the entry between the check and the removal.
function removeStoredSessionIfUser(userId) {
    if (storedSessionUserId() !== userId) return false;
    localStorage.removeItem(sessionStorageKey());
    return true;
}

// Remove the stored session entry only if it belongs to `userId` and is
// still exactly `entry` (see signOutCurrentUser). Must run under the
// session lock, as above.
function removeStoredSessionIfEntry(userId, entry) {
    if (entry === null || rawStoredSession() !== entry || storedSessionUserId() !== userId) return false;
    localStorage.removeItem(sessionStorageKey());
    return true;
}

// Clear the local progress of a deleted account, unless another account has
// signed in on this device meanwhile (another tab). The decision keys off who
// holds the stored session, read under the session lock, so a replacement
// sign-in cannot slip in between the check and the clear.
//
// On a takeover storage is left as it is. Local progress is not partitioned
// per account (#52): the store carries no owner, so the deleted account's
// entries cannot be told from ones the replacement has since made (the same
// item may be ticked by both), and any read-modify-write of it would race the
// replacement's own saves in other tabs. Removing them is #52's job. Memory
// starts empty either way and the sync fills it from the replacement's cloud
// rows; nothing of the deleted account's list is adopted into memory.
//
// Resolves true when the decision was made, false when the lock never came
// free (memory is cleared regardless; start-up retries the decision from the
// marker).
async function clearLocalProgressUnlessTakenOver(userId, { evenIfSettled = false } = {}) {
    const decide = () => {
        completedItems = {};
        // Read what stands while holding the lock: if another tab has cleared
        // and settled the step meanwhile, storage may already hold new guest
        // progress, and only this tab's memory is dropped. Unless this tab's
        // own late write may be what stands there (see the caller).
        const standing = readDeletionRecord(userId);
        const settled = (standing && standing.phase === 'committed' && !standing.progressPending) || progressStepSettled(userId);
        if (settled && !evenIfSettled) {
            return;
        }
        const holder = storedSessionUserId();
        if (holder !== null && holder !== userId) {
            // Deliberately theirs: this settles the step just as a clear does.
            console.warn('Another account holds this device; leaving its stored progress alone (#52).');
        } else {
            saveState();
        }
        // Settled in the same critical section as the clear.
        settleDeletionRecord(userId, { progressPending: false });
    };
    const { ran, reason } = await withSessionLock(decide, deleteAttemptTimeoutMs());
    if (ran) return true;
    // Without the lock (no Web Locks at all, or one that never came free)
    // the check-and-clear could straddle another tab installing a
    // replacement account and wipe their progress, so storage is not
    // touched and the step stays pending; only this page's memory goes.
    console.warn(reason === 'no-locks'
        ? 'No Web Locks; stored progress is left as it is and the step stays pending.'
        : 'Session lock unavailable; stored progress is cleared on the next load instead.');
    completedItems = {};
    return false;
}

// End the initiating session and nothing else. signOut() on the shared client
// would act on whatever session storage holds by then, which another tab may
// have replaced, so instead: revoke the captured token server-side (best
// effort; for a deleted user it just answers 403) and remove the stored
// session only if it still belongs to the initiator, under the lock every
// writer of that entry takes. Resolves true once the removal decision was
// made (removed, or the entry is already someone else's), false when it could
// not be (no Web Locks, lock never free): then the entry stays and the marker
// keeps it from being restored until start-up can finish the job.
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

    const { ran, result } = await withSessionLock(() => removeStoredSessionIfUser(userId), deleteAttemptTimeoutMs());
    if (!ran) {
        console.warn('Stored session left in place; the deleted-user marker keeps it from being restored.');
    } else if (!result) {
        console.warn('Stored session already belongs to another account; left in place.');
    }

    if (currentUser && currentUser.id === userId) {
        currentUser = null;
        onUserLoggedOut();
    }
    return ran;
}

// An account is signing in while deletions of other accounts are still
// recorded here. Whatever those deletions left on this device is theirs now,
// except what this page holds in memory: it was loaded from the shared store
// (#52) and may be another account's list, which their sync would otherwise
// upload under their name. So memory starts empty, once per page for each
// such record and account: the store itself may still carry the other
// account's list (a takeover leaves it alone, a failed sync keeps it), so
// every page load starts over, while later session events of the same
// account (a token refresh) do not empty what the account has since done.
// A committed record's cleanup is settled by the takeover and becomes a
// tombstone; a pending record (an unanswered deletion of someone else's
// account) is not theirs to settle and stays until that account's
// credentials return.
const takeoversThisPage = new Set();

function takeOverFromDeletedAccounts(newUserId) {
    const records = readDeletionRecords();
    let emptyMemory = false;
    Object.keys(records).forEach(userId => {
        if (userId === newUserId) return;
        const record = records[userId];
        if (record.phase === 'committed' && !record.done) {
            settleDeletionRecord(userId, { progressPending: false, sessionPending: false });
        }
        const seen = `${userId}>${newUserId}`;
        if (!takeoversThisPage.has(seen)) {
            takeoversThisPage.add(seen);
            emptyMemory = true;
        }
    });
    if (emptyMemory) {
        // Redrawn at once: the sync that fills memory from the cloud may
        // stall, and the previous account's list must not stay on screen
        // meanwhile.
        completedItems = {};
        renderList();
        updateProgress();
    }
}

// One delete_user() call, bounded by the attempt timeout. Resolves
// { error } like the library does; a rejected transport (postgrest-js
// returns aborts as { error } today, but a thrown one must take the same
// path) comes back as an unanswered error.
async function attemptDeleteRpc(client) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), deleteAttemptTimeoutMs());
    try {
        const result = await client.rpc('delete_user').abortSignal(controller.signal);
        // The HTTP status travels beside the error: a gateway answering in
        // the database's place says 5xx with whatever body it likes, and
        // the body's code (if any) is not the database's.
        if (result && result.error && typeof result.status === 'number') result.error.status = result.status;
        return result;
    } catch (err) {
        return { error: { code: '', message: `${(err && err.name) || 'FetchError'}: ${(err && err.message) || ''}`, details: '', hint: '', status: 0 }, status: 0 };
    } finally {
        clearTimeout(timer);
    }
}

// The server refused the stored session of an account whose deletion is
// unanswered, for good: its refresh token is gone. No credentials of the
// account are left in this browser and none can come back on their own (a
// deleted account cannot sign in again; only a magic link the server
// verifies produces a session of it, which is possible only if it still
// exists, see finishMagicLinkSignIn), so nothing here can call delete_user()
// for it any more. The unanswered request is what most likely took the
// credentials away, but that is no proof (a sign-out everywhere revokes them
// too), so the outcome stays unconfirmed. What is settled is that this
// browser is done with the account: its sign-in here has ended either way,
// and the copy it holds is treated as a deleted account's, so the record is
// committed, flagged unconfirmed, and the cleanup runs as after a commit,
// with the person told the deletion could not be confirmed from here. A
// verified sign-in of the account later calls the RPC again and confirms it.
function settleUnreachableDeletion(userId) {
    console.warn('The server no longer accepts this browser\'s session of the account; the unfinished deletion cannot be retried from here.');
    announceAccountDeleted(userId);
    const current = readDeletionRecord(userId);
    if (current && current.phase === 'committed') return current;
    if (commitDeletionRecord(userId, { unconfirmed: true })) return readDeletionRecord(userId);
    return { userId, phase: 'committed', progressPending: true, sessionPending: true, unrecorded: true, unconfirmed: true };
}

// A deletion whose answer never arrived (the page closed while the RPC was
// out, or the outcome was reported as unknown). Whether the account still
// exists right now proves nothing: the unanswered request may still be
// running and commit a moment later. What settles it is finishing the job
// the person asked for: the RPC is idempotent, so it is called again with
// that account's credentials (the session it left behind, refreshed, or a
// session the server just verified). Success means the account is gone,
// whichever call did it, and the cleanup runs; anything else (no answer, a
// definite error, the function missing now, no session of that account to
// call with) leaves the outcome unknown: nothing is restored and nothing is
// wiped, and it is tried again on the next load or the next verified
// sign-in. Once the server has refused the stored session for good, no
// retry is possible from here any more, and the record is settled without
// confirmation instead (see settleUnreachableDeletion). Resolves the record
// as it stands afterwards, or null.
async function resolvePendingDeletion(marker, verifiedSession, retried = false) {
    const { userId } = marker;
    let session = verifiedSession || null;
    if (!session) {
        if (storedSessionUserId() !== userId) {
            console.warn('Outcome of an unfinished deletion is unknown; nothing restored or wiped.');
            return marker;
        }
        const entryBefore = rawStoredSession();
        const read = await readSessionResultWithin(deleteAttemptTimeoutMs());
        if (read && !read.session && isDefinitiveAuthRejection(read.error)) {
            // The refusal is final only for the session that was refused.
            // Another tab may store a newer session of the account (its own
            // refresh succeeding), which the adapter keeps from the
            // library's removal: the comparison and the settlement run under
            // the session lock, so no such write lands in between (and once
            // the record is published the adapter refuses it), a newer
            // session found is retried with, once, and without the lock the
            // record stays pending for a later load.
            const { ran, result } = await withSessionLock(() => {
                if (rawStoredSession() !== entryBefore) return { changed: true };
                return { settled: settleUnreachableDeletion(userId) };
            }, deleteAttemptTimeoutMs());
            if (!ran) {
                console.warn('Session lock unavailable; the refused session is left for a later load to settle.');
                return marker;
            }
            if (result.changed) {
                if (!retried && storedSessionUserId() === userId) return resolvePendingDeletion(marker, null, true);
                console.warn('The stored session changed under the retry; outcome stays unknown.');
                return marker;
            }
            return result.settled;
        }
        session = read === undefined ? undefined : read.session;
    }
    if (!session || !session.user || session.user.id !== userId || !session.access_token) {
        console.warn('No usable session to finish the unfinished deletion with; outcome stays unknown.');
        return marker;
    }
    const { error } = await attemptDeleteRpc(clientForSession(session));
    if (!error) {
        console.warn('Finished the unfinished deletion; the account is gone.');
        announceAccountDeleted(userId);
        // A record committed without confirmation (see
        // settleUnreachableDeletion) is confirmed by this answer.
        const current = readDeletionRecord(userId);
        if (current && current.phase === 'committed') {
            markStepSettled(userId, 'confirmed');
            return readDeletionRecord(userId) || current;
        }
        if (commitDeletionRecord(userId)) return readDeletionRecord(userId);
        // The answer is definite even if the record cannot be stored: the
        // cleanup runs on this outcome, while the pending attempt (and the
        // stored session it needs) stay for the next load to record it.
        return { userId, phase: 'committed', progressPending: true, sessionPending: true, unrecorded: true };
    }
    // A "function missing" answer to this retry says nothing about the
    // earlier request either: the function may have been removed, or absent
    // from a refreshed schema cache, after that one ran. Only a success can
    // settle it, so it stays unknown like any other definite error.
    // Another tab, or a verified sign-in, may have committed this same
    // deletion while the answer was out: what stands now is what counts.
    const standingNow = readDeletionRecord(userId);
    if (standingNow && standingNow.phase === 'committed') {
        console.warn('The unfinished deletion was finished elsewhere meanwhile.');
        return standingNow;
    }
    console.warn('The unfinished deletion could not be settled:', error.message);
    return standingNow || marker;
}

// Start-up: finish what a deletion could not. The page may have closed right
// after the commit, or the session lock never came free. Runs before any
// session is restored, under the same lock, and repeats on later loads until
// every pending step has settled. A stored session of the deleted account is
// removed; local progress is cleared unless another account has taken over
// this device meanwhile (then it is theirs to keep, see
// clearLocalProgressUnlessTakenOver).
async function finishPendingDeletionCleanup(marker) {
    const { userId } = marker;
    const finish = (mayRemoveSession) => {
        // What stands is read here, under the lock: another tab may have
        // cleared and settled the progress step while this one waited, and
        // storage may since hold new guest progress that must not be wiped.
        const current = readDeletionRecord(userId);
        const standing = current && current.phase === 'committed' ? current : marker;
        const holder = storedSessionUserId();
        const takenOver = holder !== null && holder !== userId;
        let sessionSettled = holder !== userId;
        if (holder === userId && mayRemoveSession) {
            localStorage.removeItem(sessionStorageKey());
            sessionSettled = true;
        }
        if (sessionSettled) settleDeletionRecord(userId, { sessionPending: false });
        // Memory was loaded from the shared store before this ran and may
        // hold the deleted account's list: never keep it.
        completedItems = {};
        let cleared = false;
        if (standing.progressPending && !progressStepSettled(userId)) {
            // On a takeover storage is theirs (#52); their sync refills
            // memory.
            if (takenOver) {
                console.warn('Another account holds this device; leaving its stored progress alone (#52).');
            } else {
                saveState();
            }
            settleDeletionRecord(userId, { progressPending: false });
            cleared = true;
        }
        return { sessionSettled, cleared };
    };
    // A commit that could not be recorded keeps the stored session: the
    // pending attempt still blocks its restore, and the next load needs it
    // to call the RPC again and record the commit.
    const mayRemoveSession = !marker.unrecorded;
    const { ran, result, reason } = await withSessionLock(() => finish(mayRemoveSession), deleteAttemptTimeoutMs());
    if (!ran) {
        // Without the lock (none at all, or one that never came free) neither
        // the stored progress nor the session entry is touched: the
        // check-and-clear could straddle another tab installing a
        // replacement account. Both steps stay pending; the record keeps the
        // session from being restored meanwhile. What is on screen does not
        // wait for a lock.
        console.warn(reason === 'no-locks'
            ? 'No Web Locks; deletion cleanup left pending.'
            : 'Session lock unavailable; deletion cleanup deferred to the next load.');
        completedItems = {};
        renderList();
        updateProgress();
        // Without Web Locks no later load can clear the browser copy either;
        // the caller tells the person, unless the step was settled before
        // (another tab's clear, a takeover). A lock that timed out is
        // retried on the next load, and the person is told that too rather
        // than told the copy is gone.
        const settled = progressStepSettled(userId);
        return { localCleanupIncomplete: reason === 'no-locks' && !settled, localCleanupDeferred: reason === 'timeout' && !settled };
    }
    // Memory was reset under the lock whether or not this invocation was the
    // one to clear storage; the screen follows either way.
    if (result.cleared) {
        console.warn('Dropped the progress of an account deleted from this browser.');
    }
    renderList();
    updateProgress();
    return { localCleanupIncomplete: false };
}

async function performAccountDeletion(userId, state) {
    const session = await readSessionWithin(deleteAttemptTimeoutMs());
    if (session === undefined) {
        throw new Error('Could not read the session in time; deletion not started');
    }
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
    // one signed in here, so nothing is deleted. Unreadable counts as "not
    // sure", which is also a no.
    const holderBeforeRpc = await currentSessionUserId();
    if (holderBeforeRpc === undefined) {
        throw new Error('Could not read the session in time; deletion not started');
    }
    if (holderBeforeRpc !== userId) {
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
    // A record still pending from an earlier attempt (this page, another
    // tab, or a previous page) is an unanswered RPC that may have committed:
    // only a success can settle it, so this attempt starts out ambiguous.
    const record = recordPendingDeletion(userId);
    if (record.writeFailed) {
        // Nothing is sent. But an attempt already unanswered may yet commit,
        // and that stays what it was: unknown, not "still active".
        if (record.existed) {
            state.uncertain = true;
            const uncertain = new Error('Could not record a new attempt while an earlier one is unanswered; outcome unknown');
            uncertain.code = 'DELETE_UNCERTAIN';
            throw uncertain;
        }
        throw new Error('Could not record the deletion in this browser; deletion not started');
    }
    // Whether this attempt's own calls ever went unanswered (then its own
    // record must stay: it may have committed), as opposed to other
    // attempts standing (then this one's definite answer still cannot vouch
    // for the account, but its own record is done with).
    let ownUnanswered = false;
    let rpcError = null;
    let alreadyCommitted = !!record.alreadyCommitted;
    if (alreadyCommitted) {
        // Another tab's attempt has committed meanwhile: the account is gone
        // and nothing is sent; the cleanup below finishes what that tab may
        // not have.
        console.warn('The account was already deleted by another attempt; finishing the cleanup.');
    } else {
        for (let attempt = 1; attempt <= 3; attempt++) {
            ({ error: rpcError } = await attemptDeleteRpc(asInitiator));
            if (!rpcError || !isAmbiguousRpcError(rpcError)) break;
            ownUnanswered = true;
            console.warn(`delete_user() attempt ${attempt} got no usable answer:`, rpcError.message);
            if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 500 * attempt));
        }
    }
    let othersUnanswered = false;
    if (rpcError) {
        // Another tab's attempt for the same account may have committed while
        // this one was out (two tabs can each write their attempt before
        // seeing the other's), in which case this error says nothing: the
        // account is gone and the cleanup below is what is left to do.
        // (A record committed without confirmation is not that: the
        // account may still exist, so this error stands.)
        const standingNow = readDeletionRecord(userId);
        if (standingNow && standingNow.phase === 'committed' && !standingNow.unconfirmed) {
            console.warn('The account was deleted by another attempt meanwhile; finishing the cleanup.');
            rpcError = null;
            alreadyCommitted = true;
        } else {
            // Another attempt still unanswered may yet commit: this error
            // cannot vouch for the account being active. This attempt's own
            // record, though, is done with once its own history is definite;
            // left standing it would keep the other's answer ambiguous too.
            // The other attempts are those still recorded once this one is
            // cleared: one that answered definitely meanwhile has cleared
            // itself (two definite answers converge on a definite failure),
            // one swept by a commit shows as that commit, which outranks
            // this error, and one started since counts as unanswered.
            if (!ownUnanswered && !isAmbiguousRpcError(rpcError)) clearPendingDeletion(userId, record.attempt);
            const afterwards = readDeletionRecord(userId);
            if (afterwards && afterwards.phase === 'committed' && !afterwards.unconfirmed) {
                console.warn('The account was deleted by another attempt meanwhile; finishing the cleanup.');
                rpcError = null;
                alreadyCommitted = true;
            } else {
                // Any attempt still recorded, this one included (its clear
                // may have failed, and the next load would retry it), and a
                // record settled without confirmation, are unanswered
                // deletions: only a success settles them.
                othersUnanswered = !!(afterwards && ((afterwards.phase === 'pending' && afterwards.attempts.length > 0) || (afterwards.phase === 'committed' && afterwards.unconfirmed)));
            }
        }
    }
    if (rpcError) {
        // A definite error on a retry only describes that retry: an earlier
        // unanswered attempt (this one's, or another tab's) may already have
        // committed (and, say, the token then failed). Only a success can
        // settle it; otherwise it is unknown.
        if (ownUnanswered || othersUnanswered || isAmbiguousRpcError(rpcError)) {
            state.uncertain = true;
            const uncertain = new Error('Lost the connection while deleting the account; outcome unknown');
            uncertain.code = 'DELETE_UNCERTAIN';
            throw uncertain;
        }
        // A definite answer to this attempt: nothing was deleted by it, and
        // its record is already gone.
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
    // is always a committed outcome. The record is rewritten first, before
    // anything that can wait: if the page closes now, the next load finishes
    // the job and never restores this account from storage. If the rewrite
    // fails the pending record stays, and the next load settles it by
    // calling the idempotent RPC again. A record another tab already
    // committed is left as it is (its settled steps stay settled).
    const committedRecorded = commitDeletionRecord(userId);
    announceAccountDeleted(userId);
    // What is still to do is read afresh: another tab may have committed and
    // settled steps while the RPC was out, and a settled step is not redone
    // (guest progress saved since would be lost).
    const standing = readDeletionRecord(userId);
    const progressStillPending = !(standing && standing.phase === 'committed' && !standing.progressPending);
    // A step another attempt settled counts as settled here too (the copy
    // is not reported as uncleared below).
    let progressSettled = !progressStillPending;
    if (progressStillPending) {
        try {
            // Clear the local copy: leaving it would make syncCloudProgress()
            // upload it all again on the next sign-in. Unless another account
            // has taken over this device meanwhile; see the helper.
            progressSettled = await clearLocalProgressUnlessTakenOver(userId);
        } catch (err) {
            console.warn('Could not clear local progress after deletion:', err);
            // Memory must not keep the deleted list either way; storage is
            // left alone when it might now be someone else's.
            completedItems = {};
        }
    } else {
        completedItems = {};
    }
    settleDeletionRecord(userId, { progressPending: !progressSettled });

    // End only the session that was just deleted. If another account signed in
    // on this device meanwhile (another tab), its stored session is left in
    // place; the caller re-runs its sign-in sync once the deletion flag clears.
    // If the commit could not be recorded, the session is kept as well: the
    // attempt stays pending, and the next load needs those credentials to
    // call the idempotent RPC again; the record keeps it from being restored
    // meanwhile.
    let sessionSettled = false;
    if (!committedRecorded) {
        console.warn('Commit not recorded; keeping the stored session for the retry on the next load.');
        if (currentUser && currentUser.id === userId) {
            currentUser = null;
            onUserLoggedOut();
        }
    } else {
        try {
            sessionSettled = await endInitiatingSession(asInitiator, session, userId);
        } catch (err) {
            console.warn('Could not end the stored session after deletion:', err);
            if (currentUser && currentUser.id === userId) {
                currentUser = null;
                onUserLoggedOut();
            }
        }
    }
    settleDeletionRecord(userId, { sessionPending: !sessionSettled });

    let sessionChanged = false;
    try {
        const holder = await currentSessionUserId();
        if (holder === undefined) {
            console.warn('Could not read the session after deletion; assuming nobody took over.');
        } else {
            sessionChanged = holder !== null && holder !== userId;
        }
    } catch (err) {
        console.warn('Could not read the session after deletion:', err);
    }
    if (sessionChanged) {
        console.warn('Another account signed in during deletion; leaving its session in place.');
    }

    // Without Web Locks the stored progress could not be cleared safely and
    // no later load will do it either; with them, a clear the lock never
    // came free for is done on the next load. Either way the person is
    // told, rather than told the browser copy is gone.
    return {
        sessionChanged,
        localCleanupIncomplete: !progressSettled && !hasWebLocks(),
        localCleanupDeferred: !progressSettled && hasWebLocks()
    };
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
