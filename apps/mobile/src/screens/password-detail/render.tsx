import { Password, usePasswordStore } from '@/store/passwordStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Redirect, Stack } from 'expo-router';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  StyleSheet,
} from 'react-native';
import { Text } from '@/components/ui/text';
import {
  Copy,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Star,
  Globe,
  User,
  Key,
  FileText,
} from 'lucide-react-native';
import { useColor } from '@/hooks/useColor';
import { useState } from 'react';
import { useStore } from './context';

export function Render({ passwordItem }: { passwordItem: Password }) {
  const { deletePassword, toggleFavorite } = usePasswordStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [optimisticFavorite, setOptimisticFavorite] = useState<boolean | null>(
    null
  );
  const setModal = useStore(s => s.setModal);

  const qc = useQueryClient();

  const backgroundColor = useColor('background');
  const cardColor = useColor('card');
  const textColor = useColor('text');
  const borderColor = useColor('border');
  const primaryColor = useColor('primary');
  const destructiveColor = useColor('red');

  const { id, title, username, password, url, notes, favorite } = passwordItem;

  const styles = StyleSheet.create({
    header: {
      backgroundColor: backgroundColor,
    },
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    contentContainer: {
      padding: 20,
    },
    headerSection: {
      backgroundColor: cardColor,
      borderRadius: 16,
      padding: 24,
      marginBottom: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 16,
      backgroundColor: primaryColor,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    iconText: {
      fontSize: 24,
      fontWeight: '600',
      color: 'white',
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: textColor,
      textAlign: 'center',
      marginBottom: 8,
    },
    headerMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    favoriteButton: {
      padding: 4,
      borderRadius: 8,
    },
    sectionCard: {
      backgroundColor: cardColor,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: borderColor,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 12,
      color: `${textColor}60`,
      fontWeight: '500',
    },
    sectionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    contentText: {
      fontSize: 16,
      color: textColor,
      flex: 1,
      fontWeight: '500',
    },
    copyButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: `${primaryColor}10`,
    },
    passwordActions: {
      flexDirection: 'row',
      gap: 8,
    },
    iconButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: `${primaryColor}10`,
    },
    urlContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    urlText: {
      fontSize: 16,
      color: primaryColor,
      flex: 1,
      fontWeight: '500',
      textDecorationLine: 'underline',
    },
    notesText: {
      fontSize: 16,
      color: textColor,
      lineHeight: 24,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    editButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      backgroundColor: primaryColor,
      gap: 8,
    },
    deleteButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 12,
      backgroundColor: destructiveColor,
      gap: 8,
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    copiedFeedback: {
      position: 'absolute',
      top: 60,
      left: 20,
      right: 20,
      backgroundColor: '#10b981',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    copiedText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '500',
    },
  });

  const handleCopyPassword = async () => {
    try {
      await Share.share({
        message: password,
        title: `Password for ${title}`,
      });
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy password:', error);
    }
  };

  const handleCopyUsername = async () => {
    try {
      await Share.share({
        message: username,
        title: `Username for ${title}`,
      });
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy username:', error);
    }
  };

  const handleDelete = () => {
    setModal({
      type: 'delete-password',
      id: passwordItem.id,
      title: passwordItem.title,
    });
  };

  const handleEdit = () => {
    setModal({
      type: 'edit-password',
      id: passwordItem.id,
    });
  };

  const handleToggleFavorite = async () => {
    const currentFavorite = favorite === 1;
    const newFavorite = !currentFavorite;

    // Optimistic update: immediately update UI
    setOptimisticFavorite(newFavorite);

    try {
      // Background update: sync with database
      await toggleFavorite(passwordItem);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      await qc.invalidateQueries({
        queryKey: ['findPassword', id],
      });
      setOptimisticFavorite(null);
    }
  };

  // Use optimistic favorite state if available, otherwise use data
  const currentFavorite =
    optimisticFavorite !== null ? optimisticFavorite : favorite === 1;

  const getFavoriteButtonStyle = () => ({
    padding: 4,
    borderRadius: 8,
    backgroundColor: currentFavorite ? `${primaryColor}20` : 'transparent',
  });

  const getDomainIcon = () => {
    if (url) {
      try {
        return new URL(url).hostname.charAt(0).toUpperCase();
      } catch {
        return title.charAt(0).toUpperCase() || '';
      }
    }
    return title.charAt(0).toUpperCase() || '';
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: title,
          headerStyle: styles.header,
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>{getDomainIcon()}</Text>
          </View>

          <Text style={styles.title}>{title}</Text>

          <View style={styles.headerMeta}>
            <TouchableOpacity
              onPress={handleToggleFavorite}
              style={getFavoriteButtonStyle()}
            >
              <Star
                size={20}
                color={currentFavorite ? '#f59e0b' : `${textColor}40`}
                fill={currentFavorite ? '#f59e0b' : 'none'}
              />
            </TouchableOpacity>
            {url && <Globe size={16} color={`${textColor}60`} />}
          </View>
        </View>

        {/* Username Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <User
              size={16}
              color={`${textColor}60`}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.sectionTitle}>用户名</Text>
          </View>

          <View style={styles.sectionContent}>
            <Text style={styles.contentText}>{username}</Text>
            <TouchableOpacity
              onPress={handleCopyUsername}
              style={styles.copyButton}
            >
              <Copy size={16} color={primaryColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Password Section */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Key
              size={16}
              color={`${textColor}60`}
              style={{ marginRight: 8 }}
            />
            <Text style={styles.sectionTitle}>密码</Text>
          </View>

          <View style={styles.sectionContent}>
            <Text style={styles.contentText}>
              {showPassword ? password : '•••••••••'}
            </Text>
            <View style={styles.passwordActions}>
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.iconButton}
              >
                {showPassword ? (
                  <EyeOff size={16} color={primaryColor} />
                ) : (
                  <Eye size={16} color={primaryColor} />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCopyPassword}
                style={styles.iconButton}
              >
                <Copy size={16} color={primaryColor} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* URL Section */}
        {url && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Globe
                size={16}
                color={`${textColor}60`}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.sectionTitle}>网址</Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                // TODO: Open URL in browser
                console.log('Open URL:', url);
              }}
              style={styles.urlContent}
            >
              <Text style={styles.urlText}>{url}</Text>
              <View style={styles.iconButton}>
                <Globe size={16} color={primaryColor} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Notes Section */}
        {notes && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <FileText
                size={16}
                color={`${textColor}60`}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.sectionTitle}>备注</Text>
            </View>

            <Text style={styles.notesText}>{notes}</Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
            <Edit size={18} color="white" />
            <Text style={styles.buttonText}>编辑</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Trash2 size={18} color="white" />
            <Text style={styles.buttonText}>删除</Text>
          </TouchableOpacity>
        </View>

        {/* Copied Feedback */}
        {showCopied && (
          <View style={styles.copiedFeedback}>
            <Text style={styles.copiedText}>已复制到剪贴板</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}
