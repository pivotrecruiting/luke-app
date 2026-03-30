import React from "react";
import { createNativeBottomTabNavigator } from "@react-navigation/bottom-tabs/unstable";

import HomeScreen from "@/screens/HomeScreen";
import InsightsScreen from "@/screens/InsightsScreen";
import AddScreen from "@/screens/AddScreen";
import GoalsScreen from "@/screens/GoalsScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import type { MainTabParamList } from "@/navigation/MainTabNavigator";
import { useTheme } from "@/hooks/useTheme";

const Tab = createNativeBottomTabNavigator<MainTabParamList>();

/**
 * Uses the native iOS tab bar so the system can apply Liquid Glass automatically.
 */
export default function MainTabNavigator() {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarControllerMode: "tabBar",
        tabBarBlurEffect: "systemDefault",
        tabBarActiveTintColor: theme.primary,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
          tabBarLabel: "Home",
          tabBarIcon: ({ focused }) => ({
            type: "sfSymbol",
            name: focused ? "house.fill" : "house",
          }),
        }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{
          title: "Insights",
          tabBarLabel: "Insights",
          tabBarIcon: ({ focused }) => ({
            type: "sfSymbol",
            name: focused ? "chart.bar.fill" : "chart.bar",
          }),
        }}
      />
      <Tab.Screen
        name="Add"
        component={AddScreen}
        options={{
          title: "Add",
          tabBarLabel: "Add",
          tabBarIcon: ({ focused }) => ({
            type: "sfSymbol",
            name: focused ? "plus.circle.fill" : "plus.circle",
          }),
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          title: "Goals",
          tabBarLabel: "Goals",
          tabBarIcon: ({ focused }) => ({
            type: "sfSymbol",
            name: focused ? "star.fill" : "star",
          }),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused }) => ({
            type: "sfSymbol",
            name: focused ? "person.fill" : "person",
          }),
        }}
      />
    </Tab.Navigator>
  );
}
