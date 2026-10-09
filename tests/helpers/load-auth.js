// Loads the real js/auth.js and js/utils.js the way index.html does: as classic
// scripts sharing one global scope, in the page's order (auth.js first, then
// utils.js), so a load-order regression shows up here too. Both are plain scripts with no exports and
// package.json is "type": "module", so they cannot be imported - node:vm gives
// them a scope with stubs for the browser globals they expect. The point is
// that the tests run the shipped source; a re-implementation would prove
// nothing about js/auth.js.

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Minimal Storage implementation: string values, null for missing keys.
export function createLocalStorage(seed = {}) {
    const store = new Map(Object.entries(seed).map(([k, v]) => [k, String(v)]));
    return {
        getItem: key => (store.has(key) ? store.get(key) : null),
        setItem: (key, value) => { store.set(key, String(value)); },
        removeItem: key => { store.delete(key); },
        clear: () => store.clear(),
        get length() { return store.size; },
        snapshot: () => Object.fromEntries(store)
    };
}

// Stands in for the Supabase client. Records every write so a test can assert
// that nothing belonging to the previous account was pushed to the cloud.
export function createFakeSupabase({ rows = [], selectError = null, session = null } = {}) {
    const upserts = [];
    const deletes = [];
    const listeners = [];
    let upsertCalls = 0;

    return {
        upserts,
        deletes,
        listeners,
        get upsertCalls() { return upsertCalls; },
        emit(event, payload = null) {
            return Promise.all(listeners.map(cb => cb(event, payload)));
        },
        from(table) {
            return {
                select: () => ({
                    eq: async (column, value) => (selectError
                        ? { data: null, error: selectError }
                        : { data: rows.filter(row => row[column] === value), error: null })
                }),
                upsert: async rowOrRows => {
                    upsertCalls++;
                    if (Array.isArray(rowOrRows)) {
                        rowOrRows.forEach(row => upserts.push({ table, row }));
                    } else {
                        upserts.push({ table, row: rowOrRows });
                    }
                    return { error: null };
                },
                delete: () => {
                    const filters = {};
                    const builder = {
                        eq: (column, value) => {
                            filters[column] = value;
                            return builder;
                        },
                        // Recorded once, when the chain is awaited, with a
                        // copy of the filters as they stand by then.
                        then: (resolve, reject) => {
                            deletes.push({ table, filters: { ...filters } });
                            return Promise.resolve({ error: null }).then(resolve, reject);
                        }
                    };
                    return builder;
                }
            };
        },
        auth: {
            getSession: async () => ({ data: { session } }),
            onAuthStateChange: (cb) => {
                listeners.push(cb);
                return { data: { subscription: { unsubscribe() {} } } };
            },
            signOut: async () => ({ error: null })
        }
    };
}

// Returns handles onto the module's internal `let` bindings. They live in the
// context's lexical scope rather than on its global object, so the only way to
// reach them is from code evaluated in that same context.
// `overrides` are merged onto the sandbox before the scripts run, so a test can
// supply the browser globals a particular path needs (a richer `document`,
// `crypto`, `TextEncoder`, a `window.GOOGLE_CLIENT_ID`) without every other
// test having to carry them.
export function loadAuthModule({ storage = createLocalStorage(), supabaseClient = null, overrides = {} } = {}) {
    const renders = { list: 0, progress: 0 };

    const sandbox = {
        console,
        setTimeout,
        clearTimeout,
        URL,
        URLSearchParams,
        AbortController,
        alert: () => {},
        localStorage: storage,
        document: { getElementById: () => null },
        window: {
            supabase: undefined,
            SUPABASE_URL: undefined,
            location: { href: 'https://example.test/', pathname: '/', search: '', hash: '' },
            history: { replaceState: () => {} }
        }
    };
    for (const [key, value] of Object.entries(overrides)) {
        if (key === 'window' && value && typeof value === 'object') {
            // Adopt the caller's object as the page's window, by reference, so
            // a test can change it after load (install `window.google`, swap
            // `matchMedia`) and auth.js sees the change. Fill in the defaults
            // it does not set.
            for (const [name, fallback] of Object.entries(sandbox.window)) {
                if (!(name in value)) value[name] = fallback;
            }
            sandbox.window = value;
        } else {
            sandbox[key] = value;
        }
    }
    sandbox.window.localStorage = storage;

    const context = vm.createContext(sandbox);

    // Globals that app.js and js/data.js own at runtime; auth.js only touches
    // them from inside functions, so declaring them up front is enough.
    vm.runInContext(`
        let completedItems = {};
        let currentLang = 'en';
        const UI_TRANSLATIONS = { en: { signIn: 'Sign In', signOut: 'Sign Out' } };
        function renderList() { globalThis.__renders.list++; }
        function updateProgress() { globalThis.__renders.progress++; }
    `, context, { filename: 'test-preamble.js' });
    sandbox.__renders = renders;

    for (const file of ['js/auth.js', 'js/utils.js']) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
    }

    vm.runInContext(`
        globalThis.__module = {
            get completedItems() { return completedItems; },
            set completedItems(value) { completedItems = value; },
            get currentUser() { return currentUser; },
            set currentUser(value) { currentUser = value; },
            get supabaseClient() { return supabaseClient; },
            set supabaseClient(value) { supabaseClient = value; },
            get authGeneration() { return authGeneration; },
            get currentLang() { return currentLang; },
            set currentLang(value) { currentLang = value; },
            initAuth,
            onUserLoggedIn,
            onUserLoggedOut,
            syncCloudProgress,
            syncItemToCloud,
            // Google sign-in on the app's origin (js/auth.js). The two getters
            // expose internal state the tests assert on.
            initGoogleSignIn,
            renderGoogleButton,
            onGoogleCredential,
            get googleNonce() { return googleNonce; },
            get googleSignInStarted() { return googleSignInStarted; }
        };
    `, context, { filename: 'test-hooks.js' });

    const module = sandbox.__module;
    module.supabaseClient = supabaseClient;

    return { module, storage, renders };
}

// completedItems is created inside the vm, so it has that context's
// Object.prototype and assert.deepStrictEqual would reject it on the prototype
// alone. Compare plain copies instead.
export function plain(value) {
    return JSON.parse(JSON.stringify(value));
}
