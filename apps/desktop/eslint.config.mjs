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

export default [
  {
    ignores: ['bin/**', 'scripts/**', 'dist-electron/**', 'vite.config.mts'],
  },
  ...tseslint.config(sheriff(sheriffOptions), ...reactConfig, {
    rules: {
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      'func-style': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            attributes: false,
            properties: false,
          },
        },
      ],
      'no-nested-ternary': 'off',
      'no-void': 'off',
      'unicorn/consistent-destructuring': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      'require-atomic-updates': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      'react-you-might-not-need-an-effect/no-derived-state': 'off',
      'react-you-might-not-need-an-effect/no-chain-state-updates': 'off',
      'react-you-might-not-need-an-effect/no-event-handler': 'off',
      'no-negated-condition': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'no-console': 'off',
      'sonarjs/no-nested-template-literals': 'off',
      '@typescript-eslint/no-shadow': 'off',
      'no-plusplus': 'off',
      '@typescript-eslint/require-await': 'off',
      'unicorn/prefer-top-level-await': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      'no-promise-executor-return': 'off',
      '@regru/prefer-early-return/prefer-early-return': 'off',
      'fsecond/valid-event-listener': 'off',
      'import/no-named-as-default': 'off',
      '@typescript-eslint/no-deprecated': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'jsx-a11y/no-autofocus': 'off',
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/label-has-associated-control': 'off',
      'react-refresh/only-export-components': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  }),
];
