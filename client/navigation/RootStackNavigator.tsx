import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OnboardingNavigator from "@/navigation/OnboardingNavigator";
import MainTabNavigator from "@/navigation/MainTabNavigator";

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
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
    </Stack.Navigator>
  );
}
