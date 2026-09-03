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
            flowType: 'implicit',
            // Session writes go through the lock account deletion holds for
            // its check-and-remove of the stored session; see the adapter.
            storage: sessionStorageAdapter()
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

        const { data, error } = await supabaseClient.auth.verifyOtp({
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

        // A deletion of this account may still be recorded as unanswered.
        // The listener refused the sign-in for that record; the session the
        // server just verified is what can settle it (see
        // resolvePendingDeletion): the account ends up deleted, or the
        // record proves void and the sign-in is completed here, or it stays
        // unknown and the person is told.
        const verified = data && data.session && data.session.user ? data.session : null;
        const record = readDeletedUserMarker();
        if (verified && record && record.userId === verified.user.id && record.phase === 'pending') {
            const outcome = await resolvePendingDeletion(record, verified);
            if (outcome && outcome.phase === 'committed') {
                await finishPendingDeletionCleanup(outcome);
                if (currentUser && currentUser.id === verified.user.id) currentUser = null;
                onUserLoggedOut();
                alert(t().deleteSuccess);
            } else if (outcome) {
                alert(t().deleteUncertain);
            } else if (!currentUser) {
                currentUser = verified.user;
                await onUserLoggedIn();
            }
        }
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

        // A deletion started in this browser may not have finished: the page
        // closed while the RPC was out (outcome unknown), or right after the
        // commit, or the session lock was held. Settle what can be settled
        // before any session is restored.
        let pendingDeletion = readDeletedUserMarker();
        if (pendingDeletion) {
            try {
                if (pendingDeletion.phase === 'pending') {
                    pendingDeletion = await resolvePendingDeletion(pendingDeletion);
                }
                if (pendingDeletion && pendingDeletion.phase === 'committed') {
                    await finishPendingDeletionCleanup(pendingDeletion);
                }
            } catch (err) {
                // The marker stays, so the session below is still ignored.
                console.warn('Could not finish the pending deletion cleanup:', err);
            }
        }

        // Fetch existing active session
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (isDeletedUserSession(session)) {
            console.warn('Not restoring the stored session of an account deleted (or being deleted) from this browser.');
        } else if (session && session.user) {
            if (deletedUserId()) takeOverFromDeletedAccount();
            currentUser = session.user;
            await onUserLoggedIn();
        }

        // Listen for auth state changes
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            console.log('Supabase auth event:', event, session?.user?.email);
            if (isDeletedUserSession(session)) {
                // A refresh or restore of an account deleted (or being
                // deleted) from this browser. SIGNED_IN is no proof of a
                // fresh sign-in either (the library re-emits it for an
                // existing session, on tab focus for one); the magic-link
                // flow settles a pending record itself, from the server's
                // answer.
                return;
            }
            if (session && session.user) {
                if (deletedUserId()) takeOverFromDeletedAccount();
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
    // this device (its session stored by a third tab), in which case its
    // stored progress is left alone.
    try {
        await clearLocalProgressUnlessTakenOver(userId);
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

// The session the shared client holds, read with a bound: getSession() first
// refreshes an expired token over the network, and fetch has no timeout of
// its own, so a stalled refresh would otherwise keep the dialog busy forever.
// Resolves the session, null when there is none, undefined when it could not
// be read in time (the read itself is left running).
async function readSessionWithin(timeoutMs) {
    const read = supabaseClient.auth.getSession().then(({ data }) => (data && data.session) || null);
    if (!(await settlesWithin(read, timeoutMs))) return undefined;
    return read;
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
    const locked = (key, write) => {
        if (!hasWebLocks()) {
            write();
            return undefined;
        }
        return navigator.locks.request(`lock:${key}`, { mode: 'exclusive' }, async () => write());
    };
    return {
        getItem: (key) => localStorage.getItem(key),
        setItem: (key, value) => locked(key, () => localStorage.setItem(key, value)),
        removeItem: (key) => locked(key, () => localStorage.removeItem(key))
    };
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
const DELETED_USER_KEY = 'moiCheckDeletedUser';

function readDeletedUserMarker() {
    let raw;
    try {
        raw = localStorage.getItem(DELETED_USER_KEY);
    } catch (err) {
        console.warn('Could not read the deleted-user marker:', err);
        return null;
    }
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.userId) {
            if (parsed.phase !== 'pending') parsed.phase = 'committed';
            return parsed;
        }
    } catch {
        // An older marker held the bare user id; treat everything as pending.
    }
    return { userId: raw, phase: 'committed', progressPending: true, sessionPending: true };
}

// Before anything irreversible: record the attempt and prove the record is
// there. A browser that cannot keep it would not remember a commit either,
// so the deletion does not start. The record is browser-wide, so it carries
// an attempt id: another tab's attempt for the same account may still be
// unanswered, and only the attempt that wrote a pending record may clear
// it. Resolves { attempt, existed } (existed: a pending record of this
// account was already there, so an earlier attempt may yet commit), or null.
function recordPendingDeletion(userId) {
    const earlier = readDeletedUserMarker();
    const existed = !!(earlier && earlier.userId === userId && earlier.phase === 'pending');
    const attempt = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    writeDeletedUserMarker({ userId, phase: 'pending', attempt });
    const check = readDeletedUserMarker();
    if (!(check && check.userId === userId && check.phase === 'pending' && check.attempt === attempt)) return null;
    return { attempt, existed };
}

function clearPendingDeletion(userId, attempt) {
    const current = readDeletedUserMarker();
    if (current && current.userId === userId && current.phase === 'pending' && current.attempt === attempt) {
        clearDeletedUserMarker();
    }
}

// The RPC has committed: rewrite the record as committed, with both cleanup
// steps still to settle, and prove the rewrite landed. If it did not (a
// larger value can hit a quota the smaller one did not), the pending record
// stays as it is: the next load retries the idempotent RPC, which finds
// nothing left, and finishes the cleanup from there.
function commitDeletionRecord(userId) {
    writeDeletedUserMarker({ userId, phase: 'committed', progressPending: true, sessionPending: true });
    const check = readDeletedUserMarker();
    const ok = !!(check && check.userId === userId && check.phase === 'committed');
    if (!ok) console.warn('Could not record the commit; the pending record stays and the next load finishes the job.');
    return ok;
}

function deletedUserId() {
    const marker = readDeletedUserMarker();
    return marker ? marker.userId : null;
}

function writeDeletedUserMarker(marker) {
    try {
        localStorage.setItem(DELETED_USER_KEY, JSON.stringify(marker));
    } catch (err) {
        console.warn('Could not record the deleted-user marker:', err);
    }
}

function clearDeletedUserMarker() {
    try {
        localStorage.removeItem(DELETED_USER_KEY);
    } catch (err) {
        console.warn('Could not clear the deleted-user marker:', err);
    }
}

// Record which cleanup steps still stand; drop the marker once none does.
// Only a committed record has steps to settle; a pending one is left alone.
function settleDeletedUserMarker(userId, patch) {
    const current = readDeletedUserMarker();
    if (!current || current.userId !== userId || current.phase !== 'committed') return;
    const next = Object.assign({}, current, patch);
    if (!next.progressPending && !next.sessionPending) {
        clearDeletedUserMarker();
    } else {
        writeDeletedUserMarker(next);
    }
}

function isDeletedUserSession(session) {
    return !!(session && session.user && session.user.id && session.user.id === deletedUserId());
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
async function clearLocalProgressUnlessTakenOver(userId) {
    const decide = () => {
        const holder = storedSessionUserId();
        completedItems = {};
        if (holder !== null && holder !== userId) {
            // Deliberately theirs: this settles the step just as a clear does.
            console.warn('Another account holds this device; leaving its stored progress alone (#52).');
            return;
        }
        saveState();
    };
    const { ran, reason } = await withSessionLock(decide, deleteAttemptTimeoutMs());
    if (ran) return true;
    if (reason === 'no-locks') {
        decide();
        return true;
    }
    console.warn('Session lock unavailable; stored progress is cleared on the next load instead.');
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

// Another account is signing in while a committed deletion's cleanup is
// still recorded. Whatever that deletion left on this device is theirs now,
// except what this page holds in memory: it was loaded from the shared store
// (#52) and may be the deleted account's list, which their sync would
// otherwise upload under their name. Memory starts empty; storage is left to
// them. A pending record (an unanswered deletion of someone else's account)
// is not theirs to settle and stays until that account's credentials return.
function takeOverFromDeletedAccount() {
    const record = readDeletedUserMarker();
    if (!record || record.phase !== 'committed') return;
    completedItems = {};
    clearDeletedUserMarker();
}

// One delete_user() call, bounded by the attempt timeout. Resolves
// { error } like the library does; a rejected transport (postgrest-js
// returns aborts as { error } today, but a thrown one must take the same
// path) comes back as an unanswered error.
async function attemptDeleteRpc(client) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), deleteAttemptTimeoutMs());
    try {
        return await client.rpc('delete_user').abortSignal(controller.signal);
    } catch (err) {
        return { error: { code: '', message: `${(err && err.name) || 'FetchError'}: ${(err && err.message) || ''}`, details: '', hint: '' } };
    } finally {
        clearTimeout(timer);
    }
}

// A deletion whose answer never arrived (the page closed while the RPC was
// out, or the outcome was reported as unknown). Whether the account still
// exists right now proves nothing: the unanswered request may still be
// running and commit a moment later. What settles it is finishing the job
// the person asked for: the RPC is idempotent, so it is called again with
// that account's credentials (the session it left behind, refreshed, or a
// session the server just verified). Success means the account is gone,
// whichever call did it, and the cleanup runs; the function not existing
// means nothing could have happened and the record goes; anything else (no
// answer, a credential the server refuses, no session of that account to
// call with) leaves the outcome unknown: nothing is restored and nothing is
// wiped, and it is tried again on the next load or the next verified
// sign-in. Resolves the record as it stands afterwards, or null.
async function resolvePendingDeletion(marker, verifiedSession) {
    const { userId } = marker;
    let session = verifiedSession || null;
    if (!session) {
        if (storedSessionUserId() !== userId) {
            console.warn('Outcome of an unfinished deletion is unknown; nothing restored or wiped.');
            return marker;
        }
        session = await readSessionWithin(deleteAttemptTimeoutMs());
    }
    if (!session || !session.user || session.user.id !== userId || !session.access_token) {
        console.warn('No usable session to finish the unfinished deletion with; outcome stays unknown.');
        return marker;
    }
    const { error } = await attemptDeleteRpc(clientForSession(session));
    if (!error) {
        console.warn('Finished the unfinished deletion; the account is gone.');
        announceAccountDeleted(userId);
        commitDeletionRecord(userId);
        return readDeletedUserMarker();
    }
    if (!isAmbiguousRpcError(error) && isMissingRpcError(error)) {
        console.warn('delete_user() is not configured, so the unfinished deletion cannot have happened.');
        clearDeletedUserMarker();
        return null;
    }
    console.warn('The unfinished deletion could not be settled:', error.message);
    return marker;
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
        const holder = storedSessionUserId();
        const takenOver = holder !== null && holder !== userId;
        let sessionSettled = holder !== userId;
        if (holder === userId && mayRemoveSession) {
            localStorage.removeItem(sessionStorageKey());
            sessionSettled = true;
        }
        let cleared = false;
        if (marker.progressPending) {
            // Memory was loaded from the shared store before this ran and
            // may hold the deleted account's list: never keep it. On a
            // takeover storage is theirs (#52); their sync refills memory.
            completedItems = {};
            if (takenOver) {
                console.warn('Another account holds this device; leaving its stored progress alone (#52).');
            } else {
                saveState();
            }
            cleared = true;
        }
        return { sessionSettled, cleared };
    };
    const { ran, result, reason } = await withSessionLock(() => finish(true), deleteAttemptTimeoutMs());
    let outcome = result;
    if (!ran) {
        if (reason !== 'no-locks') {
            // Storage waits for a lock; what is on screen does not.
            console.warn('Session lock unavailable; deletion cleanup deferred to the next load.');
            completedItems = {};
            renderList();
            updateProgress();
            return;
        }
        // No lock anywhere: the progress decision is safe enough (it only
        // reads the holder), the removal is not; the entry is left to expire
        // and stays ignored meanwhile.
        outcome = finish(false);
    }
    settleDeletedUserMarker(userId, {
        progressPending: marker.progressPending && !(ran || reason === 'no-locks'),
        sessionPending: !outcome.sessionSettled
    });
    if (outcome.cleared) {
        console.warn('Dropped the progress of an account deleted from this browser.');
        renderList();
        updateProgress();
    }
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
    if (!record) {
        throw new Error('Could not record the deletion in this browser; deletion not started');
    }
    let sawAmbiguous = record.existed;
    let rpcError = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
        ({ error: rpcError } = await attemptDeleteRpc(asInitiator));
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
        // A definite answer to this attempt: nothing was deleted by it, so
        // its record goes (another tab's later record is left to that tab).
        clearPendingDeletion(userId, record.attempt);
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
    // calling the idempotent RPC again.
    commitDeletionRecord(userId);
    announceAccountDeleted(userId);
    let progressSettled = false;
    try {
        // Clear the local copy: leaving it would make syncCloudProgress()
        // upload it all again on the next sign-in. Unless another account has
        // taken over this device meanwhile; see the helper.
        progressSettled = await clearLocalProgressUnlessTakenOver(userId);
    } catch (err) {
        console.warn('Could not clear local progress after deletion:', err);
        // Memory must not keep the deleted list either way; storage is left
        // alone when it might now be someone else's.
        completedItems = {};
    }
    settleDeletedUserMarker(userId, { progressPending: !progressSettled });

    // End only the session that was just deleted. If another account signed in
    // on this device meanwhile (another tab), its stored session is left in
    // place; the caller re-runs its sign-in sync once the deletion flag clears.
    let sessionSettled = false;
    try {
        sessionSettled = await endInitiatingSession(asInitiator, session, userId);
    } catch (err) {
        console.warn('Could not end the stored session after deletion:', err);
        if (currentUser && currentUser.id === userId) {
            currentUser = null;
            onUserLoggedOut();
        }
    }
    settleDeletedUserMarker(userId, { sessionPending: !sessionSettled });

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
