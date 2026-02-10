import React, { useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  type ImageSourcePropType,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";

import ProgressDots from "@/components/ProgressDots";
import { Spacing, BorderRadius, Typography, Colors } from "@/constants/theme";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "@/navigation/OnboardingNavigator";
import { useOnboardingStore, type OnboardingStoreT } from "@/stores/onboarding-store";

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

/**
 * Animated text component that transitions color to black when selected
 */
const AnimatedGoalLabel = ({
  label,
  isSelected,
}: {
  label: string;
  isSelected: boolean;
}) => {
  const progress = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isSelected ? 1 : 0, {
      duration: 200,
    });
  }, [isSelected, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      progress.value,
      [0, 1],
      ["#FFFFFF", "#000000"],
    );

    return {
      color,
    };
  });

  return (
    <Animated.Text style={[styles.goalLabel, animatedStyle]}>
      {label}
    </Animated.Text>
  );
};

type GoalT = {
  id: string;
  label: string;
  color: string;
  image: ImageSourcePropType;
  overlayImage?: ImageSourcePropType;
};

const topLeftGoals: GoalT[] = [
  {
    id: "overview",
    label: "Überblick\ngewinnen",
    color: "#8E97FD",
    image: require("@assets/images/image_1767540420128.png"),
  },
  {
    id: "subscriptions",
    label: "Abos\noptimieren",
    color: "#FEB18F",
    image: require("@assets/images/blob-subscriptions.png"),
    overlayImage: require("@assets/images/image_1767540704833.png"),
  },
];

const topRightGoals: GoalT[] = [
  {
    id: "klarna",
    label: "Klarna & Raten\nim Griff haben",
    color: "#FA6E5A",
    image: require("@assets/images/image_1767540791135.png"),
    overlayImage: require("@assets/images/woman-laptop.png"),
  },
  {
    id: "savings",
    label: "Notgroschen\naufbauen",
    color: "#FFCF86",
    image: require("@assets/images/image_1767540547771.png"),
  },
];

const bottomGoals: GoalT[] = [
  {
    id: "goals",
    label: "Sparziel\nerreichen",
    color: "#6CB38E",
    image: require("@assets/images/image_1767540578781.png"),
  },
  {
    id: "peace",
    label: "Finanzielle Ruhe",
    color: "#D9A5B5",
    image: require("@assets/images/image_1767540595139.png"),
  },
];

type GoalCardPropsT = {
  goal: GoalT;
  isSelected: boolean;
  flexValue: number;
  onToggle: (id: string) => void;
};

const GoalCard = ({
  goal,
  isSelected,
  flexValue,
  onToggle,
}: GoalCardPropsT) => {
  const opacity = useSharedValue(isSelected ? 1 : 0.7);

  useEffect(() => {
    opacity.value = withTiming(isSelected ? 1 : 0.7, {
      duration: 200,
    });
  }, [isSelected, opacity]);

  const animatedOpacityStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[animatedOpacityStyle, styles.cardWrapper, { flex: flexValue }]}
    >
      <Pressable
        onPress={() => onToggle(goal.id)}
        style={[styles.goalCard, { backgroundColor: goal.color }]}
      >
        {goal.id === "klarna" && goal.overlayImage ? (
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
        ) : goal.id === "subscriptions" && goal.overlayImage ? (
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
        <AnimatedGoalLabel label={goal.label} isSelected={isSelected} />
      </Pressable>
    </Animated.View>
  );
};

export default function Onboarding2Screen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const motivations = useOnboardingStore(
    (state: OnboardingStoreT) => state.motivations,
  );
  const toggleMotivation = useOnboardingStore(
    (state: OnboardingStoreT) => state.toggleMotivation,
  );
  const resetMotivations = useOnboardingStore(
    (state: OnboardingStoreT) => state.resetMotivations,
  );

  useFocusEffect(
    useCallback(() => {
      resetMotivations();
    }, [resetMotivations]),
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      <ProgressDots total={6} current={1} />

      <View style={styles.headerContainer}>
        <Text style={styles.titleBold}>Was bringt dich</Text>
        <Text style={styles.titleNormal}>zu Luke?</Text>
        <Text style={styles.subtitle}>
          wähle mindestens eines der folgenden:
        </Text>
      </View>

      <View style={styles.goalsContainer}>
        <View style={styles.topSection}>
          <View style={styles.leftColumn}>
            {topLeftGoals.map((goal, index) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                isSelected={motivations.includes(goal.id)}
                flexValue={index === 0 ? 1.2 : 1.3}
                onToggle={toggleMotivation}
              />
            ))}
          </View>
          <View style={styles.rightColumn}>
            {topRightGoals.map((goal, index) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                isSelected={motivations.includes(goal.id)}
                flexValue={index === 0 ? 0.8 : 1.3}
                onToggle={toggleMotivation}
              />
            ))}
          </View>
        </View>

        <View style={styles.bottomSection}>
          <View style={styles.leftColumn}>
            {bottomGoals
              .filter((_, index) => index % 2 === 0)
              .map((goal) => (
                <GoalCard
                key={goal.id}
                goal={goal}
                isSelected={motivations.includes(goal.id)}
                flexValue={0.7}
                onToggle={toggleMotivation}
              />
              ))}
          </View>
          <View style={styles.rightColumn}>
            {bottomGoals
              .filter((_, index) => index % 2 === 1)
              .map((goal) => (
                <GoalCard
                key={goal.id}
                goal={goal}
                isSelected={motivations.includes(goal.id)}
                flexValue={0.7}
                onToggle={toggleMotivation}
              />
              ))}
          </View>
        </View>
      </View>

      <View
        style={[
          styles.buttonContainer,
          { paddingBottom: insets.bottom + Spacing.md },
        ]}
      >
        <Pressable
          onPress={() => navigation.navigate("Onboarding3")}
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
  goalsContainer: {
    flex: 1,
    gap: Spacing.sm,
  },
  topSection: {
    flex: 2,
    flexDirection: "row",
    gap: Spacing.md,
  },
  bottomSection: {
    flex: 1.1,
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
  cardWrapper: {
    flex: 1,
  },
  goalCard: {
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    justifyContent: "space-between",
    overflow: "hidden",
    borderWidth: 4,
    borderColor: "transparent",
  },
  goalImage: {
    flex: 1,
    width: "100%",
  },
  layeredImageContainer: {
    flex: 1,
    width: "100%",
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
    height: "100%",
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
    fontWeight: "700",
  },
  buttonContainer: {
    marginTop: "auto",
    paddingTop: Spacing.xs,
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
