import { Globe, Lock, Search, Star } from 'lucide-react'
import { Input } from '@repo/ui/primitives/input'
import { cn } from '@repo/ui/lib/utils'
import { usePasswordStore } from '@/store/passwordStore'
import { ButtonAddPassword } from './button-add-password'

export function PasswordList() {
  const {
    filteredPasswords,
    selectedPassword,
    searchQuery,
    setSearchQuery,
    setSelectedPassword,
    toggleFavorite,
  } = usePasswordStore()

  return (
    <div className="w-80 h-full bg-background border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-xl font-bold text-foreground">
            Passwords
          </h2>
          <ButtonAddPassword />
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="Search passwords..."
            value={searchQuery}
            className="w-full pl-9 pr-4 h-9 rounded-lg border-border bg-surface text-sm transition-colors duration-150 focus:border-[var(--accent-blue)] focus:bg-background placeholder:text-text-tertiary"
            onChange={(e) => {
              setSearchQuery(e.target.value)
            }}
          />
        </div>
        <div className="mt-2 text-xs text-text-tertiary">
          {filteredPasswords.length} passwords
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {filteredPasswords.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-8">
            <Lock className="h-10 w-10 opacity-30" />
            <p className="text-sm">No passwords found</p>
          </div>
        ) : (
          <div className="px-2 space-y-0.5">
            {filteredPasswords.map((password) => (
              <div
                key={password.id}
                className={cn(
                  'group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-150',
                  selectedPassword?.id === password.id
                    ? 'bg-selected-bg'
                    : 'hover:bg-accent'
                )}
                onClick={() => {
                  setSelectedPassword(password)
                }}
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 overflow-hidden',
                    selectedPassword?.id === password.id
                      ? 'bg-[#D4EDFA] border-[#D4EDFA]'
                      : 'bg-surface border-border'
                  )}
                >
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
                  <h3 className="font-semibold text-sm truncate text-foreground">
                    {password.title}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {password.username || 'No username'}
                  </p>
                </div>

                {password.isFavorite && (
                  <Star className="h-3.5 w-3.5 text-[var(--accent-yellow)] fill-current shrink-0" />
                )}

                <button
                  className="p-1 rounded-md hover:bg-background transition-colors duration-150 shrink-0 opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleFavorite(password)
                  }}
                >
                  <Star
                    className={cn(
                      'h-3.5 w-3.5 transition-colors duration-150',
                      password.isFavorite
                        ? 'fill-[var(--accent-yellow)] text-[var(--accent-yellow)]'
                        : 'text-muted-foreground hover:text-[var(--accent-yellow)]'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
