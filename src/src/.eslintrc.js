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
    indent: ["warn", 2],
    "keyword-spacing": ["warn", {
      before: false,
      after: false,
      overrides: {
        from: {before: true, after: true},
        import: {before: false, after: true},
        static: {after: true}
      }
    }],
    "array-bracket-spacing": ["warn", "never"],
    "object-curly-spacing": ["warn", "never"],
    "space-before-blocks": ["warn", "never"],
    "space-before-function-paren": ["warn", "never"],
    "space-in-parens": ["warn", "never"],
    "object-curly-newline": ["warn", {multiline: true, consistent: true}],
    "no-unused-vars": ["warn", "all"],
    "no-multiple-empty-lines": ["warn", {max: 1}],
    "no-multi-spaces": ["warn", {ignoreEOLComments: true}],
    "no-undef": "error",
    "react/no-unescaped-entities": 0, // disable rule
    "quotes": 0,
    "comma-dangle": 0,
    "padded-blocks": 0,
    "react/prop-types": 0, // disable rule
    "key-spacing": ["warn", {beforeColon: false, afterColon: true, mode: "strict"}],
    "quote-props": 0,
    "semi": 0,
    "prefer-const": 0,
    "comma-spacing": 0,
    "camelcase": 0,
    "no-trailing-spaces": 0,
    "space-infix-ops": 0,
    "spaced-comment": 0,
    "react/react-in-jsx-scope": 0,
    "no-mixed-spaces-and-tabs": 0,
    "no-prototype-builtins": 0,
    "brace-style": 0,
    "no-tabs": 0,
    "no-unneeded-ternary": 0,
    "block-spacing": 0,
    "block-spacing": 0,
    "no-useless-escape": 0,
    "lines-between-class-members": 0,
    "object-property-newline": 0,
    "no-multi-str": 0,
    "dot-notation": 0,
    "no-useless-computed-key": 0,
    "arrow-spacing": 0,
    "array-callback-return": 0,
    "no-empty": 0,
    "react/jsx-no-target-blank": 0,
    "react/no-unknown-property": 0,
  }
}
