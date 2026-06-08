import { motion } from 'framer-motion';
import {
  Bot,
  Globe,
  Key,
  Lock,
  Plus,
  Search,
  Settings,
  Shield,
  Star,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from '@repo/i18n';
import { usePasswordStore } from '@/store/passwordStore';

function computeTimeAgo(
  dateStr: string,
  t: (key: string, options?: Record<string, unknown>) => string
): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return t('time.justNow');
  if (hours < 24) return t('time.hoursAgo', { hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t('time.daysAgo', { days });
  return t('time.weeksAgo', { weeks: Math.floor(days / 7) });
}

export function HomePage() {
  const { t } = useTranslation();
  const { passwords, loadPasswords } = usePasswordStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadPasswords();
  }, [loadPasswords]);

  const recentPasswords = useMemo(() => passwords.slice(0, 6), [passwords]);
  const favoriteCount = passwords.filter(p => p.isFavorite).length;
  const totalPasswords = passwords.length;

  const timeAgoMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const password of recentPasswords) {
      map.set(password.id, computeTimeAgo(password.created_at, t));
    }
    return map;
  }, [recentPasswords, t]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4, staggerChildren: 0.06 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      className='h-full overflow-y-auto bg-background'
      initial='hidden'
      animate='visible'
      variants={containerVariants}
    >
      <div className='mx-auto max-w-5xl px-10 py-10'>
        {/* Welcome */}
        <motion.div
          className='mb-10 border-b border-border pb-8'
          variants={itemVariants}
        >
          <p className='mb-3 text-sm font-semibold text-clay'>Vault</p>
          <h1 className='font-heading text-[48px] font-medium leading-tight tracking-tight text-foreground'>
            {t('home.welcome', { name: 'Lucas' })}
          </h1>
          <p className='mt-3 max-w-xl text-base leading-7 text-muted-foreground'>
            {t('home.subtitle')}
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className='mb-10 grid grid-cols-3 divide-x divide-border border-y border-border'
          variants={itemVariants}
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
              {Math.round(totalPasswords * 0.85)}
            </div>
            <div className='mt-1 text-sm text-muted-foreground'>
              {t('home.strongPasswords')}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div className='mb-10' variants={itemVariants}>
          <h2 className='mb-4 font-heading text-2xl font-medium text-foreground'>
            {t('home.quickActions')}
          </h2>
          <div className='flex flex-wrap gap-3'>
            {[
              {
                icon: Plus,
                label: t('home.addPassword'),
                action: () => navigate('/password'),
              },
              {
                icon: Search,
                label: t('nav.quickSearch'),
                shortcut: '⌘⇧P',
                action: () => navigate('/search'),
              },
              {
                icon: Zap,
                label: t('home.generatePassword'),
                action: () => navigate('/generator'),
              },
              {
                icon: Bot,
                label: 'AI Import',
                action: () => navigate('/onboard'),
              },
              {
                icon: Settings,
                label: 'Settings',
                action: () => navigate('/settings'),
              },
            ].map(action => (
              <button
                key={action.label}
                className='flex cursor-pointer items-center gap-3 rounded-md border border-border bg-card px-4 py-3 transition-colors duration-150 hover:border-foreground/30 hover:bg-white'
                onClick={action.action}
              >
                <action.icon className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm font-semibold text-foreground'>
                  {action.label}
                </span>
                {action.shortcut && (
                  <kbd className='rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary'>
                    {action.shortcut}
                  </kbd>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Two columns: Recent + Shortcuts */}
        <motion.div
          className='grid grid-cols-[1fr_280px] gap-10'
          variants={itemVariants}
        >
          {/* Recent Passwords */}
          <div>
            <h2 className='mb-4 font-heading text-2xl font-medium text-foreground'>
              {t('home.recentPasswords')}
            </h2>
            <div className='space-y-1 border-y border-border py-2'>
              {recentPasswords.length > 0 ? (
                recentPasswords.map((password, i) => (
                  <div
                    key={password.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-3 transition-colors duration-150 hover:bg-surface ${i === 0 ? 'bg-surface' : ''}`}
                    onClick={() => navigate('/password')}
                  >
                    <div className='flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-card'>
                      {password.icon ? (
                        <img
                          src={password.icon}
                          alt={password.title}
                          className='w-full h-full object-cover'
                        />
                      ) : password.url ? (
                        <Globe className='h-4 w-4 text-muted-foreground' />
                      ) : (
                        <Lock className='h-4 w-4 text-muted-foreground' />
                      )}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='truncate text-sm font-semibold text-foreground'>
                        {password.title}
                      </div>
                      <div className='truncate text-xs text-muted-foreground'>
                        {password.username || t('home.noUsername')}
                      </div>
                    </div>
                    {password.isFavorite && (
                      <Star className='h-3.5 w-3.5 shrink-0 fill-current text-clay' />
                    )}
                    <span className='text-xs text-text-tertiary shrink-0'>
                      {timeAgoMap.get(password.id)}
                    </span>
                  </div>
                ))
              ) : (
                <div className='flex flex-col items-center py-12 text-muted-foreground'>
                  <Key className='h-10 w-10 opacity-30 mb-3' />
                  <p className='text-sm'>{t('home.noPasswordsYet')}</p>
                  <button
                    className='mt-3 text-sm font-semibold text-clay hover:underline'
                    onClick={() => navigate('/password')}
                  >
                    {t('home.addFirstPassword')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div>
            <h2 className='mb-4 font-heading text-2xl font-medium text-foreground'>
              {t('home.keyboardShortcuts')}
            </h2>
            <div className='space-y-3 rounded-lg border border-border bg-card p-5'>
              {[
                { keys: '⌘ ⇧ P', desc: t('shortcuts.quickSearch') },
                { keys: '⌘ N', desc: t('shortcuts.newPassword') },
                { keys: '⌘ G', desc: t('shortcuts.generator') },
                { keys: 'Esc', desc: t('shortcuts.closeOverlay') },
                { keys: '↑ ↓', desc: t('shortcuts.navigateList') },
                { keys: '↵', desc: t('shortcuts.selectCopy') },
              ].map(sc => (
                <div
                  key={sc.desc}
                  className='flex items-center justify-between gap-4'
                >
                  <kbd className='min-w-[64px] rounded-md border border-border bg-surface px-2.5 py-1 text-center font-mono text-xs text-foreground'>
                    {sc.keys}
                  </kbd>
                  <span className='text-sm text-muted-foreground'>
                    {sc.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
