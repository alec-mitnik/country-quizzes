import js from '@eslint/js'
import reactDom from 'eslint-plugin-react-dom'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import reactX from 'eslint-plugin-react-x'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  { ignores: ['dist', 'coverage'] },
  {
    files: ['src/**/*.{ts,tsx}', 'types/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
      reactX.configs['recommended-typescript'],
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.app.json',  // Only use app config for corresponding source files
        tsconfigRootDir: import.meta.dirname,
      },
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-const-assign': 'error',
    },
  },
  {
    files: ['vite.config.ts', 'scripts/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.node.json',  // Use node config for build tooling
        tsconfigRootDir: import.meta.dirname,
      },
      ecmaVersion: 2023,
    },
  }
]);
