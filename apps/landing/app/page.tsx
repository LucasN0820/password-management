import Image from 'next/image';
import { DesktopDownloads } from './desktop-downloads';
import { MobileNav } from './mobile-nav';
import { VaultDemo } from './vault-demo';

const features = [
  {
    number: '01',
    title: '所有账号，各就其位。',
    text: '把散落的登录信息收进密码库。分类、收藏、搜索，让每次查找都少一点翻找。',
    detail: '分类整理 / 快速搜索',
    symbol: '▦',
  },
  {
    number: '02',
    title: '好密码，不必绞尽脑汁。',
    text: '按需设置长度与字符类型，为不同账号生成不同密码，把记忆的负担交给 Vault。',
    detail: '密码生成 / 强度检查',
    symbol: '✳',
  },
  {
    number: '03',
    title: '日常使用，轻一点。',
    text: '从查看账号到复制密码，让常用操作触手可及。手机与桌面，延续同一种熟悉的体验。',
    detail: '一键复制 / 多端应用',
    symbol: '↗',
  },
];

export default function Home() {
  return (
    <div className='landing'>
      <a className='skip-link' href='#main'>
        跳转到主要内容
      </a>
      <header className='site-header'>
        <nav className='shell navigation' aria-label='主导航'>
          <a href='#' className='brand' aria-label='Vault 首页'>
            <Image src='/favicon.svg' alt='' width={32} height={32} />
            <span>
              Vault<span className='brand-dot'>.</span>
            </span>
          </a>
          <div className='desktop-nav'>
            <a href='#features'>产品功能</a>
            <a href='#security'>隐私与安全</a>
            <a href='#download'>下载</a>
          </div>
          <a href='#download' className='button button-small'>
            开始使用 <span aria-hidden='true'>↗</span>
          </a>
          <MobileNav />
        </nav>
      </header>
      <main id='main'>
        <section className='shell hero'>
          <div className='hero-copy'>
            <p className='eyebrow hero-enter'>
              <span className='status-dot' /> 为你的数字生活，留一点从容
            </p>
            <h1 className='hero-enter'>
              密码有归处，
              <br />
              <span>生活少点记忆。</span>
            </h1>
            <p className='hero-description hero-enter'>
              一个安静、好用的密码管理器。
              <br />
              收好每个账号，生成可靠密码，
              <br className='mobile-break' />
              让重要的事回到你手中。
            </p>
            <div className='hero-actions hero-enter'>
              <a className='button' href='#download'>
                下载 Vault <span aria-hidden='true'>↗</span>
              </a>
              <a className='text-link' href='#features'>
                认识 Vault <span aria-hidden='true'>↓</span>
              </a>
            </div>
            <p className='hero-note hero-enter'>
              本地优先 <span>·</span> 主密码保护 <span>·</span> 简单如日常
            </p>
          </div>
          <div className='hero-visual hero-enter'>
            <div className='orbit orbit-one' />
            <div className='orbit orbit-two' />
            <span className='visual-spark' aria-hidden='true'>
              ✳
            </span>
            <VaultDemo />
            <p className='preview-caption'>A LITTLE LESS TO REMEMBER.</p>
          </div>
        </section>
        <div className='shell principles'>
          <span>
            把复杂留给密码。
            <br />
            <strong>把简单留给你。</strong>
          </span>
          <p>
            <span aria-hidden='true'>⌘</span> 一个地方，管理所有账号
          </p>
          <p>
            <span aria-hidden='true'>✳</span> 每个账号，都有独特密码
          </p>
          <p>
            <span aria-hidden='true'>◉</span> 本地存储，安心掌握
          </p>
        </div>
        <section className='shell section' id='features'>
          <div className='section-heading'>
            <div>
              <p className='eyebrow'>THOUGHTFULLY SIMPLE / 简单，刚刚好</p>
              <h2>
                少一些繁琐。
                <br />
                多一些心安。
              </h2>
            </div>
            <p>
              从记住密码，到不必惦记。
              <br />
              只留下真正需要的功能。
            </p>
          </div>
          <div className='feature-grid'>
            {features.map(item => (
              <article className='feature' key={item.number}>
                <div className='feature-top'>
                  <span>{item.number}</span>
                  <span className='feature-symbol' aria-hidden='true'>
                    {item.symbol}
                  </span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <span className='feature-detail'>{item.detail}</span>
              </article>
            ))}
          </div>
        </section>
        <section className='security-section' id='security'>
          <div className='shell security-grid'>
            <div className='security-art' aria-hidden='true'>
              <div className='security-ring ring-outer' />
              <div className='security-ring ring-inner' />
              <div className='lock-tile'>
                <svg viewBox='0 0 64 64' fill='none'>
                  <rect
                    x='15'
                    y='28'
                    width='34'
                    height='27'
                    rx='6'
                    stroke='currentColor'
                    strokeWidth='2'
                  />
                  <path
                    d='M22 28V18a10 10 0 0 1 20 0v10'
                    stroke='currentColor'
                    strokeWidth='2'
                  />
                  <circle cx='32' cy='40' r='3' fill='currentColor' />
                  <path d='M32 43v5' stroke='currentColor' strokeWidth='2' />
                </svg>
              </div>
              <span className='security-art-label'>
                YOUR PASSWORDS. YOUR SPACE.
              </span>
            </div>
            <div>
              <p className='eyebrow'>PRIVATE BY DESIGN / 安全，从本地开始</p>
              <h2>
                你的密码，
                <br />
                值得被好好保管。
              </h2>
              <p className='security-description'>
                以本地存储为基础，用主密码守护密码库。
                <br />
                让隐私成为日常的一部分，而不是额外的负担。
              </p>
              <div className='security-facts'>
                <div>
                  <span>01 / 本地优先</span>
                  <p>密码库保存在你的设备中。</p>
                </div>
                <div>
                  <span>02 / 加密保护</span>
                  <p>敏感字段采用 AES-256-GCM 加密。</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className='shell section download-section' id='download'>
          <div className='download-copy'>
            <p className='eyebrow'>MAKE ROOM FOR WHAT MATTERS</p>
            <h2>
              把密码交给 Vault。
              <br />
              <span>把时间留给生活。</span>
            </h2>
            <p>选择你的设备，从整理第一个账号开始。</p>
            <div className='download-mark' aria-hidden='true'>
              V<span>✳</span>
            </div>
          </div>
          <div className='download-panel'>
            <div className='download-panel-heading'>
              <h3>在你的设备上使用</h3>
              <span>GET VAULT ↗</span>
            </div>
            <DesktopDownloads />
            <a className='android-download' href='/download/mobile' download>
              <span>
                <small>下载移动端</small>
                <strong>Android APK</strong>
              </span>
              <span aria-hidden='true'>↓</span>
            </a>
            <p className='download-footnote'>
              桌面与移动端，同样简洁的使用体验。
            </p>
          </div>
        </section>
      </main>
      <footer className='shell footer'>
        <a href='#' className='brand'>
          <Image src='/favicon.svg' alt='' width={25} height={25} />
          <span>Vault.</span>
        </a>
        <p>少一点记忆，多一点生活。</p>
        <a href='#download'>下载应用 ↗</a>
        <span>© {new Date().getFullYear()} Vault</span>
      </footer>
    </div>
  );
}

