import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "@/navigation/OnboardingNavigator";
import { Image } from "expo-image";
import ProgressDots from "@/components/ProgressDots";
import { Spacing, BorderRadius, Typography, Colors } from "@/constants/theme";

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

const cloudBackground = require("@assets/images/cloud-background.png");

const goals = [
  {
    id: "overview",
    label: "Überblick\ngewinnen",
    color: Colors.light.cardOverview,
    image: require("@assets/images/image_1767540420128.png"),
  },
  {
    id: "klarna",
    label: "Klarna & Raten\nim Griff haben",
    color: Colors.light.cardKlarna,
    image: require("@assets/images/image_1767540689248.png"),
    backgroundImage: cloudBackground,
  },
  {
    id: "subscriptions",
    label: "Abos\noptimieren",
    color: Colors.light.cardSubscriptions,
    image: require("@assets/images/image_1767540704833.png"),
  },
  {
    id: "savings",
    label: "Notgroschen\naufbauen",
    color: Colors.light.cardSavings,
    image: require("@assets/images/image_1767540547771.png"),
  },
  {
    id: "goals",
    label: "Sparziel\nerreichen",
    color: Colors.light.cardGoals,
    image: require("@assets/images/image_1767540578781.png"),
  },
  {
    id: "peace",
    label: "Finanzielle Ruhe",
    color: Colors.light.cardPeace,
    image: require("@assets/images/image_1767540595139.png"),
  },
];

export default function Onboarding1Screen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelection = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xl }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ProgressDots total={5} current={0} />

        <View style={styles.headerContainer}>
          <Text style={styles.titleBold}>Was bringt dich</Text>
          <Text style={styles.titleNormal}>zu Luke?</Text>
          <Text style={styles.subtitle}>
            wähle mindestens eines der folgenden:
          </Text>
        </View>

        <View style={styles.goalsGrid}>
          {goals.map((goal) => (
            <Pressable
              key={goal.id}
              onPress={() => toggleSelection(goal.id)}
              style={({ pressed }) => [
                styles.goalCard,
                { backgroundColor: goal.color },
                selected.includes(goal.id) && styles.goalCardSelected,
                pressed && styles.goalCardPressed,
              ]}
            >
              {"backgroundImage" in goal && goal.backgroundImage ? (
                <Image
                  source={goal.backgroundImage}
                  style={styles.cloudBackground}
                  contentFit="contain"
                />
              ) : null}
              <Image
                source={goal.image}
                style={styles.goalImage}
                contentFit="contain"
              />
              <Text style={styles.goalLabel}>{goal.label}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View
        style={[
          styles.buttonContainer,
          { paddingBottom: insets.bottom + Spacing.xl },
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
    marginTop: Spacing["2xl"],
    marginBottom: Spacing["2xl"],
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
  goalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  goalCard: {
    width: "48%",
    height: 160,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  goalCardSelected: {
    borderWidth: 4,
    borderColor: Colors.light.primary,
  },
  goalCardPressed: {
    opacity: 0.9,
  },
  goalImage: {
    width: "100%",
    height: 80,
  },
  cloudBackground: {
    position: "absolute",
    width: 118,
    height: 67,
    top: 10,
    right: -15,
    zIndex: -1,
  },
  goalLabel: {
    ...Typography.h4,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.light.backgroundRoot,
    paddingTop: Spacing.lg,
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
