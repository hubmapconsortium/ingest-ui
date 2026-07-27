import js from "@eslint/js";
import globals from "globals";

const relaxedStyleRules = {
  "array-bracket-spacing": "off",
  "array-callback-return": "off",
  "arrow-spacing": "off",
  "block-spacing": "off",
  "brace-style": "off",
  camelcase: "off",
  "comma-dangle": "off",
  "comma-spacing": "off",
  "dot-notation": "off",
  indent: "off",
  "key-spacing": "off",
  "keyword-spacing": "off",
  "lines-between-class-members": "off",
  "no-empty": "off",
  "no-mixed-spaces-and-tabs": "off",
  "no-multi-spaces": ["warn", { ignoreEOLComments: true }],
  "no-multi-str": "off",
  "no-multiple-empty-lines": ["warn", { max: 1 }],
  "no-prototype-builtins": "off",
  "no-tabs": "off",
  "no-trailing-spaces": "off",
  "no-unneeded-ternary": "off",
  "no-useless-computed-key": "off",
  "no-useless-escape": "off",
  "object-curly-newline": "off",
  "object-curly-spacing": "off",
  "object-property-newline": "off",
  "padded-blocks": "off",
  "prefer-const": "off",
  "quote-props": "off",
  quotes: "off",
  semi: "off",
  "space-before-blocks": "off",
  "space-before-function-paren": "off",
  "space-in-parens": "off",
  "space-infix-ops": "off",
  "spaced-comment": "off",
};

export default [
  {
    ignores: ["build/**", "node_modules/**", ".test-results/**"],
  },
  {
    files: ["src/**/*.{js,jsx}", "vite.config.mjs"],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
        process: "readonly",
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        sourceType: "module",
      },
    },
    rules: {
      ...relaxedStyleRules,
      "no-undef": "error",
      "no-unused-expressions": ["error", { allowTernary: true }],
      "no-unused-vars": "warn",
    },
  },
  {
    files: ["src/**/*.test.{js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        vi: "readonly",
      },
    },
  },
  {
    files: ["vite.config.mjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
];
