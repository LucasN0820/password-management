import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { KeyRound, Plus, Wand2 } from 'lucide-react-native';
import { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useTranslation } from '@repo/i18n';
import {
  createStore,
  StoreContext,
  useStore,
} from '@/screens/password/context';
import { ModalController } from '@/screens/password/modal-controller';
import { Colors } from '@/theme/colors';
import { fonts } from '@/theme/globals';

function VaultTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const scheme = useColorScheme() ?? 'light';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();
  const setModal = useStore(s => s.setModal);

  const handleAddPassword = () => {
    if (process.env.EXPO_OS === 'ios') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setModal({ type: 'add-password' });
  };

  const renderTab = (index: number) => {
    const route = state.routes[index];
    if (!route) return null;

    const { options } = descriptors[route.key];
    const isFocused = state.index === index;
    const color = isFocused ? c.foreground : c.tabIconDefault;
    const label = index === 0 ? t('tabs.myVault') : t('tabs.generate');

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate(route.name, route.params);
      }
    };

    return (
      <Pressable
        onPress={onPress}
        style={styles.tabItem}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
      >
        {index === 0 ? (
          <KeyRound size={22} color={color} />
        ) : (
          <Wand2 size={22} color={color} />
        )}
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
          <View style={[styles.activeDot, { backgroundColor: c.accentBlue }]} />
        )}
      </Pressable>
    );
  };

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
      {renderTab(0)}
      <View
        collapsable={false}
        style={[styles.addButtonShell, { backgroundColor: c.accentBlue }]}
      >
        <Pressable
          onPress={handleAddPassword}
          accessibilityRole="button"
          accessibilityLabel={t('home.addPassword')}
          hitSlop={8}
          style={styles.addButtonPressable}
        >
          <Plus size={26} strokeWidth={2.5} color="#FFFFFF" />
        </Pressable>
      </View>
      {renderTab(1)}
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const store = useMemo(() => createStore(), []);

  return (
    <StoreContext.Provider value={store}>
      <View style={[styles.safeArea, { paddingTop: insets.top }]}>
        <Tabs
          tabBar={props => <VaultTabBar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="generator" />
        </Tabs>
        <ModalController />
      </View>
    </StoreContext.Provider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: 1,
    paddingTop: 10,
    paddingHorizontal: 24,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
    minHeight: 48,
  },
  addButtonShell: {
    width: 50,
    height: 50,
    marginHorizontal: 12,
    overflow: 'hidden',
    borderRadius: 20,
    marginTop: -5
  },
  addButtonPressable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
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
