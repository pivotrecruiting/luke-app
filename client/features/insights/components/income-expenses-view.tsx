import { Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { getCurrencySymbol } from "@/utils/currency-format";
import { styles } from "@/screens/styles/insights-screen.styles";
import { formatCurrency } from "../utils/format";
import type { TimeFilterT } from "../types/insights-types";

type IncomeExpensesViewPropsT = {
  income: number;
  expenses: number;
  timeFilter: TimeFilterT;
};

/**
 * Shows income vs expenses summary with trend and tips.
 */
export const IncomeExpensesView = ({
  income,
  expenses,
  timeFilter,
}: IncomeExpensesViewPropsT) => {
  const { currency } = useApp();
  const currencySymbol = getCurrencySymbol(currency);
  const timeFilterLabel = (() => {
    switch (timeFilter) {
      case "thisMonth":
        return "Dieser Monat";
      case "lastMonth":
        return "Letzter Monat";
      case "last3Months":
        return "3 Monate";
      case "last6Months":
        return "6 Monate";
      case "thisYear":
        return "Jahr";
      default:
        return "Dieser Monat";
    }
  })();
  const difference = income - expenses;
  const isPositive = difference >= 0;
  const maxValue = Math.max(income, expenses);
  const incomeWidth = maxValue > 0 ? (income / maxValue) * 100 : 0;
  const expensesWidth = maxValue > 0 ? (expenses / maxValue) * 100 : 0;
  const savingsRate = income > 0 ? (difference / income) * 100 : 0;

  return (
    <View style={styles.incomeExpensesContainer}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Bilanz · {timeFilterLabel}</Text>
          <View
            style={[
              styles.statusBadge,
              isPositive ? styles.statusPositive : styles.statusNegative,
            ]}
          >
            <Feather
              name={isPositive ? "trending-up" : "trending-down"}
              size={14}
              color={isPositive ? "#059669" : "#DC2626"}
            />
            <Text
              style={[
                styles.statusText,
                isPositive
                  ? styles.statusTextPositive
                  : styles.statusTextNegative,
              ]}
            >
              {isPositive ? "Im Plus" : "Im Minus"}
            </Text>
          </View>
        </View>

        <View style={styles.barSection}>
          <View style={styles.barRow}>
            <View style={styles.barLabelContainer}>
              <View
                style={[styles.barIndicator, { backgroundColor: "#22C55E" }]}
              />
              <Text style={styles.barLabel}>Einnahmen</Text>
            </View>
            <Text style={styles.barValue}>{currencySymbol} {formatCurrency(income, currency)}</Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                styles.barFillIncome,
                { width: `${incomeWidth}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.barSection}>
          <View style={styles.barRow}>
            <View style={styles.barLabelContainer}>
              <View
                style={[styles.barIndicator, { backgroundColor: "#EF4444" }]}
              />
              <Text style={styles.barLabel}>Ausgaben</Text>
            </View>
            <Text style={styles.barValue}>{currencySymbol} {formatCurrency(expenses, currency)}</Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                styles.barFillExpenses,
                { width: `${expensesWidth}%` },
              ]}
            />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.differenceSection}>
          <View style={styles.differenceRow}>
            <Text style={styles.differenceLabel}>Differenz</Text>
            <Text
              style={[
                styles.differenceValue,
                isPositive
                  ? styles.differencePositive
                  : styles.differenceNegative,
              ]}
            >
              {isPositive ? "+" : ""}{currencySymbol} {formatCurrency(difference, currency)}
            </Text>
          </View>
          <View style={styles.differenceRow}>
            <Text style={styles.savingsLabel}>Sparquote</Text>
            <Text
              style={[
                styles.savingsValue,
                isPositive
                  ? styles.differencePositive
                  : styles.differenceNegative,
              ]}
            >
              {savingsRate.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tipsCard}>
        <View style={styles.tipsHeader}>
          <Feather name="zap" size={20} color="#F59E0B" />
          <Text style={styles.tipsTitle}>Tipp</Text>
        </View>
        <Text style={styles.tipsText}>
          {isPositive
            ? savingsRate >= 20
              ? "Hervorragend! Du sparst über 20% deines Einkommens. Weiter so!"
              : "Du bist auf einem guten Weg. Versuche, deine Sparquote auf 20% zu erhöhen."
            : "Deine Ausgaben übersteigen deine Einnahmen. Prüfe deine variablen Kosten."}
        </Text>
      </View>
    </View>
  );
};
