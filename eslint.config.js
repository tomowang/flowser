import pluginVue from 'eslint-plugin-vue'
import vueTs from '@vue/eslint-config-typescript'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{js,mjs,jsx,ts,tsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '.output/**', '.wxt/**', 'components/ui/**', 'docs/**'],
  },

  ...pluginVue.configs['flat/recommended'],
  ...vueTs(),
  skipFormatting,
]
