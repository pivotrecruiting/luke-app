import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import ProgressDots from "@/components/ProgressDots";
import { Spacing, BorderRadius, Typography, Colors } from "@/constants/theme";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "@/navigation/OnboardingNavigator";

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

const topLeftGoals = [
  {
    id: "overview",
    label: "Überblick\ngewinnen",
    color: "#8E97FD",
    image: require("@assets/images/image_1767540420128.png"),
    height: 197,
  },
  {
    id: "subscriptions",
    label: "Abos\noptimieren",
    color: "#FEB18F",
    image: require("@assets/images/blob-subscriptions.png"),
    overlayImage: require("@assets/images/image_1767540704833.png"),
    height: 184,
  },
];

const topRightGoals = [
  {
    id: "klarna",
    label: "Klarna & Raten\nim Griff haben",
    color: "#FA6E5A",
    image: require("@assets/images/image_1767540791135.png"),
    overlayImage: require("@assets/images/woman-laptop.png"),
    height: 157,
  },
  {
    id: "savings",
    label: "Notgroschen\naufbauen",
    color: "#FFCF86",
    image: require("@assets/images/image_1767540547771.png"),
    height: 224,
  },
];

const bottomGoals = [
  {
    id: "goals",
    label: "Sparziel\nerreichen",
    color: "#6CB38E",
    image: require("@assets/images/image_1767540578781.png"),
    height: 165,
  },
  {
    id: "peace",
    label: "Finanzielle Ruhe",
    color: "#D9A5B5",
    image: require("@assets/images/image_1767540595139.png"),
    height: 165,
  },
];

export default function Onboarding1Screen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const renderGoalCard = (
    goal: (typeof topLeftGoals)[0] | (typeof topRightGoals)[0],
    isBottom = false,
  ) => (
    <Pressable
      key={goal.id}
      onPress={() => toggleSelection(goal.id)}
      style={({ pressed }) => [
        isBottom ? styles.bottomCard : styles.goalCard,
        { backgroundColor: goal.color, height: goal.height },
        selected.includes(goal.id) && styles.goalCardSelected,
        pressed && styles.goalCardPressed,
      ]}
    >
      {goal.id === "klarna" && "overlayImage" in goal ? (
        <View style={styles.layeredImageContainer}>
          <Image
            source={goal.image}
            style={styles.goalImageCloud}
            contentFit="contain"
          />
          <Image
            source={goal.overlayImage}
            style={styles.goalImageOverlay}
            contentFit="contain"
          />
        </View>
      ) : goal.id === "subscriptions" && "overlayImage" in goal ? (
        <View style={styles.layeredImageContainer}>
          <Image
            source={goal.image}
            style={styles.subscriptionBlob}
            contentFit="contain"
          />
          <Image
            source={goal.overlayImage}
            style={styles.subscriptionFigure}
            contentFit="contain"
          />
        </View>
      ) : (
        <Image
          source={goal.image}
          style={styles.goalImage}
          contentFit="contain"
        />
      )}
      <Text style={styles.goalLabel}>{goal.label}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      <ProgressDots total={5} current={0} />

      <View style={styles.headerContainer}>
        <Text style={styles.titleBold}>Was bringt dich</Text>
        <Text style={styles.titleNormal}>zu Luke?</Text>
        <Text style={styles.subtitle}>
          wähle mindestens eines der folgenden:
        </Text>
      </View>

      <View style={styles.topSection}>
        <View style={styles.leftColumn}>
          {topLeftGoals.map((goal) => renderGoalCard(goal))}
        </View>
        <View style={styles.rightColumn}>
          {topRightGoals.map((goal) => renderGoalCard(goal))}
        </View>
      </View>

      <View style={styles.bottomSection}>
        {bottomGoals.map((goal) => renderGoalCard(goal, true))}
      </View>

      <View
        style={[
          styles.buttonContainer,
          { paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        <Pressable
          onPress={() => navigation.navigate("Onboarding2")}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>WEITER</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.backgroundRoot,
    paddingHorizontal: Spacing.xl,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerContainer: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  titleBold: {
    ...Typography.h1,
    color: Colors.light.text,
  },
  titleNormal: {
    ...Typography.h1,
    color: Colors.light.text,
    fontWeight: "400",
  },
  subtitle: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginTop: Spacing.md,
  },
  topSection: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  leftColumn: {
    flex: 1,
    gap: Spacing.md,
  },
  rightColumn: {
    flex: 1,
    gap: Spacing.md,
  },
  bottomSection: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  goalCard: {
    width: "100%",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    justifyContent: "space-between",
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "transparent",
  },
  bottomCard: {
    flex: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    justifyContent: "space-between",
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "transparent",
  },
  goalCardSelected: {
    borderColor: Colors.light.primary,
  },
  goalCardPressed: {
    opacity: 0.9,
  },
  goalImage: {
    width: "100%",
    height: 80,
  },
  layeredImageContainer: {
    width: "100%",
    height: 80,
    position: "relative",
  },
  goalImageCloud: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  goalImageOverlay: {
    position: "absolute",
    width: "80%",
    height: "90%",
    left: "10%",
    bottom: 0,
  },
  subscriptionBlob: {
    position: "absolute",
    width: "100%",
    height: 95,
    left: 0,
    bottom: 0,
  },
  subscriptionFigure: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  goalLabel: {
    ...Typography.h4,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  buttonContainer: {
    marginTop: "auto",
    paddingTop: Spacing.md,
  },
  button: {
    backgroundColor: Colors.light.buttonPrimary,
    borderRadius: BorderRadius.md,
    height: Spacing.buttonHeight,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    ...Typography.button,
    color: Colors.light.buttonText,
  },
});
