'use client';

import { useEffect, useMemo, useState } from 'react';

type DesktopPlatform = 'mac-arm64' | 'mac-x64' | 'win-x64' | 'linux-x64';

type DesktopDownload = {
  href: string;
  platform: DesktopPlatform;
  subtitle: string;
  title: string;
};

type UserAgentData = {
  platform?: string;
  getHighEntropyValues?: (hints: string[]) => Promise<{
    architecture?: string;
    bitness?: string;
    platform?: string;
  }>;
};

type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: UserAgentData;
};

const desktopDownloads: DesktopDownload[] = [
  {
    title: 'macOS Apple',
    subtitle: '下载桌面端',
    href: '/download/desktop?platform=mac-arm64',
    platform: 'mac-arm64',
  },
  {
    title: 'macOS Intel',
    subtitle: '下载桌面端',
    href: '/download/desktop?platform=mac-x64',
    platform: 'mac-x64',
  },
  {
    title: 'Windows',
    subtitle: '下载桌面端',
    href: '/download/desktop?platform=win-x64',
    platform: 'win-x64',
  },
  {
    title: 'Linux',
    subtitle: '下载桌面端',
    href: '/download/desktop?platform=linux-x64',
    platform: 'linux-x64',
  },
];

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

function normalize(value: string | undefined) {
  return value?.toLowerCase() ?? '';
}

async function detectDesktopPlatform(): Promise<DesktopPlatform | null> {
  const nav = navigator as NavigatorWithUserAgentData;
  const userAgent = normalize(navigator.userAgent);
  let platform = normalize(nav.userAgentData?.platform || navigator.platform);
  let architecture = '';

  if (nav.userAgentData?.getHighEntropyValues) {
    try {
      const hints = await nav.userAgentData.getHighEntropyValues([
        'architecture',
        'bitness',
        'platform',
      ]);

      platform = normalize(hints.platform || platform);
      architecture = normalize(
        `${hints.architecture ?? ''} ${hints.bitness ?? ''}`
      );
    } catch {
      architecture = '';
    }
  }

  const device = `${platform} ${userAgent}`;

  if (/android|iphone|ipad|ipod/.test(device)) {
    return null;
  }

  if (/win/.test(device)) {
    return 'win-x64';
  }

  if (/linux/.test(device)) {
    return 'linux-x64';
  }

  if (/mac|darwin/.test(device)) {
    if (/x86|x64|amd64|intel/.test(architecture)) {
      return 'mac-x64';
    }

    return 'mac-arm64';
  }

  return null;
}

function DesktopDownloadButton({
  href,
  isRecommended,
  subtitle,
  title,
}: DesktopDownload & {
  isRecommended: boolean;
}) {
  return (
    <a
      aria-label={`${title}${isRecommended ? '，推荐下载' : ''}`}
      className={`flex w-full min-w-0 items-center gap-3 rounded-xl border px-4 py-3 transition hover:-translate-y-0.5 ${
        isRecommended
          ? 'border-terra-mid bg-white/[0.11] shadow-[0_0_0_1px_rgba(232,168,142,0.3)] hover:border-terra-mid hover:bg-white/[0.14]'
          : 'border-white/10 bg-white/[0.06] hover:border-white/20 hover:bg-white/10'
      }`}
      href={href}
    >
      <span
        className={`flex shrink-0 items-center ${
          isRecommended ? 'text-terra-mid' : 'text-white/70'
        }`}
      >
        <MonitorIcon />
      </span>
      <span className='flex min-w-0 flex-1 flex-col gap-px'>
        <span className='text-[11px] text-white/40'>{subtitle}</span>
        <span className='[overflow-wrap:anywhere] font-serif text-base font-medium !text-[#faf9f7]'>
          {title}
        </span>
      </span>
      {isRecommended ? (
        <span className='rounded-full bg-terra-light px-2.5 py-1 text-[11px] font-semibold text-terra'>
          推荐
        </span>
      ) : null}
    </a>
  );
}

export function DesktopDownloads() {
  const [recommendedPlatform, setRecommendedPlatform] =
    useState<DesktopPlatform | null>(null);

  useEffect(() => {
    let isMounted = true;

    detectDesktopPlatform().then(platform => {
      if (isMounted) {
        setRecommendedPlatform(platform);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedDownloads = useMemo(() => {
    if (!recommendedPlatform) {
      return desktopDownloads;
    }

    return [...desktopDownloads].sort((left, right) => {
      if (left.platform === recommendedPlatform) {
        return -1;
      }

      if (right.platform === recommendedPlatform) {
        return 1;
      }

      return 0;
    });
  }, [recommendedPlatform]);

  return (
    <div className='flex flex-col gap-2.5'>
      {sortedDownloads.map(item => (
        <DesktopDownloadButton
          {...item}
          isRecommended={item.platform === recommendedPlatform}
          key={item.href}
        />
      ))}
    </div>
  );
}
