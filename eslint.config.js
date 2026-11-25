const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')

// Modules are used through their public API (index.ts) only
const publicApiOnly = {
  group: ['@/features/*/*', '@/shared/api/*', '@/shared/device/camera/*'],
  message: 'Import from the public API (its index.ts) instead of its internals.',
}

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'android/*', 'ios/*', '.expo/*'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [publicApiOnly] }],
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
          pathGroups: [
            { pattern: '@modules/**', group: 'internal', position: 'before' },
            { pattern: '@/**', group: 'internal' },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },
  {
    // shared/ is the bottom layer, identical in every app: it must not depend on the app's own code.
    // This replaces the rule above for these files, so it repeats publicApiOnly.
    files: ['src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            publicApiOnly,
            {
              group: ['@/features/*', '@/app/*', '@/db', '@/db/*', '@/config'],
              message: 'shared/ cannot depend on features, routes, the database schema or the app config.',
            },
          ],
        },
      ],
    },
  },
])
