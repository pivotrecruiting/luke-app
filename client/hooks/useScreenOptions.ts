import { Platform } from "react-native";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { isLiquidGlassAvailable } from "expo-glass-effect";

import { useTheme } from "@/hooks/useTheme";

interface UseScreenOptionsParams {
  transparent?: boolean;
  headerShown?: boolean;
}

/**
 * Hook to generate native stack navigation options with iOS 18 Liquid Glass support.
 * Provides transparent headers with blur effects that adapt to iOS 18+ capabilities.
 */
export function useScreenOptions({
  transparent = true,
  headerShown = true,
}: UseScreenOptionsParams = {}): NativeStackNavigationOptions {
  const { theme, isDark } = useTheme();
  const liquidGlassAvailable = isLiquidGlassAvailable();

  // Use 'regular' blur effect for iOS 18+ Liquid Glass, fallback to light/dark for older versions
  const blurEffect = liquidGlassAvailable
    ? "regular"
    : isDark
      ? "dark"
      : "light";

  return {
    headerShown,
    headerTitleAlign: "center",
    headerTransparent: transparent,
    headerBlurEffect: Platform.select({
      ios: blurEffect,
      default: undefined,
    }),
    headerTintColor: theme.text,
    headerStyle: {
      backgroundColor: Platform.select({
        ios: undefined,
        android: theme.backgroundRoot,
        web: theme.backgroundRoot,
      }),
    },
    gestureEnabled: true,
    gestureDirection: "horizontal",
    fullScreenGestureEnabled: liquidGlassAvailable ? false : true,
    contentStyle: {
      backgroundColor: theme.backgroundRoot,
    },
  };
}
