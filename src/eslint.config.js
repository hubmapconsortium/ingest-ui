// eslint.config.js
module.exports = [
  {
      rules: {
        'indent': ['error', 2],
        'quotes': ['error', 'single'],
        'semi': ['error', 'always'],
        'comma-dangle': ['error', 'never'],
        'object-curly-spacing': ['error', 'always'],
        'arrow-parens': ['error', 'as-needed'],
        'no-var': ['error'],
        'eqeqeq': ['error', 'always'],
        'no-trailing-spaces': ['error'],
        'keyword-spacing': ['error', { 'before': true, 'after': true }],
        'space-before-blocks': ['error', 'always'],
        'space-infix-ops': ['error', { 'int32Hint': false }]
      }
  }
];
