import { sheriff, tseslint } from 'eslint-config-sheriff';
import { baseConfig } from '@repo/eslint-config/base';

const sheriffOptions = {
  react: false,
  lodash: false,
  remeda: false,
  next: false,
  astro: false,
  playwright: false,
  jest: false,
  vitest: false,
};

export default tseslint.config(sheriff(sheriffOptions), ...baseConfig);
