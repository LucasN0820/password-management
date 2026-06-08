import { Globe, Lock, Search, Star } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@repo/ui/lib/utils';
import type { Password } from '@repo/db';
import { useTranslation } from '@repo/i18n';
import { usePasswordStore } from '../store/passwordStore';

export default function SpotlightSearch() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Password[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { passwords, searchPasswords: storeSearch } = usePasswordStore();

  const searchPasswords = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults(passwords);
        return;
      }
      try {
        await storeSearch(searchQuery);
        const { filteredPasswords } = usePasswordStore.getState();
        setResults(filteredPasswords);
      } catch {
        setResults(passwords);
      }
    },
    [passwords, storeSearch]
  );

  useEffect(() => {
    searchPasswords('');
    inputRef.current?.focus();
  }, [searchPasswords]);

  useEffect(() => {
    searchPasswords(query);
  }, [query, searchPasswords]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  useEffect(() => {
    if (results.length > 0 && selectedIndex >= 0) {
      const el = document.querySelector(
        `[data-selected-index="${selectedIndex}"]`
      );
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedIndex, results]);

  const handleSelect = useCallback((password: Password) => {
    navigator.clipboard
      .writeText(password.password)
      .then(() => window.close())
      .catch(console.error);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (results.length > 0)
            setSelectedIndex(prev => (prev + 1) % results.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (results.length > 0)
            setSelectedIndex(
              prev => (prev - 1 + results.length) % results.length
            );
          break;
        case 'Enter':
          e.preventDefault();
          if (results.length > 0 && results[selectedIndex])
            handleSelect(results[selectedIndex]);
          break;
        case 'Escape':
          window.close();
          break;
      }
    },
    [results, selectedIndex, handleSelect]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key))
        handleKeyDown(e);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleKeyDown]);

  return (
    <div className='pointer-events-none fixed inset-0 z-50 flex items-start justify-center pt-[160px]'>
      <div className='mx-4 w-full max-w-[640px] overflow-hidden rounded-lg border border-border bg-background shadow-2xl'>
        {/* Search Input */}
        <div className='pointer-events-auto flex items-center gap-3 border-b border-border px-5 py-4'>
          <Search className='h-5 w-5 shrink-0 text-muted-foreground' />
          <input
            autoFocus
            ref={inputRef}
            type='text'
            placeholder={t('spotlight.searchPlaceholder')}
            value={query}
            className='flex-1 bg-transparent text-lg text-foreground placeholder:text-text-tertiary outline-none'
            onChange={e => setQuery(e.target.value)}
          />
          <kbd className='shrink-0 rounded-md border border-border bg-surface px-2 py-1 font-mono text-[10px] text-muted-foreground'>
            Esc
          </kbd>
        </div>

        {/* Results */}
        {(query || results.length > 0) && (
          <div className='pointer-events-auto max-h-[360px] overflow-y-auto px-2 py-2'>
            {results.length === 0 ? (
              <div className='flex flex-col items-center py-10 text-muted-foreground'>
                <Lock className='h-8 w-8 opacity-20 mb-2' />
                <p className='text-sm'>
                  {query
                    ? t('spotlight.noMatchingPasswords')
                    : t('spotlight.noPasswordsYet')}
                </p>
              </div>
            ) : (
              <div className='space-y-0.5'>
                {results.map((password, index) => (
                  <div
                    key={password.id}
                    data-selected-index={index}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-md px-4 py-3 transition-colors duration-100',
                      selectedIndex === index
                        ? 'bg-selected-bg'
                        : 'hover:bg-accent'
                    )}
                    onClick={() => handleSelect(password)}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md',
                        selectedIndex === index ? 'bg-clay-soft' : 'bg-surface'
                      )}
                    >
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
                      <div className='text-sm font-semibold text-foreground truncate'>
                        {password.title}
                      </div>
                      <div className='text-xs text-muted-foreground truncate'>
                        {password.username || t('home.noUsername')}
                      </div>
                    </div>
                    {password.isFavorite && (
                      <Star className='h-3.5 w-3.5 shrink-0 fill-current text-clay' />
                    )}
                    {selectedIndex === index && (
                      <kbd className='shrink-0 rounded-md bg-ink px-2 py-0.5 font-mono text-[10px] text-white'>
                        ↵ Copy
                      </kbd>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom Bar */}
        <div className='pointer-events-auto flex items-center justify-between border-t border-border bg-surface px-5 py-2.5 font-mono text-xs text-muted-foreground'>
          <div className='flex items-center gap-4'>
            <span className='flex items-center gap-1.5'>
              <kbd className='bg-background px-1.5 py-0.5 rounded border border-border text-foreground'>
                ↑↓
              </kbd>
              {t('spotlight.navigate')}
            </span>
            <span className='flex items-center gap-1.5'>
              <kbd className='bg-background px-1.5 py-0.5 rounded border border-border text-foreground'>
                ↵
              </kbd>
              {t('spotlight.copyPassword')}
            </span>
            <span className='flex items-center gap-1.5'>
              <kbd className='bg-background px-1.5 py-0.5 rounded border border-border text-foreground'>
                Esc
              </kbd>
              {t('spotlight.close')}
            </span>
          </div>
          {results.length > 0 && (
            <span className='text-text-tertiary'>
              {results.length} passwords
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
