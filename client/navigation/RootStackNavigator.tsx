import React from "react";
import { Platform } from "react-native";
import type { NavigatorScreenParams } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import OnboardingNavigator from "@/navigation/OnboardingNavigator";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import type { MainTabParamList } from "@/navigation/MainTabNavigator";
import GoalDetailScreen from "@/screens/GoalDetailScreen";
import BudgetDetailScreen from "@/screens/BudgetDetailScreen";
import IncomeScreen from "@/screens/IncomeScreen";
import ExpensesScreen from "@/screens/ExpensesScreen";
import LevelUpScreen from "@/screens/LevelUpScreen";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

export type RootStackParamList = {
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
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
  const liquidGlassAvailable = isLiquidGlassAvailable();

  // Base glass effect configuration for iOS 18+
  // Use 'regular' for iOS 18+ Liquid Glass, fallback to custom header for older versions
  const glassBlurEffect = liquidGlassAvailable
    ? ("regular" as const)
    : Platform.select({
        ios: "light" as const,
        default: undefined,
      });

  // Only use native header if iOS 18+ Liquid Glass is available
  // Otherwise, screens will use their custom headers
  const useNativeHeader = liquidGlassAvailable && Platform.OS === "ios";

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
              headerShown: useNativeHeader,
              headerTitle: useNativeHeader ? "Einnahmen" : undefined,
              headerTransparent: useNativeHeader ? true : undefined,
              headerBlurEffect: useNativeHeader ? glassBlurEffect : undefined,
              headerTitleAlign: useNativeHeader ? "center" : undefined,
              headerStyle: useNativeHeader
                ? {
                    backgroundColor: Platform.select({
                      ios: undefined,
                      default: "#FFFFFF",
                    }),
                  }
                : undefined,
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="Expenses"
            component={ExpensesScreen}
            options={{
              headerShown: useNativeHeader,
              headerTitle: useNativeHeader ? "Ausgaben" : undefined,
              headerTransparent: useNativeHeader ? true : undefined,
              headerBlurEffect: useNativeHeader ? glassBlurEffect : undefined,
              headerTitleAlign: useNativeHeader ? "center" : undefined,
              headerStyle: useNativeHeader
                ? {
                    backgroundColor: Platform.select({
                      ios: undefined,
                      default: "#FFFFFF",
                    }),
                  }
                : undefined,
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
