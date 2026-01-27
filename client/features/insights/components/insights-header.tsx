import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { styles } from "@/screens/styles/insights-screen.styles";
import type { InsightsTabT } from "../types/insights-types";

type InsightsHeaderPropsT = {
  topInset: number;
  activeTab: InsightsTabT;
  onChangeTab: (value: InsightsTabT) => void;
};

/**
 * Displays the insights header with gradient and tab selector.
 */
export const InsightsHeader = ({
  topInset,
  activeTab,
  onChangeTab,
}: InsightsHeaderPropsT) => {
  return (
    <LinearGradient
      colors={["rgba(42, 58, 230, 0.69)", "rgba(23, 32, 128, 0.69)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.header, { paddingTop: topInset }]}
    >
      <Text style={styles.headerTitle}>Insights</Text>
      <Text style={styles.headerSubtitle}>alles auf einen Blick.</Text>

      <View style={styles.toggleContainer}>
        <Pressable
          style={[
            styles.toggleButton,
            activeTab === "ausgaben" && styles.toggleButtonActive,
          ]}
          onPress={() => onChangeTab("ausgaben")}
        >
          <Text
            style={[
              styles.toggleButtonText,
              activeTab === "ausgaben" && styles.toggleButtonTextActive,
            ]}
          >
            Ausgaben
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.toggleButton,
            activeTab === "einnahmen" && styles.toggleButtonActive,
          ]}
          onPress={() => onChangeTab("einnahmen")}
        >
          <Text
            style={[
              styles.toggleButtonText,
              activeTab === "einnahmen" && styles.toggleButtonTextActive,
            ]}
          >
            Einnahmen
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
};
