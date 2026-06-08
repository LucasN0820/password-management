import { Image, Star, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@repo/ui/primitives/button';
import { Input } from '@repo/ui/primitives/input';
import { Label } from '@repo/ui/primitives/label';
import { cn } from '@repo/ui/lib/utils';
import type { Password } from '@repo/db';

interface AddPasswordModalProps {
  onClose: () => void;
  onSave: (data: Omit<Password, 'id' | 'created_at' | 'updated_at'>) => void;
}

export function AddPasswordModal({ onClose, onSave }: AddPasswordModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    category: 'all',
    isFavorite: false,
    icon: '',
  });
  const [isClosing, setIsClosing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleIconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Icon file must be under 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        setFormData({ ...formData, icon: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeIcon = () => {
    setFormData({ ...formData, icon: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-foreground/24',
        isClosing
          ? 'animate-out fade-out duration-200'
          : 'animate-in fade-in duration-200'
      )}
    >
      <div
        className={cn(
          'mx-4 w-full max-w-md rounded-lg border border-border bg-card shadow-lg',
          isClosing
            ? 'animate-out slide-out-to-bottom-4 duration-200'
            : 'animate-in slide-in-from-bottom-4 duration-200'
        )}
      >
        <div className='flex items-center justify-between border-b border-border px-6 py-4'>
          <h2 className='font-heading text-2xl font-medium text-foreground'>
            New Password
          </h2>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            onClick={handleClose}
          >
            <X className='h-4 w-4' />
          </Button>
        </div>

        <form className='space-y-4 px-6 py-5' onSubmit={handleSubmit}>
          {/* Icon */}
          <div className='space-y-2'>
            <Label className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              Icon
            </Label>
            <div className='flex items-center gap-3'>
              <div className='flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-border bg-surface'>
                {formData.icon ? (
                  <img
                    src={formData.icon}
                    alt='Icon'
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
                  Upload
                </Button>
                {formData.icon && (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='border-border bg-card'
                    onClick={removeIcon}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Title */}
          <div className='space-y-1.5'>
            <Label
              htmlFor='title'
              className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'
            >
              Title *
            </Label>
            <Input
              required
              id='title'
              value={formData.title}
              placeholder='e.g., GitHub'
              className='border-border bg-surface focus:border-clay focus:bg-background'
              onChange={e =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          {/* Username */}
          <div className='space-y-1.5'>
            <Label
              htmlFor='username'
              className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'
            >
              Username
            </Label>
            <Input
              id='username'
              value={formData.username}
              placeholder='Username or email'
              className='border-border bg-surface focus:border-clay focus:bg-background'
              onChange={e =>
                setFormData({ ...formData, username: e.target.value })
              }
            />
          </div>

          {/* Password */}
          <div className='space-y-1.5'>
            <Label
              htmlFor='password'
              className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'
            >
              Password *
            </Label>
            <Input
              required
              id='password'
              type='password'
              value={formData.password}
              placeholder='Enter password'
              className='border-border bg-surface font-mono focus:border-clay focus:bg-background'
              onChange={e =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
          </div>

          {/* URL */}
          <div className='space-y-1.5'>
            <Label
              htmlFor='url'
              className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'
            >
              URL
            </Label>
            <Input
              id='url'
              type='url'
              value={formData.url}
              placeholder='https://...'
              className='border-border bg-surface focus:border-clay focus:bg-background'
              onChange={e => setFormData({ ...formData, url: e.target.value })}
            />
          </div>

          {/* Notes */}
          <div className='space-y-1.5'>
            <Label
              htmlFor='notes'
              className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'
            >
              Notes
            </Label>
            <textarea
              id='notes'
              className='flex min-h-[60px] w-full resize-none rounded-md border border-border bg-surface px-3 py-2 text-sm transition-colors placeholder:text-text-tertiary focus:bg-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
              value={formData.notes}
              placeholder='Optional notes...'
              rows={3}
              onChange={e =>
                setFormData({ ...formData, notes: e.target.value })
              }
            />
          </div>

          {/* Favorite */}
          <div className='flex items-center space-x-2'>
            <input
              type='checkbox'
              id='isFavorite'
              checked={formData.isFavorite}
              className='h-4 w-4 rounded border border-border'
              onChange={e =>
                setFormData({ ...formData, isFavorite: e.target.checked })
              }
            />
            <Label
              htmlFor='isFavorite'
              className='flex cursor-pointer items-center gap-1.5 text-sm'
            >
              <Star
                className={cn(
                  'h-3.5 w-3.5',
                  formData.isFavorite && 'fill-clay text-clay'
                )}
              />
              Add to favorites
            </Label>
          </div>

          {/* Actions */}
          <div className='flex justify-end gap-2 border-t border-border pt-3'>
            <Button
              type='button'
              variant='outline'
              className='border-border bg-card'
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button type='submit'>Create</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
