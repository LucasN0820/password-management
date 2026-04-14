import { useState, useCallback } from 'react';
import { useStore } from './context';
import { Password, usePasswordStore } from '@/store/passwordStore';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  useColorScheme,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Search, Plus } from 'lucide-react-native';
import { useTranslation } from '@repo/i18n';
import { ModalController } from './modal-controller';
import { AllPassword } from './password-all';
import { FavoritePassword } from './password-favorite';
import { ActionSheet, ActionSheetOption } from '@/components/action-sheet';
import { CopyToast } from '@/components/copy-toast';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Copy, ClipboardCopy, Edit, Star, Trash2 } from 'lucide-react-native';

type Tab = 'all' | 'favorites';

export function Render() {
  const { t } = useTranslation();
  const [searchVisible, setSearchVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedPassword, setSelectedPassword] = useState<Password | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const setModal = useStore(s => s.setModal);
  const { searchQuery, setSearchQuery, loadPasswords } = usePasswordStore();
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPasswords();
    setRefreshing(false);
  }, [loadPasswords]);

  const handleLongPress = useCallback((password: Password) => {
    setSelectedPassword(password);
    setActionSheetVisible(true);
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  const actionSheetOptions: ActionSheetOption[] = selectedPassword ? [
    {
      label: t('passwords.copyPassword'),
      icon: Copy,
      onPress: async () => {
        if (selectedPassword) {
          await Clipboard.setStringAsync(selectedPassword.password);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showToast(t('passwords.passwordCopied'));
        }
      },
    },
    {
      label: t('passwords.copyUsername'),
      icon: ClipboardCopy,
      onPress: async () => {
        if (selectedPassword) {
          await Clipboard.setStringAsync(selectedPassword.username);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          showToast(t('passwords.usernameCopied'));
        }
      },
    },
    {
      label: t('passwords.edit'),
      icon: Edit,
      onPress: () => {
        if (selectedPassword) {
          setModal({ type: 'edit-password', id: selectedPassword.id });
        }
      },
    },
    {
      label: selectedPassword.isFavorite ? t('passwords.removeFromFavorites') : t('passwords.addToFavorites'),
      icon: Star,
      onPress: () => {
        // Toggle handled by store
      },
    },
    {
      label: t('passwords.delete'),
      icon: Trash2,
      destructive: true,
      onPress: () => {
        if (selectedPassword) {
          setModal({ type: 'delete-password', id: selectedPassword.id, title: selectedPassword.title });
        }
      },
    },
  ] : [];

  return (
    <>
      <View style={[styles.container, { backgroundColor: c.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: c.foreground, fontFamily: fonts.heading }]}>
            {t('passwords.myVault')}
          </Text>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSearchVisible(!searchVisible);
              }}
              style={[styles.headerIcon, { backgroundColor: c.surface, borderColor: c.border }]}
            >
              <Search size={18} color={c.mutedForeground} />
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setModal({ type: 'add-password' });
              }}
              style={[styles.headerIconFilled, { backgroundColor: c.foreground }]}
            >
              <Plus size={18} color={c.background} />
            </Pressable>
          </View>
        </View>

        {/* Search bar */}
        {searchVisible && (
          <View style={styles.searchContainer}>
            <View style={[styles.searchInput, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Search size={16} color={c.textTertiary} />
              <TextInput
                style={[styles.searchText, { color: c.foreground, fontFamily: fonts.body }]}
                placeholder={t('passwords.searchPlaceholder')}
                placeholderTextColor={c.textTertiary}
                value={searchQuery}
                onChangeText={text => setSearchQuery(text.trim())}
                autoFocus
              />
            </View>
          </View>
        )}

        {/* Segmented tabs */}
        <View style={styles.tabContainer}>
          <View style={[styles.tabPill, { backgroundColor: c.surface }]}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('all');
              }}
              style={[
                styles.tab,
                activeTab === 'all' && [styles.tabActive, { backgroundColor: c.background }],
              ]}
            >
              <Text style={[
                styles.tabText,
                { fontFamily: activeTab === 'all' ? fonts.bodySemiBold : fonts.body },
                { color: activeTab === 'all' ? c.foreground : c.mutedForeground },
              ]}>
                {t('passwords.all')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('favorites');
              }}
              style={[
                styles.tab,
                activeTab === 'favorites' && [styles.tabActive, { backgroundColor: c.background }],
              ]}
            >
              <Text style={[
                styles.tabText,
                { fontFamily: activeTab === 'favorites' ? fonts.bodySemiBold : fonts.body },
                { color: activeTab === 'favorites' ? c.foreground : c.mutedForeground },
              ]}>
                {t('passwords.favorites')}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Password list */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={c.foreground}
            />
          }
        >
          {activeTab === 'all'
            ? <AllPassword onLongPress={handleLongPress} />
            : <FavoritePassword onLongPress={handleLongPress} />
          }
        </ScrollView>
      </View>

      <ModalController />

      <ActionSheet
        visible={actionSheetVisible}
        onClose={() => setActionSheetVisible(false)}
        options={actionSheetOptions}
      />

      <CopyToast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  pageTitle: {
    fontSize: 32,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIconFilled: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  searchText: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  tabContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  tabPill: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 16,
  },
  tabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
});
