import type { ReactNode } from 'react';
import { DesktopDownloads } from './desktop-downloads';
import { MobileNav } from './mobile-nav';

const navItems = [
  { href: '#features', label: '产品' },
  { href: '#security', label: '安全' },
  { href: '#pricing', label: '价格' },
  { href: '#teams', label: '企业' },
];

const vaultCards = [
  {
    name: 'Google',
    account: 'hello@example.com',
    letter: 'G',
    tone: '#E8F0FE',
    offset: false,
  },
  {
    name: 'Netflix',
    account: 'hello@example.com',
    letter: 'N',
    tone: '#FDE8E7',
    offset: true,
  },
];

const brands = ['Notion', 'Figma', 'Linear', 'Vercel', 'Stripe'];

const features = [
  {
    title: '零知识加密',
    description:
      '你的数据在离开设备前已被加密。我们的服务器看不到你的任何密码，即使在极端情况下，你的信息也永远属于你。',
    large: true,
    tags: ['AES-256-GCM', 'PBKDF2', '本地加密'],
  },
  {
    title: '一键自动填充',
    description: '识别当前页面，精准匹配凭据，无需思考。',
  },
  {
    title: '全平台同步',
    description: 'iOS、Android、桌面、浏览器，实时同步，无缝切换。',
  },
  {
    title: '强密码生成',
    description: '为每个账号生成唯一的强密码，告别 123456。',
  },
  {
    title: '泄漏监控',
    description: '持续监测暗网数据库，一旦发现泄漏立即提醒。',
  },
];

const securityItems = [
  '主密钥永不离开你的设备',
  '开源审计，代码透明可查',
  '符合 SOC 2 Type II 标准',
  '定期第三方渗透测试',
];

const testimonials = [
  {
    text: '"用了三年，从没让我失望过。设计克制，功能够用，安全令人放心。"',
    name: '林小舟',
    role: '产品设计师',
    initial: 'L',
  },
  {
    text: '"把家里五口人都迁移过来了。以前每个人记自己的密码，现在统一管理，省了太多麻烦。"',
    name: '王明远',
    role: '软件工程师',
    initial: 'W',
  },
  {
    text: '"界面很像 Claude，简洁但有质感。最重要的是，真的能让我忘掉密码这件事。"',
    name: '陈予安',
    role: '自由职业者',
    initial: 'C',
  },
];

const plans = [
  {
    name: '个人免费版',
    price: '0',
    period: '/ 永久',
    features: ['无限密码存储', '自动填充', '强密码生成', '跨设备同步（2台）'],
    cta: '免费开始',
    href: '#download',
  },
  {
    name: '个人高级版',
    price: '18',
    period: '/ 月',
    features: [
      '免费版全部功能',
      '无限设备同步',
      '泄漏监控报警',
      '优先客服支持',
      '加密文件存储（1GB）',
    ],
    cta: '立即升级',
    href: '#download',
    featured: true,
    badge: '最受欢迎',
  },
  {
    name: '团队版',
    price: '36',
    period: '/ 人/月',
    features: [
      '高级版全部功能',
      '团队共享密码库',
      '成员权限管理',
      '审计日志',
      'SSO 集成',
    ],
    cta: '联系销售',
    href: 'mailto:hello@example.com',
  },
];

const mobileDownloads = [
  {
    title: 'Android APK',
    subtitle: '下载移动端',
    href: '/download/mobile',
  },
];

const footerGroups = [
  {
    title: '产品',
    links: ['功能介绍', '安全白皮书', '更新日志'],
  },
  {
    title: '支持',
    links: ['帮助中心', '联系我们', '系统状态'],
  },
  {
    title: '法律',
    links: ['隐私政策', '服务条款', 'Cookie 设置'],
  },
];

const pageShell = 'min-h-screen overflow-x-hidden bg-cream text-charcoal';
const container = 'mx-auto max-w-[1100px] px-5 md:px-8';
const label = 'mb-4 inline-block text-xs font-semibold uppercase text-terra';
const lightLabel =
  'mb-4 inline-block text-xs font-semibold uppercase text-terra-mid';
const sectionTitle =
  'mb-4 font-serif text-4xl font-normal leading-[1.15] text-charcoal md:text-[46px]';
const sectionDesc =
  'mb-11 max-w-[480px] text-base leading-[1.65] text-charcoal-3 md:mb-14 md:text-[17px]';
const primaryButton =
  'inline-flex items-center justify-center gap-1.5 rounded-lg !bg-[#1a1916] px-[18px] py-2 text-sm font-medium leading-relaxed !text-[#faf9f7] transition hover:-translate-y-px hover:!bg-[#3a3834]';
const outlineButton =
  'inline-flex items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-cream-3 px-[18px] py-2 text-sm font-medium leading-relaxed text-charcoal transition hover:-translate-y-px hover:border-sand hover:bg-cream-2';
const largeButton = 'rounded-[10px] px-6 py-3 text-[15px]';
const cardBase = 'min-w-0 rounded-2xl border border-cream-3 p-7 md:p-8';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function LockIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      aria-hidden='true'
      fill='none'
      height={size}
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.8'
      viewBox='0 0 24 24'
      width={size}
    >
      <rect height='10' rx='2' width='16' x='4' y='10' />
      <path d='M8 10V7a4 4 0 0 1 8 0v3' />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden='true'
      fill='none'
      height='16'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.8'
      viewBox='0 0 24 24'
      width='16'
    >
      <path d='M5 12h14' />
      <path d='m13 6 6 6-6 6' />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden='true'
      fill='none'
      height='16'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='2'
      viewBox='0 0 24 24'
      width='16'
    >
      <path d='m5 12 4 4L19 6' />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg
      aria-hidden='true'
      fill='none'
      height='18'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.7'
      viewBox='0 0 24 24'
      width='18'
    >
      <path d='M2.1 12s3.4-6 9.9-6 9.9 6 9.9 6-3.4 6-9.9 6-9.9-6-9.9-6Z' />
      <circle cx='12' cy='12' r='2.4' />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      aria-hidden='true'
      fill='none'
      height='20'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.8'
      viewBox='0 0 24 24'
      width='20'
    >
      <path d='M12 3v5' />
      <path d='M12 16v5' />
      <path d='M3 12h5' />
      <path d='M16 12h5' />
      <path d='m6 6 3 3' />
      <path d='m15 15 3 3' />
      <path d='m18 6-3 3' />
      <path d='m9 15-3 3' />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg
      aria-hidden='true'
      fill='none'
      height='22'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.8'
      viewBox='0 0 24 24'
      width='22'
    >
      <rect height='12' rx='2' width='18' x='3' y='4' />
      <path d='M8 20h8' />
      <path d='M12 16v4' />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      aria-hidden='true'
      fill='none'
      height='22'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.8'
      viewBox='0 0 24 24'
      width='22'
    >
      <rect height='20' rx='3' width='12' x='6' y='2' />
      <path d='M11 18h2' />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg
      aria-hidden='true'
      fill='currentColor'
      height='14'
      viewBox='0 0 24 24'
      width='14'
    >
      <path d='m12 2 2.9 6.4 7 .8-5.2 4.7 1.4 6.9L12 17.3l-6.1 3.5 1.4-6.9L2.1 9.2l7-.8L12 2Z' />
    </svg>
  );
}

function Logo() {
  return (
    <a className='flex shrink-0 items-center gap-2' href='#'>
      <span className='flex h-7 w-7 items-center justify-center rounded-[7px] !bg-[#1a1916] !text-[#faf9f7]'>
        <LockIcon size={16} />
      </span>
      <span className='font-serif text-lg font-semibold text-charcoal'>
        Vault
      </span>
    </a>
  );
}

function VaultPreview() {
  return (
    <div className='relative flex w-full max-w-[520px] flex-col gap-3 pb-10 text-left'>
      {vaultCards.map(card => (
        <article
          className={cn(
            'rounded-[14px] border border-cream-3 bg-white px-4 py-[15px] shadow-vault md:px-5 md:py-4',
            card.offset && 'origin-top scale-[0.97] opacity-75'
          )}
          key={card.name}
        >
          <div className='mb-3 flex items-center gap-3'>
            <span
              className='flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-charcoal-2'
              style={{ background: card.tone }}
            >
              {card.letter}
            </span>
            <span className='min-w-0'>
              <span className='block truncate text-sm font-medium text-charcoal'>
                {card.name}
              </span>
              <span className='mt-px block truncate text-xs text-charcoal-3'>
                {card.account}
              </span>
            </span>
            <span className='ml-auto rounded-md p-1.5 text-charcoal-3 transition hover:bg-cream-2'>
              <EyeIcon />
            </span>
          </div>
          <div className='font-mono text-lg text-charcoal-3'>••••••••••••</div>
        </article>
      ))}

      <div className='absolute bottom-2.5 right-2 flex items-center gap-[7px] rounded-full !bg-[#1a1916] px-3.5 py-2 text-xs font-medium !text-[#faf9f7] shadow-toast md:right-0'>
        <LockIcon size={14} />
        已自动填充
        <span className='h-1.5 w-1.5 rounded-full bg-[#4ade80]' />
      </div>
    </div>
  );
}

function FeatureIcon({ index }: { index: number }) {
  const icons = [
    <LockIcon key='lock' />,
    <EyeIcon key='eye' />,
    <PhoneIcon key='phone' />,
    <SparkIcon key='spark' />,
    <MonitorIcon key='monitor' />,
  ];

  return (
    <span className='mb-1 flex h-10 w-10 items-center justify-center rounded-[10px] border border-cream-3 bg-cream text-charcoal-2'>
      {icons[index]}
    </span>
  );
}

function DownloadButton({
  href,
  icon,
  subtitle,
  title,
}: {
  href: string;
  icon: ReactNode;
  subtitle: string;
  title: string;
}) {
  return (
    <a
      className='flex w-full min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10'
      href={href}
    >
      <span className='flex shrink-0 items-center text-white/70'>{icon}</span>
      <span className='flex min-w-0 flex-col gap-px'>
        <span className='text-[11px] text-white/40'>{subtitle}</span>
        <span className='[overflow-wrap:anywhere] font-serif text-base font-medium !text-[#faf9f7]'>
          {title}
        </span>
      </span>
    </a>
  );
}

export default function Home() {
  return (
    <main className={pageShell}>
      <header className='sticky top-0 z-50 border-b border-cream-3 bg-cream/88 backdrop-blur-2xl'>
        <nav
          aria-label='Primary'
          className='mx-auto flex h-[60px] max-w-[1100px] items-center gap-4 px-5 md:gap-10 md:px-8'
        >
          <Logo />

          <div className='hidden flex-1 items-center gap-7 md:flex'>
            {navItems.map(item => (
              <a
                className='text-sm font-medium text-charcoal-3 transition hover:text-charcoal'
                href={item.href}
                key={item.href}
              >
                {item.label}
              </a>
            ))}
          </div>

          <a
            className={cn(
              primaryButton,
              'ml-auto whitespace-nowrap px-3.5 md:px-[18px]'
            )}
            href='#download'
          >
            免费开始
          </a>

          <MobileNav />
        </nav>
      </header>

      <section
        className={cn(
          container,
          'flex flex-col items-center py-16 text-center md:py-[100px] md:pb-20'
        )}
      >
        <div className='mb-7 inline-flex items-center gap-1.5 rounded-full border border-[#edd5cb] bg-terra-light px-3 py-1.5 text-xs font-medium text-terra md:mb-8'>
          <LockIcon size={14} />
          军用级加密 · AES-256
        </div>

        <h1 className='mb-6 max-w-[640px] font-serif text-[38px] font-normal leading-[1.1] text-charcoal md:text-[72px]'>
          记住一个密码，
          <em className='block text-charcoal-2'>掌管所有安全</em>
        </h1>

        <p className='mb-10 max-w-[500px] text-base leading-[1.7] text-charcoal-3 md:text-lg'>
          Vault 以极简的方式保管你的数字身份。无需记忆，无需妥协，只需信任。
        </p>

        <div className='mb-4 flex flex-col items-center justify-center gap-3 sm:flex-row'>
          <a className={cn(primaryButton, largeButton)} href='#download'>
            免费使用
            <ArrowIcon />
          </a>
          <a className={cn(outlineButton, largeButton)} href='#features'>
            了解更多
          </a>
        </div>

        <p className='mb-14 text-[13px] text-charcoal-3 md:mb-[72px]'>
          免费版永久可用 · 无需信用卡
        </p>

        <VaultPreview />
      </section>

      <section
        aria-label='产品信任品牌'
        className='border-y border-cream-3 bg-cream-2 px-5 py-8 text-center'
      >
        <p className='mb-5 text-xs font-medium uppercase text-charcoal-3'>
          全球 200 万用户的选择
        </p>
        <div className='flex flex-wrap items-center justify-center gap-6 md:gap-12'>
          {brands.map(brand => (
            <span
              className='font-serif text-xl font-semibold text-sand'
              key={brand}
            >
              {brand}
            </span>
          ))}
        </div>
      </section>

      <section
        className={cn(container, 'py-[72px] md:py-[100px]')}
        id='features'
      >
        <span className={label}>功能</span>
        <h2 className={sectionTitle}>少，但更好</h2>
        <p className={sectionDesc}>我们只做密码管理该做的事，不多也不少</p>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          {features.map((feature, index) => (
            <article
              className={cn(
                cardBase,
                'flex flex-col gap-3 bg-white transition hover:border-sand hover:shadow-feature',
                feature.large && 'bg-cream-2 md:col-span-2'
              )}
              key={feature.title}
            >
              <FeatureIcon index={index} />
              <h3 className='font-serif text-xl font-medium text-charcoal'>
                {feature.title}
              </h3>
              <p className='flex-1 text-[15px] leading-[1.65] text-charcoal-3'>
                {feature.description}
              </p>
              {feature.tags ? (
                <div className='flex flex-wrap gap-1.5'>
                  {feature.tags.map(tag => (
                    <span
                      className='rounded-md border border-cream-3 bg-white px-2.5 py-1 font-mono text-[11px] text-charcoal-3'
                      key={tag}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section
        className='bg-charcoal px-5 py-[72px] md:px-8 md:py-[100px]'
        id='security'
      >
        <div className='mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-20'>
          <div>
            <span className={lightLabel}>安全架构</span>
            <h2 className='mb-5 font-serif text-[34px] font-normal leading-[1.2] !text-[#faf9f7] md:text-[44px]'>
              我们看不到你的密码，
              <em className='block text-sand'>这是设计，不是承诺</em>
            </h2>
            <p className='mb-8 text-base leading-[1.7] text-white/[0.55]'>
              Vault 采用端对端加密架构。主密钥从不上传服务器，
              加密在你的设备本地完成。即便 Vault 被攻击，
              攻击者得到的也只是无法解密的密文。
            </p>
            <ul className='flex flex-col gap-3'>
              {securityItems.map(item => (
                <li
                  className='flex items-center gap-2.5 text-[15px] text-white/75'
                  key={item}
                >
                  <span className='shrink-0 text-terra-mid'>
                    <CheckIcon />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className='order-first flex flex-col items-center gap-5 md:order-none'>
            <div className='flex h-44 w-44 items-center justify-center rounded-full border border-white/[0.08] md:h-[200px] md:w-[200px]'>
              <div className='flex h-[132px] w-[132px] items-center justify-center rounded-full border border-white/12 md:h-[150px] md:w-[150px]'>
                <div className='flex h-[78px] w-[78px] items-center justify-center rounded-full border border-white/[0.15] bg-white/[0.06] text-white/70 md:h-[88px] md:w-[88px]'>
                  <LockIcon size={34} />
                </div>
              </div>
            </div>
            <p className='text-[13px] font-medium uppercase text-terra-mid'>
              端对端加密
            </p>
          </div>
        </div>
      </section>

      <section className={cn(container, 'py-[72px] md:py-[100px]')}>
        <span className={label}>用户评价</span>
        <h2 className={sectionTitle}>真实用户，真实体验</h2>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          {testimonials.map(item => (
            <article
              className={cn(cardBase, 'flex flex-col gap-4 bg-white')}
              key={item.name}
            >
              <div className='flex gap-1 text-terra' aria-label='5 stars'>
                {Array.from({ length: 5 }).map((_, index) => (
                  <StarIcon key={index} />
                ))}
              </div>
              <p className='flex-1 font-serif text-base italic leading-[1.65] text-charcoal-2'>
                {item.text}
              </p>
              <div className='flex items-center gap-3 border-t border-cream-3 pt-4'>
                <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream-3 text-sm font-semibold text-charcoal-2'>
                  {item.initial}
                </span>
                <span>
                  <span className='block text-sm font-medium text-charcoal'>
                    {item.name}
                  </span>
                  <span className='mt-px block text-xs text-charcoal-3'>
                    {item.role}
                  </span>
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className='border-y border-cream-3 bg-cream-2 px-5 py-[72px] text-center md:px-8 md:py-[100px]'
        id='pricing'
      >
        <span className={label}>定价</span>
        <h2 className={sectionTitle}>简单透明</h2>

        <div className='mx-auto mt-14 grid max-w-[1100px] grid-cols-1 items-stretch gap-4 md:grid-cols-3'>
          {plans.map(plan => (
            <article
              className={cn(
                cardBase,
                'flex flex-col text-left',
                plan.featured
                  ? '!border-[#1a1916] !bg-[#1a1916] shadow-price'
                  : 'bg-white'
              )}
              key={plan.name}
            >
              {plan.badge ? (
                <span className='mb-4 w-fit rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold uppercase text-terra-mid'>
                  {plan.badge}
                </span>
              ) : null}
              <h3
                className={cn(
                  'mb-3 font-serif text-lg font-medium',
                  plan.featured ? '!text-[#faf9f7]' : 'text-charcoal'
                )}
              >
                {plan.name}
              </h3>
              <div
                className={cn(
                  'mb-1 flex items-baseline gap-px font-serif text-[44px] leading-none',
                  plan.featured ? 'text-white' : 'text-charcoal'
                )}
              >
                <span className='self-start pt-2 text-[22px]'>¥</span>
                {plan.price}
                <span
                  className={cn(
                    'font-sans text-sm',
                    plan.featured ? 'text-white/[0.45]' : 'text-charcoal-3'
                  )}
                >
                  {plan.period}
                </span>
              </div>
              <ul className='my-6 flex flex-1 flex-col gap-2.5'>
                {plan.features.map(feature => (
                  <li
                    className={cn(
                      'flex items-center gap-2 text-sm',
                      plan.featured ? 'text-white/[0.65]' : 'text-charcoal-3'
                    )}
                    key={feature}
                  >
                    <span
                      className={cn(
                        'shrink-0',
                        plan.featured ? 'text-terra-mid' : 'text-terra'
                      )}
                    >
                      <CheckIcon />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                className={cn(
                  plan.featured
                    ? 'inline-flex w-full items-center justify-center rounded-lg bg-white px-4 py-[11px] text-sm font-medium text-charcoal transition hover:-translate-y-px hover:bg-cream-2'
                    : 'inline-flex w-full items-center justify-center rounded-lg border-[1.5px] border-cream-3 px-4 py-[11px] text-sm font-medium text-charcoal transition hover:-translate-y-px hover:border-sand hover:bg-cream-2'
                )}
                href={plan.href}
              >
                {plan.cta}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section
        className='bg-charcoal px-5 py-[72px] md:px-8 md:py-[100px]'
        id='download'
      >
        <div className='mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-12 md:grid-cols-[1fr_1.4fr] md:gap-20'>
          <div>
            <span className={lightLabel}>立即下载</span>
            <h2 className='mb-4 font-serif text-4xl font-normal leading-[1.15] !text-[#faf9f7] md:text-[46px]'>
              随时随地，触手可及
            </h2>
            <p className='max-w-[480px] text-base leading-[1.65] text-white/[0.5] md:text-[17px]'>
              全平台原生应用，密码数据实时同步，切换设备无需重新配置。
            </p>
          </div>

          <div className='flex w-full flex-col gap-8 md:flex-row md:items-start md:gap-10'>
            <div className='flex w-full min-w-0 flex-1 flex-col gap-3.5'>
              <span className='text-[11px] font-semibold uppercase text-white/[0.35]'>
                移动端
              </span>
              <div className='flex flex-col gap-2.5'>
                {mobileDownloads.map(item => (
                  <DownloadButton
                    href={item.href}
                    icon={<PhoneIcon />}
                    key={item.href}
                    subtitle={item.subtitle}
                    title={item.title}
                  />
                ))}
              </div>
            </div>

            <div className='h-px w-full bg-white/[0.08] md:mt-7 md:h-auto md:w-px md:self-stretch' />

            <div className='flex w-full min-w-0 flex-1 flex-col gap-3.5'>
              <span className='text-[11px] font-semibold uppercase text-white/[0.35]'>
                桌面端
              </span>
              <DesktopDownloads />
            </div>
          </div>
        </div>
      </section>

      <section
        className={cn(
          container,
          'flex flex-col items-center py-[72px] text-center md:py-[120px]'
        )}
        id='teams'
      >
        <h2 className='mb-5 max-w-[700px] font-serif text-4xl font-normal leading-[1.12] text-charcoal md:text-[62px]'>
          今天就开始，
          <em className='block text-charcoal-2'>把安全交给 Vault</em>
        </h2>
        <p className='mb-9 max-w-[400px] text-[17px] text-charcoal-3'>
          加入 200 万用户，让数字生活更简单、更安全
        </p>
        <a
          className={cn(
            primaryButton,
            largeButton,
            'mb-4 rounded-xl px-8 py-3.5 text-base'
          )}
          href='#download'
        >
          免费开始使用
          <ArrowIcon />
        </a>
        <p className='text-[13px] text-charcoal-3'>
          无需信用卡 · 随时取消 · 数据始终属于你
        </p>
      </section>

      <footer className='border-t border-cream-3 bg-cream-2 px-5 py-12 pb-7 md:px-8 md:pt-14'>
        <div className='mx-auto mb-12 flex max-w-[1100px] flex-col justify-between gap-12 md:flex-row'>
          <div className='flex flex-col gap-3'>
            <Logo />
            <p className='max-w-[200px] font-serif text-sm italic leading-normal text-charcoal-3'>
              让每一个密码都有归处
            </p>
          </div>

          <div className='flex flex-wrap gap-8 md:gap-16'>
            {footerGroups.map(group => (
              <div className='flex flex-col gap-2.5' key={group.title}>
                <span className='mb-1 text-xs font-semibold uppercase text-charcoal-3'>
                  {group.title}
                </span>
                {group.links.map(link => (
                  <a
                    className='text-sm text-charcoal-3 transition hover:text-charcoal'
                    href='#'
                    key={link}
                  >
                    {link}
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className='mx-auto flex max-w-[1100px] flex-col justify-between gap-2 border-t border-cream-3 pt-6 text-[13px] text-charcoal-3 md:flex-row'>
          <span>© 2025 Vault Inc. All rights reserved.</span>
          <span>以 ♥ 构建于安全之上</span>
        </div>
      </footer>
    </main>
  );
}
