'use client';

import Image from 'next/image';
import { DesktopDownloads } from './desktop-downloads';
import { LocaleProvider, useLocale } from './locale-context';
import { MobileNav } from './mobile-nav';
import { VaultDemo } from './vault-demo';
import type { Locale } from './i18n';

function LanguageSwitcher() {
  const { locale, messages, setLocale } = useLocale();

  return (
    <div
      aria-label={messages.language.label}
      className='language-switcher'
      role='group'
    >
      <button
        aria-pressed={locale === 'zh'}
        aria-label={messages.language.chinese}
        onClick={() => setLocale('zh')}
        title={messages.language.chinese}
        type='button'
      >
        中
      </button>
      <span aria-hidden='true'>/</span>
      <button
        aria-pressed={locale === 'en'}
        aria-label={messages.language.english}
        onClick={() => setLocale('en')}
        title={messages.language.english}
        type='button'
      >
        EN
      </button>
    </div>
  );
}

function LandingContent() {
  const { messages } = useLocale();
  const { navigation, hero, principles, features, security, download, footer } =
    messages;

  return (
    <div className='landing'>
      <a className='skip-link' href='#main'>
        {messages.skipLink}
      </a>
      <header className='site-header'>
        <nav className='shell navigation' aria-label={navigation.mainLabel}>
          <a href='#' className='brand' aria-label={messages.brandLabel}>
            <Image src='/favicon.svg' alt='' width={32} height={32} />
            <span>
              Vault<span className='brand-dot'>.</span>
            </span>
          </a>
          <div className='desktop-nav'>
            <a href='#features'>{navigation.products}</a>
            <a href='#security'>{navigation.security}</a>
            <a href='#download'>{navigation.download}</a>
          </div>
          <LanguageSwitcher />
          <a href='#download' className='button button-small'>
            {navigation.start} <span aria-hidden='true'>↗</span>
          </a>
          <MobileNav />
        </nav>
      </header>
      <main id='main'>
        <section className='shell hero'>
          <div className='hero-copy'>
            <p className='eyebrow hero-enter'>
              <span className='status-dot' /> {hero.eyebrow}
            </p>
            <h1 className='hero-enter'>
              {hero.title[0]}
              <br />
              <span>{hero.title[1]}</span>
            </h1>
            <p className='hero-description hero-enter'>
              {hero.description[0]}
              <br />
              {hero.description[1]}
            </p>
            <div className='hero-actions hero-enter'>
              <a className='button' href='#download'>
                {hero.primary} <span aria-hidden='true'>↗</span>
              </a>
              <a className='text-link' href='#features'>
                {hero.secondary} <span aria-hidden='true'>↓</span>
              </a>
            </div>
            <p className='hero-note hero-enter'>
              {hero.note.map((item, index) => (
                <span key={item}>
                  {index > 0 ? ' · ' : ''}
                  {item}
                </span>
              ))}
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
            {principles.title[0]}
            <br />
            <strong>{principles.title[1]}</strong>
          </span>
          {principles.items.map((item, index) => (
            <p key={item}>
              <span aria-hidden='true'>{['⌘', '✳', '◉'][index]}</span>
              {item}
            </p>
          ))}
        </div>
        <section className='shell section' id='features'>
          <div className='section-heading'>
            <div>
              <p className='eyebrow'>{features.eyebrow}</p>
              <h2>
                {features.title[0]}
                <br />
                {features.title[1]}
              </h2>
            </div>
            <p>
              {features.description[0]}
              <br />
              {features.description[1]}
            </p>
          </div>
          <div className='feature-grid'>
            {features.items.map((item, index) => (
              <article className='feature' key={item.title}>
                <div className='feature-top'>
                  <span>{String(index + 1).padStart(2, '0')}</span>
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
              <span className='security-art-label'>{security.artLabel}</span>
            </div>
            <div>
              <p className='eyebrow'>{security.eyebrow}</p>
              <h2>
                {security.title[0]}
                <br />
                {security.title[1]}
              </h2>
              <p className='security-description'>
                {security.description[0]}
                <br />
                {security.description[1]}
              </p>
              <div className='security-facts'>
                {security.facts.map(([title, text]) => (
                  <div key={title}>
                    <span>{title}</span>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className='shell section download-section' id='download'>
          <div className='download-copy'>
            <p className='eyebrow'>{download.eyebrow}</p>
            <h2>
              {download.title[0]}
              <br />
              <span>{download.title[1]}</span>
            </h2>
            <p>{download.description}</p>
            <div className='download-mark' aria-hidden='true'>
              V<span>✳</span>
            </div>
          </div>
          <div className='download-panel'>
            <div className='download-panel-heading'>
              <h3>{download.panelTitle}</h3>
              <span>{download.panelLabel}</span>
            </div>
            <DesktopDownloads />
            <a className='android-download' href='/download/mobile' download>
              <span>
                <small>{download.mobileSubtitle}</small>
                <strong>{download.android}</strong>
              </span>
              <span aria-hidden='true'>↓</span>
            </a>
            <p className='download-footnote'>{download.footnote}</p>
          </div>
        </section>
      </main>
      <footer className='shell footer'>
        <a href='#' className='brand'>
          <Image src='/favicon.svg' alt='' width={25} height={25} />
          <span>Vault.</span>
        </a>
        <p>{footer.tagline}</p>
        <a href='#download'>{footer.download}</a>
        <span>© {new Date().getFullYear()} Vault</span>
      </footer>
    </div>
  );
}

export function LandingPage({ initialLocale }: { initialLocale: Locale }) {
  return (
    <LocaleProvider initialLocale={initialLocale}>
      <LandingContent />
    </LocaleProvider>
  );
}
