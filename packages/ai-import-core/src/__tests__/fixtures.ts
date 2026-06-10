export interface SyntheticCredentialFixture {
  name: string;
  extension: '.csv' | '.txt' | '.md';
  content: string;
  expectedPassword: string | null;
}

const specialPasswords = [
  'p@ss word',
  'quote"value',
  'slash\\value',
  '密码-安全-123',
  'line_break_token',
];

function passwordFor(index: number) {
  return specialPasswords[index % specialPasswords.length] ?? `Secret-${index}`;
}

export const csvFixtures: SyntheticCredentialFixture[] = Array.from(
  { length: 25 },
  (_, index) => {
    const negative = index % 6 === 0;
    const password = passwordFor(index);
    return {
      name: `csv-${index + 1}.csv`,
      extension: '.csv' as const,
      content: negative
        ? `title,username,url\nService ${index},user${index}@example.com,https://example.com`
        : `标题,账号,密码,网址,备注\n服务 ${index},user${index}@example.com,"${password.replaceAll('"', '""')}",https://example.com,fixture ${index}`,
      expectedPassword: negative ? null : password,
    };
  }
);

export const textFixtures: SyntheticCredentialFixture[] = Array.from(
  { length: 25 },
  (_, index) => {
    const negative = index % 7 === 0;
    const password = passwordFor(index + 25);
    return {
      name: `text-${index + 1}.txt`,
      extension: '.txt' as const,
      content: negative
        ? `Account ${index}\nUsername: user${index}@example.com\nNo password is present.`
        : `服务: Example ${index}\n账号: user${index}@example.com\n密码: ${password}\n网址: https://example.com/${index}`,
      expectedPassword: negative ? null : password,
    };
  }
);

export const markdownFixtures: SyntheticCredentialFixture[] = Array.from(
  { length: 25 },
  (_, index) => {
    const negative = index % 8 === 0;
    const password = passwordFor(index + 50);
    return {
      name: `markdown-${index + 1}.md`,
      extension: '.md' as const,
      content: negative
        ? `# Account ${index}\n- Login: user${index}\n- Recovery email only`
        : `# Account ${index}\n\n- Login: user${index}\n- Password: ${password}\n- URL: https://example.com/${index}`,
      expectedPassword: negative ? null : password,
    };
  }
);

export const syntheticCredentialFixtures = [
  ...csvFixtures,
  ...textFixtures,
  ...markdownFixtures,
];
