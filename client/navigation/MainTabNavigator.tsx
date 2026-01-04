import React from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import HomeScreen from "@/screens/HomeScreen";
import InsightsScreen from "@/screens/InsightsScreen";

function InsightsTabButton({ onPress, accessibilityState }: any) {
  const focused = accessibilityState?.selected;
  return (
    <View style={styles.insightsTabWrapper}>
      <Pressable
        onPress={onPress}
        style={[
          styles.insightsTabButton,
          focused ? styles.insightsTabButtonActive : null,
        ]}
      >
        <View style={[styles.insightsCircle, focused ? styles.insightsCircleActive : null]} />
        <Text style={[styles.insightsLabel, focused ? styles.insightsLabelActive : null]}>
          Insights
        </Text>
      </Pressable>
    </View>
  );
}

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
          tabBarIcon: ({ color, focused }) => (
            <View
              style={[
                styles.homeIconContainer,
                focused && styles.homeIconContainerActive,
              ]}
            >
              {focused ? (
                <View style={styles.diamondActive}>
                  <View style={styles.iconRotateBack}>
                    <Feather name="home" size={20} color="#FFFFFF" />
                  </View>
                </View>
              ) : (
                <View style={styles.diamond}>
                  <Feather name="home" size={20} color={color} />
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Insights"
        component={InsightsScreen}
        options={{
          tabBarButton: (props) => <InsightsTabButton {...props} />,
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
  homeIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  homeIconContainerActive: {
    marginBottom: 4,
  },
  diamond: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  diamondActive: {
    width: 44,
    height: 44,
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    transform: [{ rotate: "45deg" }],
    justifyContent: "center",
    alignItems: "center",
  },
  iconRotateBack: {
    transform: [{ rotate: "-45deg" }],
  },
  insightsTabWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  insightsTabButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 6,
    paddingBottom: 7,
    paddingHorizontal: 16,
    borderRadius: 100,
  },
  insightsTabButtonActive: {
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
  insightsLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
    marginTop: 2,
  },
  insightsLabelActive: {
    color: "#3B82F6",
  },
});
