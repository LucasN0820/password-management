import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Switch,
} from 'react-native';
import { RefreshCw, Copy, Check, Save, Minus, Plus } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';
import { CopyToast } from '@/components/copy-toast';
import { ModalAddPassword } from '@/components/modal-add-password';

export function GeneratorScreen() {
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  const generatePassword = useCallback(() => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let chars = '';
    if (includeUppercase) chars += uppercase;
    if (includeLowercase) chars += lowercase;
    if (includeNumbers) chars += numbers;
    if (includeSymbols) chars += symbols;

    if (chars === '') {
      setGeneratedPassword('');
      return;
    }

    let pw = '';
    for (let i = 0; i < length; i++) {
      pw += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(pw);
    setCopied(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

  const copyToClipboard = async () => {
    if (generatedPassword) {
      await Clipboard.setStringAsync(generatedPassword);
      setCopied(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setToastVisible(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getStrength = () => {
    if (!generatedPassword) return { label: '', color: c.textTertiary, ratio: 0 };
    let score = 0;
    if (generatedPassword.length >= 12) score++;
    if (generatedPassword.length >= 16) score++;
    if (/[A-Z]/.test(generatedPassword)) score++;
    if (/[a-z]/.test(generatedPassword)) score++;
    if (/[0-9]/.test(generatedPassword)) score++;
    if (/[^A-Za-z0-9]/.test(generatedPassword)) score++;

    if (score <= 2) return { label: 'Weak', color: c.accentRed, ratio: 0.25 };
    if (score <= 4) return { label: 'Medium', color: c.accentYellow, ratio: 0.6 };
    return { label: 'Strong', color: c.accentGreen, ratio: 1 };
  };

  const strength = getStrength();

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: c.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Page title */}
        <Text style={[styles.pageTitle, { color: c.foreground, fontFamily: fonts.heading }]}>
          Generator
        </Text>

        {/* Password display card */}
        <View style={[styles.passwordCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Pressable onPress={generatedPassword ? copyToClipboard : undefined}>
            <Text
              style={[
                styles.passwordText,
                { color: c.foreground, fontFamily: fonts.mono },
                !generatedPassword && { color: c.textTertiary, fontFamily: fonts.body },
              ]}
              numberOfLines={2}
            >
              {generatedPassword || 'Tap generate to create a password'}
            </Text>
          </Pressable>

          {/* Strength bar */}
          {generatedPassword && (
            <View style={styles.strengthSection}>
              <View style={[styles.strengthTrack, { backgroundColor: c.border }]}>
                <View style={[
                  styles.strengthFill,
                  { backgroundColor: strength.color, width: `${strength.ratio * 100}%` },
                ]} />
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color, fontFamily: fonts.bodySemiBold }]}>
                {strength.label}
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.passwordActions}>
            <Pressable
              onPress={generatePassword}
              style={[styles.regenerateBtn, { borderColor: c.foreground }]}
            >
              <RefreshCw size={16} color={c.foreground} />
              <Text style={[styles.regenerateText, { color: c.foreground, fontFamily: fonts.bodySemiBold }]}>
                Regenerate
              </Text>
            </Pressable>
            <Pressable
              onPress={copyToClipboard}
              disabled={!generatedPassword}
              style={[
                styles.copyBtn,
                { backgroundColor: generatedPassword ? c.foreground : c.border },
              ]}
            >
              {copied ? (
                <Check size={18} color={c.background} />
              ) : (
                <Copy size={18} color={generatedPassword ? c.background : c.textTertiary} />
              )}
            </Pressable>
          </View>
        </View>

        {/* Length section */}
        <Text style={[styles.sectionTitle, { color: c.foreground, fontFamily: fonts.heading }]}>
          Length
        </Text>
        <View style={[styles.sliderCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.lengthControls}>
            <Pressable
              onPress={() => {
                setLength(Math.max(4, length - 1));
                Haptics.selectionAsync();
              }}
              onLongPress={() => {
                setLength(Math.max(4, length - 5));
                Haptics.selectionAsync();
              }}
              style={[styles.lengthButton, { backgroundColor: c.foreground }]}
            >
              <Minus size={16} color={c.background} />
            </Pressable>

            <View style={styles.lengthDisplay}>
              <Text style={[styles.sliderValue, { color: c.foreground, fontFamily: fonts.bodySemiBold }]}>
                {length}
              </Text>
              {/* Visual progress bar */}
              <View style={[styles.lengthTrack, { backgroundColor: c.border }]}>
                <View style={[
                  styles.lengthFill,
                  { backgroundColor: c.foreground, width: `${((length - 4) / 60) * 100}%` },
                ]} />
              </View>
            </View>

            <Pressable
              onPress={() => {
                setLength(Math.min(64, length + 1));
                Haptics.selectionAsync();
              }}
              onLongPress={() => {
                setLength(Math.min(64, length + 5));
                Haptics.selectionAsync();
              }}
              style={[styles.lengthButton, { backgroundColor: c.foreground }]}
            >
              <Plus size={16} color={c.background} />
            </Pressable>
          </View>
          <View style={styles.sliderLabels}>
            <Text style={[styles.sliderLabel, { color: c.textTertiary, fontFamily: fonts.body }]}>Min: 4</Text>
            <Text style={[styles.sliderLabel, { color: c.textTertiary, fontFamily: fonts.body }]}>Max: 64</Text>
          </View>
        </View>

        {/* Characters section */}
        <Text style={[styles.sectionTitle, { color: c.foreground, fontFamily: fonts.heading }]}>
          Characters
        </Text>
        <View style={[styles.toggleCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <ToggleRow
            label="Uppercase (A-Z)"
            value={includeUppercase}
            onToggle={() => setIncludeUppercase(!includeUppercase)}
            colors={c}
            showBorder
          />
          <ToggleRow
            label="Lowercase (a-z)"
            value={includeLowercase}
            onToggle={() => setIncludeLowercase(!includeLowercase)}
            colors={c}
            showBorder
          />
          <ToggleRow
            label="Numbers (0-9)"
            value={includeNumbers}
            onToggle={() => setIncludeNumbers(!includeNumbers)}
            colors={c}
            showBorder
          />
          <ToggleRow
            label="Symbols (!@#$)"
            value={includeSymbols}
            onToggle={() => setIncludeSymbols(!includeSymbols)}
            colors={c}
          />
        </View>

        {/* Save to vault */}
        {generatedPassword && (
          <Pressable
            onPress={() => setShowSaveModal(true)}
            style={[styles.saveButton, { backgroundColor: c.foreground }]}
          >
            <Save size={18} color={c.background} />
            <Text style={[styles.saveButtonText, { color: c.background, fontFamily: fonts.bodySemiBold }]}>
              Save to Vault
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <CopyToast
        visible={toastVisible}
        message="Password copied"
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
    <View style={[
      styles.toggleRow,
      showBorder && { borderBottomWidth: 1, borderBottomColor: c.border },
    ]}>
      <Text style={[styles.toggleLabel, { color: c.foreground, fontFamily: fonts.body }]}>
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
        trackColor={{ false: c.border, true: c.foreground }}
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 32,
    marginBottom: 20,
  },
  passwordCard: {
    borderRadius: 20,
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
  strengthLabel: {
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
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
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  regenerateText: {
    fontSize: 14,
  },
  copyBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    marginBottom: 12,
  },
  sliderCard: {
    borderRadius: 16,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
  toggleCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 28,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  toggleLabel: {
    fontSize: 15,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
  },
  saveButtonText: {
    fontSize: 15,
  },
});
