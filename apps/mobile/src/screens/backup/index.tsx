import * as Haptics from 'expo-haptics';
import {
  ArchiveRestore,
  FileText,
  ShieldCheck,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { useTranslation } from '@repo/i18n';
import {
  deleteExportedFile,
  exportCsv,
  exportEncryptedBackup,
  mergeEntries,
  type PassphraseIssue,
  pickBackupFile,
  readEncryptedBackup,
  validateExistingPassphrase,
  validateNewPassphrase,
} from '@/features/backup';
import { usePasswordStore } from '@/store/passwordStore';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';

function selection() {
  if (process.env.EXPO_OS === 'ios') {
    void Haptics.selectionAsync();
  }
}

type PassphraseMode = 'export' | 'import';

interface PassphraseModalState {
  mode: PassphraseMode;
  raw?: string;
}

function backupErrorMessage(
  error: unknown,
  t: ReturnType<typeof useTranslation>['t']
) {
  const code = error instanceof Error ? error.message : '';
  switch (code) {
    case 'BAD_PASSPHRASE': {
      return t('backup.errorBadPassphrase');
    }
    case 'NOT_A_BACKUP': {
      return t('backup.errorNotBackup');
    }
    case 'UNSUPPORTED_BACKUP': {
      return t('backup.errorUnsupported');
    }
    default: {
      return t('backup.errorGeneric');
    }
  }
}

export function BackupScreen() {
  const { t } = useTranslation();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = Colors[scheme];

  const {passwords} = usePasswordStore();
  const {addPasswords} = usePasswordStore();

  const [busy, setBusy] = useState<null | 'export' | 'import'>(null);
  const [modal, setModal] = useState<PassphraseModalState | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [issue, setIssue] = useState<PassphraseIssue>(null);

  const closeModal = () => {
    setModal(null);
    setPassphrase('');
    setConfirm('');
    setIssue(null);
  };

  const issueText = (value: PassphraseIssue) => {
    switch (value) {
      case 'required': {
        return t('backup.passphraseRequired');
      }
      case 'tooShort': {
        return t('backup.passphraseTooShort');
      }
      case 'mismatch': {
        return t('backup.passphraseMismatch');
      }
      case null:
      default: {
        return '';
      }
    }
  };

  const offerCleanup = (uri: string) => {
    Alert.alert(t('backup.cleanupTitle'), t('backup.cleanupMessage'), [
      { text: t('backup.cleanupKeep'), style: 'cancel' },
      {
        text: t('backup.cleanupConfirm'),
        style: 'destructive',
        onPress: () => void deleteExportedFile(uri),
      },
    ]);
  };

  const runEncryptedExport = async (pass: string) => {
    setBusy('export');
    try {
      const uri = await exportEncryptedBackup(passwords, pass);
      offerCleanup(uri);
    } catch (error) {
      Alert.alert(t('backup.errorTitle'), backupErrorMessage(error, t));
    } finally {
      setBusy(null);
    }
  };

  const runImport = async (raw: string, pass: string) => {
    setBusy('import');
    try {
      const payload = await readEncryptedBackup(raw, pass);
      const { toAdd, skipped } = mergeEntries(payload.entries, passwords);
      if (toAdd.length > 0) {
        await addPasswords(toAdd);
      }
      Alert.alert(
        t('backup.importSuccessTitle'),
        t('backup.importSuccessMessage', { added: toAdd.length, skipped })
      );
    } catch (error) {
      Alert.alert(t('backup.errorTitle'), backupErrorMessage(error, t));
    } finally {
      setBusy(null);
    }
  };

  const submitModal = () => {
    if (!modal) return;
    if (modal.mode === 'export') {
      const validation = validateNewPassphrase(passphrase, confirm);
      if (validation) {
        setIssue(validation);
        return;
      }
      const pass = passphrase;
      closeModal();
      void runEncryptedExport(pass);
    } else {
      const validation = validateExistingPassphrase(passphrase);
      if (validation) {
        setIssue(validation);
        return;
      }
      const pass = passphrase;
      const raw = modal.raw ?? '';
      closeModal();
      void runImport(raw, pass);
    }
  };

  const startEncryptedExport = () => {
    selection();
    if (passwords.length === 0) {
      Alert.alert(t('backup.title'), t('backup.emptyVault'));
      return;
    }
    setModal({ mode: 'export' });
  };

  const startCsvExport = () => {
    selection();
    if (passwords.length === 0) {
      Alert.alert(t('backup.title'), t('backup.emptyVault'));
      return;
    }
    Alert.alert(t('backup.csvWarningTitle'), t('backup.csvWarningMessage'), [
      { text: t('backup.cancel'), style: 'cancel' },
      {
        text: t('backup.csvWarningConfirm'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusy('export');
            try {
              const uri = await exportCsv(passwords);
              offerCleanup(uri);
            } catch (error) {
              Alert.alert(
                t('backup.errorTitle'),
                backupErrorMessage(error, t)
              );
            } finally {
              setBusy(null);
            }
          })();
        },
      },
    ]);
  };

  const startImport = () => {
    selection();
    void (async () => {
      try {
        const picked = await pickBackupFile();
        if (!picked) return;
        setModal({ mode: 'import', raw: picked.raw });
      } catch (error) {
        Alert.alert(t('backup.errorTitle'), backupErrorMessage(error, t));
      }
    })();
  };

  function ActionRow({
    icon,
    label,
    hint,
    onPress,
    last,
    danger,
  }: {
    icon: React.ReactNode;
    label: string;
    hint: string;
    onPress: () => void;
    last?: boolean;
    danger?: boolean;
  }) {
  return <Pressable
      onPress={onPress}
      disabled={busy !== null}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.actionRow,
        !last && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: c.border,
        },
        busy !== null && styles.disabled,
      ]}
    >
      {icon}
      <View style={styles.rowText}>
        <Text
          style={[
            styles.rowLabel,
            {
              color: danger ? c.accentRed : c.foreground,
              fontFamily: fonts.body,
            },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.rowHint,
            { color: c.mutedForeground, fontFamily: fonts.caption },
          ]}
        >
          {hint}
        </Text>
      </View>
    </Pressable>
}

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <Text
        style={[
          styles.subtitle,
          { color: c.mutedForeground, fontFamily: fonts.body },
        ]}
      >
        {t('backup.screenSubtitle')}
      </Text>

      <View
        style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
      >
        <ActionRow
          icon={<ShieldCheck size={20} color={c.accentGreen} />}
          label={t('backup.exportEncrypted')}
          hint={t('backup.exportEncryptedHint')}
          onPress={startEncryptedExport}
        />
        <ActionRow
          icon={<ArchiveRestore size={20} color={c.accentBlue} />}
          label={t('backup.import')}
          hint={t('backup.importHint')}
          onPress={startImport}
        />
        <ActionRow
          icon={<FileText size={20} color={c.accentRed} />}
          label={t('backup.exportCsv')}
          hint={t('backup.exportCsvHint')}
          onPress={startCsvExport}
          danger
          last
        />
      </View>

      {busy !== null ? (
        <View style={styles.busyRow}>
          <ActivityIndicator color={c.accentBlue} />
          <Text
            style={[
              styles.busyText,
              { color: c.mutedForeground, fontFamily: fonts.caption },
            ]}
          >
            {busy === 'export' ? t('backup.exporting') : t('backup.importing')}
          </Text>
        </View>
      ) : null}

      <Modal
        visible={modal !== null}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.backdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
            <Text
              style={[
                styles.modalTitle,
                { color: c.foreground, fontFamily: fonts.bodySemiBold },
              ]}
            >
              {t('backup.passphraseTitle')}
            </Text>
            <Text
              style={[
                styles.modalPrompt,
                { color: c.mutedForeground, fontFamily: fonts.caption },
              ]}
            >
              {modal?.mode === 'export'
                ? t('backup.passphrasePrompt')
                : t('backup.passphraseImportPrompt')}
            </Text>

            <TextInput
              value={passphrase}
              onChangeText={value => {
                setPassphrase(value);
                setIssue(null);
              }}
              placeholder={t('backup.passphrasePlaceholder')}
              placeholderTextColor={c.textTertiary}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel={t('backup.passphrasePlaceholder')}
              style={[
                styles.input,
                {
                  color: c.foreground,
                  borderColor: c.border,
                  backgroundColor: c.surface,
                  fontFamily: fonts.body,
                },
              ]}
            />
            {modal?.mode === 'export' ? (
              <TextInput
                value={confirm}
                onChangeText={value => {
                  setConfirm(value);
                  setIssue(null);
                }}
                placeholder={t('backup.passphraseConfirmPlaceholder')}
                placeholderTextColor={c.textTertiary}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel={t('backup.passphraseConfirmPlaceholder')}
                style={[
                  styles.input,
                  {
                    color: c.foreground,
                    borderColor: c.border,
                    backgroundColor: c.surface,
                    fontFamily: fonts.body,
                  },
                ]}
              />
            ) : null}

            {issue ? (
              <Text
                style={[
                  styles.errorText,
                  { color: c.accentRed, fontFamily: fonts.caption },
                ]}
              >
                {issueText(issue)}
              </Text>
            ) : null}

            <View style={styles.modalButtons}>
              <Pressable
                onPress={closeModal}
                accessibilityRole="button"
                accessibilityLabel={t('backup.cancel')}
                style={[styles.modalButton, { borderColor: c.border }]}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    { color: c.foreground, fontFamily: fonts.body },
                  ]}
                >
                  {t('backup.cancel')}
                </Text>
              </Pressable>
              <Pressable
                onPress={submitModal}
                accessibilityRole="button"
                accessibilityLabel={t('backup.confirm')}
                style={[
                  styles.modalButton,
                  styles.modalButtonPrimary,
                  { backgroundColor: c.accentBlue, borderColor: c.accentBlue },
                ]}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    { color: '#FFFFFF', fontFamily: fonts.bodySemiBold },
                  ]}
                >
                  {modal?.mode === 'export'
                    ? t('backup.encrypt')
                    : t('backup.confirm')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48, gap: 18 },
  subtitle: { fontSize: 14, lineHeight: 20, paddingHorizontal: 4 },
  card: {
    borderRadius: 14,
    borderCurve: 'continuous',
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  disabled: { opacity: 0.5 },
  rowText: { flex: 1, gap: 3 },
  rowLabel: { fontSize: 16 },
  rowHint: { fontSize: 13, lineHeight: 18 },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  busyText: { fontSize: 13 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    padding: 20,
    gap: 12,
  },
  modalTitle: { fontSize: 18 },
  modalPrompt: { fontSize: 13, lineHeight: 18 },
  input: {
    minHeight: 48,
    borderRadius: 11,
    borderCurve: 'continuous',
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  errorText: { fontSize: 13 },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 4 },
  modalButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  modalButtonPrimary: {},
  modalButtonText: { fontSize: 15 },
});
