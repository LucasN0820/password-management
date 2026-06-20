import { Globe, Lock, Search, Star } from 'lucide-react';
import {
  type KeyboardEvent,
  memo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import type { Password } from '@repo/db';
import { useTranslation } from '@repo/i18n';
import { cn } from '@repo/ui/lib/utils';
import { Input } from '@repo/ui/primitives/input';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  PASSWORD_LIST_VIRTUALIZATION_THRESHOLD,
  shouldVirtualizeList,
} from '@/lib/virtualization';
import { usePasswordStore } from '@/store/passwordStore';
import { ButtonAddPassword } from './button-add-password';

const PASSWORD_ROW_ESTIMATE_PX = 64;

interface PasswordListItemProps {
  isSelected: boolean;
  onSelect: (password: Password) => void;
  onToggleFavorite: (password: Password) => void;
  password: Password;
}

const PasswordListItem = memo(
  ({
    isSelected,
    onSelect,
    onToggleFavorite,
    password,
  }: PasswordListItemProps) => {
    const { t } = useTranslation();
    return (
      <div
        aria-selected={isSelected}
        tabIndex={-1}
        role='option'
        className={cn(
          'group flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition-colors duration-150',
          isSelected ? 'bg-selected-bg' : 'hover:bg-background'
        )}
        onClick={() => {
          onSelect(password);
        }}
      >
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border',
            isSelected
              ? 'border-clay/20 bg-clay-soft'
              : 'border-border bg-background'
          )}
        >
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
          <h3 className='truncate text-sm font-semibold text-foreground'>
            {password.title}
          </h3>
          <p className='truncate text-xs text-muted-foreground'>
            {password.username || t('home.noUsername')}
          </p>
        </div>

        <button
          type='button'
          aria-label={
            password.isFavorite
              ? t('passwords.removeNamedFromFavorites', {
                  title: password.title,
                })
              : t('passwords.addNamedToFavorites', {
                  title: password.title,
                })
          }
          className={cn(
            'shrink-0 rounded-md p-1 transition-colors duration-150 hover:bg-background',
            password.isFavorite
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
          )}
          onClick={event => {
            event.stopPropagation();
            onToggleFavorite(password);
          }}
        >
          <Star
            className={cn(
              'h-3.5 w-3.5 transition-colors duration-150',
              password.isFavorite
                ? 'fill-clay text-clay'
                : 'text-muted-foreground hover:text-clay'
            )}
          />
        </button>
      </div>
    );
  }
);
PasswordListItem.displayName = 'PasswordListItem';

export function PasswordList() {
  const { t } = useTranslation();
  const filteredPasswords = usePasswordStore(state => state.filteredPasswords);
  const selectedPassword = usePasswordStore(state => state.selectedPassword);
  const searchQuery = usePasswordStore(state => state.searchQuery);
  const setSearchQuery = usePasswordStore(state => state.setSearchQuery);
  const setSelectedPassword = usePasswordStore(
    state => state.setSelectedPassword
  );
  const toggleFavorite = usePasswordStore(state => state.toggleFavorite);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const shouldVirtualize = shouldVirtualizeList(
    filteredPasswords.length,
    PASSWORD_LIST_VIRTUALIZATION_THRESHOLD
  );
  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? filteredPasswords.length : 0,
    estimateSize: () => PASSWORD_ROW_ESTIMATE_PX,
    getScrollElement: () => scrollElementRef.current,
    getItemKey: index => filteredPasswords[index]?.id ?? index,
    overscan: 5,
  });

  const handleSelect = useCallback(
    (password: Password) => {
      setSelectedPassword(password);
      scrollElementRef.current?.focus();
    },
    [setSelectedPassword]
  );

  const handleToggleFavorite = useCallback(
    (password: Password) => {
      toggleFavorite(password);
    },
    [toggleFavorite]
  );

  const selectedIndex = selectedPassword
    ? filteredPasswords.findIndex(item => item.id === selectedPassword.id)
    : -1;

  useEffect(() => {
    if (shouldVirtualize && selectedIndex >= 0) {
      virtualizer.scrollToIndex(selectedIndex, { align: 'auto' });
    }
  }, [selectedIndex, shouldVirtualize, virtualizer]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (filteredPasswords.length === 0) {
        return;
      }

      let nextIndex: number;
      switch (event.key) {
        case 'ArrowDown': {
          nextIndex = Math.min(selectedIndex + 1, filteredPasswords.length - 1);

          break;
        }
        case 'ArrowUp': {
          nextIndex = Math.max(selectedIndex - 1, 0);

          break;
        }
        case 'Home': {
          nextIndex = 0;

          break;
        }
        case 'End': {
          nextIndex = filteredPasswords.length - 1;

          break;
        }
        default: {
          return;
        }
      }

      event.preventDefault();
      const nextPassword = filteredPasswords[nextIndex];
      if (nextPassword) {
        setSelectedPassword(nextPassword);
        if (shouldVirtualize) {
          virtualizer.scrollToIndex(nextIndex, { align: 'auto' });
        }
      }
    },
    [
      filteredPasswords,
      selectedIndex,
      setSelectedPassword,
      shouldVirtualize,
      virtualizer,
    ]
  );

  return (
    <div className='flex h-full w-80 flex-col border-r border-border bg-warm/45'>
      <div className='border-b border-border p-4'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='font-heading text-2xl font-medium text-foreground'>
            {t('nav.passwords')}
          </h2>
          <ButtonAddPassword />
        </div>
        <div className='relative'>
          <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            type='text'
            placeholder={t('passwords.searchPlaceholder')}
            value={searchQuery}
            className='h-9 w-full rounded-md border-border bg-background pl-9 pr-4 text-sm transition-colors duration-150 placeholder:text-text-tertiary focus:border-clay focus:bg-background'
            onChange={event => {
              setSearchQuery(event.target.value);
            }}
          />
        </div>
        <div className='mt-3 text-xs font-medium text-muted-foreground'>
          {t('passwords.count', { count: filteredPasswords.length })}
        </div>
      </div>

      <div
        ref={scrollElementRef}
        aria-label={t('passwords.listAriaLabel')}
        className='flex-1 overflow-y-auto py-2 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50'
        role='listbox'
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        {filteredPasswords.length === 0 ? (
          <div className='flex h-full flex-col items-center justify-center gap-3 p-8 text-muted-foreground'>
            <Lock className='h-10 w-10 opacity-30' />
            <p className='text-sm'>{t('passwords.noPasswordsFound')}</p>
          </div>
        ) : shouldVirtualize ? (
          <div
            className='relative mx-2'
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map(virtualRow => {
              const password = filteredPasswords[virtualRow.index];
              if (!password) {
                return null;
              }

              return (
                <div
                  key={password.id}
                  className='absolute left-0 top-0 w-full pb-1'
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <PasswordListItem
                    isSelected={selectedPassword?.id === password.id}
                    password={password}
                    onSelect={handleSelect}
                    onToggleFavorite={handleToggleFavorite}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className='space-y-1 px-2'>
            {filteredPasswords.map(password => {
              return (
                <PasswordListItem
                  key={password.id}
                  isSelected={selectedPassword?.id === password.id}
                  password={password}
                  onSelect={handleSelect}
                  onToggleFavorite={handleToggleFavorite}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
