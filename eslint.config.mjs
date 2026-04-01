import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

const typeScriptLintTargets = ["**/*.ts", "**/*.d.ts"];
const javaScriptLintTargets = ["**/*.js", "**/*.mjs", "**/*.cjs"];
const typeCheckedConfigs = tseslint.configs.recommendedTypeChecked.map((config) => ({
  ...config,
  files: typeScriptLintTargets,
}));

const ignoredPaths = [
  "**/node_modules/**",
  "**/dist/**",
  "**/dist-types/**",
  "**/.nuxt/**",
  "**/.output/**",
  "**/.venv/**",
  ".tmp*/**",
  "packages/client/**",
  "packages/desktop/**",
];

/** Root typed ESLint configuration for server, shared, and scripts TypeScript files. */
export default tseslint.config(
  {
    ignores: ignoredPaths,
  },
  eslint.configs.recommended,
  {
    files: javaScriptLintTargets,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-console": "error",
      "no-debugger": "error",
    },
  },
  ...typeCheckedConfigs,
  {
    files: typeScriptLintTargets,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "no-console": "error",
      "no-debugger": "error",
    },
  },
);
