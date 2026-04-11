import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  View,
  Pressable,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PasswordForm, PasswordFormRef } from '@/components/password-form';
import { useMutation } from '@tanstack/react-query';
import { Password, usePasswordStore } from '@/store/passwordStore';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';
import * as Haptics from 'expo-haptics';

interface Props {
  onClose: () => void;
  initialPassword?: string;
}

export function ModalAddPassword({ onClose, initialPassword }: Props) {
  const [visible, setVisible] = useState(true);
  const { addPassword } = usePasswordStore();
  const formRef = useRef<PasswordFormRef>(null);
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: Omit<Password, 'id' | 'created_at' | 'updated_at'>) => {
      await addPassword(data);
    },
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      handleClose();
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to save password. Please try again.');
    },
  });

  useEffect(() => {
    if (Platform.OS === 'android' && !visible) {
      setTimeout(() => onClose?.(), 300);
    }
  }, [visible, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
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
            <Text style={[styles.cancelText, { color: c.accentBlue, fontFamily: fonts.body }]}>
              Cancel
            </Text>
          </Pressable>
          <Text style={[styles.title, { color: c.foreground, fontFamily: fonts.heading }]}>
            Add Password
          </Text>
          <Pressable
            onPress={() => formRef.current?.requestSubmit()}
            disabled={isPending}
          >
            <Text style={[
              styles.saveText,
              { fontFamily: fonts.bodySemiBold },
              isPending ? { color: c.textTertiary } : { color: c.accentBlue },
            ]}>
              {isPending ? 'Saving...' : 'Save'}
            </Text>
          </Pressable>
        </View>

        {/* Form */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.formWrapper}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <PasswordForm
              ref={formRef}
              onSubmit={mutate}
              initialValue={initialPassword ? { password: initialPassword } : undefined}
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
