module.exports = {
  env: {
    browser: true,
    es2021: true
  },
  extends: [
    // 'standard'
    'plugin:react/recommended'
  ],
  overrides: [
    {
      env: {
        node: true
      },
      files: [
        '.eslintrc.{js,cjs}'
      ],
      parserOptions: {
        sourceType: 'script'
      }
    }
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [
    'react'
  ],
  rules: {
    'indent': ['warn', 2],
    'keyword-spacing': ['warn', {
      before: false,
      after: false,
      overrides: {
        from: {before: true, after: true},
        import: {before: false, after: true},
        static: {after: true}
      }
    }],
    'array-bracket-spacing': ['warn', 'never'],
    'object-curly-spacing': ['warn', 'never'],
    'space-before-blocks': ['warn', 'never'],
    'space-before-function-paren': ['warn', 'never'],
    'react/no-unescaped-entities': 0, // disable rule
    'react/prop-types': 0, // disable rule
		
  }
}
