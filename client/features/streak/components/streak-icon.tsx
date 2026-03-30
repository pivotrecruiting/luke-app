import React from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";

const ornamentImage = require("@assets/images/lvlup-ornament.svg");
const streakOngoingFoxImage = require("@assets/images/streaks/streak-ongoing-fox.png");
const streakCompletedFoxImage = require("@assets/images/streaks/streak-completed-fox.png");

type StreakIconVariant = "ongoing" | "completed";

type StreakIconProps = {
  variant?: StreakIconVariant;
};

/**
 * Displays the streak fox image with decorative star ornaments.
 * Ongoing: running fox. Completed: fox with trophy.
 */
export const StreakIcon = ({ variant = "ongoing" }: StreakIconProps) => {
  const foxImage =
    variant === "completed" ? streakCompletedFoxImage : streakOngoingFoxImage;

  return (
    <View style={styles.container}>
      <Image
        source={ornamentImage}
        style={[styles.ornament, styles.ornamentTopRight]}
        contentFit="contain"
      />
      <Image source={foxImage} style={styles.foxImage} contentFit="contain" />
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
    width: 200,
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
