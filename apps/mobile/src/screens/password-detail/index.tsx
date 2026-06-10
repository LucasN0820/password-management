import { Redirect } from 'expo-router';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { usePasswordStore } from '@/store/passwordStore';
import { createStore,StoreContext } from './context';
import { ModalController } from './modal-controller';
import { Render } from './render';

export function PasswordDetailScreen({ id }: { id: number }) {
  const { findPassword } = usePasswordStore();
  const store = useMemo(() => createStore(), []);

  const { isLoading, data } = useQuery({
    queryKey: ['findPassword', id],
    queryFn: async () => {
      return await findPassword(id);
    },
  });

  if (isLoading) {
    return <LoadingSkeleton style={{ padding: 16 }} />;
  }

  if (!data) {
    return <Redirect href="/+not-found" />;
  }

  return (
    <StoreContext.Provider value={store}>
      <Render passwordItem={data} />
      <ModalController />
    </StoreContext.Provider>
  );
}
