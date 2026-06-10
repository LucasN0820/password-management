import { Star } from 'lucide-react-native';
import { StyleSheet, Text, useColorScheme,View } from 'react-native';
import { PasswordItem } from '@/components/password-item';
import { Password, usePasswordStore } from '@/store/passwordStore';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';
import { useStore } from './context';

interface Props {
  onLongPress?: (password: Password) => void;
}

export function FavoritePassword({ onLongPress }: Props) {
  const { filteredPasswords } = usePasswordStore();
  const setModal = useStore(s => s.setModal);
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  const favorites = filteredPasswords.filter(p => p.isFavorite);

  if (favorites.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Star size={32} color={c.textTertiary} />
        <Text style={[styles.emptyTitle, { color: c.foreground, fontFamily: fonts.heading }]}>
          No favorites yet
        </Text>
        <Text style={[styles.emptySubtitle, { color: c.mutedForeground, fontFamily: fonts.body }]}>
          Tap the star on any password to add it here
        </Text>
      </View>
    );
  }

  return (
    <View>
      {favorites.map(p => (
        <PasswordItem
          key={p.id}
          password={p}
          onLongPress={onLongPress}
          onEdit={id => {
            setModal({ type: 'edit-password', id });
          }}
          onDelete={(id, title) => {
            setModal({ type: 'delete-password', id, title });
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 22,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
