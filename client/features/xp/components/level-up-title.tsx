import React from "react";
import { Text, StyleSheet } from "react-native";
import { Typography } from "@/constants/theme";

type LevelUpTitleProps = {
  userName: string;
};

/**
 * Displays the welcome title for the level up screen.
 */
export const LevelUpTitle = ({ userName }: LevelUpTitleProps) => {
  return (
    <Text style={styles.title}>Willkommen im Club, {userName}!</Text>
  );
};

const styles = StyleSheet.create({
  title: {
    ...Typography.h2,
    color: "#FFFFFF",
    textAlign: "center",
  },
});
