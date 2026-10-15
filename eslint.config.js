// @ts-check
import js from '@eslint/js'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        // cva variant helpers, form hooks, and example schemas are part of a component's public API.
        {
          allowConstantExport: true,
          allowExportNames: [
            'buttonVariants',
            'badgeVariants',
            'useFieldControlProps',
            'useFormSubmit',
            'profileSchema',
            'searchFilterSchema',
            'getPageItems',
            'sortRows',
            'paginateRows',
            'filterOrders',
            'summarizeOrders',
          ],
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      // Nothing in the app builds code from strings.
      'no-eval': 'error',
      'no-new-func': 'error',
    },
  },
  {
    // The playground runs only the components its allowlist names. These keep it that way: no
    // module is imported by a runtime string, and no markup is injected.
    files: ['src/playground/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportExpression',
          message:
            'The playground never imports a module at runtime. Add the example to the allowlist in src/playground/index.ts.',
        },
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'The playground renders React elements only; it never injects markup.',
        },
      ],
    },
  },
  {
    files: ['eslint.config.js'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.node },
  },
)
