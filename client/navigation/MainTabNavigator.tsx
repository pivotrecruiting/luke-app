import React, { memo, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Line } from "react-native-svg";

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
    tabItemMinWidth: 80,
    iconSize: 18,
    addIconSize: 28,
    addItemSize: 56,
    addItemElevation: 8,
    addItemTopOffset: 16,
    labelTopGap: 3,
    safe: {
      bottomInset: 16, // Abstand unterhalb der Tabbar (innerhalb SafeAreaView)
      contentInset: 30, // Content kann bis zur Hälfte der Tab Bar Höhe sichtbar sein (tabBarHeight / 2)
    },
    layout: {
      horizontalInset: 4, // links/rechts Außenabstand der gesamten Tabbar (minimal für fast volle Breite)
      innerHorizontalPadding: 10, // padding innerhalb der Tabbar
    },
    blur: {
      intensity: 50,
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
 * - Add Item ist absolut positioniert und schwebt über der Tab Bar
 */
const SimpleTabBar = memo(({ state, navigation }: BottomTabBarProps) => {
  const s = useMemo(() => makeStyles(ui), []);

  // Separate routes: Add Item wird separat behandelt
  const regularRoutes = state.routes.filter((route) => route.name !== "Add");
  const addRoute = state.routes.find((route) => route.name === "Add");
  const isAddFocused =
    addRoute && state.index === state.routes.indexOf(addRoute);

  return (
    <SafeAreaView edges={["bottom"]} style={s.safeArea}>
      <View style={s.tabBarContainer} pointerEvents="box-none">
        <View style={s.tabBar}>
          <BlurView
            intensity={ui.metrics.blur.intensity}
            tint={ui.metrics.blur.tint}
            style={StyleSheet.absoluteFill}
          />
          <View style={s.glassTint} pointerEvents="none" />

          <View style={s.tabRow}>
            {regularRoutes.map((route, index) => {
              const originalIndex = state.routes.indexOf(route);
              const isFocused = state.index === originalIndex;
              const routeName = route.name as keyof MainTabParamList;

              const handlePress = () => {
                if (!isFocused) navigation.navigate(route.name as never);
              };

              return (
                <React.Fragment key={route.key}>
                  {/* Placeholder spacer in the middle to create space for the floating Add button */}
                  {index === 2 && (
                    <View style={s.placeholderSpacer} pointerEvents="none" />
                  )}
                  <TouchableOpacity
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
                        isFocused
                          ? ui.color.text.active
                          : ui.color.text.inactive
                      }
                    />
                    <Text style={[s.tabLabel, isFocused && s.tabLabelActive]}>
                      {TAB_LABELS[routeName]}
                    </Text>
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Add Item absolut positioniert über der Tab Bar */}
        {addRoute && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={isAddFocused ? { selected: true } : {}}
            onPress={() => {
              if (!isAddFocused) navigation.navigate("Add" as never);
            }}
            style={[s.addItem, isAddFocused && s.addItemActive]}
            activeOpacity={0.75}
          >
            <Svg
              width={ui.metrics.addIconSize}
              height={ui.metrics.addIconSize}
              viewBox="0 0 24 24"
            >
              <Line
                x1="12"
                y1="5"
                x2="12"
                y2="19"
                stroke={
                  isAddFocused ? ui.color.text.active : ui.color.text.inactive
                }
                strokeWidth="3"
                strokeLinecap="round"
              />
              <Line
                x1="5"
                y1="12"
                x2="19"
                y2="12"
                stroke={
                  isAddFocused ? ui.color.text.active : ui.color.text.inactive
                }
                strokeWidth="3"
                strokeLinecap="round"
              />
            </Svg>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
});

SimpleTabBar.displayName = "SimpleTabBar";

export default function MainTabNavigatorNew() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 0,
        },
        sceneStyle: {
          paddingBottom: ui.metrics.tabBarHeight / 2,
        },
      }}
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
      paddingHorizontal: 0,
      paddingBottom: 0,
    },

    tabBarContainer: {
      position: "absolute",
      bottom: 0,
      left: theme.metrics.layout.horizontalInset,
      right: theme.metrics.layout.horizontalInset,
      paddingBottom: theme.metrics.safe.bottomInset,
      alignItems: "center",
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
      backgroundColor: "transparent",
    },

    tabRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-around",
      paddingHorizontal: theme.metrics.layout.innerHorizontalPadding,
    },

    placeholderSpacer: {
      width: theme.metrics.addItemSize,
      height: theme.metrics.addItemSize,
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

    addItem: {
      position: "absolute",
      top: -theme.metrics.addItemTopOffset,
      alignSelf: "center",
      width: theme.metrics.addItemSize,
      height: theme.metrics.addItemSize,
      borderRadius: theme.metrics.addItemSize / 2,
      backgroundColor: theme.color.surface,
      borderWidth: 1,
      borderColor: theme.color.border,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
      ...theme.shadow.ios,
      ...theme.shadow.android,
      elevation: theme.metrics.addItemElevation + 5,
    },

    addItemActive: {
      backgroundColor: theme.color.tabItemActiveBackground,
    },
  });
}
