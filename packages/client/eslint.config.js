import pluginVue from "eslint-plugin-vue";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";

export default [
  ...pluginVue.configs["flat/recommended"],
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
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
