'use client';

import { useState } from 'react';
import { useLocale } from './locale-context';

const tabs = ['all', 'work', 'life'] as const;
type Tab = (typeof tabs)[number];

const accounts = [
  {
    name: 'Notion',
    account: 'hello@example.com',
    letter: 'N',
    category: 'work',
    tone: 'neutral',
  },
  {
    name: 'Figma',
    account: 'design@example.com',
    letter: 'F',
    category: 'work',
    tone: 'terra',
  },
  {
    name: 'Google',
    account: 'hello@example.com',
    letter: 'G',
    category: 'life',
    tone: 'green',
  },
];

export function VaultDemo() {
  const { messages } = useLocale();
  const { demo } = messages;
  const [filter, setFilter] = useState<Tab>('all');
  const [visible, setVisible] = useState(false);
  const [version, setVersion] = useState(0);
  const samples = ['kR9#mW2!pL7@xN4', 'tH4&nB8!vQ3#sJ6', 'wF7@cK2$rM9!dP5'];
  return (
    <div className='vault-scene'>
      <div className='vault-window'>
        <div className='window-bar'>
          <span className='window-dots' aria-hidden='true'>
            <i />
            <i />
            <i />
          </span>
          <span>{demo.windowTitle}</span>
          <span className='demo-label'>{demo.interactive}</span>
        </div>
        <div className='vault-content'>
          <div className='vault-title'>
            <div>
              <span className='vault-greeting'>{demo.greeting}</span>
              <h2>
                {demo.title}
                <span>.</span>
              </h2>
            </div>
            <span className='vault-count'>
              03<span>{demo.accountCount}</span>
            </span>
          </div>
          <div className='vault-tabs' aria-label={demo.tabsLabel}>
            {tabs.map(tab => (
              <button
                key={tab}
                type='button'
                aria-pressed={filter === tab}
                onClick={() => setFilter(tab)}
              >
                {demo.tabs[tab]}
              </button>
            ))}
          </div>
          <div className='account-list'>
            {accounts
              .filter(item => filter === 'all' || item.category === filter)
              .map(item => (
                <div className='account-row' key={item.name}>
                  <span className={`account-logo ${item.tone}`}>
                    {item.letter}
                  </span>
                  <span className='account-info'>
                    <strong>{item.name}</strong>
                    <span>{item.account}</span>
                  </span>
                  <span
                    className='account-password'
                    aria-label={demo.passwordHidden}
                  >
                    ••••••
                  </span>
                  <span className='account-arrow' aria-hidden='true'>
                    ↗
                  </span>
                </div>
              ))}
          </div>
          <div className='vault-bottom'>
            <span>
              <span className='status-dot' /> {demo.localVault}
            </span>
            <span>{demo.calm}</span>
          </div>
        </div>
      </div>
      <div className='generator-card'>
        <div className='generator-heading'>
          <span>
            <span aria-hidden='true'>✳</span> {demo.generator}
          </span>
          <span className='strength'>{demo.strongPassword}</span>
        </div>
        <div className='generated-password'>
          <code>
            {visible ? samples[version % samples.length] : '•••• •••• •••• •••'}
          </code>
          <button
            type='button'
            aria-label={visible ? demo.hidePassword : demo.showPassword}
            aria-pressed={visible}
            onClick={() => setVisible(value => !value)}
          >
            <svg
              aria-hidden='true'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
            >
              <path d='M2 12s3-6 10-6 10 6 10 6-3 6-10 6S2 12 2 12Z' />
              <circle cx='12' cy='12' r='3' />
            </svg>
          </button>
        </div>
        <div className='strength-meter' aria-hidden='true'>
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className='generator-footer'>
          <span>{demo.sampleNote}</span>
          <button
            type='button'
            onClick={() => {
              setVersion(value => value + 1);
              setVisible(true);
            }}
          >
            {demo.nextPassword} <span aria-hidden='true'>↻</span>
          </button>
        </div>
      </div>
    </div>
  );
}
