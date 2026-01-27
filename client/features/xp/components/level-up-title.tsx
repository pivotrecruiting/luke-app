import React from "react";
import { Text, StyleSheet } from "react-native";

type LevelUpTitleProps = {
  userName?: string;
};

/**
 * Displays the welcome title for the level up screen.
 */
export const LevelUpTitle = ({ userName }: LevelUpTitleProps) => {
  const normalizedName = userName?.trim();
  const title = normalizedName
    ? `Willkommen im Club, ${normalizedName}!`
    : "Willkommen im Club!";

  return <Text style={styles.title}>{title}</Text>;
};

const styles = StyleSheet.create({
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
});
