import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["app.js", "config.js", "config.template.js"],
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
      "no-undef": "error",
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
    },
  },
  {
    ignores: ["node_modules/"],
  },
];
