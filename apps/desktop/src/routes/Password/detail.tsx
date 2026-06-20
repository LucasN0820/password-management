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
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@repo/i18n';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@repo/ui/primitives/alert-dialog';
import { Button } from '@repo/ui/primitives/button';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { usePasswordStore } from '@/store/passwordStore';
import { useStore } from './context';

export function PasswordDetail() {
  const { t } = useTranslation();
  const { selectedPassword, deletePassword } = usePasswordStore();
  const { setModal } = useStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { copiedKey: copiedField, copyToClipboard } = useCopyToClipboard();
  const passwordVisibilityLabel = showPassword
    ? t('passwords.hidePassword')
    : t('passwords.showPassword');

  if (!selectedPassword) {
    return (
      <div className='flex h-full flex-1 items-center justify-center bg-background'>
        <div className='flex flex-col items-center gap-3 text-muted-foreground'>
          <Lock className='h-12 w-12 opacity-20' />
          <p className='font-heading text-2xl font-medium'>
            {t('passwords.selectToView')}
          </p>
          <span className='text-sm text-text-tertiary'>
            {t('passwords.selectToViewHint')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-full flex-1 flex-col bg-background'>
      {/* Header */}
      <div className='flex items-start justify-between border-b border-border bg-warm/45 px-8 py-7'>
        <div className='flex items-center gap-4'>
          <div className='flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-border bg-card'>
            {selectedPassword.icon ? (
              <img
                src={selectedPassword.icon}
                alt={selectedPassword.title}
                className='w-full h-full object-cover'
              />
            ) : selectedPassword.url ? (
              <Globe className='h-6 w-6 text-muted-foreground' />
            ) : (
              <Lock className='h-6 w-6 text-muted-foreground' />
            )}
          </div>
          <div>
            <h1 className='font-heading text-4xl font-medium tracking-tight text-foreground'>
              {selectedPassword.title}
            </h1>
            {selectedPassword.url && (
              <a
                href={selectedPassword.url}
                target='_blank'
                rel='noopener noreferrer'
                className='mt-1 flex items-center gap-1 text-sm font-medium text-clay hover:underline'
              >
                {selectedPassword.url}
                <ExternalLink className='h-3 w-3' />
              </a>
            )}
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            className='border-border text-sm transition-colors duration-150 hover:bg-accent'
            onClick={() => {
              setModal({ type: 'edit-password', password: selectedPassword });
            }}
          >
            <Edit className='h-3.5 w-3.5 mr-1.5' />
            {t('passwords.edit')}
          </Button>
          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant='outline'
                size='icon'
                aria-label={t('passwords.delete')}
                className='h-8 w-8 border-border text-destructive hover:bg-destructive/10 transition-colors duration-150'
              >
                <Trash2 className='h-3.5 w-3.5' />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('passwords.deleteConfirmTitle')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('passwords.deleteConfirmDescription', {
                    title: selectedPassword.title,
                  })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('modal.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  className='bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20'
                  onClick={() => deletePassword(selectedPassword.id)}
                >
                  {t('passwords.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Fields */}
      <div className='flex-1 overflow-y-auto px-8 py-8'>
        <div className='max-w-2xl space-y-6'>
          {/* Username */}
          <div className='space-y-2'>
            <label className='flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              <User className='h-3.5 w-3.5' />
              {t('form.username')}
            </label>
            <div className='flex gap-2'>
              <div className='flex-1 rounded-md border border-border bg-card px-3.5 py-2.5 text-sm text-foreground'>
                {selectedPassword.username || '—'}
              </div>
              <Button
                variant='outline'
                size='sm'
                className='border-border px-3 transition-colors duration-150 hover:bg-primary hover:text-primary-foreground'
                onClick={() => {
                  copyToClipboard(selectedPassword.username || '', 'username');
                }}
              >
                {copiedField === 'username'
                  ? t('generator.copied')
                  : t('generator.copy')}
              </Button>
            </div>
          </div>

          {/* Password */}
          <div className='space-y-2'>
            <label className='flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              <Lock className='h-3.5 w-3.5' />
              {t('form.password')}
            </label>
            <div className='flex gap-2'>
              <div className='flex-1 rounded-md border border-border bg-card px-3.5 py-2.5 font-mono text-sm text-foreground'>
                {showPassword ? selectedPassword.password : '••••••••••••'}
              </div>
              <Button
                variant='outline'
                size='sm'
                aria-label={passwordVisibilityLabel}
                className='border-border px-3 transition-colors duration-150'
                onClick={() => {
                  setShowPassword(!showPassword);
                }}
              >
                {showPassword ? (
                  <EyeOff className='h-3.5 w-3.5' />
                ) : (
                  <Eye className='h-3.5 w-3.5' />
                )}
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='border-border px-3 transition-colors duration-150 hover:bg-primary hover:text-primary-foreground'
                onClick={() => {
                  copyToClipboard(selectedPassword.password, 'password');
                }}
              >
                {copiedField === 'password'
                  ? t('generator.copied')
                  : t('generator.copy')}
              </Button>
            </div>
          </div>

          {/* URL */}
          {selectedPassword.url && (
            <div className='space-y-2'>
              <label className='flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                <Globe className='h-3.5 w-3.5' />
                {t('form.url')}
              </label>
              <div className='rounded-md border border-border bg-card px-3.5 py-2.5 text-sm'>
                <a
                  href={selectedPassword.url}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='font-medium text-clay hover:underline'
                >
                  {selectedPassword.url}
                </a>
              </div>
            </div>
          )}

          {/* Notes */}
          {selectedPassword.notes && (
            <div className='space-y-2'>
              <label className='flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
                <FileText className='h-3.5 w-3.5' />
                {t('form.notes')}
              </label>
              <div className='min-h-[60px] whitespace-pre-wrap rounded-md border border-border bg-card px-3.5 py-2.5 text-sm text-foreground'>
                {selectedPassword.notes}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className='border-t border-border pt-6'>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='text-xs text-text-tertiary'>
                  {t('passwords.created')}
                </span>
                <p className='text-foreground mt-0.5'>
                  {new Date(selectedPassword.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <span className='text-xs text-text-tertiary'>
                  {t('passwords.updated')}
                </span>
                <p className='text-foreground mt-0.5'>
                  {new Date(selectedPassword.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom hint bar */}
      <div className='flex items-center gap-4 border-t border-border bg-warm/45 px-8 py-2.5 font-mono text-xs text-text-tertiary'>
        <span>↑↓ {t('shortcuts.navigateList')}</span>
        <span>↵ {t('generator.copy')}</span>
        <span>Esc {t('spotlight.close')}</span>
      </div>
    </div>
  );
}
