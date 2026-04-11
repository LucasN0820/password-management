import {
  Edit,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Lock,
  Trash2,
  User,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@repo/ui/primitives/button'
import { usePasswordStore } from '@/store/passwordStore'
import { useStore } from './context'

export function PasswordDetail() {
  const { selectedPassword, deletePassword } = usePasswordStore()
  const { setModal } = useStore()
  const [showPassword, setShowPassword] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 1500)
  }

  if (!selectedPassword) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Lock className="h-12 w-12 opacity-20" />
          <p className="text-base font-heading text-xl">
            Select a password to view details
          </p>
          <span className="text-sm text-text-tertiary">
            Choose from the list or create a new one
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-background">
      {/* Header */}
      <div className="px-8 py-6 border-b border-border bg-surface/50 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-surface border border-border flex items-center justify-center overflow-hidden">
            {selectedPassword.icon ? (
              <img
                src={selectedPassword.icon}
                alt={selectedPassword.title}
                className="w-full h-full object-cover"
              />
            ) : selectedPassword.url ? (
              <Globe className="h-6 w-6 text-muted-foreground" />
            ) : (
              <Lock className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">
              {selectedPassword.title}
            </h1>
            {selectedPassword.url && (
              <a
                href={selectedPassword.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--accent-blue)] hover:underline flex items-center gap-1 mt-0.5"
              >
                {selectedPassword.url}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-sm border-border hover:bg-accent transition-colors duration-150"
            onClick={() => {
              setModal({ type: 'edit-password', password: selectedPassword })
            }}
          >
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 border-border text-destructive hover:bg-destructive/10 transition-colors duration-150"
            onClick={() => deletePassword(selectedPassword.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Fields */}
      <div className="flex-1 px-8 py-8 overflow-y-auto">
        <div className="max-w-2xl space-y-6">
          {/* Username */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              Username
            </label>
            <div className="flex gap-2">
              <div className="flex-1 px-3.5 py-2.5 rounded-lg bg-surface text-sm text-foreground">
                {selectedPassword.username || '—'}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="px-3 border-border hover:bg-primary hover:text-primary-foreground transition-colors duration-150"
                onClick={() => {
                  copyToClipboard(selectedPassword.username || '', 'username')
                }}
              >
                {copiedField === 'username' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              Password
            </label>
            <div className="flex gap-2">
              <div className="flex-1 px-3.5 py-2.5 rounded-lg bg-surface text-sm font-mono text-foreground">
                {showPassword
                  ? selectedPassword.password
                  : '••••••••••••'}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="px-3 border-border transition-colors duration-150"
                onClick={() => {
                  setShowPassword(!showPassword)
                }}
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="px-3 border-border hover:bg-primary hover:text-primary-foreground transition-colors duration-150"
                onClick={() => {
                  copyToClipboard(selectedPassword.password, 'password')
                }}
              >
                {copiedField === 'password' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* URL */}
          {selectedPassword.url && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5" />
                URL
              </label>
              <div className="px-3.5 py-2.5 rounded-lg bg-surface text-sm">
                <a
                  href={selectedPassword.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent-blue)] hover:underline"
                >
                  {selectedPassword.url}
                </a>
              </div>
            </div>
          )}

          {/* Notes */}
          {selectedPassword.notes && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Notes
              </label>
              <div className="px-3.5 py-2.5 rounded-lg bg-surface text-sm text-foreground min-h-[60px] whitespace-pre-wrap">
                {selectedPassword.notes}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-6 border-t border-border">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-text-tertiary">Created</span>
                <p className="text-foreground mt-0.5">
                  {new Date(selectedPassword.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className="text-xs text-text-tertiary">Updated</span>
                <p className="text-foreground mt-0.5">
                  {new Date(selectedPassword.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom hint bar */}
      <div className="px-8 py-2.5 border-t border-border bg-surface/50 flex items-center gap-4 text-xs text-text-tertiary font-mono">
        <span>↑↓ Navigate</span>
        <span>↵ Copy</span>
        <span>Esc Close</span>
      </div>
    </div>
  )
}
