import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Key,
  MoreHorizontal,
  Star,
  User,
} from 'lucide-react-native';
import { Edit, Share2, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  useColorScheme,
  View,
} from 'react-native';
import { Text } from 'react-native';
import { useTranslation } from '@repo/i18n';
import { useQueryClient } from '@tanstack/react-query';
import { ActionSheet, ActionSheetOption } from '@/components/action-sheet';
import { CopyToast } from '@/components/copy-toast';
import { TotpCard } from '@/components/totp-card';
import { useSettingsStore } from '@/features/settings/settings-store';
import { useSecureScreen } from '@/hooks/useSecureScreen';
import { copySensitive } from '@/lib/clipboard';
import { faviconUrl } from '@/lib/favicon';
import { Password, usePasswordStore } from '@/store/passwordStore';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';
import { useStore } from './context';

export function Render({ passwordItem }: { passwordItem: Password }) {
  const { t } = useTranslation();
  const { toggleFavorite } = usePasswordStore();
  const [showPassword, setShowPassword] = useState(false);
  const [optimisticFavorite, setOptimisticFavorite] = useState<boolean | null>(
    null
  );
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const setModal = useStore(s => s.setModal);
  const router = useRouter();
  const qc = useQueryClient();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = Colors[scheme];

  // The password can be revealed on this screen — block screenshots while here.
  useSecureScreen('password-detail');

  const {
    id,
    title,
    username,
    password,
    url,
    notes,
    isFavorite,
    icon,
    totp_secret: totpSecret,
  } = passwordItem;
  const currentFavorite =
    optimisticFavorite !== null ? optimisticFavorite : isFavorite;

  // Optional, opt-in website favicon (falls back to the letter on failure).
  const fetchFavicons = useSettingsStore(s => s.fetchFavicons);
  const [faviconFailed, setFaviconFailed] = useState(false);
  const favicon = fetchFavicons && !icon ? faviconUrl(url) : null;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  const handleCopy = async (text: string, label: string, sensitive = false) => {
    if (sensitive) {
      await copySensitive(text);
    } else {
      await Clipboard.setStringAsync(text);
    }
    if (process.env.EXPO_OS === 'ios') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    showToast(t('passwords.copied', { label }));
  };

  const handleToggleFavorite = async () => {
    if (process.env.EXPO_OS === 'ios') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newFavorite = !currentFavorite;
    setOptimisticFavorite(newFavorite);
    try {
      await toggleFavorite(passwordItem);
    } catch {
      // revert
    } finally {
      await qc.invalidateQueries({ queryKey: ['findPassword', id] });
      setOptimisticFavorite(null);
    }
  };

  const handleEdit = () => {
    setModal({ type: 'edit-password', id: passwordItem.id });
  };

  const handleDelete = () => {
    setModal({
      type: 'delete-password',
      id: passwordItem.id,
      title: passwordItem.title,
    });
  };

  const getDomainIcon = () => {
    if (url) {
      try {
        return new URL(url).hostname.charAt(0).toUpperCase();
      } catch {
        return title.charAt(0).toUpperCase() || '';
      }
    }
    return title.charAt(0).toUpperCase() || '';
  };

  const share = async (includePassword: boolean) => {
    const { Share } = await import('react-native');
    const lines = [title, `${t('aiImport.fields.username')}: ${username}`];
    if (url) {
      lines.push(`${t('aiImport.fields.url')}: ${url}`);
    }
    if (includePassword) {
      lines.push(`${t('aiImport.fields.password')}: ${password}`);
    }
    await Share.share({ message: lines.join('\n') });
  };

  /** Confirm before sharing so the password is only included on explicit opt-in. */
  const confirmShare = () => {
    Alert.alert(t('share.title'), t('share.message'), [
      { text: t('share.cancel'), style: 'cancel' },
      {
        text: t('share.withoutPassword'),
        onPress: () => void share(false),
      },
      {
        text: t('share.includePassword'),
        style: 'destructive',
        onPress: () => void share(true),
      },
    ]);
  };

  const overflowOptions: ActionSheetOption[] = [
    {
      label: t('passwords.edit'),
      icon: Edit,
      onPress: handleEdit,
    },
    {
      label: t('passwords.share'),
      icon: Share2,
      onPress: confirmShare,
    },
    {
      label: t('passwords.delete'),
      icon: Trash2,
      destructive: true,
      onPress: handleDelete,
    },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title,
          headerStyle: { backgroundColor: c.background },
          headerShadowVisible: false,
          headerTitleStyle: {
            color: c.foreground,
            fontFamily: fonts.bodySemiBold,
          },
          headerLeft: () => (
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={24} color={c.foreground} />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={() => setActionSheetVisible(true)}
              style={styles.moreButton}
            >
              <MoreHorizontal size={24} color={c.foreground} />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: c.background }]}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero section */}
        <View style={styles.heroSection}>
          <View style={[styles.heroIcon, { backgroundColor: c.foreground }]}>
            {icon ? (
              <Image
                source={{ uri: icon }}
                style={styles.heroIconImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={120}
              />
            ) : favicon && !faviconFailed ? (
              <Image
                source={{ uri: favicon }}
                style={styles.heroIconImage}
                contentFit="contain"
                cachePolicy="memory-disk"
                transition={120}
                onError={() => setFaviconFailed(true)}
              />
            ) : (
              <Text
                style={[
                  styles.heroIconText,
                  { fontFamily: fonts.bodySemiBold },
                ]}
              >
                {getDomainIcon()}
              </Text>
            )}
          </View>

          <View style={styles.heroTitleRow}>
            <Text
              selectable
              style={[
                styles.heroTitle,
                { color: c.foreground, fontFamily: fonts.heading },
              ]}
            >
              {title}
            </Text>
            <Pressable onPress={handleToggleFavorite} style={styles.heroStar}>
              <Star
                size={22}
                color={currentFavorite ? c.accentBlue : c.textTertiary}
                fill={currentFavorite ? c.accentBlue : 'none'}
              />
            </Pressable>
          </View>
        </View>

        {/* Username card */}
        <View
          style={[
            styles.detailCard,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          <View style={styles.cardLabel}>
            <User size={14} color={c.textTertiary} />
            <Text
              style={[
                styles.cardLabelText,
                { color: c.textTertiary, fontFamily: fonts.bodySemiBold },
              ]}
            >
              {t('form.username')}
            </Text>
          </View>
          <View style={styles.cardContent}>
            <Text
              selectable
              style={[
                styles.cardValue,
                { color: c.foreground, fontFamily: fonts.body },
              ]}
            >
              {username}
            </Text>
            <Pressable
              onPress={() => handleCopy(username, t('form.username'))}
              style={[styles.copyBtn, { backgroundColor: c.surface }]}
            >
              <Copy size={16} color={c.accentBlue} />
            </Pressable>
          </View>
        </View>

        {/* Password card */}
        <View
          style={[
            styles.detailCard,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          <View style={styles.cardLabel}>
            <Key size={14} color={c.textTertiary} />
            <Text
              style={[
                styles.cardLabelText,
                { color: c.textTertiary, fontFamily: fonts.bodySemiBold },
              ]}
            >
              {t('form.password')}
            </Text>
          </View>
          <View style={styles.cardContent}>
            <Text
              selectable={showPassword}
              style={[
                styles.cardValue,
                {
                  color: c.foreground,
                  fontFamily: showPassword ? fonts.mono : fonts.body,
                },
              ]}
            >
              {showPassword ? password : '••••••••••'}
            </Text>
            <View style={styles.cardActions}>
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={[styles.copyBtn, { backgroundColor: c.surface }]}
              >
                {showPassword ? (
                  <EyeOff size={16} color={c.accentBlue} />
                ) : (
                  <Eye size={16} color={c.accentBlue} />
                )}
              </Pressable>
              <Pressable
                onPress={() => handleCopy(password, t('form.password'), true)}
                style={[styles.copyBtn, { backgroundColor: c.surface }]}
              >
                <Copy size={16} color={c.accentBlue} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* TOTP card */}
        {totpSecret ? (
          <TotpCard secret={totpSecret} scheme={scheme} onCopied={showToast} />
        ) : null}

        {/* URL card */}
        {url && (
          <View
            style={[
              styles.detailCard,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
            <View style={styles.cardLabel}>
              <Globe size={14} color={c.textTertiary} />
              <Text
                style={[
                  styles.cardLabelText,
                  { color: c.textTertiary, fontFamily: fonts.bodySemiBold },
                ]}
              >
                {t('form.url')}
              </Text>
            </View>
            <Pressable
              onPress={() => {
                const target =
                  url.startsWith('http://') || url.startsWith('https://')
                    ? url
                    : `https://${url}`;
                Linking.canOpenURL(target).then(supported => {
                  if (supported) Linking.openURL(target);
                  else Alert.alert(t('passwords.invalidUrl'));
                });
              }}
              style={styles.cardContent}
            >
              <Text
                selectable
                style={[
                  styles.cardValue,
                  { color: c.accentBlue, fontFamily: fonts.body },
                ]}
              >
                {url}
              </Text>
              <View style={[styles.copyBtn, { backgroundColor: c.surface }]}>
                <Globe size={16} color={c.accentBlue} />
              </View>
            </Pressable>
          </View>
        )}

        {/* Notes card */}
        {notes && (
          <View
            style={[
              styles.detailCard,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
            <View style={styles.cardLabel}>
              <FileText size={14} color={c.textTertiary} />
              <Text
                style={[
                  styles.cardLabelText,
                  { color: c.textTertiary, fontFamily: fonts.bodySemiBold },
                ]}
              >
                {t('form.notes')}
              </Text>
            </View>
            <Text
              selectable
              style={[
                styles.notesText,
                { color: c.foreground, fontFamily: fonts.body },
              ]}
            >
              {notes}
            </Text>
          </View>
        )}
      </ScrollView>

      <ActionSheet
        visible={actionSheetVisible}
        onClose={() => setActionSheetVisible(false)}
        options={overflowOptions}
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  moreButton: {
    padding: 4,
  },
  heroSection: {
    alignItems: 'center',
    paddingBottom: 12,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 14,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  heroIconImage: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  heroIconText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroTitle: {
    fontSize: 34,
    textAlign: 'center',
  },
  heroStar: {
    padding: 4,
  },
  detailCard: {
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 16,
  },
  cardLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  cardLabelText: {
    fontSize: 11,
    letterSpacing: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardValue: {
    fontSize: 16,
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  copyBtn: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 10,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
  },
});
