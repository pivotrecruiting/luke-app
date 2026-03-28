import React from "react";
import { Text, StyleSheet } from "react-native";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { PurpleGradientButton } from "@/components/ui/purple-gradient-button";

type ContinueButtonProps = {
  onPress: () => void;
  label?: string;
};

/**
 * Displays a full-width continue button with rocket emoji.
 */
export const ContinueButton = ({
  onPress,
  label = "WEITER",
}: ContinueButtonProps) => {
  return (
    <PurpleGradientButton onPress={onPress} style={styles.button}>
      <Text style={styles.buttonText}>{label} 🚀</Text>
    </PurpleGradientButton>
  );
};

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    ...Typography.button,
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
});
