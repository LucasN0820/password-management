import { Search, Star, Globe, Lock } from 'lucide-react'
import { usePasswordStore } from '@/store/passwordStore'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { ButtonAddPassword } from './button-add-password'

export function PasswordList() {
  const {
    filteredPasswords,
    selectedPassword,
    searchQuery,
    setSearchQuery,
    setSelectedPassword,
    toggleFavorite
  } = usePasswordStore()

  return (
    <div className="w-80 h-full bg-background border-r border-border/50 flex flex-col">
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="搜索密码..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 h-10 rounded-lg border-border/50 bg-background/50 backdrop-blur-sm text-sm transition-all duration-200 focus:border-border focus:bg-background focus:shadow-sm placeholder:text-muted-foreground/60"
            />
          </div>
          <ButtonAddPassword />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredPasswords.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground p-8">
            <Lock className="h-12 w-12 opacity-30" />
            <p className="text-sm font-medium">暂无密码记录</p>
            <span className="text-xs">点击上方"添加密码"按钮添加</span>
          </div>
        ) : (
          <ul className="divide-y divide-border/20">
            {filteredPasswords.map((password) => (
              <li key={password.id}>
                <div
                  className={cn(
                    "group flex items-center gap-3 px-3 py-3 cursor-pointer transition-all duration-200",
                    "hover:bg-accent/50 hover:shadow-sm",
                    selectedPassword?.id === password.id
                      ? "bg-accent border-l-2 border-primary"
                      : "border-l-2 border-transparent hover:border-primary/30"
                  )}
                  onClick={() => setSelectedPassword(password)}
                >
                  <div className="w-10 h-10 rounded-lg border border-border/40 bg-card/50 backdrop-blur-sm flex items-center justify-center text-muted-foreground shrink-0 overflow-hidden transition-all duration-200 group-hover:border-border group-hover:shadow-md">
                    {password.icon ? (
                      <img
                        src={password.icon}
                        alt={password.title}
                        className="w-full h-full object-cover"
                      />
                    ) : password.url ? (
                      <Globe className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                    ) : (
                      <Lock className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate mb-0.5 group-hover:text-foreground transition-colors duration-200">
                      {password.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate group-hover:text-muted-foreground/80 transition-colors duration-200">
                      {password.username || '无用户名'}
                    </p>
                  </div>

                  {password.favorite === 1 && (
                    <div className="shrink-0">
                      <Star className="h-3.5 w-3.5 fill-primary text-primary opacity-70" />
                    </div>
                  )}

                  <button
                    className="p-1.5 rounded-lg hover:bg-background/80 transition-all duration-200 shrink-0 opacity-0 group-hover:opacity-100 hover:scale-105"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(password)
                    }}
                  >
                    <Star
                      className={cn(
                        "h-4 w-4 transition-all duration-300",
                        password.favorite === 1
                          ? "fill-primary text-primary"
                          : "text-muted-foreground hover:text-primary"
                      )}
                    />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
