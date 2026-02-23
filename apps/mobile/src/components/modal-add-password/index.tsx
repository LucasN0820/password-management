import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PasswordForm } from '@/components/password-form';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useMutation } from '@tanstack/react-query';
import { Password, usePasswordStore } from '@/store/passwordStore';
import { PasswordFormRef, FormType } from '@/components/password-form';
import { X } from 'lucide-react-native';

interface Props {
  onClose: () => void;
}

export function ModalAddPassword({ onClose }: Props) {
  const [visible, setVisible] = useState(true)
  const { addPassword } = usePasswordStore()
  const formRef = useRef<PasswordFormRef>(null)

  const handleClose = useCallback(() => {
    setVisible(false)
  }, []);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: Omit<Password, 'id' | 'created_at' | 'updated_at'>) => {
      await addPassword(data)
    },
    onSuccess: () => {
      handleClose()
    }
  })

  useEffect(() => {
    // On Android, onClose is not called.
    if (Platform.OS === "android" && !visible) {
      setTimeout(() => {
        onClose?.()
      }, 300)
    }
  }, [visible, onClose])

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      // onRequestClose={handleClose}
      onDismiss={onClose}
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>添加密码</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>
        <View style={styles.form}>
          <PasswordForm ref={formRef} onSubmit={mutate} />
        </View>
        <View style={styles.actions}>
          <Button variant="outline" onPress={handleClose} disabled={isPending}>
            <Text>取消</Text>
          </Button>
          <Button onPress={() => {
            formRef.current?.requestSubmit()
          }} loading={isPending}>
            <Text>添加</Text>
          </Button>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    flex: 1,
    padding: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
});
