import { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  CheckCircle2,
  Download,
  FileText,
  Play,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react-native';
import { useTranslation } from '@repo/i18n';
import { usePasswordStore } from '@/store/passwordStore';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';
import { useMobileImportStore } from '@/features/ai-import/import-store';
import type {
  EditableImportCandidate,
  MobileModelStatus,
} from '@/features/ai-import/types';

function formatBytes(bytes: number) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  return `${Math.round(bytes / 1024 ** 2)} MB`;
}

export function AiImportScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const { addPasswords } = usePasswordStore();
  const state = useMobileImportStore();

  useEffect(() => {
    void state.initialize();
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState !== 'active') void state.handleAppBackground();
    });
    return () => {
      subscription.remove();
      void state.handleAppBackground();
    };
  }, []);

  const handleSave = useCallback(async () => {
    const saved = await state.saveCandidates(addPasswords);
    if (!saved) return;
    if (process.env.EXPO_OS === 'ios') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.back();
  }, [addPasswords, router, state.saveCandidates]);

  const busy = ['downloading', 'processing', 'saving'].includes(state.stage);
  const selectedCount = state.candidates.filter(
    candidate => candidate.selected
  ).length;

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.notice, { backgroundColor: c.selectedBg }]}>
        <View style={styles.noticeHeader}>
          <ShieldCheck size={20} color={c.accentGreen} />
          <Text
            style={[
              styles.noticeTitle,
              { color: c.foreground, fontFamily: fonts.bodySemiBold },
            ]}
          >
            {t('aiImport.localPrivate')}
          </Text>
          <View style={[styles.badge, { backgroundColor: c.accentYellow }]}>
            <Text
              style={[
                styles.badgeText,
                { color: c.background, fontFamily: fonts.bodySemiBold },
              ]}
            >
              {t('aiImport.experimental')}
            </Text>
          </View>
        </View>
        <Text
          selectable
          style={[
            styles.bodyText,
            { color: c.mutedForeground, fontFamily: fonts.body },
          ]}
        >
          {t('aiImport.privacyDescription')}
        </Text>
      </View>

      <SectionTitle title={t('aiImport.modelTitle')} color={c.foreground} />
      <Text
        style={[
          styles.sectionHint,
          { color: c.mutedForeground, fontFamily: fonts.body },
        ]}
      >
        {t('aiImport.modelHint')}
      </Text>
      <View style={styles.stack}>
        {state.models.map(status => (
          <ModelCard
            key={status.model.id}
            status={status}
            selected={status.model.id === state.selectedModelId}
            downloading={
              state.stage === 'downloading' &&
              state.downloadProgress?.modelId === status.model.id
            }
            progress={
              state.downloadProgress?.modelId === status.model.id
                ? state.downloadProgress.fraction
                : 0
            }
            disabled={busy}
            onSelect={() => void state.selectModel(status.model.id)}
            onDownload={() => {
              void state
                .selectModel(status.model.id)
                .then(() => state.downloadSelectedModel());
            }}
            onRemove={() => {
              Alert.alert(
                t('aiImport.removeModel'),
                t('aiImport.removeModelConfirm', { name: status.model.name }),
                [
                  { text: t('aiImport.cancel'), style: 'cancel' },
                  {
                    text: t('aiImport.remove'),
                    style: 'destructive',
                    onPress: () => void state.removeModel(status.model.id),
                  },
                ]
              );
            }}
          />
        ))}
      </View>

      <SectionTitle title={t('aiImport.filesTitle')} color={c.foreground} />
      <Text
        style={[
          styles.sectionHint,
          { color: c.mutedForeground, fontFamily: fonts.body },
        ]}
      >
        {t('aiImport.filesHint')}
      </Text>
      <Pressable
        onPress={() => void state.pickFiles()}
        disabled={busy}
        style={[
          styles.outlineButton,
          { borderColor: c.border, backgroundColor: c.card },
        ]}
      >
        <FileText size={19} color={c.foreground} />
        <Text
          style={[
            styles.buttonText,
            { color: c.foreground, fontFamily: fonts.bodySemiBold },
          ]}
        >
          {t('aiImport.selectFiles')}
        </Text>
      </Pressable>
      {state.files.map(file => (
        <View
          key={file.path}
          style={[styles.fileRow, { borderColor: c.border }]}
        >
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={[
                styles.fileName,
                { color: c.foreground, fontFamily: fonts.body },
              ]}
            >
              {file.name}
            </Text>
            <Text
              style={[
                styles.caption,
                { color: c.mutedForeground, fontFamily: fonts.caption },
              ]}
            >
              {formatBytes(file.size)}
            </Text>
          </View>
          <CheckCircle2 size={18} color={c.accentGreen} />
        </View>
      ))}

      {state.error ? (
        <Text
          selectable
          style={[styles.error, { color: c.accentRed, fontFamily: fonts.body }]}
        >
          {state.error}
        </Text>
      ) : null}

      {state.warnings.map(warning => (
        <Text
          key={warning}
          selectable
          style={[
            styles.warning,
            { color: c.accentYellow, fontFamily: fonts.body },
          ]}
        >
          {warning}
        </Text>
      ))}

      {state.stage === 'processing' && state.progress ? (
        <View style={[styles.progressCard, { backgroundColor: c.surface }]}>
          <ActivityIndicator color={c.foreground} />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.buttonText,
                { color: c.foreground, fontFamily: fonts.bodySemiBold },
              ]}
            >
              {t(`aiImport.phase.${state.progress.phase}`)}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                styles.caption,
                { color: c.mutedForeground, fontFamily: fonts.caption },
              ]}
            >
              {state.progress.fileName ?? t('aiImport.finishing')}
            </Text>
          </View>
        </View>
      ) : null}

      {state.stage !== 'review' ? (
        <View style={styles.buttonRow}>
          <Pressable
            onPress={() => void state.runImport()}
            disabled={busy || !state.files.length}
            style={[
              styles.primaryButton,
              {
                backgroundColor: c.foreground,
                opacity: busy || !state.files.length ? 0.45 : 1,
              },
            ]}
          >
            {state.stage === 'processing' ? (
              <ActivityIndicator color={c.background} />
            ) : (
              <Play size={18} color={c.background} />
            )}
            <Text
              style={[
                styles.primaryButtonText,
                { color: c.background, fontFamily: fonts.bodySemiBold },
              ]}
            >
              {t('aiImport.startImport')}
            </Text>
          </Pressable>
          {busy ? (
            <Pressable
              onPress={() => void state.cancelCurrentOperation()}
              style={[styles.cancelButton, { borderColor: c.border }]}
            >
              <X size={18} color={c.accentRed} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {state.stage === 'review' || state.stage === 'saving' ? (
        <>
          <SectionTitle
            title={t('aiImport.reviewTitle')}
            color={c.foreground}
          />
          <Text
            style={[
              styles.sectionHint,
              { color: c.mutedForeground, fontFamily: fonts.body },
            ]}
          >
            {t('aiImport.reviewHint')}
          </Text>
          {state.candidates.length ? (
            state.candidates.map(candidate => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onChange={patch => state.updateCandidate(candidate.id, patch)}
                onRemove={() => state.removeCandidate(candidate.id)}
              />
            ))
          ) : (
            <Text
              style={[
                styles.emptyText,
                { color: c.mutedForeground, fontFamily: fonts.body },
              ]}
            >
              {t('aiImport.noCandidates')}
            </Text>
          )}
          <View style={styles.buttonRow}>
            <Pressable
              onPress={() => void handleSave()}
              disabled={!selectedCount || state.stage === 'saving'}
              style={[
                styles.primaryButton,
                {
                  backgroundColor: c.foreground,
                  opacity: selectedCount ? 1 : 0.45,
                },
              ]}
            >
              {state.stage === 'saving' ? (
                <ActivityIndicator color={c.background} />
              ) : (
                <ShieldCheck size={18} color={c.background} />
              )}
              <Text
                style={[
                  styles.primaryButtonText,
                  { color: c.background, fontFamily: fonts.bodySemiBold },
                ]}
              >
                {t('aiImport.saveSelected', { count: selectedCount })}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => void state.reset()}
              style={[styles.cancelButton, { borderColor: c.border }]}
            >
              <X size={18} color={c.mutedForeground} />
            </Pressable>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function SectionTitle({ title, color }: { title: string; color: string }) {
  return (
    <Text style={[styles.sectionTitle, { color, fontFamily: fonts.heading }]}>
      {title}
    </Text>
  );
}

function ModelCard({
  status,
  selected,
  downloading,
  progress,
  disabled,
  onSelect,
  onDownload,
  onRemove,
}: {
  status: MobileModelStatus;
  selected: boolean;
  downloading: boolean;
  progress: number;
  disabled: boolean;
  onSelect: () => void;
  onDownload: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  return (
    <Pressable
      onPress={onSelect}
      disabled={disabled}
      style={[
        styles.modelCard,
        {
          backgroundColor: selected ? c.selectedBg : c.card,
          borderColor: selected ? c.accentBlue : c.border,
        },
      ]}
    >
      <View style={styles.modelHeader}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.modelName,
              { color: c.foreground, fontFamily: fonts.bodySemiBold },
            ]}
          >
            {status.model.name}
          </Text>
          <Text
            style={[
              styles.caption,
              { color: c.mutedForeground, fontFamily: fonts.caption },
            ]}
          >
            {formatBytes(status.model.sizeBytes)} · {status.model.description}
          </Text>
        </View>
        {selected ? <CheckCircle2 size={20} color={c.accentBlue} /> : null}
      </View>
      {downloading ? (
        <View style={styles.downloadRow}>
          <ActivityIndicator size="small" color={c.foreground} />
          <Text
            style={[
              styles.caption,
              { color: c.foreground, fontFamily: fonts.caption },
            ]}
          >
            {Math.round(progress * 100)}%
          </Text>
        </View>
      ) : status.downloaded ? (
        <View style={styles.downloadRow}>
          <Text
            style={[
              styles.downloaded,
              { color: c.accentGreen, fontFamily: fonts.bodySemiBold },
            ]}
          >
            {t('aiImport.downloaded')}
          </Text>
          <Pressable onPress={onRemove} hitSlop={10}>
            <Trash2 size={17} color={c.accentRed} />
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onDownload}
          disabled={disabled}
          style={[styles.smallButton, { borderColor: c.border }]}
        >
          <Download size={16} color={c.foreground} />
          <Text
            style={[
              styles.smallButtonText,
              { color: c.foreground, fontFamily: fonts.bodySemiBold },
            ]}
          >
            {t('aiImport.download')}
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
}

function CandidateCard({
  candidate,
  onChange,
  onRemove,
}: {
  candidate: EditableImportCandidate;
  onChange: (patch: Partial<EditableImportCandidate>) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  return (
    <View
      style={[
        styles.candidateCard,
        { backgroundColor: c.card, borderColor: c.border },
      ]}
    >
      <View style={styles.candidateHeader}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.modelName,
              { color: c.foreground, fontFamily: fonts.bodySemiBold },
            ]}
          >
            {candidate.sourceFile}
          </Text>
          <Text
            style={[
              styles.caption,
              { color: c.mutedForeground, fontFamily: fonts.caption },
            ]}
          >
            {t('aiImport.confidence', {
              value: Math.round(candidate.confidence * 100),
            })}
          </Text>
        </View>
        <Switch
          value={candidate.selected}
          onValueChange={selected => onChange({ selected })}
        />
        <Pressable onPress={onRemove} hitSlop={10}>
          <Trash2 size={18} color={c.accentRed} />
        </Pressable>
      </View>
      <CandidateField
        label={t('aiImport.fields.title')}
        value={candidate.title}
        onChangeText={title => onChange({ title })}
      />
      <CandidateField
        label={t('aiImport.fields.username')}
        value={candidate.username}
        onChangeText={username => onChange({ username })}
        autoCapitalize="none"
      />
      <CandidateField
        label={t('aiImport.fields.password')}
        value={candidate.password}
        onChangeText={password => onChange({ password })}
        autoCapitalize="none"
      />
      <CandidateField
        label={t('aiImport.fields.url')}
        value={candidate.url ?? ''}
        onChangeText={url => onChange({ url: url || null })}
        autoCapitalize="none"
        keyboardType="url"
      />
      <CandidateField
        label={t('aiImport.fields.notes')}
        value={candidate.notes ?? ''}
        onChangeText={notes => onChange({ notes: notes || null })}
        multiline
      />
      {candidate.sourceExcerpt ? (
        <Text
          selectable
          style={[
            styles.excerpt,
            { color: c.mutedForeground, fontFamily: fonts.mono },
          ]}
        >
          {candidate.sourceExcerpt}
        </Text>
      ) : null}
    </View>
  );
}

function CandidateField({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  return (
    <View style={styles.field}>
      <Text
        style={[
          styles.fieldLabel,
          { color: c.mutedForeground, fontFamily: fonts.caption },
        ]}
      >
        {label}
      </Text>
      <TextInput
        {...props}
        placeholderTextColor={c.textTertiary}
        style={[
          styles.input,
          props.multiline && styles.multiline,
          {
            color: c.foreground,
            backgroundColor: c.surface,
            borderColor: c.border,
            fontFamily: fonts.body,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 48, gap: 12 },
  notice: { borderRadius: 16, borderCurve: 'continuous', padding: 16, gap: 10 },
  noticeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noticeTitle: { fontSize: 16, flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  bodyText: { fontSize: 14, lineHeight: 21 },
  sectionTitle: { fontSize: 24, marginTop: 14 },
  sectionHint: { fontSize: 13, lineHeight: 19, marginTop: -7 },
  stack: { gap: 10 },
  modelCard: {
    borderWidth: 1,
    borderRadius: 14,
    borderCurve: 'continuous',
    padding: 14,
    gap: 12,
  },
  modelHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  modelName: { fontSize: 15 },
  caption: { fontSize: 12, lineHeight: 17 },
  downloadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  downloaded: { fontSize: 13 },
  smallButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 14,
    gap: 7,
    borderWidth: 1,
    borderRadius: 10,
  },
  smallButtonText: { fontSize: 13 },
  outlineButton: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  buttonText: { fontSize: 15 },
  fileRow: {
    minHeight: 54,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileName: { fontSize: 14 },
  error: { fontSize: 13, lineHeight: 19 },
  warning: { fontSize: 13, lineHeight: 19 },
  progressCard: {
    borderRadius: 12,
    borderCurve: 'continuous',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  primaryButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: { fontSize: 15 },
  cancelButton: {
    width: 52,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { textAlign: 'center', paddingVertical: 24 },
  candidateCard: {
    borderWidth: 1,
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 14,
    gap: 12,
  },
  candidateHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 12 },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  multiline: { minHeight: 82, paddingTop: 12, textAlignVertical: 'top' },
  excerpt: { fontSize: 11, lineHeight: 16 },
});
