import { Text, View } from "react-native";
import { useApp } from "@/context/AppContext";
import { getCurrencySymbol } from "@/utils/currency-format";
import { styles } from "@/screens/styles/goal-detail-screen.styles";
import { formatCurrency } from "../utils/format";

type GoalSummaryCardPropsT = {
  name: string;
  icon: string;
  current: number;
  target: number;
  percentage: number;
  remaining: number;
};

/**
 * Displays the goal summary card with progress, amounts and remaining.
 * Mirrors BudgetSummaryCard structure for consistency.
 */
export const GoalSummaryCard = ({
  name,
  icon,
  current,
  target,
  percentage,
  remaining,
}: GoalSummaryCardPropsT) => {
  const { currency } = useApp();
  const currencySymbol = getCurrencySymbol(currency);

  return (
    <View style={styles.summaryCard}>
      <View style={styles.goalHeader}>
        <View style={styles.goalLeft}>
          <Text style={styles.goalIcon}>{icon}</Text>
          <View>
            <Text style={styles.goalName}>{name}</Text>
            <Text style={styles.goalProgress}>
              {currencySymbol} {formatCurrency(current, currency)} / {currencySymbol} {formatCurrency(target, currency)}
            </Text>
          </View>
        </View>
        <Text style={styles.goalPercentage}>
          {percentage.toFixed(2).replace(".", ",")}%
        </Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${Math.min(percentage, 100)}%` },
          ]}
        />
      </View>
      <View style={styles.goalFooter}>
        <Text style={styles.remainingLabel}>Übrig</Text>
        <Text style={styles.remainingValue}>
          {currencySymbol} {formatCurrency(Math.max(0, remaining), currency)}
        </Text>
      </View>
    </View>
  );
};
