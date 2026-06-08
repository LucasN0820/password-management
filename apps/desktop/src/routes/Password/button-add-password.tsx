import { Plus } from 'lucide-react';
import { Button } from '@repo/ui/primitives/button';
import { useStore } from './context';

export function ButtonAddPassword() {
  const { setModal } = useStore();

  return (
    <Button
      size='sm'
      className='h-8 w-8 rounded-md bg-primary p-0 text-primary-foreground transition-colors duration-150 hover:bg-primary/90'
      onClick={() => {
        setModal({ type: 'add-password' });
      }}
    >
      <Plus className='h-4 w-4' />
    </Button>
  );
}
