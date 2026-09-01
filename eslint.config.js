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
      },
    },
    rules: {
      "no-undef": "off", // In non-bundled browser scripts, symbols are shared globally across files
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "vars": "local" }],
    },
  },
  {
    ignores: ["node_modules/"],
  },
];
