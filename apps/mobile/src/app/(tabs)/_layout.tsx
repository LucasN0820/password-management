import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { KeyRound, Wand2 } from 'lucide-react-native';
import { Pressable, StyleSheet,Text, View } from 'react-native';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTranslation } from '@repo/i18n';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';

function VaultTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: c.background,
          borderTopColor: c.border,
          paddingBottom: Math.max(insets.bottom, 18),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const color = isFocused ? c.foreground : c.tabIconDefault;

        const icon =
          index === 0 ? (
            <KeyRound size={22} color={color} />
          ) : (
            <Wand2 size={22} color={color} />
          );

        const label = index === 0 ? t('tabs.myVault') : t('tabs.generate');

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
          >
            {icon}
            <Text
              style={[
                styles.tabLabel,
                {
                  color,
                  fontFamily: isFocused ? fonts.bodySemiBold : fonts.body,
                },
              ]}
            >
              {label}
            </Text>
            {isFocused && (
              <View
                style={[styles.activeDot, { backgroundColor: c.accentBlue }]}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top }]}>
      <Tabs
        tabBar={props => <VaultTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="generator" />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 34,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    minHeight: 48,
  },
  tabLabel: {
    fontSize: 11,
  },
  activeDot: {
    width: 18,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
});
