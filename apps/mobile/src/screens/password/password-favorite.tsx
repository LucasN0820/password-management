import { View } from 'react-native';
import { usePasswordStore } from '@/store/passwordStore';
import { PasswordItem } from '@/components/password-item';
import { useStore } from './context';

export function FavoritePassword() {
  const { passwords } = usePasswordStore();
  const setModal = useStore(s => s.setModal);

  return (
    <View className="flex gap-1">
      {passwords
        .filter(p => p.favorite)
        .map(p => (
          <PasswordItem
            key={p.id}
            password={p}
            onEdit={id => {
              setModal({
                type: 'edit-password',
                id,
              });
            }}
            onDelete={(id, title) => {
              setModal({
                type: 'delete-password',
                id,
                title,
              });
            }}
          />
        ))}
    </View>
  );
}
