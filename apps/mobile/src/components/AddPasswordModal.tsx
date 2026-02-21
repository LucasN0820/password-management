import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Modal } from 'react-native';
import { X, Eye, EyeOff } from 'lucide-react-native';
import { usePasswordStore } from '@/store/passwordStore';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AddPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  password?: any;
}

export default function AddPasswordModal({ visible, onClose, password }: AddPasswordModalProps) {
  const [formData, setFormData] = useState({
    title: password?.title || '',
    username: password?.username || '',
    password: password?.password || '',
    url: password?.url || '',
    notes: password?.notes || '',
    category: password?.category || 'all',
    favorite: password?.favorite || 0,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { addPassword, updatePassword } = usePasswordStore();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '标题不能为空';
    }
    if (!formData.password.trim()) {
      newErrors.password = '密码不能为空';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (password) {
        await updatePassword(password.id, formData);
        Alert.alert('成功', '密码已更新');
      } else {
        await addPassword(formData);
        Alert.alert('成功', '密码已添加');
      }
      handleClose();
    } catch (error) {
      Alert.alert('错误', '操作失败，请重试');
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      username: '',
      password: '',
      url: '',
      notes: '',
      category: 'all',
      favorite: 0,
    });
    setShowPassword(false);
    setErrors({});
    onClose();
  };

  const updateFormData = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView edges={['top', 'bottom']} className='flex-1'>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {password ? '编辑密码' : '添加密码'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Title */}
            <View style={styles.field}>
              <Text style={styles.label}>标题 *</Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                value={formData.title}
                onChangeText={(value) => updateFormData('title', value)}
                placeholder="输入密码标题"
              />
              {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
            </View>

            {/* Username */}
            <View style={styles.field}>
              <Text style={styles.label}>用户名</Text>
              <TextInput
                style={styles.input}
                value={formData.username}
                onChangeText={(value) => updateFormData('username', value)}
                placeholder="输入用户名或邮箱"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
            <View style={styles.field}>
              <Text style={styles.label}>密码 *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  placeholder="输入密码"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#6b7280" />
                  ) : (
                    <Eye size={20} color="#6b7280" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* URL */}
            <View style={styles.field}>
              <Text style={styles.label}>网址</Text>
              <TextInput
                style={styles.input}
                value={formData.url}
                onChangeText={(value) => updateFormData('url', value)}
                placeholder="https://example.com"
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>

            {/* Category */}
            <View style={styles.field}>
              <Text style={styles.label}>分类</Text>
              <TextInput
                style={styles.input}
                value={formData.category}
                onChangeText={(value) => updateFormData('category', value)}
                placeholder="输入分类名称"
              />
            </View>

            {/* Notes */}
            <View style={styles.field}>
              <Text style={styles.label}>备注</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(value) => updateFormData('notes', value)}
                placeholder="添加备注信息"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.button, styles.cancelButton]}
            >
              <Text style={styles.cancelButtonText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[styles.button, styles.submitButton]}
            >
              <Text style={styles.submitButtonText}>
                {password ? '更新' : '添加'}
              </Text>
            </TouchableOpacity>
          </View>
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
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
  },
  eyeButton: {
    padding: 12,
    position: 'absolute',
    right: 0,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});
