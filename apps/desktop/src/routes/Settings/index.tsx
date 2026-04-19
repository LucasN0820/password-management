import { Bot, KeyRound, Loader2, Save, ShieldCheck, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, toast } from '@repo/ui'
import type { AiImportKeyStatus } from '../../../electron/preload'

const emptyStatus: AiImportKeyStatus = {
  mode: 'development',
  hasConfiguredKey: false,
}

export default function SettingsPage() {
  const [status, setStatus] = useState<AiImportKeyStatus>(emptyStatus)
  const [keyValue, setKeyValue] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadStatus = async () => {
      try {
        const nextStatus = await window.electronAPI.getAiImportKeyStatus()
        if (!cancelled) {
          setStatus(nextStatus)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void loadStatus()

    return () => {
      cancelled = true
    }
  }, [])

  const handleSave = async () => {
    if (status.mode === 'development') {
      toast({
        title: 'Development mode',
        description: 'AI_IMPORT_KEY is read from your environment in development.',
      })
      return
    }

    setSaving(true)
    try {
      const nextStatus = await window.electronAPI.setAiImportKey(keyValue)
      setStatus(nextStatus)
      setKeyValue('')
      toast({
        title: 'AI import key saved',
        description: 'The production AI import key is now stored for this desktop app.',
      })
    } catch (error) {
      toast({
        title: 'Unable to save key',
        description: error instanceof Error ? error.message : 'Unknown settings error',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleClear = async () => {
    if (status.mode === 'development') {
      toast({
        title: 'Development mode',
        description: 'Unset AI_IMPORT_KEY in your shell or .env.local instead.',
      })
      return
    }

    setSaving(true)
    try {
      const nextStatus = await window.electronAPI.clearAiImportKey()
      setStatus(nextStatus)
      setKeyValue('')
      toast({
        title: 'AI import key removed',
        description: 'The production AI import key was cleared from local settings.',
      })
    } catch (error) {
      toast({
        title: 'Unable to clear key',
        description: error instanceof Error ? error.message : 'Unknown settings error',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-[linear-gradient(180deg,#fff_0%,#faf8f3_100%)]">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 px-10 py-10">
        <section className="rounded-[28px] border border-border bg-white/90 p-8 shadow-sm">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#F4F1FF] px-3 py-1 text-sm font-medium text-[#6B5CE7]">
            <ShieldCheck className="h-4 w-4" />
            Runtime Configuration
          </div>
          <h1 className="font-heading text-[42px] leading-tight text-foreground">
            Configure the AI import key for this desktop app.
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Development builds read <code>AI_IMPORT_KEY</code> from your environment. Production
            builds use the key you save here.
          </p>
        </section>

        <Card className="border-border/80 bg-white/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-[var(--accent-blue)]" />
              AI Import
            </CardTitle>
            <CardDescription>
              This key is used by the AI onboarding flow when it calls Anthropic.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-[#FCFBF8] px-4 py-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading key status
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-border bg-[#FCFBF8] px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        Current mode
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {status.mode === 'development'
                          ? 'Development mode reads AI_IMPORT_KEY from your shell or .env.local.'
                          : 'Production mode reads the key saved in this settings page.'}
                      </div>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-sm text-muted-foreground">
                      {status.mode}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-[#FCFBF8] px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        Key status
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {status.hasConfiguredKey
                          ? 'A key is available for AI import.'
                          : 'No AI import key is configured yet.'}
                      </div>
                    </div>
                    <div
                      className={`rounded-full px-3 py-1 text-sm ${
                        status.hasConfiguredKey
                          ? 'bg-[#EEF8F3] text-[var(--accent-green)]'
                          : 'bg-[#FFF1F1] text-[var(--accent-red)]'
                      }`}
                    >
                      {status.hasConfiguredKey ? 'Configured' : 'Missing'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai-import-key">AI_IMPORT_KEY</Label>
                  <Input
                    disabled={saving || status.mode === 'development'}
                    id="ai-import-key"
                    onChange={event => setKeyValue(event.target.value)}
                    placeholder={
                      status.mode === 'development'
                        ? 'Set AI_IMPORT_KEY in your environment'
                        : 'Paste production AI import key'
                    }
                    type="password"
                    value={keyValue}
                  />
                  <p className="text-sm text-muted-foreground">
                    {status.mode === 'development'
                      ? 'This field is disabled in development because the app reads directly from the environment.'
                      : 'The saved key is stored locally and reused by AI onboarding in packaged builds.'}
                  </p>
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <Button
                    disabled={saving || status.mode === 'development'}
                    onClick={handleClear}
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear Key
                  </Button>
                  <Button
                    disabled={saving || status.mode === 'development' || !keyValue.trim()}
                    onClick={handleSave}
                    type="button"
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Key
                  </Button>
                </div>
              </>
            )}

            <div className="rounded-2xl border border-border bg-[#F7F6F3] px-4 py-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <KeyRound className="h-4 w-4 text-[var(--accent-blue)]" />
                Notes
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Development: export <code>AI_IMPORT_KEY</code> or set it in <code>.env.local</code>.</li>
                <li>Production: save the key here after the app is installed.</li>
                <li>The AI onboarding flow will refuse to run if no key is available.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
