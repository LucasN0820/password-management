import { reactConfig } from './react.mjs';

export const nextConfig = [
  ...reactConfig,
  // Next.js Route Handlers requires function name like `GET` or `POST`
  {
    files: ['src/app/**/route.ts'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'function',
          format: ['camelCase', 'UPPER_CASE'],
        },
      ],
    },
  },
];
