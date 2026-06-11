import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { type Href, useRouter } from 'expo-router';
import { FileUp, Plus, Search } from 'lucide-react-native';
import { ClipboardCopy, Copy, Edit, Star, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useTranslation } from '@repo/i18n';
import { ActionSheet, ActionSheetOption } from '@/components/action-sheet';
import { CopyToast } from '@/components/copy-toast';
import { PasswordItem } from '@/components/password-item';
import { Password, usePasswordStore } from '@/store/passwordStore';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';
import { useStore } from './context';

type Tab = 'all' | 'favorites';

function impact(style: Haptics.ImpactFeedbackStyle) {
  if (process.env.EXPO_OS === 'ios') {
    void Haptics.impactAsync(style);
  }
}

function notify(type: Haptics.NotificationFeedbackType) {
  if (process.env.EXPO_OS === 'ios') {
    void Haptics.notificationAsync(type);
  }
}

export function Render() {
  const { t } = useTranslation();
  const router = useRouter();
  const [searchVisible, setSearchVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedPassword, setSelectedPassword] = useState<Password | null>(
    null
  );
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const setModal = useStore(s => s.setModal);
  const {
    filteredPasswords,
    searchQuery,
    setSearchQuery,
    loadPasswords,
    toggleFavorite,
  } = usePasswordStore();
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const activePasswords =
    activeTab === 'all'
      ? filteredPasswords
      : filteredPasswords.filter(p => p.isFavorite);

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

  const actionSheetOptions: ActionSheetOption[] = selectedPassword
    ? [
        {
          label: t('passwords.copyPassword'),
          icon: Copy,
          onPress: async () => {
            if (selectedPassword) {
              await Clipboard.setStringAsync(selectedPassword.password);
              notify(Haptics.NotificationFeedbackType.Success);
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
              notify(Haptics.NotificationFeedbackType.Success);
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
          label: selectedPassword.isFavorite
            ? t('passwords.removeFromFavorites')
            : t('passwords.addToFavorites'),
          icon: Star,
          onPress: async () => {
            if (selectedPassword) {
              await toggleFavorite(selectedPassword);
              impact(Haptics.ImpactFeedbackStyle.Light);
            }
          },
        },
        {
          label: t('passwords.delete'),
          icon: Trash2,
          destructive: true,
          onPress: () => {
            if (selectedPassword) {
              setModal({
                type: 'delete-password',
                id: selectedPassword.id,
                title: selectedPassword.title,
              });
            }
          },
        },
      ]
    : [];

  const renderPassword = useCallback(
    ({ item }: { item: Password }) => (
      <PasswordItem
        password={item}
        onLongPress={handleLongPress}
        onEdit={id => {
          setModal({ type: 'edit-password', id });
        }}
        onDelete={(id, title) => {
          setModal({ type: 'delete-password', id, title });
        }}
      />
    ),
    [handleLongPress, setModal]
  );

  const renderEmptyState = useCallback(() => {
    const isFavorites = activeTab === 'favorites';
    return (
      <View style={styles.emptyState}>
        {isFavorites ? (
          <Star size={32} color={c.textTertiary} />
        ) : (
          <Pressable
            onPress={() => setModal({ type: 'add-password' })}
            style={[styles.emptyIconButton, { backgroundColor: c.foreground }]}
          >
            <Plus size={24} color={c.background} />
          </Pressable>
        )}
        <Text
          style={[
            styles.emptyTitle,
            { color: c.foreground, fontFamily: fonts.heading },
          ]}
        >
          {isFavorites ? 'No favorites yet' : 'No passwords yet'}
        </Text>
        <Text
          style={[
            styles.emptySubtitle,
            { color: c.mutedForeground, fontFamily: fonts.body },
          ]}
        >
          {isFavorites
            ? 'Tap the star on any password to add it here'
            : 'Tap + to add your first password'}
        </Text>
      </View>
    );
  }, [
    activeTab,
    c.background,
    c.foreground,
    c.mutedForeground,
    c.textTertiary,
    setModal,
  ]);

  return (
    <>
      <View style={[styles.container, { backgroundColor: c.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[
              styles.pageTitle,
              { color: c.foreground, fontFamily: fonts.heading },
            ]}
          >
            {t('passwords.myVault')}
          </Text>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => {
                impact(Haptics.ImpactFeedbackStyle.Light);
                router.push('/ai-import' as Href);
              }}
              accessibilityRole="button"
              accessibilityLabel={t('aiImport.title')}
              style={[
                styles.headerIcon,
                { backgroundColor: c.surface, borderColor: c.border },
              ]}
            >
              <FileUp size={18} color={c.mutedForeground} />
            </Pressable>
            <Pressable
              onPress={() => {
                impact(Haptics.ImpactFeedbackStyle.Light);
                setSearchVisible(!searchVisible);
              }}
              style={[
                styles.headerIcon,
                { backgroundColor: c.surface, borderColor: c.border },
              ]}
            >
              <Search size={18} color={c.mutedForeground} />
            </Pressable>
          </View>
        </View>

        {/* Search bar */}
        {searchVisible && (
          <View style={styles.searchContainer}>
            <View
              style={[
                styles.searchInput,
                { backgroundColor: c.surface, borderColor: c.border },
              ]}
            >
              <Search size={16} color={c.textTertiary} />
              <TextInput
                style={[
                  styles.searchText,
                  { color: c.foreground, fontFamily: fonts.body },
                ]}
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
          <View
            style={[
              styles.tabPill,
              { backgroundColor: c.surface, borderColor: c.border },
            ]}
          >
            <Pressable
              onPress={() => {
                impact(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('all');
              }}
              style={[
                styles.tab,
                activeTab === 'all' && [
                  styles.tabActive,
                  { backgroundColor: c.background },
                ],
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    fontFamily:
                      activeTab === 'all' ? fonts.bodySemiBold : fonts.body,
                  },
                  {
                    color:
                      activeTab === 'all' ? c.foreground : c.mutedForeground,
                  },
                ]}
              >
                {t('passwords.all')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                impact(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('favorites');
              }}
              style={[
                styles.tab,
                activeTab === 'favorites' && [
                  styles.tabActive,
                  { backgroundColor: c.background },
                ],
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    fontFamily:
                      activeTab === 'favorites'
                        ? fonts.bodySemiBold
                        : fonts.body,
                  },
                  {
                    color:
                      activeTab === 'favorites'
                        ? c.foreground
                        : c.mutedForeground,
                  },
                ]}
              >
                {t('passwords.favorites')}
              </Text>
            </Pressable>
          </View>
        </View>

        <FlatList
          data={activePasswords}
          renderItem={renderPassword}
          keyExtractor={item => String(item.id)}
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            activePasswords.length === 0 && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={c.foreground}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      </View>

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
    paddingTop: 18,
    paddingBottom: 14,
  },
  pageTitle: {
    fontSize: 40,
    letterSpacing: -0.2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderCurve: 'continuous',
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
    borderRadius: 12,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    minHeight: 48,
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
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 4,
  },
  tab: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
    borderCurve: 'continuous',
  },
  tabActive: {
    boxShadow: '0 1px 2px rgba(31, 30, 27, 0.08)',
  },
  tabText: {
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
    gap: 8,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 26,
    marginTop: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyIconButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
