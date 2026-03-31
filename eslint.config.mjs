import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

const lintTargets = ["**/*.ts"];

const ignoredPaths = [
  "**/*.d.ts",
  "**/*.js",
  "**/*.mjs",
  "**/*.cjs",
  "**/node_modules/**",
  "**/dist/**",
  "**/dist-types/**",
  "**/.nuxt/**",
  "**/.output/**",
  "**/.venv/**",
  ".tmp*/**",
  "packages/desktop/**",
];

/** Root typed ESLint configuration for server, shared, and scripts TypeScript files. */
export default tseslint.config(
  {
    ignores: ignoredPaths,
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: lintTargets,
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
