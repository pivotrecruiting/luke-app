import { useMemo } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useApp } from "@/context/AppContext";
import { getCurrencySymbol } from "@/utils/currency-format";
import { styles } from "@/screens/styles/insights-screen.styles";
import { formatCurrency } from "../utils/format";
import type { MonthlyTrendT, TimeFilterT } from "../types/insights-types";

const CHART_HORIZONTAL_PADDING_PX = 80;

type TrendViewPropsT = {
  monthlyData: MonthlyTrendT[];
  timeFilter: TimeFilterT;
  currentSavings: number;
  selectedMonth: number | null;
  onSelectMonth: (index: number | null) => void;
};

/**
 * Renders a responsive savings card with a line chart and month selection.
 */
export const TrendView = ({
  monthlyData,
  timeFilter,
  currentSavings,
  selectedMonth,
  onSelectMonth,
}: TrendViewPropsT) => {
  const { currency } = useApp();
  const { width: windowWidth } = useWindowDimensions();
  const currencySymbol = getCurrencySymbol(currency);

  if (monthlyData.length === 0) {
    return (
      <View style={styles.trendContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.trendHeader}>
            <Text style={styles.summaryTitle}>Aktuelle Ersparnisse</Text>
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

  const lastMonthData = monthlyData[monthlyData.length - 1];
  const selectedData =
    safeSelectedMonth !== null
      ? monthlyData[safeSelectedMonth]
      : lastMonthData;

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
  const chartWidth = useMemo(() => {
    return Math.max(windowWidth - CHART_HORIZONTAL_PADDING_PX, 240);
  }, [windowWidth]);
  const lineData = useMemo(() => {
    return monthlyData.map((item) => ({
      value: Math.max(item.amount, 0),
      label: item.month,
    }));
  }, [monthlyData]);

  const handleMonthIndex = (index: number) => {
    if (index < 0 || index >= monthlyData.length) {
      return;
    }
    onSelectMonth(selectedMonth === index ? null : index);
  };

  const headerAmount =
    safeSelectedMonth !== null ? selectedData.amount : currentSavings;
  const headerSubtitle =
    safeSelectedMonth !== null
      ? `${selectedData.month} - ${timeFilterLabel}`
      : `${lastMonthData.month} - ${timeFilterLabel}`;

  return (
    <View style={styles.trendContainer}>
      <View style={styles.summaryCard}>
        <View style={styles.trendHeader}>
          <Text style={styles.summaryTitle}>
            {safeSelectedMonth !== null
              ? `Ersparnisse ${selectedData.month}`
              : "Aktuelle Ersparnisse"}
          </Text>
          <Text style={styles.trendSavingsValue}>
            {currencySymbol} {formatCurrency(headerAmount, currency)}
          </Text>
          <Text style={styles.trendSubtitle}>{headerSubtitle}</Text>
        </View>

        <View style={styles.chartContainer}>
          <LineChart
            data={lineData}
            width={chartWidth}
            height={200}
            areaChart
            labelsExtraHeight={32}
            xAxisLabelsHeight={22}
            focusEnabled
            showStripOnFocus={false}
            color="#3B5BDB"
            thickness={3}
            hideYAxisText
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor="#D1D5DB"
            xAxisLabelTextStyle={styles.trendLineLabel}
            noOfSections={4}
            rulesType="dashed"
            rulesColor="#E5E7EB"
            startFillColor="rgba(59, 91, 219, 0.25)"
            endFillColor="rgba(59, 91, 219, 0.04)"
            startOpacity={0.8}
            endOpacity={0.1}
            dataPointsColor="#3B5BDB"
            dataPointsRadius={6}
            focusedDataPointIndex={safeSelectedMonth ?? -1}
            onFocus={(_item: unknown, index: number) => {
              handleMonthIndex(index);
            }}
            onPress={(_item: unknown, index: number) => {
              handleMonthIndex(index);
            }}
          />
        </View>

        <Text style={styles.trendHint}>
          Tippe auf einen Monat, um die Summe oben zu sehen
        </Text>
      </View>
    </View>
  );
};
