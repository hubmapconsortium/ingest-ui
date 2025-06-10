module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    // "standard",
    // 'plugin:react/recommended'
  ],
  overrides: [
    {
      env: {
        node: true
      },
      files: [
        ".eslintrc.{js,cjs}"
      ],
      parserOptions: {
        sourceType: "script"
      }
    }
  ],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  plugins: [
    "react"
  ],
  rules: {
    "no-undef": "error",
    // "indent": ["warn", 2,{ "outerIIFEBody": 1 }],
    "indent": 0,
    // "keyword-spacing": ["warn", {
    //     before: false,
    //     after: false,
    //     overrides: {
    //         from: {before: true, after: true},
    //         import: {before: false, after: true},
    //         static: {after: true}
    //       }
    //     }
    // ],
    "keyword-spacing": [0],
    // "key-spacing": ["warn", {beforeColon: false, afterColon: true, mode: "strict"}],
    "key-spacing": [0],
    // "no-unused-expressions": ["error", { "allowTernary": true }],
    "no-unused-expressions": [0],
    // "no-unused-vars": ["warn", "all"],
    "no-unused-vars": [0],
    // "array-bracket-spacing": ["warn", "never"],
    "array-bracket-spacing": [0],
    // "object-curly-spacing": ["warn", "never"],
    "object-curly-spacing": [0],
    // "space-before-blocks": ["warn", "never"],
    "space-before-blocks": [0],
    // "space-before-function-paren": ["warn", "never"],
    "space-before-function-paren": [0],
    // "space-in-parens": ["warn", "never", {"exceptions": ["{}"]}],
    "space-in-parens": [0],
    // "quotes": ["warn", "single"],
    "quotes": 0,
    // "jsx-quotes": ["warn", "prefer-single"],
    "jsx-quotes": 0,
    // "block-spacing": ["warn",'never'],
    "block-spacing": 0,
    // "comma-spacing": ["warn", {before: false, after: true}],
    "comma-spacing": 0,
    // "no-multiple-empty-lines": ["warn", {max: 1}],
    "no-multiple-empty-lines": [0],
    // "no-multi-spaces": ["warn", {ignoreEOLComments: true}],
    "no-multi-spaces": [0],
    "quote-props": 0,
    "object-curly-newline": [0],
    "array-callback-return": 0,
    "arrow-spacing": 0,
    "brace-style": 0,
    "camelcase": 0,
    "comma-dangle": 0,
    "dot-notation": 0,
    "lines-between-class-members": 0,
    "no-empty": 0,
    "no-mixed-spaces-and-tabs": 0,
    "no-multi-str": 0,
    "no-prototype-builtins": 0,
    "no-tabs": 0,
    "no-trailing-spaces": 0,
    "no-unneeded-ternary": 0,
    "no-useless-computed-key": 0,
    "no-useless-escape": 0,
    "object-property-newline": 0,
    "padded-blocks": 0,
    "prefer-const": 0,
    "react/jsx-no-target-blank": 0,
    "react/no-unescaped-entities": 0, // disable rule
    "react/no-unknown-property": 0,
    "react/prop-types": 0, // disable rule
    "react/react-in-jsx-scope": 0,
    "semi": 0,
    "space-infix-ops": 0,
    "spaced-comment": 0,
  }
}
