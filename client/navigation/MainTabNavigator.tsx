import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import HomeScreen from "@/screens/HomeScreen";
import InsightsScreen from "@/screens/InsightsScreen";
import AddScreen from "@/screens/AddScreen";
import GoalsScreen from "@/screens/GoalsScreen";
import ProfileScreen from "@/screens/ProfileScreen";

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
                Insight
              </Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Add"
        component={AddScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabButton, focused && styles.tabButtonActive]}>
              <View style={[styles.addCircle, focused && styles.addCircleActive]}>
                <Feather name="plus" size={18} color={focused ? "#FFFFFF" : "#9CA3AF"} />
              </View>
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                Add
              </Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabButton, focused && styles.tabButtonActive]}>
              <Feather name="star" size={22} color={focused ? "#6155F5" : "#9CA3AF"} />
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                Goals
              </Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: ({ focused }) => (
            <View style={[styles.tabButton, focused && styles.tabButtonActive]}>
              <Feather name="user" size={22} color={focused ? "#6155F5" : "#9CA3AF"} />
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                Profil
              </Text>
            </View>
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
    paddingHorizontal: 6,
    borderRadius: 100,
    minWidth: 44,
  },
  tabButtonActive: {
  },
  insightsCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#9CA3AF",
  },
  insightsCircleActive: {
    backgroundColor: "#6155F5",
  },
  homeCircle: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: "#9CA3AF",
    transform: [{ rotate: "45deg" }],
  },
  homeCircleActive: {
    backgroundColor: "#6155F5",
  },
  addCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  addCircleActive: {
    backgroundColor: "#6155F5",
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: "500",
    color: "#9CA3AF",
    marginTop: 2,
    textAlign: "center",
  },
  tabLabelActive: {
    color: "#3B82F6",
  },
});
