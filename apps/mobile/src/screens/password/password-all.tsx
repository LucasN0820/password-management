import { Plus } from 'lucide-react-native';
import { Pressable,StyleSheet, Text, useColorScheme, View } from 'react-native';
import { PasswordItem } from '@/components/password-item';
import { Password, usePasswordStore } from '@/store/passwordStore';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';
import { useStore } from './context';

interface Props {
  onLongPress?: (password: Password) => void;
}

export function AllPassword({ onLongPress }: Props) {
  const { filteredPasswords } = usePasswordStore();
  const setModal = useStore(s => s.setModal);
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  if (filteredPasswords.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={[styles.emptyTitle, { color: c.foreground, fontFamily: fonts.heading }]}>
          No passwords yet
        </Text>
        <Text style={[styles.emptySubtitle, { color: c.mutedForeground, fontFamily: fonts.body }]}>
          Tap + to add your first password
        </Text>
        <Pressable
          onPress={() => setModal({ type: 'add-password' })}
          style={[styles.emptyButton, { backgroundColor: c.foreground }]}
        >
          <Plus size={24} color={c.background} />
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      {filteredPasswords.map(p => (
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
  },
  emptyTitle: {
    fontSize: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
