import { Globe, Lock, Search, Star } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';
import { Input } from '@repo/ui/primitives/input';
import { usePasswordStore } from '@/store/passwordStore';
import { ButtonAddPassword } from './button-add-password';

export function PasswordList() {
  const {
    filteredPasswords,
    selectedPassword,
    searchQuery,
    setSearchQuery,
    setSelectedPassword,
    toggleFavorite,
  } = usePasswordStore();

  return (
    <div className='flex h-full w-80 flex-col border-r border-border bg-warm/45'>
      <div className='border-b border-border p-4'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='font-heading text-2xl font-medium text-foreground'>
            Passwords
          </h2>
          <ButtonAddPassword />
        </div>
        <div className='relative'>
          <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            type='text'
            placeholder='Search passwords...'
            value={searchQuery}
            className='h-9 w-full rounded-md border-border bg-background pl-9 pr-4 text-sm transition-colors duration-150 placeholder:text-text-tertiary focus:border-clay focus:bg-background'
            onChange={e => {
              setSearchQuery(e.target.value);
            }}
          />
        </div>
        <div className='mt-3 text-xs font-medium text-muted-foreground'>
          {filteredPasswords.length} passwords
        </div>
      </div>

      <div className='flex-1 overflow-y-auto py-2'>
        {filteredPasswords.length === 0 ? (
          <div className='flex h-full flex-col items-center justify-center gap-3 p-8 text-muted-foreground'>
            <Lock className='h-10 w-10 opacity-30' />
            <p className='text-sm'>No passwords found</p>
          </div>
        ) : (
          <div className='space-y-1 px-2'>
            {filteredPasswords.map(password => 
              { return <div
                key={password.id}
                className={cn(
                  'group flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition-colors duration-150',
                  selectedPassword?.id === password.id
                    ? 'bg-selected-bg'
                    : 'hover:bg-background'
                )}
                onClick={() => {
                  setSelectedPassword(password);
                }}
              >
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border',
                    selectedPassword?.id === password.id
                      ? 'border-clay/20 bg-clay-soft'
                      : 'border-border bg-background'
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
                  <h3 className='truncate text-sm font-semibold text-foreground'>
                    {password.title}
                  </h3>
                  <p className='truncate text-xs text-muted-foreground'>
                    {password.username || 'No username'}
                  </p>
                </div>

                {password.isFavorite && (
                  <Star className='h-3.5 w-3.5 shrink-0 fill-current text-clay' />
                )}

                <button
                  className='shrink-0 rounded-md p-1 opacity-0 transition-colors duration-150 hover:bg-background group-hover:opacity-100'
                  onClick={e => {
                    e.stopPropagation();
                    toggleFavorite(password);
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
              </div> }
            )}
          </div>
        )}
      </div>
    </div>
  );
}
