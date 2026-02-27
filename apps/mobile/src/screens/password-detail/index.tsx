import { usePasswordStore } from '@/store/passwordStore';
import { useQuery } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { Render } from './render';
import { useMemo } from 'react';
import { StoreContext, createStore } from './context';
import { ModalController } from './modal-controller';

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
    return <LoadingSkeleton className="p-4" />;
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
