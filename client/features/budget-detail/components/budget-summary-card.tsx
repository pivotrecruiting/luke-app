import { Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { getCurrencySymbol } from "@/utils/currency-format";
import { styles } from "@/screens/styles/budget-detail-screen.styles";
import { formatCurrency } from "../utils/format";

type BudgetSummaryCardPropsT = {
  name: string;
  icon: string;
  iconColor: string;
  current: number;
  limit: number;
  remaining: number;
  isOverBudget: boolean;
  displayPercentage: number;
};

/**
 * Shows the summary card with budget progress and stats.
 */
export const BudgetSummaryCard = ({
  name,
  icon,
  iconColor,
  current,
  limit,
  remaining,
  isOverBudget,
  displayPercentage,
}: BudgetSummaryCardPropsT) => {
  const { currency } = useApp();
  const currencySymbol = getCurrencySymbol(currency);
  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <View
          style={[styles.iconContainer, { backgroundColor: `${iconColor}20` }]}
        >
          <Feather name={icon as any} size={28} color={iconColor} />
        </View>
        <View style={styles.summaryInfo}>
          <Text style={styles.summaryTitle}>{name}</Text>
          <Text
            style={[
              styles.summaryAmount,
              isOverBudget && styles.overBudgetText,
            ]}
          >
            {currencySymbol} {formatCurrency(current, currency)} / {currencySymbol} {formatCurrency(limit, currency)}
          </Text>
        </View>
      </View>

      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${displayPercentage}%` },
            isOverBudget && styles.progressBarOver,
          ]}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Ausgegeben</Text>
          <Text
            style={[styles.statValue, isOverBudget && styles.overBudgetText]}
          >
            {currencySymbol} {formatCurrency(current, currency)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Übrig</Text>
          <Text style={styles.statValue}>{currencySymbol} {formatCurrency(remaining, currency)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Limit</Text>
          <Text style={styles.statValue}>{currencySymbol} {formatCurrency(limit, currency)}</Text>
        </View>
      </View>
    </View>
  );
};
