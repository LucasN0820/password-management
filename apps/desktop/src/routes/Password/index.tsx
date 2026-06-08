import { useMemo } from 'react';
import { createStore, PasswordStoreContext } from './context';
import { PasswordDetail } from './detail';
import { PasswordList } from './list';
import { ModalController } from './modal-controller';

export default function PasswordPage() {
  const store = useMemo(() => createStore(), []);

  return (
    <PasswordStoreContext.Provider value={store}>
      <div className='flex h-full flex-row bg-background'>
        <div className='h-full w-80 border-r border-border bg-warm/45'>
          <PasswordList />
        </div>
        <div className='flex-1'>
          <PasswordDetail />
        </div>
        <ModalController />
      </div>
    </PasswordStoreContext.Provider>
  );
}
