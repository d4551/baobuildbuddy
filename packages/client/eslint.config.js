import eslint from "@eslint/js";
import pluginVue from "eslint-plugin-vue";
import pluginVueA11y from "eslint-plugin-vuejs-accessibility";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";

const typedFiles = ["**/*.{ts,tsx,vue}", "**/*.d.ts"];
const javaScriptFiles = ["**/*.js", "**/*.mjs", "**/*.cjs"];
const typedConfigs = tseslint.configs.recommendedTypeChecked.map((config) => ({
  ...config,
  files: typedFiles,
}));

/**
 * ESLint softener ban:
 * - No layout/format rule "off" (Biome owns formatting; use essential + quality, not recommended+mute).
 * - no-undef off only under TypeScript (type-aware supersedes).
 * - vue/multi-word-component-names off only for Nuxt pages/layouts/app/error (framework SSOT).
 */
export default [
  eslint.configs.recommended,
  // Quality-only Vue base — avoids layout rule softens required by flat/recommended + Biome.
  ...pluginVue.configs["flat/essential"],
  ...pluginVueA11y.configs["flat/recommended"],
  ...typedConfigs,
  {
    ignores: ["node_modules/**", ".nuxt/**", "**/.nuxt/**", ".output/**", "dist/**"],
  },
  {
    files: javaScriptFiles,
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-console": "error",
      "no-debugger": "error",
    },
  },
  {
    files: typedFiles,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".vue"],
        ecmaVersion: "latest",
        projectService: true,
        sourceType: "module",
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: typedFiles,
    rules: {
      // TypeScript projectService owns globals — core no-undef false-positives on types.
      "no-undef": "off",
      // Non-layout quality ratchets (strongly-recommended / recommended without format wars).
      "vue/attribute-hyphenation": "error",
      "vue/block-order": "error",
      "vue/component-definition-name-casing": "error",
      "vue/html-end-tags": "error",
      "vue/no-lone-template": "error",
      "vue/no-multiple-slot-args": "error",
      "vue/no-required-prop-with-default": "error",
      "vue/no-template-shadow": "error",
      "vue/no-v-html": "error",
      "vue/one-component-per-file": "error",
      "vue/order-in-components": "error",
      "vue/prop-name-casing": "error",
      "vue/require-default-prop": "error",
      "vue/require-explicit-emits": "error",
      "vue/require-prop-types": "error",
      "vue/this-in-template": "error",
      "vue/v-bind-style": "error",
      "vue/v-on-event-hyphenation": ["error", "always", { autofix: true }],
      "vue/v-on-style": "error",
      "vue/v-slot-style": "error",
      "vue/no-duplicate-attributes": "error",
      "vuejs-accessibility/click-events-have-key-events": "error",
      "vuejs-accessibility/interactive-supports-focus": "error",
      "vuejs-accessibility/form-control-has-label": "error",
      "vuejs-accessibility/label-has-for": [
        "error",
        {
          required: {
            some: ["nesting", "id"],
          },
          allowChildren: true,
        },
      ],
      "vuejs-accessibility/aria-role": "error",
      "vuejs-accessibility/aria-props": "error",
      "vuejs-accessibility/aria-unsupported-elements": "error",
      "vuejs-accessibility/no-static-element-interactions": "error",
      "vuejs-accessibility/tabindex-no-positive": "error",
      "vuejs-accessibility/alt-text": "error",
      "vuejs-accessibility/anchor-has-content": "error",
      "vuejs-accessibility/heading-has-content": "error",
      "vuejs-accessibility/iframe-has-title": "error",
      "vuejs-accessibility/media-has-caption": "error",
      "vuejs-accessibility/mouse-events-have-key-events": "error",
      "vuejs-accessibility/no-autofocus": "error",
      "vuejs-accessibility/no-distracting-elements": "error",
      "vuejs-accessibility/no-redundant-roles": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["pages/**/*.vue", "layouts/**/*.vue", "app.vue", "error.vue"],
    rules: {
      // Nuxt file-based routing requires single-segment page/layout filenames.
      "vue/multi-word-component-names": "off",
    },
  },
];
