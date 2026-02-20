import { Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { getCurrencySymbol } from "@/utils/currency-format";
import { styles } from "@/screens/styles/insights-screen.styles";
import { formatCurrency } from "../utils/format";
import type {
  PeriodIncomeExpensesT,
  TimeFilterT,
} from "../types/insights-types";

const CHART_HEIGHT = 100;

type IncomeExpensesViewPropsT = {
  income: number;
  expenses: number;
  periodIncomeExpenses: PeriodIncomeExpensesT[];
  timeFilter: TimeFilterT;
};

/**
 * Renders a balance header and vertical bar chart comparing income vs expenses per period.
 */
export const IncomeExpensesView = ({
  income,
  expenses,
  periodIncomeExpenses,
  timeFilter,
}: IncomeExpensesViewPropsT) => {
  const { currency } = useApp();
  const currencySymbol = getCurrencySymbol(currency);
  const balance = income - expenses;
  const isPositive = balance >= 0;

  const maxValue = Math.max(
    1,
    ...periodIncomeExpenses.flatMap((p) => [p.income, p.expenses]),
  );

  if (periodIncomeExpenses.length === 0) {
    return (
      <View style={styles.incomeExpensesContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceTitle}>Balance</Text>
            <Text style={styles.balanceAmount}>
              {currencySymbol} {formatCurrency(balance, currency)}
            </Text>
          </View>
          <Text style={styles.incomeExpensesPeriodLabel}>
            Keine Periodendaten verfügbar
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.incomeExpensesContainer}>
      <View style={styles.summaryCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceTitle}>Balance</Text>
          <Text style={styles.balanceAmount}>
            {currencySymbol} {formatCurrency(balance, currency)}
          </Text>
        </View>

        <View style={styles.incomeExpensesChartContainer}>
          <View style={styles.incomeExpensesChartBars}>
            {periodIncomeExpenses.map((period, index) => {
              const expensesHeight =
                period.expenses > 0
                  ? Math.max((period.expenses / maxValue) * CHART_HEIGHT, 6)
                  : 0;
              const incomeHeight =
                period.income > 0
                  ? Math.max((period.income / maxValue) * CHART_HEIGHT, 6)
                  : 0;

              return (
                <View
                  key={index}
                  style={styles.incomeExpensesPeriodGroup}
                  accessibilityLabel={`Period ${period.label}: Income ${formatCurrency(period.income, currency)}, Expenses ${formatCurrency(period.expenses, currency)}`}
                >
                  <View style={styles.incomeExpensesBarWrapper}>
                    <View
                      style={[
                        styles.incomeExpensesBar,
                        styles.incomeExpensesBarExpenses,
                        { height: expensesHeight || 4 },
                      ]}
                    />
                    <View
                      style={[
                        styles.incomeExpensesBar,
                        styles.incomeExpensesBarIncome,
                        { height: incomeHeight || 4 },
                      ]}
                    />
                  </View>
                  <Text style={styles.incomeExpensesPeriodLabel}>
                    {period.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.incomeExpensesLegend}>
          <View style={styles.incomeExpensesLegendItem}>
            <View
              style={[
                styles.incomeExpensesLegendDot,
                styles.incomeExpensesBarExpenses,
              ]}
            />
            <Text style={styles.incomeExpensesLegendText}>Ausgaben</Text>
          </View>
          <View style={styles.incomeExpensesLegendItem}>
            <View
              style={[
                styles.incomeExpensesLegendDot,
                styles.incomeExpensesBarIncome,
              ]}
            />
            <Text style={styles.incomeExpensesLegendText}>Einnahmen</Text>
          </View>
        </View>
      </View>
    </View>
  );
};
