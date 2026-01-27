import React from "react";
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
 * Simple tab bar layout with minimal styling.
 */
const SimpleTabBar = ({ state, navigation }: BottomTabBarProps) => {
  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <View style={styles.tabBar}>
        <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFill} />
        <View style={styles.glassTint} pointerEvents="none" />
        <View style={styles.tabRow}>
          {state.routes.map((route, index) => {
            const isFocused = state.index === index;
            const routeName = route.name as keyof MainTabParamList;
            const iconName = TAB_ICONS[routeName];
            const label = TAB_LABELS[routeName];

            const handlePress = () => {
              if (isFocused) return;
              navigation.navigate(route.name as never);
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={handlePress}
                style={styles.tabItem}
              >
                <Feather
                  name={iconName}
                  size={18}
                  color={isFocused ? "#0F172A" : "#64748B"}
                />
                <Text
                  style={[styles.tabLabel, isFocused && styles.tabLabelActive]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
};

/**
 * Main tab navigator with a minimal, clean tab bar.
 */
export default function MainTabNavigatorNew() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
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

const styles = StyleSheet.create({
  safeArea: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "transparent",
  },
  tabBar: {
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    shadowColor: "#0B1220",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  glassTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  tabRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
    paddingVertical: 6,
    backgroundColor: "transparent",
    borderRadius: 24,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 3,
  },
  tabLabelActive: {
    color: "#0F172A",
  },
});
