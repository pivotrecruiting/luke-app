import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "@/navigation/OnboardingNavigator";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";

const { width: screenWidth } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  return (
    <LinearGradient
      colors={["#0a0a15", "#000000"]}
      style={styles.container}
    >
      <Image
        source={require("@assets/images/nordic-style-colorful-metal-pendant-light-fixture-dining-room-ta.png")}
        style={styles.lampImage}
        contentFit="cover"
      />

      <LinearGradient
        colors={[
          "transparent",
          "rgba(97, 106, 201, 0.08)",
          "rgba(97, 106, 201, 0.15)",
          "rgba(97, 106, 201, 0.08)",
          "transparent",
        ]}
        locations={[0, 0.2, 0.5, 0.8, 1]}
        style={styles.glowOval}
      />

      <View style={styles.textContainer}>
        <Text style={styles.headline}>Bring Licht in deine Finanzen</Text>
        <Text style={styles.tagline}>Einfach. Klar. Transparent.</Text>
      </View>

      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Pressable
          onPress={() => navigation.navigate("SignUp")}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>7 TAGE KOSTENLOS TESTEN</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  lampImage: {
    width: 302,
    height: 208,
    marginTop: 0,
    marginLeft: -20,
  },
  glowOval: {
    position: "absolute",
    top: 155,
    alignSelf: "center",
    width: 250,
    height: 500,
    borderRadius: 125,
  },
  textContainer: {
    position: "absolute",
    top: 385,
    alignItems: "center",
    width: "100%",
    paddingHorizontal: Spacing.xl,
  },
  headline: {
    ...Typography.h2,
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: -6 },
    textShadowRadius: 4,
  },
  tagline: {
    ...Typography.body,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginTop: Spacing.md,
    fontWeight: "500",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
  },
  button: {
    backgroundColor: "#7340fd",
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing["2xl"],
    alignItems: "center",
    shadowColor: "#2a39e6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 40,
    elevation: 8,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    ...Typography.button,
    color: "#FAFAFA",
    letterSpacing: 0.5,
  },
});
