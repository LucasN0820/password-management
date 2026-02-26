import { usePasswordStore } from '@/store/passwordStore';
import { useQuery } from '@tanstack/react-query';
import { Redirect } from 'expo-router';
import { LoadingSkeleton } from '@/components/loading-skeleton';
import { Render } from './render';

export function PasswordDetailScreen({ id }: { id: number }) {
  const { findPassword } = usePasswordStore();

  const { isLoading, data } = useQuery({
    queryKey: ['findPassword', id],
    queryFn: async () => {
      return await findPassword(id);
    },
  });

  if (isLoading) {
    return <LoadingSkeleton className='p-4' />;
  }

  if (!data) {
    return <Redirect href="/+not-found" />;
  }


  return <Render passwordItem={data} />
}
