'use client';

import { useState } from 'react';

const navItems = [
  { href: '#product', label: '产品' },
  { href: '#security', label: '安全' },
  { href: '#plans', label: '价格' },
  { href: '#teams', label: '企业' },
];

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden='true'
      className='h-5 w-5'
      fill='none'
      stroke='currentColor'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='1.8'
      viewBox='0 0 24 24'
    >
      {open ? (
        <path d='m6 6 12 12M18 6 6 18' />
      ) : (
        <path d='M5 7h14M5 12h14M5 17h14' />
      )}
    </svg>
  );
}

export function MobileNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className='md:hidden'>
      <button
        aria-controls='mobile-menu'
        aria-expanded={isMenuOpen}
        aria-label={isMenuOpen ? '关闭菜单' : '打开菜单'}
        className='flex h-10 w-10 items-center justify-center rounded-md border border-line bg-white text-ink'
        onClick={() => setIsMenuOpen(open => !open)}
        type='button'
      >
        <MenuIcon open={isMenuOpen} />
      </button>

      {isMenuOpen && (
        <div
          className='absolute left-0 right-0 top-[72px] border-b border-line bg-background px-5 py-5 shadow-soft'
          id='mobile-menu'
        >
          <div className='grid gap-1'>
            {navItems.map(item => (
              <a
                className='rounded-md px-2 py-3 text-sm font-semibold text-muted transition-colors hover:bg-white hover:text-ink'
                href={item.href}
                key={item.href}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className='mt-4 grid gap-2 border-t border-line pt-4'>
            <a
              className='rounded-md border border-line bg-white px-4 py-3 text-center text-sm font-semibold text-ink'
              href='#plans'
              onClick={() => setIsMenuOpen(false)}
            >
              了解价格
            </a>
            <a
              className='rounded-md bg-ink px-4 py-3 text-center text-sm font-semibold text-white'
              href='#product'
              onClick={() => setIsMenuOpen(false)}
            >
              免费开始
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
