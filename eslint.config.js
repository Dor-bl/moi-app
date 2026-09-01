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
        // Shared Globals across script modules
        BUCKET_LIST: "writable",
        MILESTONES: "writable",
        CATEGORY_BADGES: "writable",
        UI_TRANSLATIONS: "writable",
        ALLOWED_THEMES: "writable",
        applyTheme: "writable",
        updateThemeButtonsUI: "writable",
        initTheme: "writable",
        setTheme: "writable",
        SUPABASE_URL: "writable",
        SUPABASE_ANON_KEY: "writable",
        supabaseClient: "writable",
        currentUser: "writable",
        updateAuthBtnState: "writable",
        initAuth: "writable",
        onUserLoggedIn: "writable",
        onUserLoggedOut: "writable",
        syncCloudProgress: "writable",
        syncItemToCloud: "writable",
        getMilestoneObj: "writable",
        showBadgeToast: "writable",
        saveState: "writable",
        createConfetti: "writable",
        completedItems: "writable",
        currentLang: "writable",
        currentFilter: "writable",
        currentView: "writable",
        selectedItemId: "writable",
        completedCollapsedPref: "writable",
        resortTimer: "writable",
        listNeedsResort: "writable",
        leafletMap: "writable",
        markersGroup: "writable",
        renderList: "writable",
        updateProgress: "writable",
        setupEventListeners: "writable"
      },
    },
    rules: {
      "no-undef": "error",
      "no-redeclare": "off",
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "vars": "local" }],
    },
  },
  {
    ignores: ["node_modules/"],
  },
];
