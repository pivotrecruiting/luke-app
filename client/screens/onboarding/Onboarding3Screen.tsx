import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { OnboardingStackParamList } from "@/navigation/OnboardingNavigator";
import { Image } from "expo-image";
import ProgressDots from "@/components/ProgressDots";
import CurrencyInput from "@/components/CurrencyInput";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Spacing, BorderRadius, Typography, Colors } from "@/constants/theme";
import {
  useOnboardingStore,
  type OnboardingStoreT,
} from "@/stores/onboarding-store";

type NavigationProp = NativeStackNavigationProp<OnboardingStackParamList>;

export default function Onboarding3Screen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const setInitialSavingsAmount = useOnboardingStore(
    (state: OnboardingStoreT) => state.setInitialSavingsAmount,
  );
  const resetInitialSavings = useOnboardingStore(
    (state: OnboardingStoreT) => state.resetInitialSavings,
  );
  const [amount, setAmount] = useState("");

  const parseAmount = (value: string): number | null => {
    const parsed = Number.parseFloat(value.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) return null;
    return parsed;
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setInitialSavingsAmount(parseAmount(value));
  };

  useFocusEffect(
    useCallback(() => {
      setAmount("");
      resetInitialSavings();
    }, [resetInitialSavings]),
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xl }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        <ProgressDots total={6} current={2} />

        <View style={styles.headerContainer}>
          <Text style={styles.titleBold}>Hast du bereits etwas</Text>
          <Text style={styles.titleBold}>erspartes?</Text>
          <Text style={styles.subtitleItalic}>
            Dein Erspartes wandert direkt in deinen Tresor - bereit für deine
            späteren Ziele.
          </Text>
        </View>

        <View style={styles.illustrationContainer}>
          <Image
            source={require("@assets/images/image_1767542218268.png")}
            style={styles.ellipseBg}
            contentFit="contain"
          />
          <Image
            source={require("@assets/images/image_1767541830063.png")}
            style={styles.coinsImage}
            contentFit="contain"
          />
        </View>

        <View style={styles.inputContainer}>
          <CurrencyInput value={amount} onChangeText={handleAmountChange} />
        </View>
      </KeyboardAwareScrollViewCompat>

      <View
        style={[
          styles.buttonContainer,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        <Pressable
          onPress={() => {
            setAmount("");
            setInitialSavingsAmount(null);
            navigation.navigate("Onboarding4");
          }}
          style={({ pressed }) => [
            styles.skipButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.skipButtonText}>Nein, hab ich nicht</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setInitialSavingsAmount(parseAmount(amount));
            navigation.navigate("Onboarding4");
          }}
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.continueButtonText}>WEITER</Text>
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
  },
  titleBold: {
    ...Typography.h1,
    color: Colors.light.text,
  },
  subtitleItalic: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginTop: Spacing.md,
    fontStyle: "italic",
  },
  illustrationContainer: {
    height: 200,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing["2xl"],
    position: "relative",
  },
  ellipseBg: {
    position: "absolute",
    width: 200,
    height: 170,
  },
  coinsImage: {
    width: 210,
    height: 180,
    zIndex: 1,
  },
  inputContainer: {
    marginTop: Spacing["2xl"],
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.light.backgroundRoot,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  skipButton: {
    backgroundColor: "#E8E4F3",
    borderRadius: BorderRadius.md,
    height: Spacing.buttonHeight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.accent,
  },
  skipButtonText: {
    ...Typography.body,
    fontWeight: "600",
    color: Colors.light.accent,
  },
  continueButton: {
    backgroundColor: Colors.light.buttonPrimary,
    borderRadius: BorderRadius.md,
    height: Spacing.buttonHeight,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonText: {
    ...Typography.button,
    color: Colors.light.buttonText,
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
