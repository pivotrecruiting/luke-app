import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OnboardingNavigator from "@/navigation/OnboardingNavigator";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import GoalDetailScreen from "@/screens/GoalDetailScreen";
import IncomeScreen from "@/screens/IncomeScreen";
import ExpensesScreen from "@/screens/ExpensesScreen";
import { useApp } from "@/context/AppContext";

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  GoalDetail: {
    goalId: string;
  };
  Income: undefined;
  Expenses: undefined;
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
          animation: "fade_from_bottom",
          animationDuration: 200,
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen 
        name="Income" 
        component={IncomeScreen}
        options={{ 
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen 
        name="Expenses" 
        component={ExpensesScreen}
        options={{ 
          headerShown: false,
          animation: "slide_from_right",
        }}
      />
    </Stack.Navigator>
  );
}
