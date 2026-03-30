import React from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
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
import VaultScreen from "@/screens/VaultScreen";
import LevelUpScreen from "@/screens/LevelUpScreen";
import StreakScreen from "@/screens/StreakScreen";
import PaywallScreen from "@/screens/PaywallScreen";
import RequestPasswordScreen from "@/screens/RequestPasswordScreen";
import ResetPasswordScreen from "@/screens/ResetPasswordScreen";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { Colors } from "@/constants/theme";

export type RootStackParamList = {
  Onboarding: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  GoalDetail: {
    goalId: string;
    /** When true, opens the deposit modal immediately. */
    openDeposit?: boolean;
  };
  BudgetDetail: {
    budgetId: string;
  };
  Income: undefined;
  Expenses: undefined;
  Vault: undefined;
  LevelUp: {
    levelId?: string;
    xpGained?: number;
  };
  Streak: {
    xpGained?: number;
    variant?: "ongoing" | "completed";
  };
  Paywall: undefined;
  RequestPassword:
    | {
        email?: string;
      }
    | undefined;
  ResetPassword: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Shows a neutral loading state while auth and app data are being resolved.
 */
function AuthLoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.light.primary} />
    </View>
  );
}

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

  if (isLoading || (isAuthenticated && isAppLoading)) {
    return <AuthLoadingScreen />;
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
      <Stack.Screen
        name="RequestPassword"
        component={RequestPasswordScreen}
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
          headerShown: false,
        }}
      />
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
            name="Vault"
            component={VaultScreen}
            options={{
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
          <Stack.Screen
            name="Streak"
            component={StreakScreen}
            options={{
              presentation: "modal",
              animation: "fade_from_bottom",
              animationDuration: 300,
            }}
          />
          <Stack.Screen
            name="Paywall"
            component={PaywallScreen}
            options={{
              presentation: "modal",
              animation: "fade_from_bottom",
              animationDuration: 300,
            }}
          />
          <Stack.Screen
            name="ResetPassword"
            component={ResetPasswordScreen}
            options={{
              presentation: "modal",
              animation: "slide_from_bottom",
              headerShown: false,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.backgroundRoot,
  },
});
