import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "@/navigation/OnboardingNavigator";
import { Spacing } from "@/constants/theme";
import { ThemedText } from "@/components/ThemedText";
import { PurpleGradientButton } from "@/components/ui/purple-gradient-button";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  return (
    <View style={styles.container}>
      <Image
        source={require("@assets/images/Welcome.png")}
        style={styles.backgroundImage}
        contentFit="cover"
        priority="high"
        cachePolicy="memory-disk"
      />

      <View style={styles.textOverlay}>
        <View style={styles.titleWrapper}>
          <ThemedText style={styles.title}>
            Bring Licht in deine Finanzen
          </ThemedText>
          <ThemedText style={styles.titleInnerShadow}>
            Bring Licht in deine Finanzen
          </ThemedText>
        </View>

        <View style={styles.subtitleWrapper}>
          <ThemedText style={styles.subtitle}>
            Einfach. Klar. Transparent.
          </ThemedText>
          <ThemedText style={styles.subtitleInnerShadow}>
            Einfach. Klar. Transparent.
          </ThemedText>
        </View>
      </View>

      <View
        style={[styles.buttonContainer, { paddingBottom: insets.bottom + 50 }]}
      >
        <PurpleGradientButton
          onPress={() => navigation.navigate("SignUp")}
          style={styles.button}
        >
          <ThemedText style={styles.buttonText}>Loslegen</ThemedText>
        </PurpleGradientButton>
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
  textOverlay: {
    position: "absolute",
    top: "48%",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    transform: [{ translateY: -40 }],
  },
  titleWrapper: {
    position: "relative",
    width: "100%",
    minHeight: 34,
    overflow: "hidden",
    alignItems: "center",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 32,
    textAlign: "center",
  },
  titleInnerShadow: {
    position: "absolute",
    top: 1,
    left: 0,
    right: 0,
    color: "rgba(0, 0, 0, 0.2)",
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 32,
    textAlign: "center",
  },
  subtitleWrapper: {
    position: "relative",
    width: "100%",
    minHeight: 24,
    marginTop: 10,
    overflow: "hidden",
    alignItems: "center",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.78)",
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22,
    textAlign: "center",
  },
  subtitleInnerShadow: {
    position: "absolute",
    top: 1,
    left: 0,
    right: 0,
    color: "rgba(0, 0, 0, 0.2)",
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22,
    textAlign: "center",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
  },
  button: {
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
