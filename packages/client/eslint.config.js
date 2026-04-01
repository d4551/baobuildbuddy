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

export default [
  eslint.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
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
      "no-undef": "off",
      "vue/max-attributes-per-line": "off",
      "vue/html-self-closing": "off",
      "vue/singleline-html-element-content-newline": "off",
      "vue/attributes-order": "off",
      "vue/html-closing-bracket-spacing": "off",
      "vue/first-attribute-linebreak": "off",
      "vue/html-closing-bracket-newline": "off",
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
      "vue/multi-word-component-names": "off",
    },
  },
];
