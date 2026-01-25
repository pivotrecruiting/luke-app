import { Pressable, Text, View, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import Svg, { G, Line, Rect } from "react-native-svg";
import { styles } from "@/screens/styles/insights-screen.styles";
import { formatCurrency } from "../utils/format";
import type { MonthlyTrendT } from "../types/insights-types";

type TrendViewPropsT = {
  monthlyData: MonthlyTrendT[];
  selectedMonth: number | null;
  onSelectMonth: (index: number | null) => void;
};

/**
 * Renders a monthly trend chart with selectable months and highlights.
 */
export const TrendView = ({
  monthlyData,
  selectedMonth,
  onSelectMonth,
}: TrendViewPropsT) => {
  const screenWidth = Dimensions.get("window").width;
  const maxAmount = Math.max(...monthlyData.map((d) => d.amount), 1);
  const chartHeight = 180;
  const chartWidth = screenWidth - 80;
  const barWidth = chartWidth / monthlyData.length - 12;

  const average =
    monthlyData.reduce((sum, d) => sum + d.amount, 0) / monthlyData.length;
  const currentMonthData = monthlyData[monthlyData.length - 1];
  const previousMonthData =
    monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null;

  const displayedData =
    selectedMonth !== null ? monthlyData[selectedMonth] : currentMonthData;
  const displayLabel =
    selectedMonth !== null ? monthlyData[selectedMonth].month : "Diesen Monat";

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
          <Text style={styles.trendSubtitle}>Letzte 6 Monate</Text>
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
          <View
            style={{
              position: "relative",
              width: chartWidth,
              height: chartHeight + 30,
            }}
          >
            <Svg
              width={chartWidth}
              height={chartHeight + 30}
              style={{ position: "absolute", top: 0, left: 0 }}
            >
              <Line
                x1={0}
                y1={chartHeight - (average / maxAmount) * chartHeight}
                x2={chartWidth}
                y2={chartHeight - (average / maxAmount) * chartHeight}
                stroke="#9CA3AF"
                strokeWidth={1}
                strokeDasharray="5,5"
              />
              {monthlyData.map((data, index) => {
                const barHeight = (data.amount / maxAmount) * chartHeight;
                const x = index * (chartWidth / monthlyData.length) + 6;
                const y = chartHeight - barHeight;
                const isCurrentMonth = index === monthlyData.length - 1;
                const isSelected = selectedMonth === index;
                const hasSelection = selectedMonth !== null;

                return (
                  <G key={index}>
                    <Rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx={6}
                      fill={
                        isSelected
                          ? "#3B5BDB"
                          : isCurrentMonth && !hasSelection
                            ? "#3B5BDB"
                            : "#E5E7EB"
                      }
                      opacity={hasSelection && !isSelected ? 0.5 : 1}
                    />
                  </G>
                );
              })}
            </Svg>
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                flexDirection: "row",
                width: chartWidth,
                height: chartHeight,
              }}
            >
              {monthlyData.map((data, index) => {
                const barHeight = (data.amount / maxAmount) * chartHeight;
                const x = index * (chartWidth / monthlyData.length) + 6;
                const isSelected = selectedMonth === index;

                return (
                  <Pressable
                    key={index}
                    style={{
                      position: "absolute",
                      left: x,
                      top: chartHeight - barHeight,
                      width: barWidth,
                      height: barHeight,
                    }}
                    onPress={() => onSelectMonth(isSelected ? null : index)}
                  />
                );
              })}
            </View>
          </View>
          <View style={styles.chartLabels}>
            {monthlyData.map((data, index) => {
              const isSelected = selectedMonth === index;
              const isCurrentMonth = index === monthlyData.length - 1;
              const hasSelection = selectedMonth !== null;

              return (
                <Pressable
                  key={index}
                  style={styles.chartLabelPressable}
                  onPress={() => onSelectMonth(isSelected ? null : index)}
                >
                  <Text
                    style={[
                      styles.chartMonthLabel,
                      (isSelected || (isCurrentMonth && !hasSelection)) &&
                        styles.chartMonthLabelActive,
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
