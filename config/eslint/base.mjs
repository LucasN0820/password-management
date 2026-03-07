import pluginLingui from 'eslint-plugin-lingui';
import turboConfig from 'eslint-config-turbo/flat';

export const baseConfig = [
  {
    rules: {
      'func-style': ['error', 'declaration'],
      'fsecond/prefer-destructured-optionals': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@stylistic/padding-line-between-statements': 'off',
    },
  },
  // Lingui
  pluginLingui.configs['flat/recommended'],
  // will enfore listing environment variables in turbo.json `globalEnv`
  ...turboConfig,
];
