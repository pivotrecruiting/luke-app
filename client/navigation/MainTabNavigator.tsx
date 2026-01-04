import React from "react";
import { View, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import HomeScreen from "@/screens/HomeScreen";

function PlaceholderScreen() {
  return <View style={styles.placeholder} />;
}

export type MainTabParamList = {
  Home: undefined;
  Tab2: undefined;
  Tab3: undefined;
  Tab4: undefined;
  Tab5: undefined;
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
        name="Tab2"
        component={PlaceholderScreen}
        options={{
          tabBarLabel: "Label",
          tabBarIcon: ({ color }) => (
            <Feather name="circle" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Tab3"
        component={PlaceholderScreen}
        options={{
          tabBarLabel: "Label",
          tabBarIcon: ({ color }) => (
            <Feather name="star" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Tab4"
        component={PlaceholderScreen}
        options={{
          tabBarLabel: "Label",
          tabBarIcon: ({ color }) => (
            <Feather name="square" size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Tab5"
        component={PlaceholderScreen}
        options={{
          tabBarLabel: "Label",
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
});
