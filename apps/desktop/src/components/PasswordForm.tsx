import { Image, Star, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import type { PasswordInput } from '@repo/db';
import { useTranslation } from '@repo/i18n';
import { toast } from '@repo/ui/hooks/use-toast';
import { cn } from '@repo/ui/lib/utils';
import { Button } from '@repo/ui/primitives/button';
import { Input } from '@repo/ui/primitives/input';
import { Label } from '@repo/ui/primitives/label';

const MAX_ICON_FILE_SIZE = 5 * 1024 * 1024;

export const EMPTY_PASSWORD_FORM_VALUES: PasswordInput = {
  title: '',
  username: '',
  password: '',
  url: '',
  notes: '',
  category: 'all',
  isFavorite: false,
  icon: '',
  totp_secret: null,
};

interface PasswordFormProps {
  heading: string;
  submitLabel: string;
  uploadLabel: string;
  initialValues: PasswordInput;
  onClose: () => void;
  onSubmit: (data: PasswordInput) => void | Promise<void>;
}

export function PasswordForm({
  heading,
  submitLabel,
  uploadLabel,
  initialValues,
  onClose,
  onSubmit,
}: PasswordFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<PasswordInput>(() => {
    return {
      ...initialValues,
      username: initialValues.username ?? '',
      url: initialValues.url ?? '',
      notes: initialValues.notes ?? '',
      category: initialValues.category || 'all',
      icon: initialValues.icon ?? '',
      totp_secret: initialValues.totp_secret ?? null,
    };
  });
  const [isClosing, setIsClosing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = <Key extends keyof PasswordInput>(
    key: Key,
    value: PasswordInput[Key]
  ) => {
    setFormData(current => ({ ...current, [key]: value }));
  };

  const handleIconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > MAX_ICON_FILE_SIZE) {
      event.target.value = '';
      toast({
        title: t('form.iconTooLargeTitle'),
        description: t('form.iconTooLargeDescription'),
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = readEvent => {
      if (typeof readEvent.target?.result === 'string') {
        updateField('icon', readEvent.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeIcon = () => {
    updateField('icon', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onSubmit(formData);
    onClose();
  };

  return (
    <div
      role='presentation'
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-foreground/24',
        isClosing
          ? 'animate-out fade-out duration-200'
          : 'animate-in fade-in duration-200'
      )}
    >
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='password-form-heading'
        className={cn(
          'mx-4 w-full max-w-md rounded-lg border border-border bg-card shadow-lg',
          isClosing
            ? 'animate-out slide-out-to-bottom-4 duration-200'
            : 'animate-in slide-in-from-bottom-4 duration-200'
        )}
      >
        <div className='flex items-center justify-between border-b border-border px-6 py-4'>
          <h2
            id='password-form-heading'
            className='font-heading text-2xl font-medium text-foreground'
          >
            {heading}
          </h2>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            aria-label={t('modal.closePasswordForm')}
            className='h-8 w-8'
            onClick={handleClose}
          >
            <X className='h-4 w-4' />
          </Button>
        </div>

        <form className='space-y-4 px-6 py-5' onSubmit={handleSubmit}>
          <div className='space-y-2'>
            <Label className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              {t('form.icon')}
            </Label>
            <div className='flex items-center gap-3'>
              <div className='flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-border bg-surface'>
                {formData.icon ? (
                  <img
                    src={formData.icon}
                    alt={t('form.iconPreview')}
                    className='h-full w-full rounded-md object-cover'
                  />
                ) : (
                  <Image className='h-5 w-5 text-text-tertiary' />
                )}
              </div>
              <div className='flex gap-2'>
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  aria-label={t('form.chooseIcon')}
                  className='hidden'
                  onChange={handleIconUpload}
                />
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='border-border bg-card'
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className='mr-1.5 h-3.5 w-3.5' />
                  {uploadLabel}
                </Button>
                {formData.icon && (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='border-border bg-card'
                    onClick={removeIcon}
                  >
                    {t('form.removeIcon')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className='space-y-1.5'>
            <Label
              htmlFor='password-form-title'
              className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'
            >
              {t('form.title')} *
            </Label>
            <Input
              required
              id='password-form-title'
              value={formData.title}
              placeholder={t('form.titlePlaceholder')}
              className='border-border bg-surface focus:border-clay focus:bg-background'
              onChange={event => {
                updateField('title', event.target.value);
              }}
            />
          </div>

          <div className='space-y-1.5'>
            <Label
              htmlFor='password-form-username'
              className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'
            >
              {t('form.username')}
            </Label>
            <Input
              id='password-form-username'
              value={formData.username}
              placeholder={t('form.usernamePlaceholder')}
              className='border-border bg-surface focus:border-clay focus:bg-background'
              onChange={event => {
                updateField('username', event.target.value);
              }}
            />
          </div>

          <div className='space-y-1.5'>
            <Label
              htmlFor='password-form-password'
              className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'
            >
              {t('form.password')} *
            </Label>
            <Input
              required
              id='password-form-password'
              type='password'
              value={formData.password}
              placeholder={t('form.passwordPlaceholder')}
              className='border-border bg-surface font-mono focus:border-clay focus:bg-background'
              onChange={event => {
                updateField('password', event.target.value);
              }}
            />
          </div>

          <div className='space-y-1.5'>
            <Label
              htmlFor='password-form-url'
              className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'
            >
              {t('form.url')}
            </Label>
            <Input
              id='password-form-url'
              type='url'
              value={formData.url ?? ''}
              placeholder={t('form.urlPlaceholder')}
              className='border-border bg-surface focus:border-clay focus:bg-background'
              onChange={event => {
                updateField('url', event.target.value);
              }}
            />
          </div>

          <div className='space-y-1.5'>
            <Label
              htmlFor='password-form-notes'
              className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'
            >
              {t('form.notes')}
            </Label>
            <textarea
              id='password-form-notes'
              className='flex min-h-[60px] w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm transition-colors placeholder:text-text-tertiary focus:bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
              value={formData.notes ?? ''}
              placeholder={t('form.notesPlaceholder')}
              rows={3}
              onChange={event => {
                updateField('notes', event.target.value);
              }}
            />
          </div>

          <div className='flex items-center space-x-2'>
            <input
              type='checkbox'
              id='password-form-favorite'
              aria-label={t('form.favorite')}
              checked={formData.isFavorite}
              className='h-4 w-4 rounded border border-border'
              onChange={event => {
                updateField('isFavorite', event.target.checked);
              }}
            />
            <Label
              htmlFor='password-form-favorite'
              className='flex cursor-pointer items-center gap-1.5 text-sm'
            >
              <Star
                className={cn(
                  'h-3.5 w-3.5',
                  formData.isFavorite && 'fill-clay text-clay'
                )}
              />
              {t('form.favorite')}
            </Label>
          </div>

          <div className='flex justify-end gap-2 border-t border-border pt-3'>
            <Button
              type='button'
              variant='outline'
              className='border-border bg-card'
              onClick={handleClose}
            >
              {t('modal.cancel')}
            </Button>
            <Button type='submit'>{submitLabel}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
