import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const getActiveRouteName = (): keyof RootStackParamList | null => {
  if (!navigationRef.isReady()) return null;
  return navigationRef.getCurrentRoute()?.name ?? null;
};
