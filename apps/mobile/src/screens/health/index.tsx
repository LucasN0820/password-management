import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  ShieldCheck,
} from 'lucide-react-native';
import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useTranslation } from '@repo/i18n';
import { auditVault } from '@/lib/password-strength';
import { type Password, usePasswordStore } from '@/store/passwordStore';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';

export function HealthScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = Colors[scheme];

  const {passwords} = usePasswordStore();

  // Audit runs on-demand while the screen is mounted; pure + O(n) so it stays
  // responsive even for large vaults. Plaintext is only held transiently here.
  const { audit, favorites } = useMemo(() => {
    const result = auditVault(passwords);
    const favCount = passwords.filter(p => p.isFavorite).length;
    return { audit: result, favorites: favCount };
  }, [passwords]);

  const issueCount = audit.weak.length + audit.reused.length + audit.old.length;

  const openPassword = (id: number) => {
    router.push({ pathname: '/password/[id]', params: { id } });
  };

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      {/* Summary cards */}
      <View style={styles.summaryRow}>
        <SummaryCard
          label={t('health.total')}
          value={audit.total}
          colors={c}
        />
        <SummaryCard
          label={t('health.favorites')}
          value={favorites}
          colors={c}
        />
        <SummaryCard
          label={t('health.issues')}
          value={issueCount}
          tone={issueCount > 0 ? c.accentRed : c.accentGreen}
          colors={c}
        />
      </View>

      {audit.total === 0 ? (
        <EmptyState
          icon={<ShieldCheck size={28} color={c.mutedForeground} />}
          title={t('health.empty')}
          hint={t('health.emptyHint')}
          colors={c}
        />
      ) : issueCount === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={28} color={c.accentGreen} />}
          title={t('health.allClear')}
          hint={t('health.allClearHint')}
          colors={c}
        />
      ) : (
        <>
          <IssueSection
            title={t('health.weak')}
            hint={t('health.weakHint')}
            icon={<AlertTriangle size={18} color={c.accentRed} />}
            tone={c.accentRed}
            entries={audit.weak}
            onPressItem={openPassword}
            colors={c}
          />
          <IssueSection
            title={t('health.reused')}
            hint={t('health.reusedHint')}
            icon={<Copy size={18} color={c.accentYellow} />}
            tone={c.accentYellow}
            entries={audit.reused}
            onPressItem={openPassword}
            colors={c}
          />
          <IssueSection
            title={t('health.old')}
            hint={t('health.oldHint')}
            icon={<Clock size={18} color={c.accentBlue} />}
            tone={c.accentBlue}
            entries={audit.old}
            onPressItem={openPassword}
            colors={c}
          />
        </>
      )}

      <Text
        style={[
          styles.footer,
          { color: c.textTertiary, fontFamily: fonts.body },
        ]}
      >
        {t('health.privacyNote')}
      </Text>
    </ScrollView>
  );
}

function SummaryCard({
  label,
  value,
  tone,
  colors: c,
}: {
  label: string;
  value: number;
  tone?: string;
  colors: typeof Colors.light;
}) {
  return (
    <View
      style={[styles.summaryCard, { backgroundColor: c.card, borderColor: c.border }]}
    >
      <Text
        style={[
          styles.summaryValue,
          { color: tone ?? c.foreground, fontFamily: fonts.heading },
        ]}
      >
        {value}
      </Text>
      <Text
        numberOfLines={2}
        style={[
          styles.summaryLabel,
          { color: c.mutedForeground, fontFamily: fonts.caption },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function IssueSection({
  title,
  hint,
  icon,
  tone,
  entries,
  onPressItem,
  colors: c,
}: {
  title: string;
  hint: string;
  icon: React.ReactNode;
  tone: string;
  entries: Password[];
  onPressItem: (id: number) => void;
  colors: typeof Colors.light;
}) {
  const { t } = useTranslation();
  if (entries.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text
          style={[
            styles.sectionTitle,
            { color: c.foreground, fontFamily: fonts.bodySemiBold },
          ]}
        >
          {title}
        </Text>
        <View style={[styles.badge, { backgroundColor: tone }]}>
          <Text
            style={[
              styles.badgeText,
              { color: c.background, fontFamily: fonts.bodySemiBold },
            ]}
          >
            {entries.length}
          </Text>
        </View>
      </View>
      <Text
        style={[styles.sectionHint, { color: c.mutedForeground, fontFamily: fonts.caption }]}
      >
        {hint}
      </Text>
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
        {entries.map((entry, index) => (
          <Pressable
            key={entry.id}
            onPress={() => onPressItem(entry.id)}
            accessibilityRole="button"
            accessibilityLabel={entry.title || t('health.noTitle')}
            style={[
              styles.itemRow,
              index < entries.length - 1 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: c.border,
              },
            ]}
          >
            <View style={[styles.itemDot, { backgroundColor: tone }]} />
            <View style={styles.itemText}>
              <Text
                numberOfLines={1}
                style={[
                  styles.itemTitle,
                  { color: c.foreground, fontFamily: fonts.body },
                ]}
              >
                {entry.title || t('health.noTitle')}
              </Text>
              {entry.username ? (
                <Text
                  numberOfLines={1}
                  style={[
                    styles.itemSub,
                    { color: c.mutedForeground, fontFamily: fonts.caption },
                  ]}
                >
                  {entry.username}
                </Text>
              ) : null}
            </View>
            <ChevronRight size={18} color={c.textTertiary} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function EmptyState({
  icon,
  title,
  hint,
  colors: c,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  colors: typeof Colors.light;
}) {
  return (
    <View
      style={[styles.empty, { backgroundColor: c.card, borderColor: c.border }]}
    >
      {icon}
      <Text
        style={[
          styles.emptyTitle,
          { color: c.foreground, fontFamily: fonts.bodySemiBold },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.emptyHint,
          { color: c.mutedForeground, fontFamily: fonts.body },
        ]}
      >
        {hint}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48, gap: 22 },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 6,
  },
  summaryValue: { fontSize: 28, lineHeight: 32 },
  summaryLabel: { fontSize: 12, textAlign: 'center', lineHeight: 16 },
  section: { gap: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, flex: 1 },
  badge: {
    minWidth: 24,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 12 },
  sectionHint: { fontSize: 13, lineHeight: 18, marginLeft: 26 },
  card: {
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemDot: { width: 8, height: 8, borderRadius: 4 },
  itemText: { flex: 1, gap: 2 },
  itemTitle: { fontSize: 16 },
  itemSub: { fontSize: 13 },
  empty: {
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: { fontSize: 17 },
  emptyHint: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  footer: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
});
