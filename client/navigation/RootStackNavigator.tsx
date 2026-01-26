import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OnboardingNavigator from "@/navigation/OnboardingNavigator";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import GoalDetailScreen from "@/screens/GoalDetailScreen";
import BudgetDetailScreen from "@/screens/BudgetDetailScreen";
import IncomeScreen from "@/screens/IncomeScreen";
import ExpensesScreen from "@/screens/ExpensesScreen";
import LevelUpScreen from "@/screens/LevelUpScreen";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  GoalDetail: {
    goalId: string;
  };
  BudgetDetail: {
    budgetId: string;
  };
  Income: undefined;
  Expenses: undefined;
  LevelUp: {
    levelId?: string;
    xpGained?: number;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const { isOnboardingComplete, isAppLoading } = useApp();
  const { session, isLoading } = useAuth();
  const isAuthenticated = Boolean(session);
  const showOnboarding = !isAuthenticated || !isOnboardingComplete;

  if (isLoading || isAppLoading) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {showOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      ) : (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      )}
      {isAuthenticated && (
        <>
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
            name="BudgetDetail"
            component={BudgetDetailScreen}
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
          <Stack.Screen
            name="LevelUp"
            component={LevelUpScreen}
            options={{
              presentation: "modal",
              animation: "fade_from_bottom",
              animationDuration: 300,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
