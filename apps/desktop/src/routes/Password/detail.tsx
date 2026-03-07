import { Copy, Edit,ExternalLink, Eye, EyeOff, FileText, Globe, Lock, Trash2, User } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { usePasswordStore } from '@/store/passwordStore'
import { useStore } from './context'


export function PasswordDetail() {
  const { selectedPassword, deletePassword } = usePasswordStore()
  const { setModal } = useStore()
  const [showPassword, setShowPassword] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  if (!selectedPassword) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <Lock className="h-16 w-16 opacity-30" />
          <p className="text-lg">选择一个密码查看详情</p>
          <span>从左侧列表中选择或创建新密码</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-background/95 backdrop-blur-sm">
      <div className="p-6 border-b border-border/30 flex items-start justify-between bg-card/30">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary overflow-hidden shadow-sm">
            {selectedPassword?.icon ? (
              <img
                src={selectedPassword.icon}
                alt={selectedPassword.title}
                className="w-full h-full object-cover"
              />
            ) : selectedPassword?.url ? (
              <Globe className="h-7 w-7" />
            ) : (
              <Lock className="h-7 w-7" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{selectedPassword?.title}</h1>
            {selectedPassword?.url && (
              <a
                href={selectedPassword.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mt-1 transition-colors duration-200"
              >
                <Globe className="h-3 w-3" />
                {selectedPassword?.url}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 hover:scale-105 active:scale-95"
            onClick={() => { setModal({ type: 'edit-password', password: selectedPassword }); }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200 hover:scale-110 active:scale-95"
            onClick={() => deletePassword(selectedPassword.id)}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div
        className="flex-1 p-8 overflow-y-auto space-y-8"
      >
        <div
          className="space-y-6 max-w-2xl mx-auto"
        >
          <div
            className="space-y-2"
          >
            <label
              className="text-sm font-medium text-muted-foreground flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              用户名
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                type="text"
                value={selectedPassword.username || ''}
                className="flex-1 px-3 py-2 rounded-lg border border-border/50 bg-background/50 text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                className="hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={() => { copyToClipboard(selectedPassword.username || ''); }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div
            className="space-y-2"
          >
            <label
              className="text-sm font-medium text-muted-foreground flex items-center gap-2"
            >
              <Lock className="h-4 w-4" />
              密码
            </label>
            <div className="flex gap-2">
              <input
                readOnly
                type={showPassword ? 'text' : 'password'}
                value={selectedPassword.password}
                className="flex-1 px-3 py-2 rounded-lg border border-border/50 bg-background/50 text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                className="hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={() => { copyToClipboard(selectedPassword.password); }}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hover:scale-105 active:scale-95"
                onClick={() => { setShowPassword(!showPassword); }}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {selectedPassword.notes && (
            <div
              className="space-y-2"
            >
              <label
                className="text-sm font-medium text-muted-foreground flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                备注
              </label>
              <textarea
                readOnly
                value={selectedPassword.notes}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border/50 bg-background/50 text-sm resize-none"
              />
            </div>
          )}
        </div>

        <div
          className="pt-8 border-t border-border/30 space-y-4 text-sm max-w-2xl mx-auto"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                分类
              </span>
              <span className="block text-sm font-medium">
                {selectedPassword.category || '全部'}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                创建于
              </span>
              <span className="block text-sm font-medium">
                {new Date(selectedPassword.created_at).toLocaleString()}
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                更新于
              </span>
              <span className="block text-sm font-medium">
                {new Date(selectedPassword.updated_at).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div >
  )
}
