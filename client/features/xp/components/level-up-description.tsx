import React from "react";
import { Text, StyleSheet } from "react-native";
import { Typography } from "@/constants/theme";

type LevelUpDescriptionProps = {
  description?: string;
};

const DEFAULT_DESCRIPTION =
  "Du hast gerade deine erste Ausgabe getracked und bist offiziell:";

/**
 * Displays the description text for the level up screen.
 */
export const LevelUpDescription = ({
  description = DEFAULT_DESCRIPTION,
}: LevelUpDescriptionProps) => {
  return <Text style={styles.description}>{description}</Text>;
};

const styles = StyleSheet.create({
  description: {
    fontSize: 17,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
});
