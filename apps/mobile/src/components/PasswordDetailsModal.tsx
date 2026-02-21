import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, StyleSheet, Modal, ScrollView } from 'react-native';
import { X, Copy, Eye, EyeOff, Edit, Star, Globe, User, FileText } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { usePasswordStore, Password } from '@/store/passwordStore';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PasswordDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  password: Password | null;
  onEdit: (password: Password) => void;
}

export default function PasswordDetailsModal({
  visible,
  onClose,
  password,
  onEdit
}: PasswordDetailsModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { toggleFavorite, deletePassword } = usePasswordStore();

  const handleCopyToClipboard = async (text: string, fieldName: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      Alert.alert('错误', '复制失败');
    }
  };

  const handleToggleFavorite = async () => {
    if (password) {
      await toggleFavorite(password);
    }
  };

  const handleDelete = () => {
    if (!password) return;

    Alert.alert(
      '删除密码',
      `确定要删除 "${password.title}" 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            await deletePassword(password.id);
            onClose();
          }
        }
      ]
    );
  };

  const handleEdit = () => {
    if (password) {
      onEdit(password);
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const DetailRow = ({
    icon,
    label,
    value,
    isPassword = false,
    fieldName
  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    isPassword?: boolean;
    fieldName: string;
  }) => (
    <View style={styles.detailRow}>
      <View style={styles.detailHeader}>
        <View style={styles.detailIcon}>
          {icon}
        </View>
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailValue}>
          {isPassword && !showPassword ? '••••••••' : value || '未设置'}
        </Text>
        <View style={styles.detailActions}>
          {isPassword && (
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.actionButton}
            >
              {showPassword ? (
                <EyeOff size={16} color="#6b7280" />
              ) : (
                <Eye size={16} color="#6b7280" />
              )}
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => handleCopyToClipboard(value, fieldName)}
            style={styles.actionButton}
          >
            <Copy size={16} color="#6b7280" />
          </TouchableOpacity>
          {copiedField === fieldName && (
            <Text style={styles.copiedText}>已复制</Text>
          )}
        </View>
      </View>
    </View>
  );

  if (!password) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView edges={['top', 'bottom']} className='flex-1'>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>{password.title}</Text>
              <TouchableOpacity onPress={handleToggleFavorite} style={styles.favoriteButton}>
                {password.favorite ? (
                  <Star size={20} fill="#fbbf24" color="#fbbf24" />
                ) : (
                  <Star size={20} color="#9ca3af" />
                )}
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Password */}
            <DetailRow
              icon={<User size={20} color="#3b82f6" />}
              label="密码"
              value={password.password}
              isPassword={true}
              fieldName="password"
            />

            {/* Username */}
            <DetailRow
              icon={<User size={20} color="#3b82f6" />}
              label="用户名"
              value={password.username}
              fieldName="username"
            />

            {/* URL */}
            <DetailRow
              icon={<Globe size={20} color="#3b82f6" />}
              label="网址"
              value={password.url}
              fieldName="url"
            />

            {/* Notes */}
            <DetailRow
              icon={<FileText size={20} color="#3b82f6" />}
              label="备注"
              value={password.notes}
              fieldName="notes"
            />

            {/* Category */}
            <DetailRow
              icon={<Star size={20} color="#3b82f6" />}
              label="分类"
              value={password.category}
              fieldName="category"
            />

            {/* Metadata */}
            <View style={styles.metadataSection}>
              <Text style={styles.metadataTitle}>信息</Text>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>创建时间</Text>
                <Text style={styles.metadataValue}>{formatDate(password.created_at)}</Text>
              </View>
              <View style={styles.metadataRow}>
                <Text style={styles.metadataLabel}>更新时间</Text>
                <Text style={styles.metadataValue}>{formatDate(password.updated_at)}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleEdit}
              style={[styles.actionButtonLarge, styles.editButton]}
            >
              <Edit size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>编辑</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={[styles.actionButtonLarge, styles.deleteButton]}
            >
              <X size={20} color="#ffffff" />
              <Text style={styles.actionButtonText}>删除</Text>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  detailRow: {
    marginBottom: 24,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  detailContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  detailValue: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    fontFamily: 'monospace',
    marginRight: 12,
  },
  detailActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  copiedText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  metadataSection: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  metadataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metadataLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  metadataValue: {
    fontSize: 14,
    color: '#1f2937',
    fontFamily: 'monospace',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButtonLarge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  editButton: {
    backgroundColor: '#3b82f6',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});
