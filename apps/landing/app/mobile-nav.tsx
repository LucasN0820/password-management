'use client';

import { useState } from 'react';

const navItems = [
  { href: '#features', label: '产品' },
  { href: '#security', label: '安全' },
  { href: '#pricing', label: '价格' },
  { href: '#teams', label: '企业' },
  { href: '#download', label: '下载' },
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
    <div className='relative md:hidden'>
      <button
        aria-controls='mobile-menu'
        aria-expanded={isMenuOpen}
        aria-label={isMenuOpen ? '关闭菜单' : '打开菜单'}
        className='flex h-10 w-10 items-center justify-center rounded-lg border border-cream-3 bg-cream-2 text-charcoal transition hover:bg-white'
        onClick={() => setIsMenuOpen(open => !open)}
        type='button'
      >
        <MenuIcon open={isMenuOpen} />
      </button>

      {isMenuOpen && (
        <div
          className='absolute right-0 top-12 z-50 w-[min(76vw,260px)] rounded-2xl border border-cream-3 bg-cream p-3 shadow-feature'
          id='mobile-menu'
        >
          <div className='grid gap-1'>
            {navItems.map(item => (
              <a
                className='rounded-xl px-3 py-3 text-sm font-semibold text-charcoal-3 transition-colors hover:bg-white hover:text-charcoal'
                href={item.href}
                key={item.href}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </div>
          <div className='mt-3 border-t border-cream-3 pt-3'>
            <a
              className='flex items-center justify-center rounded-lg !bg-[#1a1916] px-4 py-3 text-sm font-semibold !text-[#faf9f7] transition hover:!bg-[#3a3834]'
              href='#download'
              onClick={() => setIsMenuOpen(false)}
            >
              下载应用
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
