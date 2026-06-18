import { FolderIcon } from 'lucide-react-native';
import { useMemo } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { deriveCategories, UNCATEGORIZED } from '@/lib/categories';
import { usePasswordStore } from '@/store/passwordStore';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';
import { FormType } from './form';

/**
 * Category picker: quick chips for existing categories plus a free-text field
 * to create a new one. The stored value is `all` when uncategorized.
 */
export function FieldCategory() {
  const { control } = useFormContext<FormType>();
  const { field } = useController({ control, name: 'category' });
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = Colors[scheme];
  const { passwords } = usePasswordStore();

  const categories = useMemo(() => deriveCategories(passwords), [passwords]);

  const value = field.value ?? UNCATEGORIZED;
  const isExisting = value === UNCATEGORIZED || categories.includes(value);
  const customText = isExisting ? '' : value;
  const chips = [UNCATEGORIZED, ...categories];

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <FolderIcon size={14} color={c.mutedForeground} />
        <Text
          style={[
            styles.label,
            { color: c.mutedForeground, fontFamily: fonts.bodySemiBold },
          ]}
        >
          CATEGORY
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        keyboardShouldPersistTaps="handled"
      >
        {chips.map(category => {
          const active = value === category;
          const label = category === UNCATEGORIZED ? 'Uncategorized' : category;
          return (
            <Pressable
              key={category}
              onPress={() => field.onChange(category)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={label}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? c.foreground : c.surface,
                  borderColor: active ? c.foreground : c.border,
                },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.chipText,
                  {
                    color: active ? c.background : c.mutedForeground,
                    fontFamily: active ? fonts.bodySemiBold : fonts.body,
                  },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <TextInput
        value={customText}
        onChangeText={text => field.onChange(text.length ? text : UNCATEGORIZED)}
        placeholder="New category…"
        placeholderTextColor={c.textTertiary}
        autoCapitalize="words"
        style={[
          styles.input,
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
  field: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: 12, letterSpacing: 0.5 },
  chipRow: { gap: 8, paddingVertical: 2 },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 10,
    borderCurve: 'continuous',
    borderWidth: 1,
  },
  chipText: { fontSize: 14 },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 10,
    borderCurve: 'continuous',
    paddingHorizontal: 12,
    fontSize: 15,
  },
});
