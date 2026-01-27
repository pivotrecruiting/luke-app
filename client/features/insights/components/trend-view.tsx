import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { styles } from "@/screens/styles/insights-screen.styles";
import { formatCurrency } from "../utils/format";
import type { MonthlyTrendT, TimeFilterT } from "../types/insights-types";

type TrendViewPropsT = {
  monthlyData: MonthlyTrendT[];
  timeFilter: TimeFilterT;
  selectedMonth: number | null;
  onSelectMonth: (index: number | null) => void;
};

/**
 * Renders a monthly trend chart with selectable months and highlights.
 */
export const TrendView = ({
  monthlyData,
  timeFilter,
  selectedMonth,
  onSelectMonth,
}: TrendViewPropsT) => {
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

  const maxAmount = Math.max(...monthlyData.map((d) => d.amount), 1);

  const averageBase = monthlyData.filter((d) => d.amount > 0);
  const average =
    averageBase.length > 0
      ? averageBase.reduce((sum, d) => sum + d.amount, 0) /
        averageBase.length
      : 0;
  const currentMonthData = monthlyData[monthlyData.length - 1];
  const previousMonthData =
    monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null;

  const displayedData =
    selectedMonth !== null ? monthlyData[selectedMonth] : currentMonthData;
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
    selectedMonth !== null ? monthlyData[selectedMonth].month : timeFilterLabel;

  const changePercent =
    previousMonthData && previousMonthData.amount > 0
      ? ((currentMonthData.amount - previousMonthData.amount) /
          previousMonthData.amount) *
        100
      : 0;
  const isImproving = changePercent <= 0;

  const bestMonthIndex = monthlyData.reduce(
    (min, d, i, arr) => (d.amount < arr[min].amount ? i : min),
    0,
  );
  const worstMonthIndex = monthlyData.reduce(
    (max, d, i, arr) => (d.amount > arr[max].amount ? i : max),
    0,
  );

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
              € {formatCurrency(average)}
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
              € {formatCurrency(displayedData.amount)}
            </Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          {selectedMonth !== null ? (
            <View style={styles.trendChartSelectedAmount}>
              <Text style={styles.trendChartSelectedAmountText}>
                € {formatCurrency(displayedData.amount)}
              </Text>
            </View>
          ) : null}
          <View style={styles.trendChartBars}>
            {monthlyData.map((data, index) => {
              const isZero = data.amount <= 0;
              const barHeight = isZero
                ? 6
                : Math.max((data.amount / maxAmount) * 100, 8);
              const isSelected = selectedMonth === index;
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

      <View style={styles.insightCards}>
        <Pressable
          style={[
            styles.insightCard,
            selectedMonth === bestMonthIndex && styles.insightCardSelected,
          ]}
          onPress={() =>
            onSelectMonth(
              selectedMonth === bestMonthIndex ? null : bestMonthIndex,
            )
          }
        >
          <View style={[styles.insightIcon, { backgroundColor: "#EFF6FF" }]}>
            <Feather name="calendar" size={18} color="#3B5BDB" />
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.insightLabel}>Bester Monat</Text>
            <Text style={styles.insightValue}>
              {monthlyData[bestMonthIndex].month}
            </Text>
          </View>
        </Pressable>
        <Pressable
          style={[
            styles.insightCard,
            selectedMonth === worstMonthIndex && styles.insightCardSelected,
          ]}
          onPress={() =>
            onSelectMonth(
              selectedMonth === worstMonthIndex ? null : worstMonthIndex,
            )
          }
        >
          <View style={[styles.insightIcon, { backgroundColor: "#FEF3C7" }]}>
            <Feather name="alert-circle" size={18} color="#F59E0B" />
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.insightLabel}>Teuerster Monat</Text>
            <Text style={styles.insightValue}>
              {monthlyData[worstMonthIndex].month}
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
};
