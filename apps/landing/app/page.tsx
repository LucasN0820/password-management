import { MobileNav } from './mobile-nav';

const navItems = [
  { href: '#product', label: '产品' },
  { href: '#security', label: '安全' },
  { href: '#plans', label: '价格' },
  { href: '#teams', label: '企业' },
];

const credentials = [
  {
    name: 'Google',
    account: 'hello@example.com',
    tone: 'bg-[#edf3ff] text-[#31527a]',
    letter: 'G',
    dots: 13,
  },
  {
    name: 'Netflix',
    account: 'billing@example.com',
    tone: 'bg-[#fff0ee] text-[#8b463a]',
    letter: 'N',
    dots: 12,
  },
];

const workflow = [
  {
    title: '一个主密码',
    description: '只记住进入保险库的钥匙，其余凭据由本地加密数据库保存。',
  },
  {
    title: '跨端离线可用',
    description: '桌面端和移动端使用一致的数据模型，断网时也能管理常用账户。',
  },
  {
    title: '生成即归档',
    description: '创建强密码、标记分类、快速搜索，日常维护不再变成负担。',
  },
];

const securityChecks = [
  '主密码永不离开你的设备',
  '开源架构，代码透明可信',
  '符合 SOC 2 Type II 标准',
  '定期第三方渗透测试',
];

const plans = [
  {
    name: '个人免费版',
    price: '¥0',
    unit: '/永久',
    description: '适合开始整理自己的密码库。',
    points: ['无限密码存储', '密码填充', '强密码生成', '跨设备同步（2台）'],
    cta: '免费开始',
  },
  {
    name: '个人高级版',
    price: '¥18',
    unit: '/月',
    description: '为经常在多设备间切换的用户设计。',
    points: ['免费版全部功能', '无限设备同步', '高级搜索', '优先客服支持'],
    cta: '立即升级',
    featured: true,
    badge: '最受欢迎',
  },
  {
    name: '团队',
    price: '¥36',
    unit: '/人/月',
    description: '为团队共享凭据和权限管理准备。',
    points: ['高级安全控制', '团队共享密码库', '成员权限管理', 'SSO 集成'],
    cta: '联系销售',
  },
];

function LockIcon() {
  return (
    <svg
      aria-hidden='true'
      className='h-4 w-4'
      fill='none'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.8'
      viewBox='0 0 24 24'
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
      className='h-4 w-4'
      fill='none'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.8'
      viewBox='0 0 24 24'
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
      className='h-3.5 w-3.5'
      fill='none'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='2'
      viewBox='0 0 24 24'
    >
      <path d='m5 12 4 4L19 6' />
    </svg>
  );
}

function SecurityOrbit() {
  return (
    <div className='flex flex-col items-center justify-center md:min-h-[360px]'>
      <div className='relative flex h-48 w-48 items-center justify-center md:h-64 md:w-64'>
        <span className='absolute h-full w-full rounded-full border border-white/5' />
        <span className='absolute h-[74%] w-[74%] rounded-full border border-white/8' />
        <span className='absolute h-[48%] w-[48%] rounded-full border border-white/10 bg-white/[0.015]' />
        <span className='flex h-16 w-16 items-center justify-center rounded-full border border-white/12 bg-white/[0.035] text-white/72 md:h-20 md:w-20'>
          <LockIcon />
        </span>
      </div>
      <p className='-mt-8 text-xs font-semibold text-clay-light md:-mt-10'>
        端到端加密
      </p>
    </div>
  );
}

function VaultPreview() {
  return (
    <div className='relative mx-auto w-full max-w-[520px] text-left'>
      <div className='space-y-3'>
        {credentials.map(item => (
          <article
            className='credential-row grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg border border-line bg-white px-5 py-5 shadow-soft'
            key={item.name}
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-md text-sm font-semibold ${item.tone}`}
            >
              {item.letter}
            </div>
            <div className='min-w-0'>
              <h3 className='truncate text-sm font-semibold text-ink'>
                {item.name}
              </h3>
              <p className='truncate text-xs text-muted'>{item.account}</p>
              <div
                className='mt-4 flex gap-2'
                aria-label={`${item.name} password is hidden`}
              >
                {Array.from({ length: item.dots }).map((_, index) => (
                  <span
                    className='h-1 w-1 rounded-full bg-muted/70'
                    key={index}
                  />
                ))}
              </div>
            </div>
            <svg
              aria-hidden='true'
              className='h-4 w-4 text-muted'
              fill='none'
              stroke='currentColor'
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='1.7'
              viewBox='0 0 24 24'
            >
              <path d='M2.1 12s3.4-6 9.9-6 9.9 6 9.9 6-3.4 6-9.9 6-9.9-6-9.9-6Z' />
              <circle cx='12' cy='12' r='2.4' />
            </svg>
          </article>
        ))}
      </div>
      <div className='absolute -bottom-5 right-4 flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-xs font-medium text-white shadow-status'>
        <LockIcon />
        已自动填充
        <span className='h-2 w-2 rounded-full bg-[#4cc38a]' />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className='min-h-screen bg-background text-ink'>
      <header className='sticky top-0 z-40 border-b border-line bg-background/90 backdrop-blur-xl'>
        <nav
          aria-label='Primary'
          className='mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5'
        >
          <a className='flex items-center gap-3' href='#'>
            <span className='flex h-8 w-8 items-center justify-center rounded-md bg-ink text-white'>
              <LockIcon />
            </span>
            <span className='font-serif text-2xl font-semibold tracking-tight'>
              Vault
            </span>
          </a>

          <div className='hidden items-center gap-8 md:flex'>
            {navItems.map(item => (
              <a
                className='text-sm font-medium text-muted transition-colors hover:text-ink'
                href={item.href}
                key={item.href}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className='hidden items-center gap-3 md:flex'>
            <a
              className='rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-ink/40'
              href='#plans'
            >
              了解价格
            </a>
            <a
              className='rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-charcoal'
              href='#product'
            >
              免费开始
            </a>
          </div>

          <MobileNav />
        </nav>
      </header>

      <section className='border-b border-line'>
        <div className='mx-auto flex max-w-6xl flex-col items-center px-5 pb-14 pt-16 text-center md:pb-20 md:pt-28'>
          <div className='mx-auto max-w-4xl'>
            <div className='mb-8 inline-flex items-center gap-2 rounded-full border border-clay/25 bg-clay-soft px-4 py-2 text-xs font-semibold text-clay'>
              <LockIcon />
              军用级加密 · AES-256
            </div>

            <h1 className='font-serif text-[clamp(2.85rem,11.8vw,5.9rem)] font-medium leading-[1.04] tracking-tight text-ink'>
              <span className='block whitespace-nowrap'>记住一个密码，</span>
              <span className='block whitespace-nowrap italic text-ink/80'>
                掌管所有安全
              </span>
            </h1>

            <p className='mx-auto mt-7 max-w-xl text-lg leading-8 text-muted'>
              Vault 以极简的方式保管你的数字身份。无需记忆，无需妥协，
              只需信任一把主钥匙。
            </p>

            <div className='mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row'>
              <a
                className='inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-ink px-6 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-charcoal sm:w-auto'
                href='#product'
              >
                免费使用
                <ArrowIcon />
              </a>
              <a
                className='inline-flex h-12 w-full items-center justify-center rounded-md border border-line bg-white px-6 text-sm font-semibold text-ink transition-colors hover:border-ink/35 sm:w-auto'
                href='#security'
              >
                了解更多
              </a>
            </div>

            <p className='mt-5 text-sm text-muted'>
              免费版永久可用 · 无需信用卡
            </p>
          </div>

          <div className='mt-12 w-full md:mt-16'>
            <VaultPreview />
          </div>
        </div>
      </section>

      <section className='bg-white' aria-label='产品信任指标'>
        <div className='mx-auto grid max-w-6xl divide-y divide-line px-5 md:grid-cols-3 md:divide-x md:divide-y-0'>
          {[
            ['本地优先', '敏感数据默认留在你的设备'],
            ['3 秒', '快速找到并填充常用凭据'],
            ['0 追踪', '不出售、不分析你的密码库'],
          ].map(([value, label]) => (
            <div className='py-8 md:px-8' key={value}>
              <p className='font-serif text-3xl font-medium text-ink'>
                {value}
              </p>
              <p className='mt-2 text-sm text-muted'>{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id='product' className='border-y border-line bg-warm py-20'>
        <div className='mx-auto grid max-w-6xl gap-12 px-5 md:grid-cols-[0.95fr_1.05fr]'>
          <div>
            <p className='text-sm font-semibold text-clay'>产品</p>
            <h2 className='mt-4 max-w-xl font-serif text-5xl font-medium leading-[1.02] tracking-tight md:text-6xl'>
              少一点界面，
              <span className='block'>多一点确定感。</span>
            </h2>
          </div>

          <div className='divide-y divide-line border-y border-line'>
            {workflow.map(item => (
              <article
                className='grid gap-3 py-8 sm:grid-cols-[160px_1fr]'
                key={item.title}
              >
                <h3 className='text-base font-semibold text-ink'>
                  {item.title}
                </h3>
                <p className='text-base leading-7 text-muted'>
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id='security' className='bg-[#151512] py-20 text-white md:py-28'>
        <div className='mx-auto grid max-w-6xl gap-14 px-5 md:grid-cols-[1fr_0.9fr] md:items-center'>
          <div>
            <p className='text-sm font-semibold text-clay-light'>安全架构</p>
            <h2 className='mt-8 max-w-3xl font-serif text-[clamp(2.75rem,7vw,5.35rem)] font-medium leading-[1.02] tracking-tight text-[#e8eef8]'>
              我们看不到你的密码，
              <span className='block italic text-[#d5deeb]'>
                这是设计，不是承诺
              </span>
            </h2>
            <p className='mt-8 max-w-2xl text-base leading-8 text-[#aeb8c9] md:text-lg md:leading-9'>
              Vault 从界面到数据层都保持克制。主密码只用于解锁你的本地保险库，
              凭据记录默认留在设备里，我们也没有读取它们的入口。
            </p>
            <ul className='mt-8 space-y-3'>
              {securityChecks.map(check => (
                <li
                  className='flex items-center gap-3 text-sm font-medium text-[#bfc8d7]'
                  key={check}
                >
                  <span className='flex h-5 w-5 items-center justify-center text-clay-light'>
                    <CheckIcon />
                  </span>
                  {check}
                </li>
              ))}
            </ul>
          </div>

          <SecurityOrbit />
        </div>
      </section>

      <section id='plans' className='bg-warm py-20 md:py-28'>
        <div className='mx-auto max-w-6xl px-5'>
          <div className='text-center'>
            <p className='text-sm font-semibold text-clay'>定价</p>
            <h2 className='mt-5 font-serif text-5xl font-medium tracking-tight text-ink md:text-6xl'>
              简单透明
            </h2>
          </div>

          <div className='mx-auto mt-14 grid max-w-5xl gap-4 md:grid-cols-3 md:items-stretch'>
            {plans.map(plan => (
              <article
                className={`flex min-h-[420px] flex-col rounded-lg border p-7 shadow-soft ${
                  plan.featured
                    ? 'border-ink bg-ink text-white'
                    : 'border-line bg-white text-ink'
                }`}
                key={plan.name}
              >
                <div className='min-h-8'>
                  {plan.badge ? (
                    <span className='inline-flex rounded-sm bg-clay/18 px-2.5 py-1 text-xs font-semibold text-clay-light'>
                      {plan.badge}
                    </span>
                  ) : null}
                </div>

                <h3 className='mt-4 text-lg font-semibold'>{plan.name}</h3>
                <p
                  className={`mt-3 min-h-12 text-sm leading-6 ${
                    plan.featured ? 'text-white/62' : 'text-muted'
                  }`}
                >
                  {plan.description}
                </p>

                <div className='mt-6 flex items-end gap-1'>
                  <span className='font-serif text-5xl font-medium leading-none'>
                    {plan.price}
                  </span>
                  <span
                    className={`pb-1 text-sm ${
                      plan.featured ? 'text-white/58' : 'text-muted'
                    }`}
                  >
                    {plan.unit}
                  </span>
                </div>

                <ul className='mt-8 flex-1 space-y-3'>
                  {plan.points.map(point => (
                    <li
                      className={`flex items-center gap-3 text-sm ${
                        plan.featured ? 'text-white/72' : 'text-muted'
                      }`}
                      key={point}
                    >
                      <span className='flex h-4 w-4 items-center justify-center text-clay'>
                        <CheckIcon />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>

                <a
                  className={`mt-8 inline-flex h-11 items-center justify-center rounded-md border px-4 text-sm font-semibold transition-colors ${
                    plan.featured
                      ? 'border-white bg-white text-ink hover:bg-white/88'
                      : 'border-line bg-white text-ink hover:border-ink/35'
                  }`}
                  href={plan.featured ? '#product' : '#teams'}
                >
                  {plan.cta}
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id='teams' className='border-y border-line bg-white py-16'>
        <div className='mx-auto flex max-w-6xl flex-col gap-6 px-5 md:flex-row md:items-center md:justify-between'>
          <h2 className='max-w-2xl font-serif text-4xl font-medium leading-tight md:text-5xl'>
            把团队共享凭据收进一座更安静的保险库。
          </h2>
          <a
            className='inline-flex h-12 items-center justify-center rounded-md bg-clay px-6 text-sm font-semibold text-white transition-colors hover:bg-clay-dark'
            href='mailto:hello@example.com'
          >
            联系企业方案
          </a>
        </div>
      </section>

      <footer className='bg-background py-10'>
        <div className='mx-auto flex max-w-6xl flex-col gap-6 px-5 text-sm text-muted md:flex-row md:items-center md:justify-between'>
          <div className='flex items-center gap-3 text-ink'>
            <span className='flex h-8 w-8 items-center justify-center rounded-md bg-ink text-white'>
              <LockIcon />
            </span>
            <span className='font-serif text-2xl font-semibold'>Vault</span>
          </div>
          <p>© {new Date().getFullYear()} Vault. 极简、私密、本地优先。</p>
        </div>
      </footer>
    </main>
  );
}
