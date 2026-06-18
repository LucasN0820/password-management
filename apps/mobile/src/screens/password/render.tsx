import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { type Href, useRouter } from 'expo-router';
import {
  ArrowDownUp,
  Check,
  Plus,
  Search,
  Settings,
  Sparkles,
} from 'lucide-react-native';
import { ClipboardCopy, Copy, Edit, Star, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useTranslation } from '@repo/i18n';
import { FlashList } from '@shopify/flash-list';
import { ActionSheet, ActionSheetOption } from '@/components/action-sheet';
import { CopyToast } from '@/components/copy-toast';
import { PasswordItem } from '@/components/password-item';
import { useSettingsStore } from '@/features/settings/settings-store';
import { deriveCategories, VIRTUAL_CATEGORIES } from '@/lib/categories';
import { copySensitive } from '@/lib/clipboard';
import { SORT_KEYS, type SortKey, sortPasswords } from '@/lib/sort-passwords';
import { Password, usePasswordStore } from '@/store/passwordStore';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';
import { useStore } from './context';

// FlashList's contentContainerStyle does not support `gap`; the inter-item
/**
 * Spacing the old FlatList got from `gap: 8` is rendered as a separator instead.
 */
function ItemSeparator() {
  return <View style={styles.separator} />;
}

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
  const [refreshing, setRefreshing] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedPassword, setSelectedPassword] = useState<Password | null>(
    null
  );
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [sortSheetVisible, setSortSheetVisible] = useState(false);

  const sortBy = useSettingsStore(s => s.sortBy);
  const setSortBy = useSettingsStore(s => s.setSortBy);

  const setModal = useStore(s => s.setModal);
  const {
    passwords,
    filteredPasswords,
    searchQuery,
    setSearchQuery,
    loadPasswords,
    toggleFavorite,
    selectedCategory,
    setSelectedCategory,
  } = usePasswordStore();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = Colors[scheme];

  // Category chips are derived from the loaded passwords so they always stay in
  // sync after add/edit/delete, without an extra DB round-trip. `all` and
  // `favorites` are virtual filters handled by the store's `applyFilters`.
  const categories = useMemo(
    () => [...VIRTUAL_CATEGORIES, ...deriveCategories(passwords)],
    [passwords]
  );

  // If the active custom category disappears (its last item was deleted or
  // recategorized), fall back to `all` so nothing looks stuck on an empty view.
  useEffect(() => {
    if (!categories.includes(selectedCategory)) {
      setSelectedCategory('all');
    }
  }, [categories, selectedCategory, setSelectedCategory]);

  const categoryLabel = (category: string) => {
    if (category === 'all') return t('passwords.all');
    if (category === 'favorites') return t('passwords.favorites');
    return category;
  };

  // Re-sort the (already category-filtered) list per the persisted preference.
  const sortedPasswords = useMemo(
    () => sortPasswords(filteredPasswords, sortBy),
    [filteredPasswords, sortBy]
  );

  const sortLabel = (key: SortKey) => {
    if (key === 'name') return t('list.sortByName');
    if (key === 'created') return t('list.sortByCreated');
    return t('list.sortByUpdated');
  };

  const sortOptions: ActionSheetOption[] = SORT_KEYS.map(key => ({
    label: sortLabel(key),
    icon: key === sortBy ? Check : undefined,
    onPress: () => setSortBy(key),
  }));

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
            await copySensitive(selectedPassword.password);
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
    const isFavorites = selectedCategory === 'favorites';
    return (
      <View style={styles.emptyState}>
        {isFavorites ? (
          <Star size={32} color={c.textTertiary} />
        ) : (
          <TouchableOpacity
            onPress={() => setModal({ type: 'add-password' })}
            style={[styles.emptyIconButton, { backgroundColor: c.foreground }]}
          >
            <Plus size={24} color={c.background} />
          </TouchableOpacity>
        )}
        <Text
          style={[
            styles.emptyTitle,
            { color: c.foreground, fontFamily: fonts.heading },
          ]}
        >
          {isFavorites
            ? t('passwords.noFavoritesYet')
            : t('passwords.noPasswordsYet')}
        </Text>
        <Text
          style={[
            styles.emptySubtitle,
            { color: c.mutedForeground, fontFamily: fonts.body },
          ]}
        >
          {isFavorites
            ? t('passwords.emptyFavoritesSubtitle')
            : t('passwords.emptySubtitle')}
        </Text>
      </View>
    );
  }, [
    selectedCategory,
    c.background,
    c.foreground,
    c.mutedForeground,
    c.textTertiary,
    setModal,
    t,
  ]);

  return (
    <>
      <View style={[styles.container, { backgroundColor: c.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text
            numberOfLines={1}
            style={[
              styles.pageTitle,
              { color: c.foreground, fontFamily: fonts.heading },
            ]}
          >
            {t('passwords.myVault')}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => {
                impact(Haptics.ImpactFeedbackStyle.Light);
                router.push('/ai-import' as Href);
              }}
              accessibilityRole="button"
              accessibilityLabel={t('aiImport.title')}
              style={styles.headerIcon}
            >
              <Sparkles size={24} color={c.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                impact(Haptics.ImpactFeedbackStyle.Light);
                router.push('/settings' as Href);
              }}
              accessibilityRole="button"
              accessibilityLabel={t('settings.title')}
              style={styles.headerIcon}
            >
              <Settings size={24} color={c.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Category chips + search + sort */}
        <View style={styles.chipContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            style={styles.chipScroll}
            keyboardShouldPersistTaps="handled"
          >
            {categories.map(category => {
              const active = category === selectedCategory;
              return (
                <Pressable
                  key={category}
                  onPress={() => {
                    impact(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategory(category);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={categoryLabel(category)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? c.foreground : c.surface,
                      borderColor: active ? c.foreground : c.border,
                    },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.chipText,
                      {
                        color: active ? c.background : c.mutedForeground,
                        fontFamily: active ? fonts.bodySemiBold : fonts.body,
                      },
                    ]}
                  >
                    {categoryLabel(category)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable
            onPress={() => {
              impact(Haptics.ImpactFeedbackStyle.Light);
              setSearchVisible(!searchVisible);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('passwords.searchPlaceholder')}
            style={styles.chipAction}
          >
            <Search
              size={18}
              color={searchVisible ? c.foreground : c.mutedForeground}
            />
          </Pressable>
          <Pressable
            onPress={() => {
              impact(Haptics.ImpactFeedbackStyle.Light);
              setSortSheetVisible(true);
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('list.sort')}
            style={[styles.chipAction, styles.chipActionLast]}
          >
            <ArrowDownUp size={18} color={c.mutedForeground} />
          </Pressable>
        </View>

        {/* Search bar — below the filter row */}
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
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>
          </View>
        )}

        {sortedPasswords.length === 0 ? (
          renderEmptyState()
        ) : (
          <FlashList
            data={sortedPasswords}
            renderItem={renderPassword}
            keyExtractor={item => String(item.id)}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={ItemSeparator}
            showsVerticalScrollIndicator={false}
            contentInsetAdjustmentBehavior="automatic"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={c.foreground}
              />
            }
          />
        )}
      </View>

      <ActionSheet
        visible={actionSheetVisible}
        onClose={() => setActionSheetVisible(false)}
        options={actionSheetOptions}
      />

      <ActionSheet
        visible={sortSheetVisible}
        onClose={() => setSortSheetVisible(false)}
        options={sortOptions}
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
    flexShrink: 1,
    marginRight: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
    flexShrink: 0,
  },
  headerIcon: {
    width: 40,
    height: 40,
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
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
  },
  chipScroll: {
    flex: 1,
  },
  chipRow: {
    paddingLeft: 20,
    paddingRight: 8,
    gap: 8,
  },
  chipAction: {
    width: 36,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActionLast: {
    marginRight: 14,
  },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  separator: {
    height: 8,
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
