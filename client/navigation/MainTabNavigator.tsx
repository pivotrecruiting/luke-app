import React from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import HomeScreen from "@/screens/HomeScreen";
import InsightsScreen from "@/screens/InsightsScreen";

function PlaceholderScreen() {
  return <View style={styles.placeholder} />;
}

export type MainTabParamList = {
  Home: undefined;
  Insights: undefined;
  Add: undefined;
  Goals: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabButton, focused && styles.tabButtonActive]}>
              <View style={[styles.homeCircle, focused && styles.homeCircleActive]} />
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                Home
              </Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabButton, focused && styles.tabButtonActive]}>
              <View style={[styles.insightsCircle, focused && styles.insightsCircleActive]} />
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                Insights
              </Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Add"
        component={PlaceholderScreen}
        options={{
          tabBarLabel: "",
          tabBarIcon: ({ color }) => (
            <Feather name="plus" size={28} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Goals"
        component={PlaceholderScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="star" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={PlaceholderScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Feather name="square" size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 6,
    paddingBottom: 7,
    paddingHorizontal: 16,
    borderRadius: 100,
  },
  tabButtonActive: {
    backgroundColor: "#E1D4F6",
  },
  insightsCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#9CA3AF",
  },
  insightsCircleActive: {
    backgroundColor: "#6155F5",
  },
  homeCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#9CA3AF",
    transform: [{ rotate: "45deg" }],
  },
  homeCircleActive: {
    backgroundColor: "#6155F5",
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
    marginTop: 2,
  },
  tabLabelActive: {
    color: "#3B82F6",
  },
});
