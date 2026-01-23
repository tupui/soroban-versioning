import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import react from "eslint-plugin-react";

export default [
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Browser globals
        window: "readonly",
        document: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        fetch: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        CustomEvent: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        crypto: "readonly",
        btoa: "readonly",
        atob: "readonly",
        // File API
        File: "readonly",
        Blob: "readonly",
        FileReader: "readonly",
        // Web APIs
        TextEncoder: "readonly",
        TextDecoder: "readonly",
        AbortController: "readonly",
        TransformStream: "readonly",
        WritableStream: "readonly",
        ReadableStream: "readonly",
        RequestInit: "readonly",
        Response: "readonly",
        // React types
        React: "readonly",
        HTMLElement: "readonly",
        HTMLInputElement: "readonly",
        HTMLTextAreaElement: "readonly",
        HTMLButtonElement: "readonly",
        HTMLAnchorElement: "readonly",
        Element: "readonly",
        Text: "readonly",
        Image: "readonly",
        KeyboardEvent: "readonly",
        // TypeScript types
        CryptoKey: "readonly",
        // Node globals (for some utils)
        Buffer: "readonly",
        process: "readonly",
        NodeJS: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": typescript,
      react: react,
    },
    rules: {
      // Focus on unused variables only
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-unused-vars": "off",
      // Allow empty catch blocks for expected error handling
      "no-empty": "off",
      // Allow console in dev environment
      "no-console": "off",
      // Turn off other noise for now
      "no-undef": "off",
      "no-redeclare": "off",
      "no-case-declarations": "off",
      "no-useless-escape": "off",
    },
  },
  {
    ignores: [
      "node_modules/",
      "dist/",
      ".astro/",
      "packages/",
      "tests/",
      "**/*.d.ts",
      "**/*.astro",
      "**/*.wrangler",
      "**/*.js", // Skip JS files for now
    ],
  },
];
