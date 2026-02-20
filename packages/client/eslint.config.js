import pluginVue from "eslint-plugin-vue";
import pluginVueA11y from "eslint-plugin-vuejs-accessibility";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";

export default [
  ...pluginVue.configs["flat/recommended"],
  ...pluginVueA11y.configs["flat/recommended"],
  ...tseslint.configs.recommended,
  {
    ignores: ["node_modules/**", ".nuxt/**", "**/.nuxt/**", ".output/**", "dist/**", ".data/**"],
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".vue"],
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },
  {
    rules: {
      "vue/max-attributes-per-line": "off",
      "vue/html-self-closing": "off",
      "vue/singleline-html-element-content-newline": "off",
      "vue/multi-word-component-names": "off",
      "vue/attributes-order": "off",
      "vue/html-closing-bracket-spacing": "off",
      "vue/first-attribute-linebreak": "off",
      "vue/html-closing-bracket-newline": "off",
      "vue/no-duplicate-attributes": "warn",
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
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
