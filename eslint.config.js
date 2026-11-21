import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/', 'test-results/', 'playwright-report/'] },
  js.configs.recommended,
  {
    files: ['scripts/**/*.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['tools/**/*.mjs', '*.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    // Les tests tournent sous Node mais certaines fonctions s'exécutent dans la page (page.evaluate).
    files: ['tests/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
  {
    rules: {
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
];
