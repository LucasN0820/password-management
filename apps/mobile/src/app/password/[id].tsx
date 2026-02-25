import { useLocalSearchParams } from 'expo-router';
import { PasswordDetailScreen } from '@/screens/password-detail';

export default function Screen() {
  const { id } = useLocalSearchParams();

  return <PasswordDetailScreen id={Number(id as string)} />;
}
