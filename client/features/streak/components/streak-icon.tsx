import React from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";

const ornamentImage = require("@assets/images/lvlup-ornament.svg");
const streakFoxImage = require("@assets/images/streaks/streak-completed-fox.png");

/**
 * Displays the streak fox SVG with decorative star ornaments positioned at top-right and bottom-left.
 */
export const StreakIcon = () => {
  return (
    <View style={styles.container}>
      <Image
        source={ornamentImage}
        style={[styles.ornament, styles.ornamentTopRight]}
        contentFit="contain"
      />
      <Image
        source={streakFoxImage}
        style={styles.foxImage}
        contentFit="contain"
      />
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
    minWidth: 200,
    minHeight: 200,
  },
  foxImage: {
    width: 500,
    height: 200,
  },
  ornament: {
    position: "absolute",
    width: 58,
    height: 58,
  },
  ornamentTopRight: {
    top: 20,
    right: 15,
  },
  ornamentBottomLeft: {
    bottom: -10,
    left: 15,
  },
});
