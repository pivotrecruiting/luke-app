import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OnboardingNavigator from "@/navigation/OnboardingNavigator";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import GoalDetailScreen from "@/screens/GoalDetailScreen";
import { useApp } from "@/context/AppContext";

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  GoalDetail: {
    goalId: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const { isOnboardingComplete } = useApp();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={isOnboardingComplete ? "Main" : "Onboarding"}
    >
      <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen 
        name="GoalDetail" 
        component={GoalDetailScreen}
        options={{ 
          presentation: "transparentModal",
          animation: "fade",
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
    </Stack.Navigator>
  );
}
