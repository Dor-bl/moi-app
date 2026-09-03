import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["app.js", "config.js", "config.template.js", "js/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.es2021,
        L: "readonly",
        supabase: "readonly",
        // Readonly shared exports across script modules
        BUCKET_LIST: "readonly",
        MILESTONES: "readonly",
        CATEGORY_BADGES: "readonly",
        UI_TRANSLATIONS: "readonly",
        ALLOWED_THEMES: "readonly",
        applyTheme: "readonly",
        updateThemeButtonsUI: "readonly",
        initTheme: "readonly",
        setTheme: "readonly",
        updateAuthBtnState: "readonly",
        initAuth: "readonly",
        onUserLoggedIn: "readonly",
        onUserLoggedOut: "readonly",
        syncCloudProgress: "readonly",
        syncItemToCloud: "readonly",
        describeMagicLinkError: "readonly",
        deleteUserAccountAndData: "readonly",
        deletionOutcomeMessage: "readonly",
        signOutCurrentUser: "readonly",
        getMilestoneObj: "readonly",
        showBadgeToast: "readonly",
        saveState: "readonly",
        createConfetti: "readonly",
        renderList: "readonly",
        updateProgress: "readonly",
        setupEventListeners: "readonly",
        // Shared state variables
        SUPABASE_URL: "writable",
        SUPABASE_ANON_KEY: "writable",
        supabaseClient: "writable",
        currentUser: "writable",
        completedItems: "writable",
        currentLang: "writable",
        currentFilter: "writable",
        currentView: "writable",
        selectedItemId: "writable",
        completedCollapsedPref: "writable",
        resortTimer: "writable",
        listNeedsResort: "writable",
        leafletMap: "writable",
        markersGroup: "writable"
      },
    },
    rules: {
      "no-undef": "error",
      "no-redeclare": ["error", { "builtinGlobals": false }],
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "vars": "local" }],
    },
  },
  {
    ignores: ["node_modules/"],
  },
];
