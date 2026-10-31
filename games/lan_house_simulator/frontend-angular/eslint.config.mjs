// Flat ESLint config for the isolated Angular 22 / TypeScript 6 workspace.
// Game engine (TypeScript 7) is deliberately outside this lint scope.
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['dist/**', 'out-tsc/**', 'node_modules/**']
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' }
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }]
    }
  }
];
