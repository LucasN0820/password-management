export type Locale = 'zh' | 'en';

export const messages = {
  zh: {
    language: {
      label: '语言',
      chinese: '中文',
      english: 'English',
    },
    navigation: {
      mainLabel: '主导航',
      products: '产品功能',
      security: '隐私与安全',
      download: '下载',
      start: '开始使用',
      downloadApp: '下载应用',
      openMenu: '打开菜单',
      closeMenu: '关闭菜单',
    },
    skipLink: '跳转到主要内容',
    brandLabel: 'Vault 首页',
    hero: {
      eyebrow: '为你的数字生活，留一点从容',
      title: ['密码有归处，', '生活少点记忆。'],
      description: [
        '一个安静、好用的密码管理器。',
        '收好每个账号，生成可靠密码，让重要的事回到你手中。',
      ],
      primary: '下载 Vault',
      secondary: '认识 Vault',
      note: ['本地优先', '主密码保护', '简单如日常'],
    },
    principles: {
      title: ['把复杂留给密码。', '把简单留给你。'],
      items: [
        '一个地方，管理所有账号',
        '每个账号，都有独特密码',
        '本地存储，安心掌握',
      ],
    },
    features: {
      eyebrow: 'THOUGHTFULLY SIMPLE / 简单，刚刚好',
      title: ['少一些繁琐。', '多一些心安。'],
      description: ['从记住密码，到不必惦记。', '只留下真正需要的功能。'],
      items: [
        {
          title: '所有账号，各就其位。',
          text: '把散落的登录信息收进密码库。分类、收藏、搜索，让每次查找都少一点翻找。',
          detail: '分类整理 / 快速搜索',
          symbol: '▦',
        },
        {
          title: '好密码，不必绞尽脑汁。',
          text: '按需设置长度与字符类型，为不同账号生成不同密码，把记忆的负担交给 Vault。',
          detail: '密码生成 / 强度检查',
          symbol: '✳',
        },
        {
          title: '日常使用，轻一点。',
          text: '从查看账号到复制密码，让常用操作触手可及。手机与桌面，延续同一种熟悉的体验。',
          detail: '一键复制 / 多端应用',
          symbol: '↗',
        },
      ],
    },
    security: {
      eyebrow: 'PRIVATE BY DESIGN / 安全，从本地开始',
      title: ['你的密码，', '值得被好好保管。'],
      description: [
        '以本地存储为基础，用主密码守护密码库。',
        '让隐私成为日常的一部分，而不是额外的负担。',
      ],
      facts: [
        ['01 / 本地优先', '密码库保存在你的设备中。'],
        ['02 / 加密保护', '敏感字段采用 AES-256-GCM 加密。'],
      ],
      artLabel: 'YOUR PASSWORDS. YOUR SPACE.',
    },
    download: {
      eyebrow: 'MAKE ROOM FOR WHAT MATTERS',
      title: ['把密码交给 Vault。', '把时间留给生活。'],
      description: '选择你的设备，从整理第一个账号开始。',
      panelTitle: '在你的设备上使用',
      panelLabel: 'GET VAULT ↗',
      desktopSubtitle: '下载桌面端',
      mobileSubtitle: '下载移动端',
      android: 'Android APK',
      recommended: '推荐',
      footnote: '桌面与移动端，同样简洁的使用体验。',
    },
    footer: {
      tagline: '少一点记忆，多一点生活。',
      download: '下载应用 ↗',
    },
    demo: {
      windowTitle: '我的密码库',
      interactive: '交互演示',
      greeting: '一切，都井井有条。',
      title: '我的密码',
      accountCount: '个账号',
      tabsLabel: '演示账号分类',
      tabs: { all: '全部', work: '工作', life: '生活' },
      localVault: '本地密码库',
      calm: '有序，也安心。',
      generator: '密码生成器',
      strongPassword: '强密码',
      passwordHidden: '密码已隐藏',
      showPassword: '显示演示密码',
      hidePassword: '隐藏演示密码',
      sampleNote: '15 位字符 · 仅供演示',
      nextPassword: '换一个',
    },
  },
  en: {
    language: {
      label: 'Language',
      chinese: '中文',
      english: 'English',
    },
    navigation: {
      mainLabel: 'Main navigation',
      products: 'Features',
      security: 'Security',
      download: 'Download',
      start: 'Get started',
      downloadApp: 'Download the app',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
    },
    skipLink: 'Skip to main content',
    brandLabel: 'Vault home',
    hero: {
      eyebrow: 'A little more ease for your digital life',
      title: ['A place for every password,', 'more room for life.'],
      description: [
        'A quiet, thoughtful password manager.',
        'Keep every account close, generate stronger passwords, and put your attention back where it belongs.',
      ],
      primary: 'Download Vault',
      secondary: 'Meet Vault',
      note: ['Local-first', 'Master password protected', 'Simple by design'],
    },
    principles: {
      title: ['Let passwords carry the complexity.', 'Keep life simple.'],
      items: [
        'Every account, in one place',
        'A unique password for every account',
        'Stored locally, always in your hands',
      ],
    },
    features: {
      eyebrow: 'THOUGHTFULLY SIMPLE / JUST ENOUGH',
      title: ['Less to manage.', 'More peace of mind.'],
      description: [
        'From remembering passwords to forgetting about them.',
        'Only the essentials stay.',
      ],
      items: [
        {
          title: 'Every account, in its place.',
          text: 'Bring scattered logins into one vault. Sort, favorite, and search so every lookup takes less work.',
          detail: 'Organize clearly / Search quickly',
          symbol: '▦',
        },
        {
          title: 'Good passwords, without the guesswork.',
          text: 'Choose the length and character set you need. Let Vault generate a different password for every account.',
          detail: 'Password generator / Strength checks',
          symbol: '✳',
        },
        {
          title: 'Everyday access, made lighter.',
          text: 'From opening an account to copying a password, the actions you use most stay close at hand on desktop and mobile.',
          detail: 'One-tap copy / Multi-platform',
          symbol: '↗',
        },
      ],
    },
    security: {
      eyebrow: 'PRIVATE BY DESIGN / SECURITY STARTS LOCALLY',
      title: ['Your passwords', 'deserve a proper home.'],
      description: [
        'Built around local storage, protected by your master password.',
        'Privacy becomes part of the everyday, not another thing to carry.',
      ],
      facts: [
        ['01 / LOCAL-FIRST', 'Your vault stays on your device.'],
        ['02 / ENCRYPTED', 'Sensitive fields use AES-256-GCM encryption.'],
      ],
      artLabel: 'YOUR PASSWORDS. YOUR SPACE.',
    },
    download: {
      eyebrow: 'MAKE ROOM FOR WHAT MATTERS',
      title: ['Give your passwords to Vault.', 'Keep your time for life.'],
      description: 'Choose your device and start with your first account.',
      panelTitle: 'Use Vault on your device',
      panelLabel: 'GET VAULT ↗',
      desktopSubtitle: 'Download desktop app',
      mobileSubtitle: 'Download mobile app',
      android: 'Android APK',
      recommended: 'Recommended',
      footnote: 'The same quiet, simple experience on desktop and mobile.',
    },
    footer: {
      tagline: 'Less to remember, more life to live.',
      download: 'Download the app ↗',
    },
    demo: {
      windowTitle: 'My vault',
      interactive: 'Interactive demo',
      greeting: 'Everything, in its place.',
      title: 'My passwords',
      accountCount: 'accounts',
      tabsLabel: 'Demo account categories',
      tabs: { all: 'All', work: 'Work', life: 'Life' },
      localVault: 'Local vault',
      calm: 'Organized, and at ease.',
      generator: 'Password generator',
      strongPassword: 'Strong password',
      passwordHidden: 'Password hidden',
      showPassword: 'Show demo password',
      hidePassword: 'Hide demo password',
      sampleNote: '15 characters · Demo only',
      nextPassword: 'Try another',
    },
  },
} as const;

export type Messages = (typeof messages)[Locale];

function languageTag(value: string) {
  return value.split(';')[0]?.trim().toLowerCase() ?? '';
}

export function localeFromAcceptLanguage(value: string | null): Locale {
  const preferred = (value ?? '')
    .split(',')
    .map((item, index) => {
      const [tag, ...parameters] = item.trim().split(';');
      const quality = parameters.find(parameter =>
        parameter.trim().startsWith('q=')
      );
      const weight = quality ? Number(quality.trim().slice(2)) : 1;

      return {
        index,
        tag: languageTag(tag ?? ''),
        weight: Number.isFinite(weight) ? weight : 0,
      };
    })
    .filter(item => item.tag && item.tag !== '*')
    .sort(
      (left, right) => right.weight - left.weight || left.index - right.index
    );

  return preferred[0]?.tag.startsWith('zh') ? 'zh' : 'en';
}
