import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from "@react-navigation/bottom-tabs";
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
    <SafeAreaView edges={["bottom"]} style={styles.tabBar}>
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
              color={isFocused ? "#111827" : "#6B7280"}
            />
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
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
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingTop: 8,
    paddingBottom: 8,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 4,
  },
  tabLabelActive: {
    color: "#111827",
  },
});
