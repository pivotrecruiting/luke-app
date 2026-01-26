import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";

type ContinueButtonProps = {
  onPress: () => void;
};

/**
 * Displays a full-width continue button with rocket emoji.
 */
export const ContinueButton = ({ onPress }: ContinueButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={styles.buttonText}>WEITER 🚀</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: Spacing.buttonHeight,
    backgroundColor: "#8E97FD",
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    ...Typography.button,
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
});
