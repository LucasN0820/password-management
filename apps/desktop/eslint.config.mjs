import { sheriff, tseslint } from 'eslint-config-sheriff';
import { reactConfig } from '@repo/eslint-config/react';

const sheriffOptions = {
  react: true,
  lodash: false,
  remeda: false,
  next: false,
  astro: false,
  playwright: false,
  jest: false,
  vitest: false,
};

export default tseslint.config(sheriff(sheriffOptions), ...reactConfig, {
  ignores: ['vite.config.mts', 'dist-electron'],
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
  },
});
