import { useFormContext } from 'react-hook-form';
import { FormType } from './form';
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { ImageIcon, X } from 'lucide-react-native';
import { useColor } from '@/hooks/useColor';
import * as ImagePicker from 'expo-image-picker';

export function FieldIcon() {
  const { setValue, watch } = useFormContext<FormType>();
  const icon = watch('icon');

  const borderColor = useColor('border');
  const muted = useColor('textMuted');
  const primary = useColor('primary');
  const cardColor = useColor('card');

  const pickImage = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        '需要权限',
        '请在设置中允许访问相册以选择图标',
        [{ text: '确定' }]
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      base64: true,
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]?.base64) {
      const asset = result.assets[0];
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const base64Uri = `data:${mimeType};base64,${asset.base64}`;
      setValue('icon', base64Uri, { shouldDirty: true });
    }
  };

  const removeIcon = () => {
    setValue('icon', undefined, { shouldDirty: true });
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={pickImage}
        style={[
          styles.picker,
          {
            borderColor,
            backgroundColor: icon ? 'transparent' : cardColor,
          },
        ]}
        activeOpacity={0.7}
      >
        {icon ? (
          <Image
            source={{ uri: icon }}
            style={styles.previewImage}
          />
        ) : (
          <View style={styles.placeholder}>
            <ImageIcon size={24} color={muted} />
            <Text
              style={[styles.placeholderText, { color: muted }]}
            >
              选择图标
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {icon && (
        <TouchableOpacity
          onPress={removeIcon}
          style={[styles.removeButton, { backgroundColor: primary }]}
        >
          <X size={14} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 8,
  },
  picker: {
    width: 80,
    height: 80,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  placeholder: {
    alignItems: 'center',
    gap: 4,
  },
  placeholderText: {
    fontSize: 12,
  },
  removeButton: {
    position: 'absolute',
    top: -4,
    right: '50%',
    marginRight: -44,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
