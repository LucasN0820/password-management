import { useQuery } from '@tanstack/react-query';
import { usePasswordStore } from '@/store/passwordStore';
import { Render } from './render';
import { Redirect } from 'expo-router';

interface Props {
  onClose: () => void;
  id: number
}

export function ModalEditPassword(props: Props) {
  const { findPassword } = usePasswordStore()

  const { data, isLoading } = useQuery({
    queryKey: ['password', props.id],
    queryFn: () => findPassword(props.id)
  })

  if (isLoading) {
    return null
  }

  if (!data) {
    return <Redirect href="/" />
  }

  return <Render {...props} initialValue={{ ...data, url: data.url ?? undefined, icon: data.icon ?? undefined, notes: data.notes ?? undefined }} />
}

