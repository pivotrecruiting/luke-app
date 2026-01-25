import { Text, View } from "react-native";
import { styles } from "@/screens/styles/goals-screen.styles";
import { LEVEL_DATA } from "../constants/goals-constants";

/**
 * Displays the current level progress card.
 */
export const LevelCard = () => {
  const totalXpForLevel = LEVEL_DATA.xp + LEVEL_DATA.xpToNextLevel;
  const progress = LEVEL_DATA.xp / totalXpForLevel;

  return (
    <View style={styles.levelCard}>
      <View style={styles.levelHeader}>
        <View style={styles.levelLeft}>
          <Text style={styles.foxEmoji}>🦊</Text>
          <View>
            <Text style={styles.levelTitle}>Level {LEVEL_DATA.current}</Text>
            <Text style={styles.levelName}>{LEVEL_DATA.name}</Text>
          </View>
        </View>
        <Text style={styles.xpText}>{LEVEL_DATA.xp} XP</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.xpLabels}>
        <Text style={styles.xpLabel}>{LEVEL_DATA.xp} XP</Text>
        <Text style={styles.xpLabel}>
          {LEVEL_DATA.xpToNextLevel} XP bis Level {LEVEL_DATA.nextLevel}
        </Text>
      </View>
    </View>
  );
};
