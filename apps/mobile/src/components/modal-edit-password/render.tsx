import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from '@repo/i18n';
import { useMutation } from '@tanstack/react-query';
import {
  FormType,
  PasswordForm,
  PasswordFormRef,
} from '@/components/password-form';
import { Password, usePasswordStore } from '@/store/passwordStore';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';

export function Render({
  initialValue,
  onClose,
  id,
}: {
  initialValue: FormType;
  onClose: () => void;
  id: number;
}) {
  const { t } = useTranslation();
  const { updatePassword } = usePasswordStore();
  const [visible, setVisible] = useState(true);
  const formRef = useRef<PasswordFormRef>(null);
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = Colors[scheme];

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  const { mutate, isPending } = useMutation({
    mutationFn: async (
      data: Omit<Password, 'id' | 'created_at' | 'updated_at'>
    ) => {
      await updatePassword(id, data);
    },
    onSuccess: () => {
      if (process.env.EXPO_OS === 'ios') {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      }
      handleClose();
    },
    onError: () => {
      if (process.env.EXPO_OS === 'ios') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert(t('toast.error'), t('modal.updateFailed'));
    },
  });

  useEffect(() => {
    if (process.env.EXPO_OS === 'android' && !visible) {
      setTimeout(() => onClose?.(), 300);
    }
  }, [visible, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
      onDismiss={onClose}
    >
      <SafeAreaView
        edges={['top', 'bottom']}
        style={[styles.container, { backgroundColor: c.background }]}
      >
        {/* Drag handle */}
        <View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: c.border }]} />
        </View>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: c.border }]}>
          <Pressable onPress={handleClose} disabled={isPending}>
            <Text
              style={[
                styles.cancelText,
                { color: c.accentBlue, fontFamily: fonts.body },
              ]}
            >
              {t('modal.cancel')}
            </Text>
          </Pressable>
          <Text
            style={[
              styles.title,
              { color: c.foreground, fontFamily: fonts.heading },
            ]}
          >
            {t('modal.editPassword')}
          </Text>
          <Pressable
            onPress={() => formRef.current?.requestSubmit()}
            disabled={isPending}
          >
            <Text
              style={[
                styles.saveText,
                { fontFamily: fonts.bodySemiBold },
                isPending ? { color: c.textTertiary } : { color: c.accentBlue },
              ]}
            >
              {isPending ? t('modal.saving') : t('modal.save')}
            </Text>
          </Pressable>
        </View>

        {/* Form */}
        <KeyboardAvoidingView
          behavior={process.env.EXPO_OS === 'ios' ? 'padding' : 'height'}
          style={styles.formWrapper}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.formContent}
            contentInsetAdjustmentBehavior="automatic"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <PasswordForm
              ref={formRef}
              onSubmit={mutate}
              initialValue={initialValue}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  cancelText: {
    fontSize: 15,
  },
  title: {
    fontSize: 20,
  },
  saveText: {
    fontSize: 15,
  },
  formWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  formContent: {
    padding: 20,
    paddingBottom: 40,
  },
});
