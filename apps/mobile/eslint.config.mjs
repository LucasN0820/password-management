import { sheriff, tseslint } from 'eslint-config-sheriff';
import { reactConfig } from '@repo/eslint-config/react';
import expo from 'eslint-plugin-expo';

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

export default tseslint.config(
  sheriff(sheriffOptions),
  ...reactConfig,
  {
    rules: {
      'import/no-default-export': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
  { plugins: { expo } },
  {
    ignores: [
      'metro.config.js',
      'babel.config.js',
      './src/components/ui/*.tsx',
    ],
  }
);
