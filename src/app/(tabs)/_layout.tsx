import { useAuth } from "@clerk/expo";
import { Redirect, Tabs, type Href } from "expo-router";
import type { BottomTabBarProps } from "expo-router/tabs";
import { Pressable, Text, type ColorValue, View } from "react-native";

import { SymbolIcon, type SymbolIconName } from "@/components/ui/SymbolIcon";
import { colors } from "@/constants/colors";

const signInHref = "/sign-in" as Href;

export const unstable_settings = {
  initialRouteName: "home",
};

function CareerFoxTabBar({
  descriptors,
  insets,
  navigation,
  state,
}: BottomTabBarProps) {
  return (
    <View
      className="bg-transparent px-5 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 10) }}
    >
      <View
        className="h-[92px] flex-row items-center rounded-full border border-[#EEE7FF] bg-white px-2"
        style={{ boxShadow: "0 -8px 28px rgba(13, 19, 43, 0.10)" }}
      >
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];
          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : options.title ?? route.name;
          const color = isFocused ? colors.primary : "#8F92A8";
          const icon = options.tabBarIcon?.({
            color: isFocused ? colors.white : "#8F92A8",
            focused: isFocused,
            size: 24,
          });

          const handlePress = () => {
            const event = navigation.emit({
              canPreventDefault: true,
              target: route.key,
              type: "tabPress",
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const handleLongPress = () => {
            navigation.emit({
              target: route.key,
              type: "tabLongPress",
            });
          };

          return (
            <Pressable
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              className="h-[78px] flex-1 items-center justify-center"
              key={route.key}
              onLongPress={handleLongPress}
              onPress={handlePress}
              testID={options.tabBarButtonTestID}
            >
              <View
                className="h-[50px] w-[50px] items-center justify-center rounded-full"
                style={{
                  backgroundColor: isFocused ? colors.primary : "transparent",
                }}
              >
                {icon}
              </View>
              <Text
                adjustsFontSizeToFit
                className="mt-1 w-full text-center text-[11px] font-bold leading-[15px]"
                minimumFontScale={0.78}
                numberOfLines={1}
                style={{ color }}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const tabIconNames = {
  "book.closed": {
    focused: "book.closed.fill",
    unfocused: "book.closed",
  },
  briefcase: {
    focused: "briefcase.fill",
    unfocused: "briefcase",
  },
  house: {
    focused: "house.fill",
    unfocused: "house",
  },
  mic: {
    focused: "mic.fill",
    unfocused: "mic",
  },
  person: {
    focused: "person.fill",
    unfocused: "person",
  },
} satisfies Record<string, { focused: SymbolIconName; unfocused: SymbolIconName }>;

type TabIconProps = {
  color: ColorValue;
  focused: boolean;
  name: keyof typeof tabIconNames;
  size: number;
};

function TabIcon({ color, focused, name, size }: TabIconProps) {
  const symbolName = focused
    ? tabIconNames[name].focused
    : tabIconNames[name].unfocused;

  return (
    <SymbolIcon
      accessibilityLabel={name}
      color={color}
      name={symbolName}
      size={size}
    />
  );
}

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href={signInHref} />;
  }

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.white },
        tabBarActiveTintColor: colors.primary,
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: "#8F92A8",
      }}
      tabBar={(props) => <CareerFoxTabBar {...props} />}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarAccessibilityLabel: "Home tab",
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon color={color} focused={focused} name="house" size={size} />
          ),
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          tabBarAccessibilityLabel: "Learn tab",
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon
              color={color}
              focused={focused}
              name="book.closed"
              size={size}
            />
          ),
          title: "Learn",
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          tabBarAccessibilityLabel: "Coach tab",
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon color={color} focused={focused} name="mic" size={size} />
          ),
          title: "Coach",
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          tabBarAccessibilityLabel: "Applications tab",
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon
              color={color}
              focused={focused}
              name="briefcase"
              size={size}
            />
          ),
          title: "Applications",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarAccessibilityLabel: "Profile tab",
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon color={color} focused={focused} name="person" size={size} />
          ),
          title: "Profile",
        }}
      />
    </Tabs>
  );
}
