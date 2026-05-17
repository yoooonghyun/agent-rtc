// Flat ESLint config for the root MCP server package.
// Console has its own eslint.config.mjs and is linted via `npm --prefix console run lint`.
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "dist-test/**",
      "node_modules/**",
      "console/**", // console is linted by its own config
      ".sdd/**",
      ".github/**",
      ".husky/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.mcp.json", "./tsconfig.test.json"],
        tsconfigRootDir,
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Project rules per CLAUDE.md
      "@typescript-eslint/no-explicit-any": "error",
      // Allow unused args prefixed with _
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],
    },
  },
  // Config files (this file, etc.) — relax the project requirement.
  {
    files: ["*.mjs", "*.js"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
);
