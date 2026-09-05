import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import solid from 'eslint-plugin-solid'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '**/coverage/**',
      '**/dist/**',
      '**/node_modules/**',
      '**/target/**',
      'apps/docs/.vitepress/cache/**',
      'apps/web/src/lib/api/schema.d.ts',
      'packages/bot-sdk/src/schema.d.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['apps/web/src/**/*.tsx'],
    plugins: {
      solid,
    },
    rules: solid.configs.typescript.rules,
  },
  prettier,
)
