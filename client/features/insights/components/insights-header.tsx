import { Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { HeaderTabToggle } from "@/components/ui/header-tab-toggle";
import { HeaderGradient } from "@/constants/theme";
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
      colors={HeaderGradient.colors}
      start={HeaderGradient.start}
      end={HeaderGradient.end}
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
