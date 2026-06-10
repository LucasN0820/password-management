import { useState } from "react";
import { useWindowDimensions } from "react-native";
import { SceneMap,TabView } from 'react-native-tab-view';
import { TabBar } from "react-native-tab-view";
import { useColor } from "@/hooks/useColor";
import { AllPassword } from "./password-all";
import { FavoritePassword } from "./password-favorite";

const renderScene = SceneMap({
  all: AllPassword,
  favorite: FavoritePassword,
});

const routes = [
  { key: 'all', title: '全部' },
  { key: 'favorite', title: '收藏' },
];

export function TabViewContainer() {
  const [index, setIndex] = useState(0);
  const initialLayout = useWindowDimensions();
  const background = useColor('background');
  const foreground = useColor('foreground');
  const mutedForeground = useColor('mutedForeground');

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={initialLayout}
      renderTabBar={(props) => {
        return (
          <TabBar
            {...props}
            style={{ backgroundColor: background }}
            tabStyle={{ display: 'flex', justifyContent: 'center' }}
            indicatorStyle={{ backgroundColor: foreground }}
            activeColor={foreground}
            inactiveColor={mutedForeground}
          />
        )
      }}
    />
  );
}