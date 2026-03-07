import { Globe, Lock, Search, Star, X } from 'lucide-react'
import { useCallback, useEffect, useRef,useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { Password } from '../App'
import { usePasswordStore } from '../store/passwordStore'

export default function SpotlightSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Password[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { passwords } = usePasswordStore()

  const searchPasswords = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(passwords)

      return
    }

    try {
      const searchResults = await window.electronAPI.searchPasswords(searchQuery)

      setResults(searchResults)
    } catch (error) {
      console.error('Search failed:', error)
      setResults(passwords)
    }
  }, [passwords])

  useEffect(() => {
    searchPasswords('')
    inputRef.current?.focus()
  }, [searchPasswords])

  useEffect(() => {
    searchPasswords(query)
  }, [query, searchPasswords])

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  // Auto scroll to selected item
  useEffect(() => {
    if (results.length > 0 && selectedIndex >= 0) {
      const selectedItem = document.querySelector(`[data-selected-index="${selectedIndex}"]`)

      if (selectedItem) {
        selectedItem.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        })
      }
    }
  }, [selectedIndex, results])

  const handleSelect = useCallback((password: Password) => {
    navigator.clipboard.writeText(password.password).then(() => {
      window.close()
    }).catch(error => {
      console.error('Failed to copy password:', error)
    })
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault()
        if (results.length > 0) {
          setSelectedIndex(prev => (prev + 1) % results.length)
        }
        break
      }
      case 'ArrowUp': {
        e.preventDefault()
        if (results.length > 0) {
          setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
        }
        break
      }
      case 'Enter': {
        e.preventDefault()
        if (results.length > 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        }
        break
      }
      case 'Escape': {
        window.close()
        break
      }
    }
  }, [results, selectedIndex, handleSelect])

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // 只处理导航相关的键
      if (['ArrowUp', 'ArrowDown', 'Enter', 'Escape'].includes(e.key)) {
        handleKeyDown(e)
      }
    }

    // 在document上监听键盘事件
    document.addEventListener('keydown', handleGlobalKeyDown)

    /**
     * 清理函数.
     */
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [handleKeyDown])

  const onClose = () => {
    window.close()
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (results.length > 0 && results[selectedIndex]) {
      handleSelect(results[selectedIndex])
    }
  }

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex justify-center items-start pt-14 z-5">
      <div className="w-full max-w-lg mx-4 rounded-lg border bg-popover shadow-lg">
        <form onSubmit={handleFormSubmit}>
          <div className="flex items-center gap-3 p-4 border-b">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              autoFocus
              type="text"
              placeholder="搜索密码..."
              value={query}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 flex-1"
              ref={inputRef}
              onChange={(e) => { setQuery(e.target.value); }}
            />
            <Button variant="ghost" size="icon" type="button" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </form>

        {(query || results.length > 0) && (
          <div className="max-h-96 overflow-y-scroll search-scrollbar">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Lock className="h-8 w-8 opacity-30 mb-2" />
                <p>{query ? '未找到匹配的密码' : '暂无密码记录'}</p>
              </div>
            ) : (
              <ul className="divide-y">
                {results.map((password: Password, index: number) => 
                  { return <li
                    key={password.id}
                    data-selected-index={index}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-accent/50",
                      selectedIndex === index ? "bg-accent" : ""
                    )}
                    onClick={() => { handleSelect(password); }}
                  >
                    <div className="w-8 h-8 rounded-md border border-border bg-card flex items-center justify-center text-muted-foreground shrink-0 overflow-hidden">
                      {password.icon ? (
                        <img
                          src={password.icon}
                          alt={password.title}
                          className="w-full h-full object-cover"
                        />
                      ) : password.url ? (
                        <Globe className="h-4 w-4" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-foreground truncate">{password.title}</h4>
                        {password.favorite === 1 && (
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{password.username || '无用户名'}</p>
                    </div>
                  </li> }
                )}
              </ul>
            )}
          </div>
        )}

        <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>↑↓ 导航</span>
            <span>Enter 复制密码</span>
            {results.length > 0 && (
              <span>{results.length} 个密码</span>
            )}
          </div>
          <span>Esc 关闭</span>
        </div>
      </div>
    </div>
  )
}
