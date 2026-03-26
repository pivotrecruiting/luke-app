import { useMemo } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useApp } from "@/context/AppContext";
import { getCurrencySymbol } from "@/utils/currency-format";
import { styles } from "@/screens/styles/insights-screen.styles";
import { formatCurrency } from "../utils/format";
import type { MonthlyTrendT, TimeFilterT } from "../types/insights-types";

const CHART_HORIZONTAL_PADDING_PX = 80;
const CHART_HEIGHT_PX = 200;
const CHART_INITIAL_SPACING_PX = 24;
const DATA_POINT_RADIUS_PX = 6;
const SELECTED_DATA_POINT_COLOR = "#C4B5FD";
const CHART_LABEL_STYLE = {
  fontSize: 12,
  lineHeight: 16,
  color: "#9CA3AF",
};
const CHART_LABEL_SELECTED_STYLE = {
  fontSize: 12,
  lineHeight: 16,
  color: "#1D4ED8",
  fontWeight: "700" as const,
};

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

  const chartSpacing = useMemo(() => {
    if (monthlyData.length <= 1) {
      return 0;
    }

    return (
      (chartWidth - CHART_INITIAL_SPACING_PX * 2) / (monthlyData.length - 1)
    );
  }, [chartWidth, monthlyData.length]);

  const lineData = useMemo(() => {
    return monthlyData.map((item, index) => ({
      value: Math.max(item.amount, 0),
      label: item.month,
      labelTextStyle:
        safeSelectedMonth === index
          ? { ...CHART_LABEL_SELECTED_STYLE }
          : { ...CHART_LABEL_STYLE },
      dataPointRadius:
        safeSelectedMonth === index
          ? DATA_POINT_RADIUS_PX + 2
          : DATA_POINT_RADIUS_PX,
      dataPointColor:
        safeSelectedMonth === index
          ? SELECTED_DATA_POINT_COLOR
          : "#3B5BDB",
    }));
  }, [monthlyData, safeSelectedMonth]);

  const hitAreas = useMemo(() => {
    return monthlyData.map((item, index) => {
      const currentX = CHART_INITIAL_SPACING_PX + chartSpacing * index;
      const previousX = CHART_INITIAL_SPACING_PX + chartSpacing * (index - 1);
      const nextX = CHART_INITIAL_SPACING_PX + chartSpacing * (index + 1);
      const left = index === 0 ? 0 : (previousX + currentX) / 2;
      const right =
        index === monthlyData.length - 1 ? chartWidth : (currentX + nextX) / 2;

      return {
        key: `${item.month}-${index}`,
        month: item.month,
        left,
        width: Math.max(right - left, 1),
      };
    });
  }, [chartSpacing, chartWidth, monthlyData]);

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
          <View
            style={[
              styles.trendChartTouchableArea,
              { width: chartWidth, height: CHART_HEIGHT_PX },
            ]}
          >
            {hitAreas.map((area, index) => (
              <Pressable
                key={area.key}
                accessibilityRole="button"
                accessibilityLabel={`Wert fuer ${area.month} auswaehlen`}
                style={[
                  styles.trendChartHitArea,
                  { left: area.left, width: area.width, height: CHART_HEIGHT_PX },
                ]}
                onPress={() => handleMonthIndex(index)}
              />
            ))}
          </View>

          <LineChart
            data={lineData}
            width={chartWidth}
            height={CHART_HEIGHT_PX}
            areaChart
            initialSpacing={CHART_INITIAL_SPACING_PX}
            spacing={chartSpacing}
            labelsExtraHeight={32}
            xAxisLabelsHeight={22}
            showStripOnFocus={false}
            color="#3B5BDB"
            thickness={3}
            hideYAxisText
            yAxisThickness={0}
            xAxisThickness={1}
            xAxisColor="#D1D5DB"
            noOfSections={4}
            rulesType="dashed"
            rulesColor="#E5E7EB"
            startFillColor="rgba(59, 91, 219, 0.25)"
            endFillColor="rgba(59, 91, 219, 0.04)"
            startOpacity={0.8}
            endOpacity={0.1}
            dataPointsColor="#3B5BDB"
            dataPointsRadius={DATA_POINT_RADIUS_PX}
          />
        </View>

        <Text style={styles.trendHint}>
          Tippe auf einen Monat, um die Summe oben zu sehen
        </Text>
      </View>
    </View>
  );
};
