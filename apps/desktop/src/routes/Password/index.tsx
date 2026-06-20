import { passwordPageStore,PasswordStoreContext } from './context';
import { PasswordDetail } from './detail';
import { PasswordList } from './list';
import { ModalController } from './modal-controller';

export default function PasswordPage() {
  return (
    <PasswordStoreContext.Provider value={passwordPageStore}>
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
