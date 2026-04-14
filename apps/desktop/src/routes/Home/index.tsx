import { motion } from 'framer-motion'
import { Globe, Key, Lock, Plus, Search, Star, Zap } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from '@repo/i18n'
import { usePasswordStore } from '@/store/passwordStore'

export function HomePage() {
  const { t } = useTranslation()
  const { passwords, loadPasswords } = usePasswordStore()
  const navigate = useNavigate()

  useEffect(() => {
    loadPasswords()
  }, [loadPasswords])

  const recentPasswords = passwords.slice(0, 6)
  const favoriteCount = passwords.filter((p) => p.isFavorite).length
  const totalPasswords = passwords.length

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.4, staggerChildren: 0.06 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  }

  return (
    <motion.div
      className="h-full overflow-y-auto"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="max-w-4xl mx-auto px-10 py-10">
        {/* Welcome */}
        <motion.div className="mb-10" variants={itemVariants}>
          <h1 className="font-heading text-[42px] font-bold text-foreground leading-tight">
            {t('home.welcome', { name: 'Lucas' })}
          </h1>
          <p className="text-base text-muted-foreground mt-1">
            {t('home.subtitle')}
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-3 gap-5 mb-10"
          variants={itemVariants}
        >
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="text-2xl mb-1">🔑</div>
            <div className="font-heading text-4xl font-bold text-foreground">
              {totalPasswords}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {t('home.totalPasswords')}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-[#FEF9EF] p-5">
            <div className="text-2xl mb-1">⭐</div>
            <div className="font-heading text-4xl font-bold text-foreground">
              {favoriteCount}
            </div>
            <div className="text-sm text-muted-foreground mt-1">{t('home.favorites')}</div>
          </div>
          <div className="rounded-2xl border border-border bg-[#EDF9F0] p-5">
            <div className="text-2xl mb-1">🛡️</div>
            <div className="font-heading text-4xl font-bold text-foreground">
              {Math.round(totalPasswords * 0.85)}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {t('home.strongPasswords')}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div className="mb-10" variants={itemVariants}>
          <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
            {t('home.quickActions')}
          </h2>
          <div className="flex gap-4">
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
            ].map((action) => (
              <button
                key={action.label}
                className="flex items-center gap-3 px-5 py-3 rounded-xl border border-border bg-background hover:bg-accent transition-colors duration-150 cursor-pointer"
                onClick={action.action}
              >
                <action.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {action.label}
                </span>
                {action.shortcut && (
                  <kbd className="font-mono text-[10px] text-text-tertiary bg-surface px-1.5 py-0.5 rounded border border-border">
                    {action.shortcut}
                  </kbd>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Two columns: Recent + Shortcuts */}
        <motion.div
          className="grid grid-cols-[1fr_280px] gap-8"
          variants={itemVariants}
        >
          {/* Recent Passwords */}
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
              {t('home.recentPasswords')}
            </h2>
            <div className="space-y-1">
              {recentPasswords.length > 0 ? (
                recentPasswords.map((password, i) => (
                  <div
                    key={password.id}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors duration-150 hover:bg-surface ${i === 0 ? 'bg-surface' : ''}`}
                    onClick={() => navigate('/password')}
                  >
                    <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0 overflow-hidden">
                      {password.icon ? (
                        <img
                          src={password.icon}
                          alt={password.title}
                          className="w-full h-full object-cover"
                        />
                      ) : password.url ? (
                        <Globe className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {password.title}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {password.username || t('home.noUsername')}
                      </div>
                    </div>
                    {password.isFavorite && (
                      <Star className="h-3.5 w-3.5 text-[var(--accent-yellow)] fill-current shrink-0" />
                    )}
                    <span className="text-xs text-text-tertiary shrink-0">
                      {formatTimeAgo(password.created_at, t)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center py-12 text-muted-foreground">
                  <Key className="h-10 w-10 opacity-30 mb-3" />
                  <p className="text-sm">{t('home.noPasswordsYet')}</p>
                  <button
                    className="mt-3 text-sm text-[var(--accent-blue)] hover:underline"
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
            <h2 className="font-heading text-2xl font-bold text-foreground mb-4">
              {t('home.keyboardShortcuts')}
            </h2>
            <div className="space-y-3">
              {[
                { keys: '⌘ ⇧ P', desc: t('shortcuts.quickSearch') },
                { keys: '⌘ N', desc: t('shortcuts.newPassword') },
                { keys: '⌘ G', desc: t('shortcuts.generator') },
                { keys: 'Esc', desc: t('shortcuts.closeOverlay') },
                { keys: '↑ ↓', desc: t('shortcuts.navigateList') },
                { keys: '↵', desc: t('shortcuts.selectCopy') },
              ].map((sc) => (
                <div
                  key={sc.desc}
                  className="flex items-center justify-between"
                >
                  <kbd className="font-mono text-xs text-foreground bg-surface px-2.5 py-1 rounded-md border border-border min-w-[64px] text-center">
                    {sc.keys}
                  </kbd>
                  <span className="text-sm text-muted-foreground">
                    {sc.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

function formatTimeAgo(dateStr: string, t: (key: string, options?: Record<string, unknown>) => string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const hours = Math.floor(diff / 3600000)
  if (hours < 1) return t('time.justNow')
  if (hours < 24) return t('time.hoursAgo', { hours })
  const days = Math.floor(hours / 24)
  if (days < 7) return t('time.daysAgo', { days })
  return t('time.weeksAgo', { weeks: Math.floor(days / 7) })
}
