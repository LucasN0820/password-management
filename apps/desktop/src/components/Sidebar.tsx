import { usePasswordStore } from '../store/passwordStore'
import { Button } from '@/components/ui/button'
import { Plus, Key, Star, Shield, Settings, Hash, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const categoryIcons: Record<string, React.ReactNode> = {
  all: <Shield className="h-4 w-4" />,
  favorites: <Star className="h-4 w-4" />,
}

const categoryLabels: Record<string, string> = {
  all: '全部密码',
  favorites: '收藏夹',
}

export default function Sidebar() {
  const { categories, selectedCategory, setSelectedCategory, passwords } = usePasswordStore()

  const passwordCount = passwords.length
  const favoriteCount = passwords.filter(p => p.favorite === 1).length

  const getCategoryCount = (cat: string) => {
    if (cat === 'all') return passwordCount
    if (cat === 'favorites') return favoriteCount
    return passwords.filter(p => p.category === cat).length
  }

  const allCategories = ['all', 'favorites', ...categories.filter(c => c !== 'all')]

  return (
    <aside className="w-64 h-full bg-card border-r flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <Shield className="h-5 w-5 text-primary" />
          <span>密码管家</span>
        </div>
      </div>

      <div className="p-4">
        <Button className="w-full justify-start gap-2">
          <Plus className="h-4 w-4" />
          <span>新建密码</span>
        </Button>
      </div>

      <nav className="flex-1 px-4 py-2 space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            分类
          </span>
          <ul className="space-y-1">
            {allCategories.map((category) => (
              <li key={category}>
                <button
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    selectedCategory === category
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  )}
                  onClick={() => setSelectedCategory(category)}
                >
                  <span className="shrink-0">
                    {categoryIcons[category] || <Hash className="h-4 w-4" />}
                  </span>
                  <span className="flex-1 text-left">
                    {categoryLabels[category] || category}
                  </span>
                  <span className="text-xs opacity-70">{getCategoryCount(category)}</span>
                  <ChevronRight className="h-3 w-3 opacity-50" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            工具
          </span>
          <ul className="space-y-1">
            <li>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground">
                <Key className="h-4 w-4" />
                <span>密码生成器</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <div className="p-4 border-t">
        <Button variant="ghost" className="w-full justify-start gap-2">
          <Settings className="h-4 w-4" />
          <span>设置</span>
        </Button>
      </div>
    </aside>
  )
}
