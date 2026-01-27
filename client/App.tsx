import React, { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { LevelUpGate } from "@/navigation/level-up-gate";
import { getActiveRouteName, navigationRef } from "@/navigation/navigation-ref";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/context/AppContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";

const ADD_DEEPLINK_PATH = "add";

/**
 * Hosts the navigation container and routes deep links after app state is ready.
 */
function AppNavigator() {
  const { session, isLoading: isAuthLoading } = useAuth();
  const { isOnboardingComplete, isAppLoading } = useApp();
  const isAuthenticated = Boolean(session);
  const showOnboarding = !isAuthenticated || !isOnboardingComplete;
  const [currentRouteName, setCurrentRouteName] = useState<
    keyof RootStackParamList | null
  >(null);
  const [isNavReady, setIsNavReady] = useState(false);
  const hasHandledInitialUrl = useRef(false);

  const handleNavStateChange = useCallback(() => {
    setCurrentRouteName(getActiveRouteName());
  }, []);

  const handleNavReady = useCallback(() => {
    setIsNavReady(true);
    handleNavStateChange();
  }, [handleNavStateChange]);

  const handleDeepLink = useCallback(
    (url: string | null) => {
      if (!url || showOnboarding) return;

      const { path } = Linking.parse(url);
      const normalizedPath = (path ?? "").replace(/\/+$/, "");
      if (normalizedPath !== ADD_DEEPLINK_PATH) return;

      if (navigationRef.isReady()) {
        navigationRef.navigate("Main", { screen: "Add" });
      }
    },
    [showOnboarding],
  );

  useEffect(() => {
    if (!isNavReady || isAuthLoading || isAppLoading) return;

    if (!hasHandledInitialUrl.current) {
      hasHandledInitialUrl.current = true;
      Linking.getInitialURL()
        .then(handleDeepLink)
        .catch(() => {});
    }

    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.remove();
    };
  }, [handleDeepLink, isAuthLoading, isAppLoading, isNavReady]);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.root}>
        <KeyboardProvider>
          <NavigationContainer
            ref={navigationRef}
            onReady={handleNavReady}
            onStateChange={handleNavStateChange}
          >
            <RootStackNavigator />
          </NavigationContainer>
          <LevelUpGate currentRouteName={currentRouteName} />
          <StatusBar style="auto" />
        </KeyboardProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppProvider>
            <AppNavigator />
          </AppProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
