import { usePasswordStore } from '@/store/passwordStore';
import { useQuery } from '@tanstack/react-query';
import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';
import { Text } from '@/components/ui/text';

export function PasswordDetailScreen({ id }: { id: number }) {
  const { findPassword } = usePasswordStore();

  const { isLoading, data } = useQuery({
    queryKey: ['findPassword', id],
    queryFn: async () => {
      return await findPassword(id);
    },
  });

  if (isLoading) {
    return <View />;
  }

  if (!data) {
    return <Redirect href="/+not-found" />;
  }

  return (
    <>
      <Stack.Screen options={{ headerTitle: data.title }} />
      <View>
        <Text>{data.username}</Text>
        <Text>{data.password}</Text>
      </View>
    </>
  );
}
