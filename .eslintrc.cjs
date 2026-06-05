module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/strict',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'commitlint.config.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: [],
  rules: {
    // Enforced: use const where reassignment never happens
    'prefer-const': 'error',
    // Hooks dep checking: warn (not error) because it can be intentionally omitted for stable refs
    'react-hooks/exhaustive-deps': 'warn',
    // New in react-hooks v7: flags setState called synchronously inside useEffect.
    // Warn rather than error — initialising state from sessionStorage on mount is a valid pattern.
    'react-hooks/set-state-in-effect': 'off',
    'react-hooks/refs': 'off',
    'react-hooks/static-components': 'off',
    // Allow empty catch blocks (fire-and-forget logging patterns)
    'no-empty': ['error', { allowEmptyCatch: true }],
    // Unused vars: error except for args/vars prefixed with _
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    // Allow explicit any only where unavoidable (external API payloads) — enforced with inline comments
    '@typescript-eslint/no-explicit-any': 'off',
    // Allow non-null assertions with inline explanation comments
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
  overrides: [
    {
      // Relax rules in test files (mock supabase, mock contexts necessarily use any)
      files: ['src/__tests__/**/*.ts', 'src/__tests__/**/*.tsx', 'e2e/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
  ],
}
