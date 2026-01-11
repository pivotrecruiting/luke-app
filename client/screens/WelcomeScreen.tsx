import React from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "@/navigation/OnboardingNavigator";
import { Spacing } from "@/constants/theme";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <Image
        source={require("@assets/images/welcome-background.png")}
        style={styles.backgroundImage}
        contentFit="cover"
      />

      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Pressable
          onPress={() => navigation.navigate("SignUp")}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
  },
  button: {
    height: 56,
    borderRadius: 28,
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
