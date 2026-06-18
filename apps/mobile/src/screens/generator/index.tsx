import * as Haptics from 'expo-haptics';
import {
  Check,
  Copy,
  Minus,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { CopyToast } from '@/components/copy-toast';
import { ModalAddPassword } from '@/components/modal-add-password';
import { useSecureScreen } from '@/hooks/useSecureScreen';
import { copySensitive } from '@/lib/clipboard';
import {
  createRandomIndex,
  generatePassphrase,
  generateSecurePassword,
  type PassphraseCapitalization,
  passphraseEntropyBits,
  passwordEntropyBits,
  poolSizeFor,
  strengthFromEntropy,
  type StrengthLevel,
} from '@/lib/secure-random';
import { WORDLIST } from '@/lib/wordlist';
import { getMobileRandomBytes } from '@/store/vaultKey';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';

type Mode = 'password' | 'passphrase';

const SEPARATORS = [
  { value: '-', labelKey: 'generator.separatorHyphen' },
  { value: '.', labelKey: 'generator.separatorDot' },
  { value: ' ', labelKey: 'generator.separatorSpace' },
  { value: '_', labelKey: 'generator.separatorUnderscore' },
] as const;

const CAPITALIZATIONS: {
  value: PassphraseCapitalization;
  labelKey: string;
}[] = [
  { value: 'none', labelKey: 'generator.capNone' },
  { value: 'first', labelKey: 'generator.capFirst' },
  { value: 'all', labelKey: 'generator.capAll' },
];

/** Last N generated values, kept in session memory only (cleared on leave). */
const HISTORY_LIMIT = 5;

function impact(style: Haptics.ImpactFeedbackStyle) {
  if (process.env.EXPO_OS === 'ios') {
    void Haptics.impactAsync(style);
  }
}

function selection() {
  if (process.env.EXPO_OS === 'ios') {
    void Haptics.selectionAsync();
  }
}

function notify(type: Haptics.NotificationFeedbackType) {
  if (process.env.EXPO_OS === 'ios') {
    void Haptics.notificationAsync(type);
  }
}

export function GeneratorScreen() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('password');

  // Random-character options.
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [excludeSimilar, setExcludeSimilar] = useState(false);

  // Passphrase options.
  const [wordCount, setWordCount] = useState(4);
  const [separator, setSeparator] = useState<string>('-');
  const [capitalization, setCapitalization] =
    useState<PassphraseCapitalization>('none');

  const [generatedPassword, setGeneratedPassword] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = Colors[scheme];

  // The generated secret is on screen — block screenshots while here.
  useSecureScreen('generator');

  // Sensitive-data lifecycle: wipe the current value and session history when
  // the screen unmounts so secrets do not linger in memory.
  useEffect(() => {
    return () => {
      setHistory([]);
      setGeneratedPassword('');
    };
  }, []);

  const pushHistory = useCallback((value: string) => {
    if (!value) return;
    setHistory(prev => {
      const next = [value, ...prev.filter(v => v !== value)];
      return next.slice(0, HISTORY_LIMIT);
    });
  }, []);

  const generate = useCallback(async () => {
    const pw =
      mode === 'passphrase'
        ? await generatePassphrase(
            { wordCount, separator, capitalization },
            WORDLIST,
            createRandomIndex(getMobileRandomBytes)
          )
        : await generateSecurePassword(
            {
              length,
              includeUppercase,
              includeLowercase,
              includeNumbers,
              includeSymbols,
              excludeSimilar,
            },
            getMobileRandomBytes
          );
    setGeneratedPassword(pw);
    setCopied(false);
    if (pw) {
      pushHistory(pw);
      impact(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [
    mode,
    length,
    includeUppercase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
    excludeSimilar,
    wordCount,
    separator,
    capitalization,
    pushHistory,
  ]);

  const copyValue = useCallback(
    async (value: string, markCopied: boolean) => {
      if (!value) return;
      await copySensitive(value);
      if (markCopied) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      notify(Haptics.NotificationFeedbackType.Success);
      setToastVisible(true);
    },
    []
  );

  const copyToClipboard = () => void copyValue(generatedPassword, true);

  const strength = useMemo((): {
    label: string;
    color: string;
    ratio: number;
    bits: number;
  } => {
    if (!generatedPassword) {
      return { label: '', color: c.textTertiary, ratio: 0, bits: 0 };
    }
    const bits =
      mode === 'passphrase'
        ? passphraseEntropyBits(wordCount, WORDLIST.length)
        : passwordEntropyBits(
            generatedPassword.length,
            poolSizeFor({
              includeUppercase,
              includeLowercase,
              includeNumbers,
              includeSymbols,
              excludeSimilar,
            })
          );
    const level: StrengthLevel = strengthFromEntropy(bits);
    const map: Record<
      StrengthLevel,
      { label: string; color: string; ratio: number }
    > = {
      weak: { label: t('generator.weak'), color: c.accentRed, ratio: 0.3 },
      medium: {
        label: t('generator.medium'),
        color: c.accentYellow,
        ratio: 0.65,
      },
      strong: {
        label: t('generator.strong'),
        color: c.accentBlue,
        ratio: 1,
      },
    };
    return { ...map[level], bits: Math.round(bits) };
  }, [
    generatedPassword,
    mode,
    wordCount,
    includeUppercase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
    excludeSimilar,
    c,
    t,
  ]);

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: c.background }]}
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <Text
          style={[
            styles.pageTitle,
            { color: c.foreground, fontFamily: fonts.heading },
          ]}
        >
          {t('generator.title')}
        </Text>

        {/* Mode switch */}
        <View
          style={[
            styles.modeSwitch,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          {(['password', 'passphrase'] as const).map(m => {
            const active = mode === m;
            const labelKey =
              m === 'password'
                ? 'generator.modePassword'
                : 'generator.modePassphrase';
            return (
              <Pressable
                key={m}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={t(labelKey)}
                onPress={() => {
                  setMode(m);
                  selection();
                }}
                style={[
                  styles.modeTab,
                  active && { backgroundColor: c.foreground },
                ]}
              >
                <Text
                  style={[
                    styles.modeTabText,
                    {
                      color: active ? c.background : c.foreground,
                      fontFamily: fonts.bodySemiBold,
                    },
                  ]}
                >
                  {t(labelKey)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Password display card */}
        <View
          style={[
            styles.passwordCard,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          <Pressable onPress={generatedPassword ? copyToClipboard : undefined}>
            <Text
              selectable={Boolean(generatedPassword)}
              style={[
                styles.passwordText,
                { color: c.foreground, fontFamily: fonts.mono },
                !generatedPassword && {
                  color: c.textTertiary,
                  fontFamily: fonts.body,
                },
              ]}
              numberOfLines={3}
            >
              {generatedPassword || t('generator.placeholder')}
            </Text>
          </Pressable>

          {/* Strength bar */}
          {generatedPassword ? (
            <View style={styles.strengthSection}>
              <View
                style={[styles.strengthTrack, { backgroundColor: c.border }]}
              >
                <View
                  style={[
                    styles.strengthFill,
                    {
                      backgroundColor: strength.color,
                      width: `${strength.ratio * 100}%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.strengthRow}>
                <Text
                  style={[
                    styles.strengthLabel,
                    { color: strength.color, fontFamily: fonts.bodySemiBold },
                  ]}
                >
                  {strength.label}
                </Text>
                <Text
                  style={[
                    styles.strengthBits,
                    { color: c.textTertiary, fontFamily: fonts.body },
                  ]}
                >
                  {t('generator.entropy', { bits: strength.bits })}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Action buttons */}
          <View style={styles.passwordActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('generator.regenerate')}
              onPress={() => void generate()}
              style={[styles.regenerateBtn, { borderColor: c.foreground }]}
            >
              <RefreshCw size={16} color={c.foreground} />
              <Text
                style={[
                  styles.regenerateText,
                  { color: c.foreground, fontFamily: fonts.bodySemiBold },
                ]}
              >
                {t('generator.regenerate')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('generator.copy')}
              onPress={copyToClipboard}
              disabled={!generatedPassword}
              style={[
                styles.copyBtn,
                {
                  backgroundColor: generatedPassword ? c.foreground : c.border,
                },
              ]}
            >
              {copied ? (
                <Check size={18} color={c.background} />
              ) : (
                <Copy
                  size={18}
                  color={generatedPassword ? c.background : c.textTertiary}
                />
              )}
            </Pressable>
          </View>
        </View>

        {mode === 'password' ? (
          <PasswordControls
            colors={c}
            length={length}
            setLength={setLength}
            includeUppercase={includeUppercase}
            setIncludeUppercase={setIncludeUppercase}
            includeLowercase={includeLowercase}
            setIncludeLowercase={setIncludeLowercase}
            includeNumbers={includeNumbers}
            setIncludeNumbers={setIncludeNumbers}
            includeSymbols={includeSymbols}
            setIncludeSymbols={setIncludeSymbols}
            excludeSimilar={excludeSimilar}
            setExcludeSimilar={setExcludeSimilar}
          />
        ) : (
          <PassphraseControls
            colors={c}
            wordCount={wordCount}
            setWordCount={setWordCount}
            separator={separator}
            setSeparator={setSeparator}
            capitalization={capitalization}
            setCapitalization={setCapitalization}
          />
        )}

        {/* History */}
        <View style={styles.historyHeader}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: c.foreground,
                fontFamily: fonts.heading,
                marginBottom: 0,
              },
            ]}
          >
            {t('generator.history')}
          </Text>
          {history.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('generator.clearHistory')}
              onPress={() => {
                setHistory([]);
                selection();
              }}
              style={styles.clearHistoryBtn}
            >
              <Trash2 size={14} color={c.textTertiary} />
              <Text
                style={[
                  styles.clearHistoryText,
                  { color: c.textTertiary, fontFamily: fonts.body },
                ]}
              >
                {t('generator.clearHistory')}
              </Text>
            </Pressable>
          ) : null}
        </View>
        <View
          style={[
            styles.historyCard,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          {history.length === 0 ? (
            <Text
              style={[
                styles.historyEmpty,
                { color: c.textTertiary, fontFamily: fonts.body },
              ]}
            >
              {t('generator.historyEmpty')}
            </Text>
          ) : (
            history.map((value, i) => (
              <View
                key={`${value}-${i}`}
                style={[
                  styles.historyRow,
                  i < history.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: c.border,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.historyValue,
                    { color: c.foreground, fontFamily: fonts.mono },
                  ]}
                >
                  {value}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('generator.copyEntry')}
                  onPress={() => void copyValue(value, false)}
                  style={styles.historyCopyBtn}
                >
                  <Copy size={16} color={c.foreground} />
                </Pressable>
              </View>
            ))
          )}
        </View>

        {/* Save to vault */}
        {generatedPassword ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('generator.saveToVault')}
            onPress={() => setShowSaveModal(true)}
            style={[styles.saveButton, { backgroundColor: c.foreground }]}
          >
            <Save size={18} color={c.background} />
            <Text
              style={[
                styles.saveButtonText,
                { color: c.background, fontFamily: fonts.bodySemiBold },
              ]}
            >
              {t('generator.saveToVault')}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <CopyToast
        visible={toastVisible}
        message={t('passwords.passwordCopied')}
        onHide={() => setToastVisible(false)}
      />

      {showSaveModal && (
        <ModalAddPassword
          onClose={() => setShowSaveModal(false)}
          initialPassword={generatedPassword}
        />
      )}
    </>
  );
}

function PasswordControls({
  colors: c,
  length,
  setLength,
  includeUppercase,
  setIncludeUppercase,
  includeLowercase,
  setIncludeLowercase,
  includeNumbers,
  setIncludeNumbers,
  includeSymbols,
  setIncludeSymbols,
  excludeSimilar,
  setExcludeSimilar,
}: {
  colors: typeof Colors.light;
  length: number;
  setLength: (n: number) => void;
  includeUppercase: boolean;
  setIncludeUppercase: (v: boolean) => void;
  includeLowercase: boolean;
  setIncludeLowercase: (v: boolean) => void;
  includeNumbers: boolean;
  setIncludeNumbers: (v: boolean) => void;
  includeSymbols: boolean;
  setIncludeSymbols: (v: boolean) => void;
  excludeSimilar: boolean;
  setExcludeSimilar: (v: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <Text
        style={[
          styles.sectionTitle,
          { color: c.foreground, fontFamily: fonts.heading },
        ]}
      >
        {t('generator.passwordLength')}
      </Text>
      <Stepper
        colors={c}
        value={length}
        min={4}
        max={64}
        onChange={setLength}
        accessibilityLabel={t('generator.passwordLength')}
      />

      <Text
        style={[
          styles.sectionTitle,
          { color: c.foreground, fontFamily: fonts.heading },
        ]}
      >
        {t('generator.characters')}
      </Text>
      <View
        style={[
          styles.toggleCard,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
      >
        <ToggleRow
          label={t('generator.uppercase')}
          value={includeUppercase}
          onToggle={() => setIncludeUppercase(!includeUppercase)}
          colors={c}
          showBorder
        />
        <ToggleRow
          label={t('generator.lowercase')}
          value={includeLowercase}
          onToggle={() => setIncludeLowercase(!includeLowercase)}
          colors={c}
          showBorder
        />
        <ToggleRow
          label={t('generator.numbers')}
          value={includeNumbers}
          onToggle={() => setIncludeNumbers(!includeNumbers)}
          colors={c}
          showBorder
        />
        <ToggleRow
          label={t('generator.symbols')}
          value={includeSymbols}
          onToggle={() => setIncludeSymbols(!includeSymbols)}
          colors={c}
          showBorder
        />
        <ToggleRow
          label={t('generator.excludeSimilar')}
          value={excludeSimilar}
          onToggle={() => setExcludeSimilar(!excludeSimilar)}
          colors={c}
        />
      </View>
    </>
  );
}

function PassphraseControls({
  colors: c,
  wordCount,
  setWordCount,
  separator,
  setSeparator,
  capitalization,
  setCapitalization,
}: {
  colors: typeof Colors.light;
  wordCount: number;
  setWordCount: (n: number) => void;
  separator: string;
  setSeparator: (s: string) => void;
  capitalization: PassphraseCapitalization;
  setCapitalization: (v: PassphraseCapitalization) => void;
}) {
  const { t } = useTranslation();
  return (
    <>
      <Text
        style={[
          styles.sectionTitle,
          { color: c.foreground, fontFamily: fonts.heading },
        ]}
      >
        {t('generator.wordCount')}
      </Text>
      <Stepper
        colors={c}
        value={wordCount}
        min={3}
        max={10}
        onChange={setWordCount}
        accessibilityLabel={t('generator.wordCount')}
      />

      <Text
        style={[
          styles.sectionTitle,
          { color: c.foreground, fontFamily: fonts.heading },
        ]}
      >
        {t('generator.separator')}
      </Text>
      <SegmentedControl
        colors={c}
        options={SEPARATORS.map(s => ({
          value: s.value,
          label: t(s.labelKey),
        }))}
        value={separator}
        onChange={setSeparator}
      />

      <Text
        style={[
          styles.sectionTitle,
          { color: c.foreground, fontFamily: fonts.heading },
        ]}
      >
        {t('generator.capitalization')}
      </Text>
      <SegmentedControl
        colors={c}
        options={CAPITALIZATIONS.map(cap => ({
          value: cap.value,
          label: t(cap.labelKey),
        }))}
        value={capitalization}
        onChange={setCapitalization}
      />
    </>
  );
}

function Stepper({
  colors: c,
  value,
  min,
  max,
  onChange,
  accessibilityLabel,
}: {
  colors: typeof Colors.light;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  accessibilityLabel: string;
}) {
  return (
    <View
      style={[
        styles.sliderCard,
        { backgroundColor: c.card, borderColor: c.border },
      ]}
    >
      <View style={styles.lengthControls}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${accessibilityLabel} −`}
          onPress={() => {
            onChange(Math.max(min, value - 1));
            selection();
          }}
          style={[styles.lengthButton, { backgroundColor: c.foreground }]}
        >
          <Minus size={16} color={c.background} />
        </Pressable>

        <View style={styles.lengthDisplay}>
          <Text
            style={[
              styles.sliderValue,
              { color: c.foreground, fontFamily: fonts.bodySemiBold },
            ]}
          >
            {value}
          </Text>
          <View style={[styles.lengthTrack, { backgroundColor: c.border }]}>
            <View
              style={[
                styles.lengthFill,
                {
                  backgroundColor: c.accentBlue,
                  width: `${((value - min) / (max - min)) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${accessibilityLabel} +`}
          onPress={() => {
            onChange(Math.min(max, value + 1));
            selection();
          }}
          style={[styles.lengthButton, { backgroundColor: c.foreground }]}
        >
          <Plus size={16} color={c.background} />
        </Pressable>
      </View>
      <View style={styles.sliderLabels}>
        <Text
          style={[
            styles.sliderLabel,
            { color: c.textTertiary, fontFamily: fonts.body },
          ]}
        >
          Min: {min}
        </Text>
        <Text
          style={[
            styles.sliderLabel,
            { color: c.textTertiary, fontFamily: fonts.body },
          ]}
        >
          Max: {max}
        </Text>
      </View>
    </View>
  );
}

function SegmentedControl<T extends string>({
  colors: c,
  options,
  value,
  onChange,
}: {
  colors: typeof Colors.light;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View
      style={[
        styles.segmented,
        { backgroundColor: c.card, borderColor: c.border },
      ]}
    >
      {options.map(opt => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={opt.label}
            onPress={() => {
              onChange(opt.value);
              selection();
            }}
            style={[
              styles.segment,
              active && { backgroundColor: c.foreground },
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.segmentText,
                {
                  color: active ? c.background : c.foreground,
                  fontFamily: fonts.bodySemiBold,
                },
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onToggle,
  colors: c,
  showBorder,
}: {
  label: string;
  value: boolean;
  onToggle: () => void;
  colors: typeof Colors.light;
  showBorder?: boolean;
}) {
  return (
    <View
      style={[
        styles.toggleRow,
        showBorder && { borderBottomWidth: 1, borderBottomColor: c.border },
      ]}
    >
      <Text
        style={[
          styles.toggleLabel,
          { color: c.foreground, fontFamily: fonts.body },
        ]}
      >
        {label}
      </Text>
      <Switch
        value={value}
        accessibilityLabel={label}
        onValueChange={() => {
          impact(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
        trackColor={{ false: c.border, true: c.accentBlue }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 40,
    marginBottom: 20,
    letterSpacing: -0.2,
  },
  modeSwitch: {
    flexDirection: 'row',
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 4,
    gap: 4,
    marginBottom: 20,
  },
  modeTab: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
    borderCurve: 'continuous',
  },
  modeTabText: {
    fontSize: 15,
  },
  passwordCard: {
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 24,
    marginBottom: 28,
  },
  passwordText: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
    minHeight: 56,
  },
  strengthSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  strengthTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  strengthLabel: {
    fontSize: 13,
  },
  strengthBits: {
    fontSize: 12,
  },
  passwordActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    minHeight: 44,
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  regenerateText: {
    fontSize: 14,
  },
  copyBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 26,
    marginBottom: 12,
  },
  sliderCard: {
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 20,
    marginBottom: 28,
  },
  lengthControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  lengthButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lengthDisplay: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  sliderValue: {
    fontSize: 20,
  },
  lengthTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  lengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
  },
  sliderLabel: {
    fontSize: 12,
  },
  segmented: {
    flexDirection: 'row',
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 4,
    gap: 4,
    marginBottom: 28,
  },
  segment: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
    borderCurve: 'continuous',
  },
  segmentText: {
    fontSize: 13,
  },
  toggleCard: {
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 28,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    minHeight: 56,
    paddingVertical: 14,
  },
  toggleLabel: {
    fontSize: 15,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  clearHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 4,
  },
  clearHistoryText: {
    fontSize: 13,
  },
  historyCard: {
    borderRadius: 12,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 28,
  },
  historyEmpty: {
    fontSize: 14,
    padding: 20,
    textAlign: 'center',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 12,
    minHeight: 56,
    gap: 12,
  },
  historyValue: {
    flex: 1,
    fontSize: 14,
  },
  historyCopyBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 12,
    borderCurve: 'continuous',
  },
  saveButtonText: {
    fontSize: 15,
  },
});
