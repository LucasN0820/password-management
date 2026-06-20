import { motion, type Variants } from 'framer-motion';
import {
  Bot,
  Globe,
  Key,
  Lock,
  type LucideIcon,
  Plus,
  Search,
  Settings,
  Shield,
  Star,
  Zap,
} from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import type { Password } from '@repo/db';
import { useTranslation } from '@repo/i18n';
import { countStrongPasswords } from '@/lib/password-strength';
import { usePasswordStore } from '@/store/passwordStore';

const CONTAINER_VARIANTS: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, staggerChildren: 0.06 },
  },
};

const ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

interface QuickActionDefinition {
  icon: LucideIcon;
  labelKey: string;
  route: string;
  shortcut?: string;
}

const QUICK_ACTIONS: QuickActionDefinition[] = [
  { icon: Plus, labelKey: 'home.addPassword', route: '/password' },
  {
    icon: Search,
    labelKey: 'nav.quickSearch',
    route: '/search',
    shortcut: 'Ctrl+Shift+P',
  },
  {
    icon: Zap,
    labelKey: 'home.generatePassword',
    route: '/generator',
  },
  { icon: Bot, labelKey: 'nav.aiImport', route: '/onboard' },
  { icon: Settings, labelKey: 'nav.settings', route: '/settings' },
];

const KEYBOARD_SHORTCUTS = [
  { keys: 'Ctrl+Shift+P', descriptionKey: 'shortcuts.quickSearch' },
  { keys: 'Ctrl+N', descriptionKey: 'shortcuts.newPassword' },
  { keys: 'Ctrl+G', descriptionKey: 'shortcuts.generator' },
  { keys: 'Esc', descriptionKey: 'shortcuts.closeOverlay' },
  { keys: '↑ / ↓', descriptionKey: 'shortcuts.navigateList' },
  { keys: 'Enter', descriptionKey: 'shortcuts.selectCopy' },
] as const;

function computeTimeAgo(
  dateStr: string,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) {
    return t('time.justNow');
  }
  if (hours < 24) {
    return t('time.hoursAgo', { hours });
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return t('time.daysAgo', { days });
  }
  return t('time.weeksAgo', { weeks: Math.floor(days / 7) });
}

interface QuickActionButtonProps {
  action: QuickActionDefinition;
  label: string;
  onNavigate: (route: string) => void;
}

const QuickActionButton = memo(
  ({ action, label, onNavigate }: QuickActionButtonProps) => {
    const Icon = action.icon;
    return (
      <button
        className='flex cursor-pointer items-center gap-3 rounded-md border border-border bg-card px-4 py-3 transition-colors duration-150 hover:border-foreground/30 hover:bg-white'
        type='button'
        onClick={() => {
          onNavigate(action.route);
        }}
      >
        <Icon className='h-4 w-4 text-muted-foreground' />
        <span className='text-sm font-semibold text-foreground'>{label}</span>
        {action.shortcut ? (
          <kbd className='rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary'>
            {action.shortcut}
          </kbd>
        ) : null}
      </button>
    );
  }
);
QuickActionButton.displayName = 'QuickActionButton';

interface RecentPasswordRowProps {
  highlighted: boolean;
  noUsernameLabel: string;
  onOpen: () => void;
  password: Password;
  timeAgo: string | undefined;
}

const RecentPasswordRow = memo(
  ({
    highlighted,
    noUsernameLabel,
    onOpen,
    password,
    timeAgo,
  }: RecentPasswordRowProps) => {
    return (
      <button
        className={`flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-3 text-left transition-colors duration-150 hover:bg-surface ${highlighted ? 'bg-surface' : ''}`}
        type='button'
        onClick={onOpen}
      >
        <div className='flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-card'>
          {password.icon ? (
            <img
              src={password.icon}
              alt={password.title}
              className='h-full w-full object-cover'
            />
          ) : password.url ? (
            <Globe className='h-4 w-4 text-muted-foreground' />
          ) : (
            <Lock className='h-4 w-4 text-muted-foreground' />
          )}
        </div>
        <div className='min-w-0 flex-1'>
          <div className='truncate text-sm font-semibold text-foreground'>
            {password.title}
          </div>
          <div className='truncate text-xs text-muted-foreground'>
            {password.username || noUsernameLabel}
          </div>
        </div>
        {password.isFavorite ? (
          <Star className='h-3.5 w-3.5 shrink-0 fill-current text-clay' />
        ) : null}
        <span className='shrink-0 text-xs text-text-tertiary'>{timeAgo}</span>
      </button>
    );
  }
);
RecentPasswordRow.displayName = 'RecentPasswordRow';

interface InlineInterface {
  description: string;
  keys: string;
}
const KeyboardShortcutRow = memo(({ description, keys }: InlineInterface) => {
  return (
    <div className='flex items-center justify-between gap-4'>
      <kbd className='min-w-[64px] rounded-md border border-border bg-surface px-2.5 py-1 text-center font-mono text-xs text-foreground'>
        {keys}
      </kbd>
      <span className='text-sm text-muted-foreground'>{description}</span>
    </div>
  );
});
KeyboardShortcutRow.displayName = 'KeyboardShortcutRow';

export function HomePage() {
  const { t } = useTranslation();
  const passwords = usePasswordStore(state => state.passwords);
  const navigate = useNavigate();
  const recentPasswords = useMemo(() => passwords.slice(0, 6), [passwords]);
  const favoriteCount = useMemo(
    () => passwords.filter(password => password.isFavorite).length,
    [passwords]
  );
  const totalPasswords = passwords.length;
  const strongPasswordCount = useMemo(
    () => countStrongPasswords(passwords),
    [passwords]
  );
  const timeAgoMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const password of recentPasswords) {
      map.set(password.id, computeTimeAgo(password.created_at, t));
    }
    return map;
  }, [recentPasswords, t]);
  const handleNavigate = useCallback(
    (route: string) => {
      navigate(route);
    },
    [navigate]
  );
  const handleOpenPasswords = useCallback(() => {
    navigate('/password');
  }, [navigate]);
  const noUsernameLabel = t('home.noUsername');
  const localizedActionLabels = useMemo(() => {
    return new Map([
      ['/password', t('home.addPassword')],
      ['/search', t('nav.quickSearch')],
      ['/generator', t('home.generatePassword')],
      ['/onboard', t('nav.aiImport')],
      ['/settings', t('nav.settings')],
    ]);
  }, [t]);

  return (
    <motion.div
      animate='visible'
      className='h-full overflow-y-auto bg-background'
      initial='hidden'
      variants={CONTAINER_VARIANTS}
    >
      <div className='mx-auto max-w-5xl px-10 py-10'>
        <motion.div
          className='mb-10 border-b border-border pb-8'
          variants={ITEM_VARIANTS}
        >
          <p className='mb-3 text-sm font-semibold text-clay'>
            {t('app.name')}
          </p>
          <h1 className='font-heading text-[48px] font-medium leading-tight tracking-tight text-foreground'>
            {t('home.welcome', { name: 'Lucas' })}
          </h1>
          <p className='mt-3 max-w-xl text-base leading-7 text-muted-foreground'>
            {t('home.subtitle')}
          </p>
        </motion.div>

        <motion.div
          className='mb-10 grid grid-cols-3 divide-x divide-border border-y border-border'
          variants={ITEM_VARIANTS}
        >
          <div className='px-6 py-5'>
            <Key className='mb-4 h-5 w-5 text-clay' />
            <div className='font-heading text-4xl font-medium text-foreground'>
              {totalPasswords}
            </div>
            <div className='mt-1 text-sm text-muted-foreground'>
              {t('home.totalPasswords')}
            </div>
          </div>
          <div className='px-6 py-5'>
            <Star className='mb-4 h-5 w-5 text-clay' />
            <div className='font-heading text-4xl font-medium text-foreground'>
              {favoriteCount}
            </div>
            <div className='mt-1 text-sm text-muted-foreground'>
              {t('home.favorites')}
            </div>
          </div>
          <div className='px-6 py-5'>
            <Shield className='mb-4 h-5 w-5 text-clay' />
            <div className='font-heading text-4xl font-medium text-foreground'>
              {strongPasswordCount}
            </div>
            <div className='mt-1 text-sm text-muted-foreground'>
              {t('home.strongPasswords')}
            </div>
          </div>
        </motion.div>

        <motion.div className='mb-10' variants={ITEM_VARIANTS}>
          <h2 className='mb-4 font-heading text-2xl font-medium text-foreground'>
            {t('home.quickActions')}
          </h2>
          <div className='flex flex-wrap gap-3'>
            {QUICK_ACTIONS.map(action => {
              return (
                <QuickActionButton
                  key={action.route}
                  action={action}
                  label={localizedActionLabels.get(action.route) ?? ''}
                  onNavigate={handleNavigate}
                />
              );
            })}
          </div>
        </motion.div>

        <motion.div
          className='grid grid-cols-[1fr_280px] gap-10'
          variants={ITEM_VARIANTS}
        >
          <div>
            <h2 className='mb-4 font-heading text-2xl font-medium text-foreground'>
              {t('home.recentPasswords')}
            </h2>
            <div className='space-y-1 border-y border-border py-2'>
              {recentPasswords.length > 0 ? (
                recentPasswords.map((password, index) => {
                  return (
                    <RecentPasswordRow
                      key={password.id}
                      highlighted={index === 0}
                      noUsernameLabel={noUsernameLabel}
                      password={password}
                      timeAgo={timeAgoMap.get(password.id)}
                      onOpen={handleOpenPasswords}
                    />
                  );
                })
              ) : (
                <div className='flex flex-col items-center py-12 text-muted-foreground'>
                  <Key className='mb-3 h-10 w-10 opacity-30' />
                  <p className='text-sm'>{t('home.noPasswordsYet')}</p>
                  <button
                    className='mt-3 text-sm font-semibold text-clay hover:underline'
                    type='button'
                    onClick={handleOpenPasswords}
                  >
                    {t('home.addFirstPassword')}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className='mb-4 font-heading text-2xl font-medium text-foreground'>
              {t('home.keyboardShortcuts')}
            </h2>
            <div className='space-y-3 rounded-lg border border-border bg-card p-5'>
              {KEYBOARD_SHORTCUTS.map(shortcut => {
                return (
                  <KeyboardShortcutRow
                    key={shortcut.descriptionKey}
                    description={t(shortcut.descriptionKey)}
                    keys={shortcut.keys}
                  />
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
