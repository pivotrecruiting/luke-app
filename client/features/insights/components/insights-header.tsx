import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { HeaderTabToggle } from "@/components/ui/header-tab-toggle";
import { styles } from "@/screens/styles/insights-screen.styles";
import type { InsightsTabT } from "../types/insights-types";

type InsightsHeaderPropsT = {
  topInset: number;
  activeTab: InsightsTabT;
  onChangeTab: (value: InsightsTabT) => void;
};

const INSIGHTS_TABS = [
  { value: "analytics" as const, icon: "bar-chart-2" },
  { value: "ausgaben" as const, label: "Ausgaben" },
  { value: "einnahmen" as const, label: "Einnahmen" },
];

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

      <HeaderTabToggle
        tabs={INSIGHTS_TABS}
        value={activeTab}
        onChange={onChangeTab}
      />
    </LinearGradient>
  );
};
