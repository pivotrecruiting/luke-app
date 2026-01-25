import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { styles } from "@/screens/styles/goals-screen.styles";
import { formatCurrency } from "../utils/format";
import type { BudgetItemPropsT } from "../types/goals-types";

/**
 * Renders a single budget item with progress.
 */
export const BudgetItem = ({ budget, onPress }: BudgetItemPropsT) => {
  const percentage = (budget.current / budget.limit) * 100;
  const isOverBudget = budget.current > budget.limit;
  const displayPercentage = Math.min(percentage, 100);

  return (
    <Pressable style={styles.budgetItem} onPress={onPress}>
      <View style={styles.budgetHeader}>
        <View style={styles.budgetLeft}>
          <View
            style={[
              styles.budgetIconContainer,
              { backgroundColor: `${budget.iconColor}20` },
            ]}
          >
            <Feather name={budget.icon as any} size={20} color={budget.iconColor} />
          </View>
          <View>
            <Text style={styles.budgetName}>{budget.name}</Text>
            <Text
              style={[
                styles.budgetProgress,
                isOverBudget && styles.budgetProgressOver,
              ]}
            >
              € {formatCurrency(budget.current)} / € {budget.limit}
            </Text>
          </View>
        </View>
        <View style={styles.budgetRight}>
          <Text
            style={[styles.budgetLimit, isOverBudget && styles.budgetLimitOver]}
          >
            € {budget.limit}
          </Text>
          <Feather name="chevron-right" size={16} color="#9CA3AF" />
        </View>
      </View>
      <View style={styles.budgetProgressBarContainer}>
        <View
          style={[
            styles.budgetProgressBar,
            { width: `${displayPercentage}%` },
            isOverBudget && styles.budgetProgressBarOver,
          ]}
        />
      </View>
    </Pressable>
  );
};
