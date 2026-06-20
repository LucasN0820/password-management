import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { type Href, useRouter } from 'expo-router';
import {
  Archive,
  ChevronRight,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react-native';
import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useTranslation } from '@repo/i18n';
import { useAppUpdateCheck } from '@/features/app-update';
import { getDeviceLanguage } from '@/features/settings/device-language';
import { useSettingsStore } from '@/features/settings/settings-store';
import {
  AUTO_LOCK_OPTIONS,
  CLIPBOARD_CLEAR_OPTIONS,
  type LanguagePreference,
  type ThemeMode,
} from '@/features/settings/types';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';

function selection() {
  if (process.env.EXPO_OS === 'ios') {
    void Haptics.selectionAsync();
  }
}

interface SegmentOption<T> {
  value: T;
  label: string;
}

/** A platform-neutral segmented control. Each segment is a ≥44pt touch target. */
function Segmented<T extends string | number>({
  options,
  selected,
  onSelect,
  colors: c,
}: {
  options: SegmentOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  colors: typeof Colors.light;
}) {
  return (
    <View style={[styles.segment, { backgroundColor: c.surface, borderColor: c.border }]}>
      {options.map(option => {
        const isActive = option.value === selected;
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => {
              selection();
              onSelect(option.value);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={option.label}
            style={[
              styles.segmentItem,
              isActive && [styles.segmentItemActive, { backgroundColor: c.background }],
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.segmentText,
                {
                  color: isActive ? c.foreground : c.mutedForeground,
                  fontFamily: isActive ? fonts.bodySemiBold : fonts.body,
                },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function Section({
  title,
  children,
  colors: c,
}: {
  title: string;
  children: React.ReactNode;
  colors: typeof Colors.light;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: c.mutedForeground, fontFamily: fonts.bodySemiBold }]}>
        {title.toUpperCase()}
      </Text>
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        {children}
      </View>
    </View>
  );
}

function Row({
  label,
  hint,
  children,
  colors: c,
  last,
}: {
  label: string;
  hint?: string;
  children?: React.ReactNode;
  colors: typeof Colors.light;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
      ]}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: c.foreground, fontFamily: fonts.body }]}>
          {label}
        </Text>
        {hint ? (
          <Text style={[styles.rowHint, { color: c.mutedForeground, fontFamily: fonts.caption }]}>
            {hint}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = Colors[scheme];
  const { check: checkForUpdates, isChecking } = useAppUpdateCheck();

  const themeMode = useSettingsStore(s => s.themeMode);
  const language = useSettingsStore(s => s.language);
  const appLockEnabled = useSettingsStore(s => s.appLockEnabled);
  const autoLockMs = useSettingsStore(s => s.autoLockMs);
  const clipboardClearMs = useSettingsStore(s => s.clipboardClearMs);

  const fetchFavicons = useSettingsStore(s => s.fetchFavicons);

  const setThemeMode = useSettingsStore(s => s.setThemeMode);
  const setLanguage = useSettingsStore(s => s.setLanguage);
  const setAppLockEnabled = useSettingsStore(s => s.setAppLockEnabled);
  const setAutoLockMs = useSettingsStore(s => s.setAutoLockMs);
  const setClipboardClearMs = useSettingsStore(s => s.setClipboardClearMs);
  const setFetchFavicons = useSettingsStore(s => s.setFetchFavicons);

  const formatDuration = (ms: number, zeroLabel: string) => {
    if (ms === 0) return zeroLabel;
    if (ms < 60_000) return t('settings.seconds', { count: ms / 1000 });
    return t('settings.minutes', { count: ms / 60_000 });
  };

  const themeOptions: SegmentOption<ThemeMode>[] = [
    { value: 'system', label: t('settings.system') },
    { value: 'light', label: t('settings.light') },
    { value: 'dark', label: t('settings.dark') },
  ];

  const languageOptions: SegmentOption<LanguagePreference>[] = [
    { value: 'system', label: t('settings.system') },
    { value: 'zh', label: '中文' },
    { value: 'en', label: 'English' },
  ];

  const autoLockOptions = useMemo(
    () =>
      AUTO_LOCK_OPTIONS.map(ms => ({
        value: ms,
        label: formatDuration(ms, t('settings.immediately')),
      })),
    [t]
  );

  const clipboardOptions = useMemo(
    () =>
      CLIPBOARD_CLEAR_OPTIONS.map(ms => ({
        value: ms,
        label: formatDuration(ms, t('settings.never')),
      })),
    [t]
  );

  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '';

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <Section title={t('health.title')} colors={c}>
        <Pressable
          onPress={() => {
            selection();
            router.push('/health' as Href);
          }}
          accessibilityRole="button"
          accessibilityLabel={t('health.entry')}
          style={styles.navRow}
        >
          <ShieldCheck size={20} color={c.accentGreen} />
          <View style={styles.rowText}>
            <Text style={[styles.rowLabel, { color: c.foreground, fontFamily: fonts.body }]}>
              {t('health.entry')}
            </Text>
            <Text style={[styles.rowHint, { color: c.mutedForeground, fontFamily: fonts.caption }]}>
              {t('health.entryHint')}
            </Text>
          </View>
          <ChevronRight size={18} color={c.textTertiary} />
        </Pressable>
      </Section>

      <Section title={t('settings.appearance')} colors={c}>
        <View style={[styles.controlRow, styles.controlRowFirst]}>
          <Segmented options={themeOptions} selected={themeMode} onSelect={setThemeMode} colors={c} />
        </View>
      </Section>

      <Section title={t('settings.language')} colors={c}>
        <View style={[styles.controlRow, styles.controlRowFirst]}>
          <Segmented
            options={languageOptions}
            selected={language}
            onSelect={value => setLanguage(value, getDeviceLanguage())}
            colors={c}
          />
        </View>
      </Section>

      <Section title={t('settings.security')} colors={c}>
        <Row label={t('settings.appLock')} hint={t('settings.appLockHint')} colors={c}>
          <Switch
            value={appLockEnabled}
            onValueChange={value => {
              selection();
              setAppLockEnabled(value);
            }}
            trackColor={{ false: c.border, true: c.accentBlue }}
            thumbColor="#FFFFFF"
          />
        </Row>
        <Row label={t('settings.autoLock')} hint={t('settings.autoLockHint')} colors={c}>
          {null}
        </Row>
        <View style={styles.controlRow}>
          <Segmented
            options={autoLockOptions}
            selected={autoLockMs}
            onSelect={setAutoLockMs}
            colors={c}
          />
        </View>
        <Row label={t('settings.clipboardClear')} hint={t('settings.clipboardClearHint')} colors={c} last>
          {null}
        </Row>
        <View style={[styles.controlRow, styles.controlRowLast]}>
          <Segmented
            options={clipboardOptions}
            selected={clipboardClearMs}
            onSelect={setClipboardClearMs}
            colors={c}
          />
        </View>
      </Section>

      <Section title={t('list.title')} colors={c}>
        <Row
          label={t('list.fetchFavicons')}
          hint={t('list.fetchFaviconsHint')}
          colors={c}
          last
        >
          <Switch
            value={fetchFavicons}
            onValueChange={value => {
              selection();
              setFetchFavicons(value);
            }}
            trackColor={{ false: c.border, true: c.accentBlue }}
            thumbColor="#FFFFFF"
          />
        </Row>
      </Section>

      <Section title={t('backup.sectionTitle')} colors={c}>
        <Pressable
          onPress={() => {
            selection();
            router.push('/backup' as Href);
          }}
          accessibilityRole="button"
          accessibilityLabel={t('backup.entry')}
          style={styles.navRow}
        >
          <Archive size={20} color={c.accentBlue} />
          <View style={styles.rowText}>
            <Text style={[styles.rowLabel, { color: c.foreground, fontFamily: fonts.body }]}>
              {t('backup.entry')}
            </Text>
            <Text style={[styles.rowHint, { color: c.mutedForeground, fontFamily: fonts.caption }]}>
              {t('backup.entryHint')}
            </Text>
          </View>
          <ChevronRight size={18} color={c.textTertiary} />
        </Pressable>
      </Section>

      <Section title={t('settings.about')} colors={c}>
        <Pressable
          onPress={() => {
            selection();
            void checkForUpdates();
          }}
          disabled={isChecking}
          accessibilityRole="button"
          accessibilityLabel={t('update.checkForUpdates')}
          accessibilityState={{ disabled: isChecking, busy: isChecking }}
          style={styles.navRow}
        >
          <RefreshCw size={20} color={c.accentBlue} />
          <View style={styles.rowText}>
            <Text
              style={[
                styles.rowLabel,
                { color: c.foreground, fontFamily: fonts.body },
              ]}
            >
              {isChecking ? t('update.checking') : t('update.checkForUpdates')}
            </Text>
            <Text
              style={[
                styles.rowHint,
                { color: c.mutedForeground, fontFamily: fonts.caption },
              ]}
            >
              {t('update.settingsHintMobile')}
            </Text>
          </View>
          <ChevronRight size={18} color={c.textTertiary} />
        </Pressable>
        <Row label={t('settings.version')} colors={c} last>
          <Text style={[styles.value, { color: c.mutedForeground, fontFamily: fonts.mono }]}>
            {version}
          </Text>
        </Row>
      </Section>

      <Text style={[styles.footer, { color: c.textTertiary, fontFamily: fonts.body }]}>
        {t('settings.privacyNote')}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48, gap: 22 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 12, letterSpacing: 0.6, marginLeft: 4 },
  card: {
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowText: { flex: 1, gap: 3 },
  rowLabel: { fontSize: 16 },
  rowHint: { fontSize: 13, lineHeight: 18 },
  value: { fontSize: 14 },
  controlRow: { paddingHorizontal: 12, paddingBottom: 12 },
  controlRowFirst: { paddingTop: 12 },
  controlRowLast: { paddingBottom: 14 },
  segment: {
    flexDirection: 'row',
    borderRadius: 11,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    borderCurve: 'continuous',
    paddingHorizontal: 8,
  },
  segmentItemActive: {
    boxShadow: '0 1px 2px rgba(31, 30, 27, 0.08)',
  },
  segmentText: { fontSize: 14 },
  footer: { fontSize: 13, lineHeight: 19, textAlign: 'center', paddingHorizontal: 12 },
});
