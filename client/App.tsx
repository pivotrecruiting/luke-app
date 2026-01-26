import React, { useCallback, useState } from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { LevelUpGate } from "@/navigation/level-up-gate";
import { getActiveRouteName, navigationRef } from "@/navigation/navigation-ref";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";

export default function App() {
  const [currentRouteName, setCurrentRouteName] = useState<
    keyof RootStackParamList | null
  >(null);

  const handleNavStateChange = useCallback(() => {
    setCurrentRouteName(getActiveRouteName());
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppProvider>
            <SafeAreaProvider>
              <GestureHandlerRootView style={styles.root}>
                <KeyboardProvider>
                  <NavigationContainer
                    ref={navigationRef}
                    onReady={handleNavStateChange}
                    onStateChange={handleNavStateChange}
                  >
                    <RootStackNavigator />
                  </NavigationContainer>
                  <LevelUpGate currentRouteName={currentRouteName} />
                  <StatusBar style="auto" />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </SafeAreaProvider>
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
