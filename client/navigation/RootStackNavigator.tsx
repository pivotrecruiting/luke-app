import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OnboardingNavigator from "@/navigation/OnboardingNavigator";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import GoalDetailScreen from "@/screens/GoalDetailScreen";

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  GoalDetail: {
    goal: {
      id: string;
      name: string;
      icon: string;
      current: number;
      target: number;
      remaining: number;
    };
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen 
        name="GoalDetail" 
        component={GoalDetailScreen}
        options={{ presentation: "modal" }}
      />
    </Stack.Navigator>
  );
}
