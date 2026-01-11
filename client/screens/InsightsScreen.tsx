import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Svg, { Circle, G, Rect, Line } from "react-native-svg";
import { Spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

const screenWidth = Dimensions.get("window").width;

const formatCurrency = (value: number) => {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const GERMAN_MONTHS_SHORT = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

interface DonutChartProps {
  categories: { name: string; amount: number; color: string }[];
  total: number;
  selectedCategory: string | null;
  onSelectCategory: (name: string | null) => void;
}

function DonutChart({ categories, total, selectedCategory, onSelectCategory }: DonutChartProps) {
  const size = 215;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const gap = 4;

  let currentAngle = -90;

  const segments = categories.map((kategorie) => {
    const percentage = kategorie.amount / total;
    const segmentLength = circumference * percentage - gap;
    const strokeDasharray = `${segmentLength} ${circumference - segmentLength}`;
    const rotation = currentAngle;
    currentAngle += percentage * 360;

    return {
      ...kategorie,
      strokeDasharray,
      rotation,
      percentage,
    };
  });

  const selectedCategoryData = selectedCategory
    ? categories.find((c) => c.name === selectedCategory)
    : null;

  const displayAmount = selectedCategoryData ? selectedCategoryData.amount : total;
  const displayLabel = selectedCategoryData ? selectedCategoryData.name : "Gesamt";

  return (
    <Pressable 
      style={styles.chartWrapper}
      onPress={() => onSelectCategory(null)}
    >
      <Svg width={size} height={size}>
        <G rotation={0} origin={`${center}, ${center}`}>
          {segments.map((segment, index) => {
            const isSelected = selectedCategory === segment.name;
            const hasSelection = selectedCategory !== null;
            const segmentOpacity = hasSelection ? (isSelected ? 1 : 0.4) : 1;
            const segmentStrokeWidth = isSelected ? strokeWidth + 4 : strokeWidth;
            
            return (
              <Circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                stroke={segment.color}
                strokeWidth={segmentStrokeWidth}
                fill="transparent"
                strokeDasharray={segment.strokeDasharray}
                strokeDashoffset={0}
                rotation={segment.rotation}
                origin={`${center}, ${center}`}
                strokeLinecap="butt"
                opacity={segmentOpacity}
              />
            );
          })}
        </G>
      </Svg>
      <View style={styles.chartCenter}>
        <Text style={styles.chartAmount}>€ {formatCurrency(displayAmount)}</Text>
        <Text style={styles.chartLabel}>{displayLabel}</Text>
        {selectedCategoryData ? (
          <Text style={styles.chartPercentage}>
            {((selectedCategoryData.amount / total) * 100).toFixed(1)}%
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

interface IncomeExpensesViewProps {
  income: number;
  expenses: number;
}

function IncomeExpensesView({ income, expenses }: IncomeExpensesViewProps) {
  const difference = income - expenses;
  const isPositive = difference >= 0;
  const maxValue = Math.max(income, expenses);
  const incomeWidth = maxValue > 0 ? (income / maxValue) * 100 : 0;
  const expensesWidth = maxValue > 0 ? (expenses / maxValue) * 100 : 0;
  const savingsRate = income > 0 ? ((difference / income) * 100) : 0;

  return (
    <View style={styles.incomeExpensesContainer}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Monatliche Bilanz</Text>
          <View style={[styles.statusBadge, isPositive ? styles.statusPositive : styles.statusNegative]}>
            <Feather name={isPositive ? "trending-up" : "trending-down"} size={14} color={isPositive ? "#059669" : "#DC2626"} />
            <Text style={[styles.statusText, isPositive ? styles.statusTextPositive : styles.statusTextNegative]}>
              {isPositive ? "Im Plus" : "Im Minus"}
            </Text>
          </View>
        </View>

        <View style={styles.barSection}>
          <View style={styles.barRow}>
            <View style={styles.barLabelContainer}>
              <View style={[styles.barIndicator, { backgroundColor: "#22C55E" }]} />
              <Text style={styles.barLabel}>Einnahmen</Text>
            </View>
            <Text style={styles.barValue}>€ {formatCurrency(income)}</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, styles.barFillIncome, { width: `${incomeWidth}%` }]} />
          </View>
        </View>

        <View style={styles.barSection}>
          <View style={styles.barRow}>
            <View style={styles.barLabelContainer}>
              <View style={[styles.barIndicator, { backgroundColor: "#EF4444" }]} />
              <Text style={styles.barLabel}>Ausgaben</Text>
            </View>
            <Text style={styles.barValue}>€ {formatCurrency(expenses)}</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, styles.barFillExpenses, { width: `${expensesWidth}%` }]} />
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.differenceSection}>
          <View style={styles.differenceRow}>
            <Text style={styles.differenceLabel}>Differenz</Text>
            <Text style={[styles.differenceValue, isPositive ? styles.differencePositive : styles.differenceNegative]}>
              {isPositive ? "+" : ""}€ {formatCurrency(difference)}
            </Text>
          </View>
          <View style={styles.differenceRow}>
            <Text style={styles.savingsLabel}>Sparquote</Text>
            <Text style={[styles.savingsValue, isPositive ? styles.differencePositive : styles.differenceNegative]}>
              {savingsRate.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tipsCard}>
        <View style={styles.tipsHeader}>
          <Feather name="lightbulb" size={20} color="#F59E0B" />
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
}

interface TrendViewProps {
  monthlyData: { month: string; amount: number }[];
  currentMonth: number;
}

function TrendView({ monthlyData, currentMonth }: TrendViewProps) {
  const maxAmount = Math.max(...monthlyData.map(d => d.amount), 1);
  const chartHeight = 180;
  const chartWidth = screenWidth - 80;
  const barWidth = (chartWidth / monthlyData.length) - 12;
  
  const average = monthlyData.reduce((sum, d) => sum + d.amount, 0) / monthlyData.length;
  const currentMonthData = monthlyData[monthlyData.length - 1];
  const previousMonthData = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null;
  
  const changePercent = previousMonthData && previousMonthData.amount > 0
    ? ((currentMonthData.amount - previousMonthData.amount) / previousMonthData.amount) * 100
    : 0;
  const isImproving = changePercent <= 0;

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
            <Text style={styles.trendStatValue}>€ {formatCurrency(average)}</Text>
          </View>
          <View style={styles.trendStatDivider} />
          <View style={styles.trendStat}>
            <Text style={styles.trendStatLabel}>Diesen Monat</Text>
            <Text style={[styles.trendStatValue, isImproving ? styles.trendPositive : styles.trendNegative]}>
              € {formatCurrency(currentMonthData.amount)}
            </Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Svg width={chartWidth} height={chartHeight + 30}>
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
              
              return (
                <G key={index}>
                  <Rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx={6}
                    fill={isCurrentMonth ? "#3B5BDB" : "#E5E7EB"}
                  />
                </G>
              );
            })}
          </Svg>
          <View style={styles.chartLabels}>
            {monthlyData.map((data, index) => (
              <Text 
                key={index} 
                style={[
                  styles.chartMonthLabel,
                  index === monthlyData.length - 1 && styles.chartMonthLabelActive
                ]}
              >
                {data.month}
              </Text>
            ))}
          </View>
        </View>

        <View style={styles.trendChangeRow}>
          <View style={[styles.changeIndicator, isImproving ? styles.changePositive : styles.changeNegative]}>
            <Feather 
              name={isImproving ? "arrow-down" : "arrow-up"} 
              size={16} 
              color={isImproving ? "#059669" : "#DC2626"} 
            />
            <Text style={[styles.changeText, isImproving ? styles.changeTextPositive : styles.changeTextNegative]}>
              {Math.abs(changePercent).toFixed(1)}% {isImproving ? "weniger" : "mehr"} als letzten Monat
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.insightCards}>
        <View style={styles.insightCard}>
          <View style={[styles.insightIcon, { backgroundColor: "#EFF6FF" }]}>
            <Feather name="calendar" size={18} color="#3B5BDB" />
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.insightLabel}>Bester Monat</Text>
            <Text style={styles.insightValue}>
              {GERMAN_MONTHS_SHORT[monthlyData.reduce((min, d, i, arr) => d.amount < arr[min].amount ? i : min, 0) % 12]}
            </Text>
          </View>
        </View>
        <View style={styles.insightCard}>
          <View style={[styles.insightIcon, { backgroundColor: "#FEF3C7" }]}>
            <Feather name="alert-circle" size={18} color="#F59E0B" />
          </View>
          <View style={styles.insightContent}>
            <Text style={styles.insightLabel}>Teuerster Monat</Text>
            <Text style={styles.insightValue}>
              {GERMAN_MONTHS_SHORT[monthlyData.reduce((max, d, i, arr) => d.amount > arr[max].amount ? i : max, 0) % 12]}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { insightCategories, totalIncome, totalFixedExpenses, weeklySpending } = useApp();
  const [activeTab, setActiveTab] = useState<"ausgaben" | "einnahmen">("ausgaben");
  const [activeFilter, setActiveFilter] = useState<"kategorien" | "income" | "trend">("kategorien");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const gesamtAusgaben = useMemo(() => {
    return insightCategories.reduce((sum, cat) => sum + cat.amount, 0);
  }, [insightCategories]);

  const totalExpenses = useMemo(() => {
    const variableExpenses = weeklySpending.reduce((sum, day) => sum + day.amount, 0);
    return totalFixedExpenses + variableExpenses;
  }, [totalFixedExpenses, weeklySpending]);

  const monthlyTrendData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      const baseAmount = totalExpenses * (0.85 + Math.random() * 0.3);
      months.push({
        month: GERMAN_MONTHS_SHORT[monthIndex],
        amount: i === 0 ? totalExpenses : baseAmount,
      });
    }
    return months;
  }, [totalExpenses]);

  const handleCategoryPress = (categoryName: string) => {
    setSelectedCategory((prev) => (prev === categoryName ? null : categoryName));
  };

  const renderContent = () => {
    switch (activeFilter) {
      case "income":
        return (
          <IncomeExpensesView
            income={totalIncome}
            expenses={totalExpenses}
          />
        );
      case "trend":
        return (
          <TrendView
            monthlyData={monthlyTrendData}
            currentMonth={new Date().getMonth()}
          />
        );
      case "kategorien":
      default:
        return (
          <View style={styles.chartCard}>
            <DonutChart
              categories={insightCategories}
              total={gesamtAusgaben}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            <View style={styles.kategorienGrid}>
              {insightCategories.map((kategorie, index) => {
                const isSelected = selectedCategory === kategorie.name;
                return (
                  <Pressable
                    key={index}
                    style={[
                      styles.kategorieItem,
                      isSelected && styles.kategorieItemSelected,
                    ]}
                    onPress={() => handleCategoryPress(kategorie.name)}
                  >
                    <View
                      style={[styles.kategorieDot, { backgroundColor: kategorie.color }]}
                    />
                    <View>
                      <Text style={styles.kategorieName}>{kategorie.name}</Text>
                      <Text style={styles.kategorieBetrag}>
                        € {formatCurrency(kategorie.amount)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.pageIndicator}>
              <View style={[styles.pageDot, activeFilter === "kategorien" && styles.pageDotActive]} />
              <View style={[styles.pageDot, activeFilter === "income" && styles.pageDotActive]} />
              <View style={[styles.pageDot, activeFilter === "trend" && styles.pageDotActive]} />
            </View>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(42, 58, 230, 0.69)", "rgba(23, 32, 128, 0.69)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}
      >
        <Text style={styles.headerTitle}>Insights</Text>
        <Text style={styles.headerSubtitle}>alles auf einen Blick.</Text>

        <View style={styles.toggleContainer}>
          <Pressable
            style={[
              styles.toggleButton,
              activeTab === "ausgaben" && styles.toggleButtonActive,
            ]}
            onPress={() => setActiveTab("ausgaben")}
          >
            <Text
              style={[
                styles.toggleButtonText,
                activeTab === "ausgaben" && styles.toggleButtonTextActive,
              ]}
            >
              Ausgaben
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.toggleButton,
              activeTab === "einnahmen" && styles.toggleButtonActive,
            ]}
            onPress={() => setActiveTab("einnahmen")}
          >
            <Text
              style={[
                styles.toggleButtonText,
                activeTab === "einnahmen" && styles.toggleButtonTextActive,
              ]}
            >
              Einnahmen
            </Text>
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.filterRow}>
          <Pressable style={styles.filterButton} onPress={() => setFilterModalVisible(true)}>
            <Feather name="sliders" size={16} color="#6B7280" />
            <Text style={styles.filterButtonText}>Filter</Text>
            <Feather name="chevron-down" size={16} color="#6B7280" />
          </Pressable>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.tabsScrollView}
          contentContainerStyle={styles.tabsRow}
        >
          <Pressable
            style={[
              styles.tabButton,
              activeFilter === "kategorien" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveFilter("kategorien")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeFilter === "kategorien" && styles.tabButtonTextActive,
              ]}
            >
              Kategorien
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tabButton,
              activeFilter === "income" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveFilter("income")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeFilter === "income" && styles.tabButtonTextActive,
              ]}
            >
              Einnahmen vs Ausgaben
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.tabButton,
              activeFilter === "trend" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveFilter("trend")}
          >
            <Text
              style={[
                styles.tabButtonText,
                activeFilter === "trend" && styles.tabButtonTextActive,
              ]}
            >
              Trend
            </Text>
          </Pressable>
        </ScrollView>

        {renderContent()}
      </ScrollView>

      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setFilterModalVisible(false)} />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Filter</Text>

            <Text style={styles.modalSectionTitle}>Zeitspanne</Text>

            <Text style={styles.modalSectionTitle}>Kosten</Text>

            <Pressable
              style={styles.modalDoneButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.modalDoneButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  toggleContainer: {
    flexDirection: "row",
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 25,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 22,
  },
  toggleButtonActive: {
    backgroundColor: "#FFFFFF",
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },
  toggleButtonTextActive: {
    color: "#3B5BDB",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 12,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  filterButtonText: {
    fontSize: 14,
    color: "#6B7280",
  },
  tabsScrollView: {
    marginBottom: 16,
    marginHorizontal: -20,
  },
  tabsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tabButtonActive: {
    backgroundColor: "#3B5BDB",
    borderColor: "#3B5BDB",
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  tabButtonTextActive: {
    color: "#FFFFFF",
  },
  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  chartWrapper: {
    width: 220,
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  chartCenter: {
    position: "absolute",
    alignItems: "center",
  },
  chartAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
  },
  chartLabel: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 4,
  },
  chartPercentage: {
    fontSize: 12,
    color: "#3B5BDB",
    fontWeight: "600",
    marginTop: 2,
  },
  kategorienGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 24,
    width: "100%",
  },
  kategorieItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
    marginBottom: 16,
    gap: 10,
    padding: 8,
    margin: -8,
    borderRadius: 8,
  },
  kategorieItemSelected: {
    backgroundColor: "rgba(59, 91, 219, 0.1)",
    margin: 0,
    marginBottom: 8,
    width: "50%",
  },
  kategorieDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  kategorieName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  kategorieBetrag: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B5BDB",
    marginTop: 2,
  },
  pageIndicator: {
    flexDirection: "row",
    gap: 6,
    marginTop: 20,
  },
  pageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
  },
  pageDotActive: {
    backgroundColor: "#3B5BDB",
  },
  incomeExpensesContainer: {
    gap: 16,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusPositive: {
    backgroundColor: "#ECFDF5",
  },
  statusNegative: {
    backgroundColor: "#FEF2F2",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusTextPositive: {
    color: "#059669",
  },
  statusTextNegative: {
    color: "#DC2626",
  },
  barSection: {
    marginBottom: 16,
  },
  barRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  barLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  barIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  barValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
  },
  barTrack: {
    height: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 6,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 6,
  },
  barFillIncome: {
    backgroundColor: "#22C55E",
  },
  barFillExpenses: {
    backgroundColor: "#EF4444",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  differenceSection: {
    gap: 8,
  },
  differenceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  differenceLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  differenceValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  differencePositive: {
    color: "#059669",
  },
  differenceNegative: {
    color: "#DC2626",
  },
  savingsLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  savingsValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  tipsCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#92400E",
  },
  tipsText: {
    fontSize: 14,
    color: "#78350F",
    lineHeight: 20,
  },
  trendContainer: {
    gap: 16,
  },
  trendHeader: {
    marginBottom: 16,
  },
  trendSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  trendStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  trendStat: {
    flex: 1,
  },
  trendStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 16,
  },
  trendStatLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  trendStatValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
  },
  trendPositive: {
    color: "#059669",
  },
  trendNegative: {
    color: "#DC2626",
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 8,
  },
  chartMonthLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    flex: 1,
    textAlign: "center",
  },
  chartMonthLabelActive: {
    color: "#3B5BDB",
    fontWeight: "600",
  },
  trendChangeRow: {
    alignItems: "center",
  },
  changeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changePositive: {
    backgroundColor: "#ECFDF5",
  },
  changeNegative: {
    backgroundColor: "#FEF2F2",
  },
  changeText: {
    fontSize: 13,
    fontWeight: "500",
  },
  changeTextPositive: {
    color: "#059669",
  },
  changeTextNegative: {
    color: "#DC2626",
  },
  insightCards: {
    flexDirection: "row",
    gap: 12,
  },
  insightCard: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  insightContent: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    minHeight: 350,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 32,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 40,
  },
  modalDoneButton: {
    backgroundColor: "#7340fd",
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: "auto",
  },
  modalDoneButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
