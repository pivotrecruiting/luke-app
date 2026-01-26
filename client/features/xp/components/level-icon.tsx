import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";

const ornamentImage = require("@assets/images/lvlup-ornament.svg");

type LevelIconProps = {
  emoji: string;
};

/**
 * Displays a large emoji icon with decorative star ornaments positioned at top-right and bottom-left.
 */
export const LevelIcon = ({ emoji }: LevelIconProps) => {
  return (
    <View style={styles.container}>
      <Image
        source={ornamentImage}
        style={[styles.ornament, styles.ornamentTopRight]}
        contentFit="contain"
      />
      <Text style={styles.emoji}>{emoji}</Text>
      <Image
        source={ornamentImage}
        style={[styles.ornament, styles.ornamentBottomLeft]}
        contentFit="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 160,
    minHeight: 160,
  },
  emoji: {
    fontSize: 108,
  },
  ornament: {
    position: "absolute",
    width: 48,
    height: 48,
  },
  ornamentTopRight: {
    top: 20,
    right: 35,
  },
  ornamentBottomLeft: {
    bottom: -10,
    left: 35,
  },
});
