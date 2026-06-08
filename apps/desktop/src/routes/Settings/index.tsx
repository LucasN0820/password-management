import { Bot, KeyRound, ShieldCheck } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  toast,
} from '@repo/ui';

export default function SettingsPage() {
  const handleOpenServiceDocs = () => {
    toast({
      title: 'AI Import Service',
      description:
        'Configure AI_IMPORT_SERVICE_URL, AI_IMPORT_SERVICE_SECRET, and DEEPSEEK_API_KEY in your environment.',
    });
  };

  return (
    <div className='h-full overflow-y-auto bg-background'>
      <div className='mx-auto flex max-w-4xl flex-col gap-6 px-10 py-10'>
        <section className='border-b border-border pb-8'>
          <div className='mb-4 inline-flex items-center gap-2 rounded-full border border-clay/25 bg-clay-soft px-3 py-1 text-sm font-semibold text-clay'>
            <ShieldCheck className='h-4 w-4' />
            Runtime Configuration
          </div>
          <h1 className='font-heading text-[48px] font-medium leading-tight tracking-tight text-foreground'>
            Settings
          </h1>
          <p className='mt-3 max-w-2xl text-base text-muted-foreground'>
            Configure your password manager settings.
          </p>
        </section>

        <Card className='rounded-lg border-border bg-card'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Bot className='h-5 w-5 text-clay' />
              AI Import Service
            </CardTitle>
            <CardDescription>
              The AI import service configuration is read from environment
              variables.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='rounded-lg border border-border bg-surface px-4 py-4'>
              <div className='mb-2 flex items-center gap-2 text-sm font-semibold text-foreground'>
                <KeyRound className='h-4 w-4 text-clay' />
                Environment Variables
              </div>
              <ul className='space-y-2 text-sm text-muted-foreground'>
                <li>
                  <code>AI_IMPORT_SERVICE_URL</code> - Service endpoint (e.g.,
                  http://localhost:3001)
                </li>
                <li>
                  <code>AI_IMPORT_SERVICE_SECRET</code> - Shared secret for
                  desktop-to-service authentication
                </li>
                <li>
                  <code>DEEPSEEK_API_KEY</code> - DeepSeek key used by the
                  import service
                </li>
              </ul>
            </div>

            <Button onClick={handleOpenServiceDocs} type='button'>
              How to Configure
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
