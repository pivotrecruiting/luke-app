import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "@/context/AppContext";
import { getCurrencySymbol } from "@/utils/currency-format";
import { styles } from "@/screens/styles/insights-screen.styles";
import { formatCurrency } from "../utils/format";
import type { MonthlyTrendT, TimeFilterT } from "../types/insights-types";

/** Max bar height in px; must match `trendBarWrapper` height in insights-screen.styles. */
const TREND_BAR_MAX_HEIGHT_PX = 180;

type TrendViewPropsT = {
  monthlyData: MonthlyTrendT[];
  timeFilter: TimeFilterT;
  selectedMonth: number | null;
  onSelectMonth: (index: number | null) => void;
};

/**
 * Renders the expense trend card: stats, interactive bar chart, and month-over-month change.
 * Month selection is via the chart only (no separate insight cards).
 */
export const TrendView = ({
  monthlyData,
  timeFilter,
  selectedMonth,
  onSelectMonth,
}: TrendViewPropsT) => {
  const { currency } = useApp();
  const currencySymbol = getCurrencySymbol(currency);
  if (monthlyData.length === 0) {
    return (
      <View style={styles.trendContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.summaryTitle}>Ausgaben-Entwicklung</Text>
            <Text style={styles.trendSubtitle}>Keine Daten</Text>
          </View>
          <Text style={styles.trendHint}>Keine Trenddaten verfügbar</Text>
        </View>
      </View>
    );
  }

  const safeSelectedMonth =
    selectedMonth !== null &&
    selectedMonth >= 0 &&
    selectedMonth < monthlyData.length
      ? selectedMonth
      : null;

  const maxAmount = Math.max(...monthlyData.map((d) => d.amount), 1);

  const averageBase = monthlyData.filter((d) => d.amount > 0);
  const average =
    averageBase.length > 0
      ? averageBase.reduce((sum, d) => sum + d.amount, 0) / averageBase.length
      : 0;
  const currentMonthData = monthlyData[monthlyData.length - 1];
  const previousMonthData =
    monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null;

  const displayedData =
    safeSelectedMonth !== null
      ? monthlyData[safeSelectedMonth]
      : currentMonthData;
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
        return "Dieses Jahr";
      default:
        return "Dieser Monat";
    }
  })();
  const displayLabel =
    safeSelectedMonth !== null
      ? monthlyData[safeSelectedMonth].month
      : timeFilterLabel;

  const changePercent =
    previousMonthData && previousMonthData.amount > 0
      ? ((currentMonthData.amount - previousMonthData.amount) /
          previousMonthData.amount) *
        100
      : 0;
  const isImproving = changePercent <= 0;

  return (
    <View style={styles.trendContainer}>
      <View style={styles.summaryCard}>
        <View style={styles.trendHeader}>
          <Text style={styles.summaryTitle}>Ausgaben-Entwicklung</Text>
          <Text style={styles.trendSubtitle}>{timeFilterLabel}</Text>
        </View>

        <View style={styles.trendStatsRow}>
          <View style={styles.trendStat}>
            <Text style={styles.trendStatLabel}>Durchschnitt</Text>
            <Text style={styles.trendStatValue}>
              {currencySymbol} {formatCurrency(average, currency)}
            </Text>
          </View>
          <View style={styles.trendStatDivider} />
          <View style={styles.trendStat}>
            <Text style={styles.trendStatLabel}>{displayLabel}</Text>
            <Text
              style={[
                styles.trendStatValue,
                displayedData.amount <= average
                  ? styles.trendPositive
                  : styles.trendNegative,
              ]}
            >
              {currencySymbol} {formatCurrency(displayedData.amount, currency)}
            </Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <View style={styles.trendChartBars}>
            {monthlyData.map((data, index) => {
              const isZero = data.amount <= 0;
              const barHeight = isZero
                ? 6
                : Math.max(
                    (data.amount / maxAmount) * TREND_BAR_MAX_HEIGHT_PX,
                    8,
                  );
              const isSelected = safeSelectedMonth === index;
              const isCurrentMonth = index === monthlyData.length - 1;
              const hasSelection = selectedMonth !== null;
              const isActive =
                !isZero && (isSelected || (isCurrentMonth && !hasSelection));
              const barColors = isActive
                ? (["#5B6BBE", "#3B4B9E"] as const)
                : (["#A5B4FC", "#7B8CDE"] as const);

              return (
                <Pressable
                  key={index}
                  style={styles.trendBarContainer}
                  onPress={() => onSelectMonth(isSelected ? null : index)}
                >
                  <View style={styles.trendBarWrapper}>
                    <LinearGradient
                      colors={barColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={[
                        styles.trendBar,
                        { height: barHeight },
                        isActive && styles.trendBarSelected,
                        hasSelection &&
                          !isSelected &&
                          !isZero &&
                          styles.trendBarDimmed,
                        isZero && styles.trendBarZero,
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.trendBarLabel,
                      isActive && styles.trendBarLabelSelected,
                    ]}
                  >
                    {data.month}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={styles.trendHint}>Tippe auf einen Monat für Details</Text>

        <View style={styles.trendChangeRow}>
          <View
            style={[
              styles.changeIndicator,
              isImproving ? styles.changePositive : styles.changeNegative,
            ]}
          >
            <Feather
              name={isImproving ? "arrow-down" : "arrow-up"}
              size={16}
              color={isImproving ? "#059669" : "#DC2626"}
            />
            <Text
              style={[
                styles.changeText,
                isImproving
                  ? styles.changeTextPositive
                  : styles.changeTextNegative,
              ]}
            >
              {Math.abs(changePercent).toFixed(1)}%{" "}
              {isImproving ? "weniger" : "mehr"} als letzten Monat
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};
