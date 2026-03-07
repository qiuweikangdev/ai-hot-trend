// eslint.config.mjs
import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  nextjs: true,
  typescript: true,
  formatters: true,
  rules: {
    'e18e/ban-dependencies': 'off',
  },
})
