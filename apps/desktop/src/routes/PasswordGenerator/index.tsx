import { Check, Copy, RefreshCw, Save } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@repo/ui/primitives/button';
import { Input } from '@repo/ui/primitives/input';
import { Label } from '@repo/ui/primitives/label';
import { Slider } from '@repo/ui/primitives/slider';
import { Switch } from '@repo/ui/primitives/switch';
import { useToast } from '@repo/ui/hooks/use-toast';
import { useTranslation } from '@repo/i18n';
import { usePasswordStore } from '@/store/passwordStore';

interface GeneratorSettings {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeSimilar: boolean;
}

export function PasswordGeneratorPage() {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [strength, setStrength] = useState(0);
  const [showSave, setShowSave] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveUsername, setSaveUsername] = useState('');
  const [saveUrl, setSaveUrl] = useState('');
  const [saveNotes, setSaveNotes] = useState('');
  const { toast } = useToast();
  const { addPassword } = usePasswordStore();

  const [settings, setSettings] = useState<GeneratorSettings>({
    length: 16,
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSymbols: true,
    excludeSimilar: false,
  });

  const calculateStrength = useCallback((pwd: string) => {
    if (!pwd) return 0;
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (pwd.length >= 12) score += 25;
    if (pwd.length >= 16) score += 25;
    if (/[a-z]/.test(pwd)) score += 10;
    if (/[A-Z]/.test(pwd)) score += 10;
    if (/\d/.test(pwd)) score += 10;
    if (/[^a-z0-9]/i.test(pwd)) score += 15;
    return Math.min(100, score);
  }, []);

  const generatePassword = useCallback(() => {
    let charset = '';
    if (settings.includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (settings.includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (settings.includeNumbers) charset += '0123456789';
    if (settings.includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    if (settings.excludeSimilar) charset = charset.replaceAll(/[il1o0]/gi, '');

    if (!charset) {
      toast({
        title: t('toast.error'),
        description: t('generator.selectAtLeastOne'),
        variant: 'destructive',
      });
      return;
    }

    let pwd = '';
    for (let i = 0; i < settings.length; i++) {
      pwd += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setPassword(pwd);
    setStrength(calculateStrength(pwd));
  }, [settings, calculateStrength, toast]);

  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  const copyToClipboard = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    toast({
      title: t('generator.copied'),
      description: t('generator.copiedToClipboard'),
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const savePassword = async () => {
    if (!password) return;
    await addPassword({
      title: saveTitle || `Generated ${new Date().toLocaleDateString()}`,
      username: saveUsername,
      password,
      url: saveUrl,
      notes: saveNotes,
      category: 'all',
      isFavorite: false,
      icon: '',
    });
    toast({ title: t('toast.saved'), description: t('generator.saved') });
    setShowSave(false);
    setSaveTitle('');
    setSaveUsername('');
    setSaveUrl('');
    setSaveNotes('');
  };

  const strengthColor =
    strength >= 80
      ? 'var(--clay)'
      : strength >= 50
        ? 'var(--accent-yellow)'
        : 'var(--accent-red)';
  const strengthText =
    strength >= 80
      ? t('generator.veryStrong')
      : strength >= 60
        ? t('generator.strong')
        : strength >= 40
          ? t('generator.medium')
          : t('generator.weak');

  return (
    <div className='h-full overflow-y-auto bg-background'>
      <div className='mx-auto max-w-5xl px-10 py-10'>
        {/* Header */}
        <p className='mb-3 text-sm font-semibold text-clay'>Generator</p>
        <h1 className='mb-2 font-heading text-5xl font-medium tracking-tight text-foreground'>
          {t('generator.title')}
        </h1>
        <p className='mb-8 max-w-xl text-base leading-7 text-muted-foreground'>
          {t('generator.subtitle')}
        </p>

        <div className='grid grid-cols-[1fr_380px] gap-8'>
          {/* Left Column: Generator + Settings */}
          <div className='space-y-6'>
            {/* Generated Password Card */}
            <div className='rounded-lg border border-border bg-card p-6'>
              <div className='mb-5 break-all font-mono text-2xl font-medium leading-relaxed tracking-wider text-foreground'>
                {password || t('generator.placeholder')}
              </div>

              {/* Strength Bar */}
              <div className='mb-2'>
                <div className='h-1.5 overflow-hidden rounded-full bg-border'>
                  <div
                    className='h-full rounded-full transition-all duration-300'
                    style={{
                      width: `${strength}%`,
                      backgroundColor: strengthColor,
                    }}
                  />
                </div>
              </div>
              <div
                className='text-xs font-semibold'
                style={{ color: strengthColor }}
              >
                {strengthText}
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-3'>
              <Button
                className='bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150'
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className='h-4 w-4 mr-2' />
                ) : (
                  <Copy className='h-4 w-4 mr-2' />
                )}
                {copied ? t('generator.copied') : t('generator.copy')}
              </Button>
              <Button
                variant='outline'
                className='border-border bg-card transition-colors duration-150'
                onClick={generatePassword}
              >
                <RefreshCw className='h-4 w-4 mr-2' />
                {t('generator.regenerate')}
              </Button>
              <Button
                variant='outline'
                className='border-border bg-card transition-colors duration-150'
                onClick={() => setShowSave(!showSave)}
              >
                <Save className='h-4 w-4 mr-2' />
                {t('generator.saveToVault')}
              </Button>
            </div>

            {/* Settings Card */}
            <div className='rounded-lg border border-border bg-card p-6'>
              <h2 className='mb-5 font-heading text-2xl font-medium text-foreground'>
                {t('generator.settings')}
              </h2>

              {/* Length Slider */}
              <div className='mb-6'>
                <div className='flex items-center justify-between mb-3'>
                  <Label className='text-sm font-semibold text-foreground'>
                    {t('generator.passwordLength')}
                  </Label>
                  <span className='font-mono text-sm font-medium text-clay'>
                    {settings.length}
                  </span>
                </div>
                <Slider
                  value={[settings.length]}
                  min={4}
                  max={64}
                  step={1}
                  onValueChange={([value]) =>
                    setSettings({ ...settings, length: value })
                  }
                />
                <div className='mt-1.5 flex justify-between font-mono text-[10px] text-text-tertiary'>
                  <span>4</span>
                  <span>64</span>
                </div>
              </div>

              {/* Toggle Options */}
              <div className='space-y-4'>
                {(
                  [
                    ['includeUppercase', t('generator.uppercase')],
                    ['includeLowercase', t('generator.lowercase')],
                    ['includeNumbers', t('generator.numbers')],
                    ['includeSymbols', t('generator.symbols')],
                    ['excludeSimilar', t('generator.excludeSimilar')],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className='flex items-center justify-between'>
                    <Label className='text-sm text-foreground'>{label}</Label>
                    <Switch
                      checked={settings[key]}
                      onCheckedChange={checked =>
                        setSettings({ ...settings, [key]: checked })
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Save Form */}
          <div
            className={`rounded-lg border border-border bg-card p-6 transition-opacity duration-200 ${showSave ? 'opacity-100' : 'pointer-events-none opacity-50'}`}
          >
            <h2 className='mb-1 font-heading text-2xl font-medium text-foreground'>
              {t('generator.savePassword')}
            </h2>
            <p className='text-sm text-muted-foreground mb-5'>
              {t('generator.saveSubtitle')}
            </p>

            <div className='space-y-4'>
              <div className='space-y-1.5'>
                <Label className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                  {t('generator.titleLabel')}
                </Label>
                <Input
                  value={saveTitle}
                  placeholder={t('generator.titlePlaceholder')}
                  className='border-border bg-background focus:border-clay'
                  onChange={e => setSaveTitle(e.target.value)}
                />
              </div>

              <div className='space-y-1.5'>
                <Label className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                  {t('generator.usernameLabel')}
                </Label>
                <Input
                  value={saveUsername}
                  placeholder={t('generator.usernamePlaceholder')}
                  className='border-border bg-background focus:border-clay'
                  onChange={e => setSaveUsername(e.target.value)}
                />
              </div>

              <div className='space-y-1.5'>
                <Label className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                  {t('generator.urlLabel')}
                </Label>
                <Input
                  value={saveUrl}
                  placeholder={t('generator.urlPlaceholder')}
                  className='border-border bg-background focus:border-clay'
                  onChange={e => setSaveUrl(e.target.value)}
                />
              </div>

              <div className='space-y-1.5'>
                <Label className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
                  {t('generator.notesLabel')}
                </Label>
                <textarea
                  value={saveNotes}
                  placeholder={t('generator.notesPlaceholder')}
                  rows={3}
                  className='flex w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-text-tertiary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                  onChange={e => setSaveNotes(e.target.value)}
                />
              </div>

              <Button
                className='w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-150'
                onClick={savePassword}
              >
                {t('generator.saveToVault')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
