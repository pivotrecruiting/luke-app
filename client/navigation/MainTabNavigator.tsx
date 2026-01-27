import React, { memo, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import HomeScreen from "@/screens/HomeScreen";
import InsightsScreen from "@/screens/InsightsScreen";
import AddScreen from "@/screens/AddScreen";
import GoalsScreen from "@/screens/GoalsScreen";
import ProfileScreen from "@/screens/ProfileScreen";

export type MainTabParamList = {
  Home: undefined;
  Insights: undefined;
  Add: undefined;
  Goals: undefined;
  Profile: undefined;
};

type TabIconNameT = keyof typeof Feather.glyphMap;

const TAB_ICONS: Record<keyof MainTabParamList, TabIconNameT> = {
  Home: "home",
  Insights: "bar-chart-2",
  Add: "plus",
  Goals: "star",
  Profile: "user",
};

const TAB_LABELS: Record<keyof MainTabParamList, string> = {
  Home: "Home",
  Insights: "Insights",
  Add: "Add",
  Goals: "Goals",
  Profile: "Profil",
};

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Single Source of Truth: Theme + Metrics
 * -> Hier drehst du in Zukunft NUR noch an diesen Werten.
 */
const ui = {
  color: {
    text: {
      active: "#0F172A",
      inactive: "#64748B",
    },
    border: "rgba(255, 255, 255, 0.5)",
    surface: "rgba(255, 255, 255, 0.4)",
    tintOverlay: "rgba(255, 255, 255, 0.25)",
    shadow: "#0B1220",
    tabItemActiveBackground: "#E2D5F7",
  },
  typography: {
    labelSize: 11,
    labelWeight: "500" as const,
  },
  radius: {
    pill: 999,
    tabBar: 30,
    tabItem: 24,
  },
  spacing: {
    xs: 4,
    sm: 6,
    md: 10,
    lg: 16,
  },
  metrics: {
    tabBarHeight: 60,
    tabItemMinWidth: 60,
    iconSize: 18,
    labelTopGap: 3,
    safe: {
      bottomInset: 16, // Abstand unterhalb der Tabbar (innerhalb SafeAreaView)
    },
    layout: {
      horizontalInset: 16, // links/rechts Außenabstand der gesamten Tabbar
      innerHorizontalPadding: 10, // padding innerhalb der Tabbar
    },
    blur: {
      intensity: 35,
      tint: "light" as const,
    },
  },
  shadow: {
    ios: {
      shadowColor: "#0B1220",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
    },
    android: {
      elevation: 12,
    },
  },
};

/**
 * Minimaler, stabiler TabBar Aufbau:
 * - SafeAreaView ist nur für Außenabstände zuständig
 * - Tabbar ist nur für "Container Look"
 * - Row ist nur für Layout der Items
 */
const SimpleTabBar = memo(({ state, navigation }: BottomTabBarProps) => {
  const s = useMemo(() => makeStyles(ui), []);

  return (
    <SafeAreaView edges={["bottom"]} style={s.safeArea}>
      <View style={s.tabBar}>
        <BlurView
          intensity={ui.metrics.blur.intensity}
          tint={ui.metrics.blur.tint}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.glassTint} pointerEvents="none" />

        <View style={s.tabRow}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const routeName = route.name as keyof MainTabParamList;

            const handlePress = () => {
              if (!isFocused) navigation.navigate(route.name as never);
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={handlePress}
                style={[s.tabItem, isFocused && s.tabItemActive]}
                activeOpacity={0.75}
              >
                <Feather
                  name={TAB_ICONS[routeName]}
                  size={ui.metrics.iconSize}
                  color={
                    isFocused ? ui.color.text.active : ui.color.text.inactive
                  }
                />
                <Text style={[s.tabLabel, isFocused && s.tabLabelActive]}>
                  {TAB_LABELS[routeName]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
});

SimpleTabBar.displayName = "SimpleTabBar";

export default function MainTabNavigatorNew() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <SimpleTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Insights" component={InsightsScreen} />
      <Tab.Screen name="Add" component={AddScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

/**
 * Styles werden aus "ui" abgeleitet.
 * -> Keine losen Werte mehr, keine Überraschungen.
 */
function makeStyles(theme: typeof ui) {
  return StyleSheet.create({
    safeArea: {
      backgroundColor: "transparent",
      paddingHorizontal: theme.metrics.layout.horizontalInset,
      paddingBottom: theme.metrics.safe.bottomInset,
    },

    tabBar: {
      height: theme.metrics.tabBarHeight,
      borderRadius: theme.radius.tabBar,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.color.border,
      backgroundColor: theme.color.surface,

      ...theme.shadow.ios,
      ...theme.shadow.android,
    },

    glassTint: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.color.tintOverlay,
    },

    tabRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      paddingHorizontal: theme.metrics.layout.innerHorizontalPadding,
    },

    tabItem: {
      minWidth: theme.metrics.tabItemMinWidth,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius.tabItem,
      backgroundColor: "transparent",
    },

    tabItemActive: {
      backgroundColor: theme.color.tabItemActiveBackground,
    },

    tabLabel: {
      marginTop: theme.metrics.labelTopGap,
      fontSize: theme.typography.labelSize,
      fontWeight: theme.typography.labelWeight,
      color: theme.color.text.inactive,
    },

    tabLabelActive: {
      color: theme.color.text.active,
    },
  });
}
