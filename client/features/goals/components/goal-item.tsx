import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { getCurrencySymbol } from "@/utils/currency-format";
import { styles } from "@/screens/styles/goals-screen.styles";
import { formatCurrency } from "../utils/format";
import type { GoalItemPropsT } from "../types/goals-types";

/**
 * Renders a single goal item with progress and deposit button.
 */
export const GoalItem = ({ goal, onPress, onDepositPress }: GoalItemPropsT) => {
  const { currency } = useApp();
  const currencySymbol = getCurrencySymbol(currency);
  const percentage = (goal.current / goal.target) * 100;

  return (
    <View style={styles.goalItem}>
      <Pressable onPress={onPress}>
        <View style={styles.goalHeader}>
          <View style={styles.goalLeft}>
            <Text style={styles.goalIcon}>{goal.icon}</Text>
            <View>
              <Text style={styles.goalName}>{goal.name}</Text>
              <Text style={styles.goalProgress}>
                {currencySymbol} {formatCurrency(goal.current, currency)} /{" "}
                {currencySymbol} {formatCurrency(goal.target, currency)}
              </Text>
            </View>
          </View>
          <Text style={styles.goalPercentage}>
            {percentage.toFixed(2).replace(".", ",")}%
          </Text>
        </View>
        <View style={styles.goalProgressBarContainer}>
          <View
            style={[styles.goalProgressBar, { width: `${percentage}%` }]}
          />
        </View>
      </Pressable>
      <View style={styles.goalFooter}>
        <Pressable onPress={onPress} style={styles.goalFooterLeft}>
          <Text style={styles.goalRemainingLabel}>Übrig</Text>
          <Text style={styles.goalRemainingValue}>
            {currencySymbol} {formatCurrency(goal.remaining, currency)}
          </Text>
        </Pressable>
        <Pressable
          style={styles.goalDepositButton}
          onPress={() => onDepositPress(goal)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Einzahlen"
        >
          <Feather name="plus" size={18} color="#3B5BDB" />
          <Text style={styles.goalDepositButtonText}>Einzahlen</Text>
        </Pressable>
      </View>
    </View>
  );
};
