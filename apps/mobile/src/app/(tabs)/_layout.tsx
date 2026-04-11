import { Tabs } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { KeyRound, Wand2 } from 'lucide-react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

function NotionTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { backgroundColor: c.background, borderTopColor: c.border, paddingBottom: Math.max(insets.bottom, 24) }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key]!;
        const isFocused = state.index === index;
        const color = isFocused ? c.foreground : c.tabIconDefault;

        const icon = index === 0
          ? <KeyRound size={22} color={color} />
          : <Wand2 size={22} color={color} />;

        const label = index === 0 ? 'My Vault' : 'Generate';

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
            <Text style={[
              styles.tabLabel,
              { color, fontFamily: isFocused ? fonts.bodySemiBold : fonts.body },
            ]}>
              {label}
            </Text>
            {isFocused && (
              <View style={[styles.activeDot, { backgroundColor: c.accentBlue }]} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <SafeAreaView edges={['top']} className="flex-1">
      <Tabs
        tabBar={props => <NotionTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="generator" />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 40,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 11,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
