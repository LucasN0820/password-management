import { Bot, KeyRound, ShieldCheck } from 'lucide-react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, toast } from '@repo/ui'

export default function SettingsPage() {
  const handleOpenServiceDocs = () => {
    toast({
      title: 'AI Import Service',
      description: 'Configure AI_IMPORT_SERVICE_URL and AI_IMPORT_SERVICE_API_KEY in your environment.',
    })
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
            Settings
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Configure your password manager settings.
          </p>
        </section>

        <Card className="border-border/80 bg-white/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-[var(--accent-blue)]" />
              AI Import Service
            </CardTitle>
            <CardDescription>
              The AI import service configuration is read from environment variables.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-2xl border border-border bg-[#F7F6F3] px-4 py-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <KeyRound className="h-4 w-4 text-[var(--accent-blue)]" />
                Environment Variables
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <code>AI_IMPORT_SERVICE_URL</code> — Service endpoint (e.g., http://localhost:3001)
                </li>
                <li>
                  <code>AI_IMPORT_SERVICE_API_KEY</code> — Shared API key for authentication
                </li>
              </ul>
            </div>

            <Button onClick={handleOpenServiceDocs} type="button">
              How to Configure
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
