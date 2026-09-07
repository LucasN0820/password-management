'use client';

import { useState } from 'react';

const accounts = [
  {
    name: 'Notion',
    account: 'hello@example.com',
    letter: 'N',
    category: '工作',
    tone: 'neutral',
  },
  {
    name: 'Figma',
    account: 'design@example.com',
    letter: 'F',
    category: '工作',
    tone: 'terra',
  },
  {
    name: 'Google',
    account: 'hello@example.com',
    letter: 'G',
    category: '生活',
    tone: 'green',
  },
];

export function VaultDemo() {
  const [filter, setFilter] = useState('全部');
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
          <span>我的密码库</span>
          <span className='demo-label'>交互演示</span>
        </div>
        <div className='vault-content'>
          <div className='vault-title'>
            <div>
              <span className='vault-greeting'>一切，都井井有条。</span>
              <h2>
                我的密码<span>.</span>
              </h2>
            </div>
            <span className='vault-count'>
              03<span>个账号</span>
            </span>
          </div>
          <div className='vault-tabs' aria-label='演示账号分类'>
            {['全部', '工作', '生活'].map(tab => (
              <button
                key={tab}
                type='button'
                aria-pressed={filter === tab}
                onClick={() => setFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className='account-list'>
            {accounts
              .filter(item => filter === '全部' || item.category === filter)
              .map(item => (
                <div className='account-row' key={item.name}>
                  <span className={`account-logo ${item.tone}`}>
                    {item.letter}
                  </span>
                  <span className='account-info'>
                    <strong>{item.name}</strong>
                    <span>{item.account}</span>
                  </span>
                  <span className='account-password' aria-label='密码已隐藏'>
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
              <span className='status-dot' /> 本地密码库
            </span>
            <span>有序，也安心。</span>
          </div>
        </div>
      </div>
      <div className='generator-card'>
        <div className='generator-heading'>
          <span>
            <span aria-hidden='true'>✳</span> 密码生成器
          </span>
          <span className='strength'>强密码</span>
        </div>
        <div className='generated-password'>
          <code>
            {visible ? samples[version % samples.length] : '•••• •••• •••• •••'}
          </code>
          <button
            type='button'
            aria-label={visible ? '隐藏演示密码' : '显示演示密码'}
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
          <span>15 位字符 · 仅供演示</span>
          <button
            type='button'
            onClick={() => {
              setVersion(value => value + 1);
              setVisible(true);
            }}
          >
            换一个 <span aria-hidden='true'>↻</span>
          </button>
        </div>
      </div>
    </div>
  );
}
