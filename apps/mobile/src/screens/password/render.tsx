import { useState } from "react";
import { useStore } from "./context";
import { Password, usePasswordStore } from "@/store/passwordStore";
import { Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Search, Plus, Star, Copy, Eye, EyeOff } from 'lucide-react-native';
import { ModalController } from "./modal-controller";
import { TabViewContainer } from "./tab-view-container";

export function Render() {
  const [searchVisible, setSearchVisible] = useState(false);
  const [showPasswords, setShowPasswords] = useState<{ [key: number]: boolean }>({});
  const setModal = useStore(s => s.setModal)

  const {
    searchQuery,
    setSearchQuery,
    toggleFavorite,
    deletePassword
  } = usePasswordStore();

  const handleCopyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('已复制', `${label}已复制到剪贴板`);
    } catch (error) {
      Alert.alert('错误', '复制失败');
    }
  };

  const handleDeletePassword = (password: Password) => {
    Alert.alert(
      '删除密码',
      `确定要删除 "${password.title}" 吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => deletePassword(password.id)
        }
      ]
    );
  };

  const togglePasswordVisibility = (id: number) => {
    setShowPasswords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderPasswordItem = ({ item }: { item: Password }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{item.title}</Text>
          <TouchableOpacity onPress={() => toggleFavorite(item)}>
            {item.favorite ? (
              <Star size={20} fill="#fbbf24" color="#fbbf24" />
            ) : (
              <Star size={20} color="#9ca3af" />
            )}
          </TouchableOpacity>
        </View>

        {item.username && (
          <Text style={styles.username}>{item.username}</Text>
        )}

        {item.url && (
          <Text style={styles.url}>{item.url}</Text>
        )}

        <View style={styles.passwordRow}>
          <Text style={styles.password}>
            {showPasswords[item.id] ? item.password : '••••••••'}
          </Text>
          <View style={styles.passwordActions}>
            <TouchableOpacity
              onPress={() => togglePasswordVisibility(item.id)}
              style={styles.iconButton}
            >
              {showPasswords[item.id] ? (
                <EyeOff size={18} color="#6b7280" />
              ) : (
                <Eye size={18} color="#6b7280" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleCopyToClipboard(item.password, '密码')}
              style={styles.iconButton}
            >
              <Copy size={18} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.category}>{item.category}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.viewButton}
            >
              <Text style={styles.buttonText}>查看</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeletePassword(item)}
              style={styles.deleteButton}
            >
              <Text style={styles.buttonText}>删除</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>密码管理</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => setSearchVisible(!searchVisible)}
                style={styles.iconButton}
              >
                <Search size={20} color="#6b7280" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModal({ type: 'add-password' })}
                style={styles.iconButton}
              >
                <Plus size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>

          {searchVisible && (
            <TextInput
              style={styles.searchInput}
              placeholder="搜索密码..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          )}
        </View>
        {/* Password List */}
        {/* <FlatList
          data={filteredPasswords}
          renderItem={renderPasswordItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadPasswords}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {searchQuery ? '没有找到匹配的密码' : '还没有密码，点击 + 添加第一个密码'}
              </Text>
            </View>
          }
        /> */}
        <TabViewContainer />
      </View>
      <ModalController />
    </>

  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  categoryFilter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f9fafb',
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#3b82f6',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#374151',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  card: {
    margin: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  username: {
    color: '#6b7280',
    marginBottom: 4,
  },
  url: {
    color: '#2563eb',
    fontSize: 14,
    marginBottom: 8,
  },
  passwordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  password: {
    flex: 1,
    color: '#1f2937',
    fontFamily: 'monospace',
  },
  passwordActions: {
    flexDirection: 'row',
    gap: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  category: {
    fontSize: 12,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#ef4444',
    borderRadius: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
  },
});