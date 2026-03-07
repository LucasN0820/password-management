import pluginQuery from '@tanstack/eslint-plugin-query';
import { baseConfig } from './base.mjs';

export const reactConfig = [
  ...baseConfig,
  ...pluginQuery.configs['flat/recommended'],
  {
    rules: {
      'react/function-component-definition': [
        'error',
        { namedComponents: 'function-declaration' },
      ],
      'react/no-multi-comp': 'off',
    },
  },
];
