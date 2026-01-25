import React, { useState, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Svg, { Circle, G, Rect, Line } from "react-native-svg";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Spacing } from "@/constants/theme";
import { useApp, IncomeEntry, ExpenseEntry } from "@/context/AppContext";
import { styles } from "./styles/insights-screen.styles";

const screenWidth = Dimensions.get("window").width;

const formatCurrency = (value: number) => {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const GERMAN_MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
];

interface DonutChartProps {
  categories: { name: string; amount: number; color: string }[];
  total: number;
  selectedCategory: string | null;
  onSelectCategory: (name: string | null) => void;
}

function DonutChart({
  categories,
  total,
  selectedCategory,
  onSelectCategory,
}: DonutChartProps) {
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

  const displayAmount = selectedCategoryData
    ? selectedCategoryData.amount
    : total;
  const displayLabel = selectedCategoryData
    ? selectedCategoryData.name
    : "Gesamt";

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
            const segmentStrokeWidth = isSelected
              ? strokeWidth + 4
              : strokeWidth;

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
        <Text style={styles.chartAmount}>
          € {formatCurrency(displayAmount)}
        </Text>
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
  const savingsRate = income > 0 ? (difference / income) * 100 : 0;

  return (
    <View style={styles.incomeExpensesContainer}>
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Monatliche Bilanz</Text>
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
            <Text style={styles.barValue}>€ {formatCurrency(income)}</Text>
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
            <Text style={styles.barValue}>€ {formatCurrency(expenses)}</Text>
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
              {isPositive ? "+" : ""}€ {formatCurrency(difference)}
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
}

interface TrendViewProps {
  monthlyData: { month: string; amount: number }[];
  selectedMonth: number | null;
  onSelectMonth: (index: number | null) => void;
}

function TrendView({
  monthlyData,
  selectedMonth,
  onSelectMonth,
}: TrendViewProps) {
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
}

const INCOME_TYPES = [
  { id: "gehalt", name: "Gehalt", icon: "briefcase" },
  { id: "nebenjob", name: "Nebenjob", icon: "clock" },
  { id: "freelance", name: "Freelance", icon: "code" },
  { id: "mieteinnahmen", name: "Mieteinnahmen", icon: "home" },
  { id: "dividenden", name: "Dividenden", icon: "trending-up" },
  { id: "kindergeld", name: "Kindergeld", icon: "users" },
  { id: "rente", name: "Rente", icon: "award" },
  { id: "sonstiges", name: "Sonstiges", icon: "plus-circle" },
];

const EXPENSE_TYPES = [
  { id: "versicherungen", name: "Versicherungen", icon: "shield" },
  { id: "netflix", name: "Netflix", icon: "tv" },
  { id: "wohnen", name: "Wohnen", icon: "home" },
  { id: "handy", name: "Handy", icon: "smartphone" },
  { id: "altersvorsorge", name: "Altersvorsorge", icon: "umbrella" },
  { id: "spotify", name: "Spotify", icon: "music" },
  { id: "fitness", name: "Fitness", icon: "activity" },
  { id: "abos", name: "Abos", icon: "repeat" },
  { id: "fahrticket", name: "Fahrticket", icon: "navigation" },
  { id: "sonstiges", name: "Sonstiges", icon: "plus-circle" },
];

const parseGermanDate = (dateStr: string): Date => {
  if (dateStr.startsWith("Heute") || dateStr.startsWith("Gestern")) {
    const today = new Date();
    if (dateStr.startsWith("Gestern")) {
      today.setDate(today.getDate() - 1);
    }
    return today;
  }

  let parts = dateStr.split(".");
  if (parts.length === 3) {
    return new Date(
      parseInt(parts[2]),
      parseInt(parts[1]) - 1,
      parseInt(parts[0]),
    );
  }

  parts = dateStr.split("/");
  if (parts.length === 3) {
    return new Date(
      parseInt(parts[2]),
      parseInt(parts[1]) - 1,
      parseInt(parts[0]),
    );
  }

  return new Date();
};

const getDateRangeForFilter = (
  filter:
    | "thisMonth"
    | "lastMonth"
    | "last3Months"
    | "last6Months"
    | "thisYear",
): { start: Date; end: Date } => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  switch (filter) {
    case "thisMonth": {
      const start = new Date(currentYear, currentMonth, 1);
      const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      return { start, end };
    }
    case "lastMonth": {
      const start = new Date(currentYear, currentMonth - 1, 1);
      const end = new Date(currentYear, currentMonth, 0, 23, 59, 59);
      return { start, end };
    }
    case "last3Months": {
      const start = new Date(currentYear, currentMonth - 2, 1);
      const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      return { start, end };
    }
    case "last6Months": {
      const start = new Date(currentYear, currentMonth - 5, 1);
      const end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      return { start, end };
    }
    case "thisYear": {
      const start = new Date(currentYear, 0, 1);
      const end = new Date(currentYear, 11, 31, 23, 59, 59);
      return { start, end };
    }
    default:
      return { start: new Date(currentYear, currentMonth, 1), end: now };
  }
};

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const {
    insightCategories,
    budgets,
    totalIncome,
    totalExpenses,
    totalFixedExpenses,
    savingsRate,
    monthlyTrendData,
    incomeEntries,
    expenseEntries,
    addIncomeEntry,
    updateIncomeEntry,
    deleteIncomeEntry,
    addExpenseEntry,
    updateExpenseEntry,
    deleteExpenseEntry,
  } = useApp();
  const [activeTab, setActiveTab] = useState<"ausgaben" | "einnahmen">(
    "ausgaben",
  );
  const [activeFilter, setActiveFilter] = useState<
    "kategorien" | "income" | "trend"
  >("kategorien");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTrendMonth, setSelectedTrendMonth] = useState<number | null>(
    null,
  );

  const [selectedTimeFilter, setSelectedTimeFilter] = useState<
    "thisMonth" | "lastMonth" | "last3Months" | "last6Months" | "thisYear"
  >("thisMonth");
  const [selectedCostFilters, setSelectedCostFilters] = useState<string[]>([]);

  const [incomeModalVisible, setIncomeModalVisible] = useState(false);
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [selectedIncomeType, setSelectedIncomeType] = useState<string | null>(
    null,
  );
  const [customIncomeType, setCustomIncomeType] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [selectedExpenseType, setSelectedExpenseType] = useState<string | null>(
    null,
  );
  const [customExpenseType, setCustomExpenseType] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [deleteExpenseConfirmId, setDeleteExpenseConfirmId] = useState<
    string | null
  >(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  const filteredCategories = useMemo(() => {
    const { start, end } = getDateRangeForFilter(selectedTimeFilter);

    const categoryColors: Record<string, string> = {
      Lebensmittel: "#3B5BDB",
      Transport: "#7B8CDE",
      Unterhaltung: "#5C7CFA",
      Shopping: "#748FFC",
      Restaurant: "#91A7FF",
      Gesundheit: "#BAC8FF",
      Sonstiges: "#DBE4FF",
    };

    const categoryTotals: Record<string, number> = {};

    budgets.forEach((budget) => {
      const filteredExpenses = budget.expenses.filter((expense) => {
        let expenseDate: Date;
        if (expense.timestamp) {
          expenseDate = new Date(expense.timestamp);
        } else {
          expenseDate = parseGermanDate(expense.date);
        }
        return expenseDate >= start && expenseDate <= end;
      });

      const totalForCategory = filteredExpenses.reduce(
        (sum, exp) => sum + exp.amount,
        0,
      );
      if (totalForCategory > 0) {
        categoryTotals[budget.name] =
          (categoryTotals[budget.name] || 0) + totalForCategory;
      }
    });

    let categories = Object.entries(categoryTotals).map(([name, amount]) => ({
      name,
      amount,
      color: categoryColors[name] || "#7B8CDE",
    }));

    if (selectedCostFilters.length > 0) {
      categories = categories.filter((cat) =>
        selectedCostFilters.includes(cat.name),
      );
    }

    return categories;
  }, [budgets, selectedCostFilters, selectedTimeFilter]);

  React.useEffect(() => {
    if (
      selectedCategory &&
      !filteredCategories.find((c) => c.name === selectedCategory)
    ) {
      setSelectedCategory(null);
    }
  }, [filteredCategories, selectedCategory]);

  const gesamtAusgaben = useMemo(() => {
    return filteredCategories.reduce((sum, cat) => sum + cat.amount, 0);
  }, [filteredCategories]);

  const activeFilterCount =
    selectedCostFilters.length + (selectedTimeFilter !== "thisMonth" ? 1 : 0);

  const handleCategoryPress = (categoryName: string) => {
    setSelectedCategory((prev) =>
      prev === categoryName ? null : categoryName,
    );
  };

  const openAddIncomeModal = () => {
    setEditingIncomeId(null);
    setSelectedIncomeType(null);
    setCustomIncomeType("");
    setIncomeAmount("");
    setIncomeModalVisible(true);
  };

  const openEditIncomeModal = (entry: IncomeEntry) => {
    setEditingIncomeId(entry.id);
    const matchingType = INCOME_TYPES.find((t) => t.name === entry.type);
    if (matchingType) {
      setSelectedIncomeType(matchingType.id);
      setCustomIncomeType("");
    } else {
      setSelectedIncomeType("sonstiges");
      setCustomIncomeType(entry.type);
    }
    setIncomeAmount(entry.amount.toString().replace(".", ","));
    setIncomeModalVisible(true);
  };

  const handleSaveIncome = () => {
    const parsedAmount = parseFloat(incomeAmount.replace(",", ".")) || 0;
    if (parsedAmount <= 0) return;

    let typeName = "";
    if (selectedIncomeType === "sonstiges" && customIncomeType.trim()) {
      typeName = customIncomeType.trim();
    } else {
      const typeObj = INCOME_TYPES.find((t) => t.id === selectedIncomeType);
      if (!typeObj) return;
      typeName = typeObj.name;
    }

    if (editingIncomeId) {
      updateIncomeEntry(editingIncomeId, typeName, parsedAmount);
    } else {
      addIncomeEntry(typeName, parsedAmount);
    }

    setIncomeModalVisible(false);
    resetIncomeForm();
  };

  const handleDeleteIncome = (id: string) => {
    deleteIncomeEntry(id);
    setDeleteConfirmId(null);
  };

  const resetIncomeForm = () => {
    setSelectedIncomeType(null);
    setCustomIncomeType("");
    setIncomeAmount("");
    setEditingIncomeId(null);
  };

  const getIconForIncomeType = (typeName: string): string => {
    const matchingType = INCOME_TYPES.find((t) => t.name === typeName);
    return matchingType?.icon || "plus-circle";
  };

  const openAddExpenseModal = () => {
    setEditingExpenseId(null);
    setSelectedExpenseType(null);
    setCustomExpenseType("");
    setExpenseAmount("");
    setExpenseModalVisible(true);
  };

  const openEditExpenseModal = (entry: ExpenseEntry) => {
    setEditingExpenseId(entry.id);
    const matchingType = EXPENSE_TYPES.find((t) => t.name === entry.type);
    if (matchingType) {
      setSelectedExpenseType(matchingType.id);
      setCustomExpenseType("");
    } else {
      setSelectedExpenseType("sonstiges");
      setCustomExpenseType(entry.type);
    }
    setExpenseAmount(entry.amount.toString().replace(".", ","));
    setExpenseModalVisible(true);
  };

  const handleSaveExpense = () => {
    const parsedAmount = parseFloat(expenseAmount.replace(",", ".")) || 0;
    if (parsedAmount <= 0) return;

    let typeName = "";
    if (selectedExpenseType === "sonstiges" && customExpenseType.trim()) {
      typeName = customExpenseType.trim();
    } else {
      const typeObj = EXPENSE_TYPES.find((t) => t.id === selectedExpenseType);
      if (!typeObj) return;
      typeName = typeObj.name;
    }

    if (editingExpenseId) {
      updateExpenseEntry(editingExpenseId, typeName, parsedAmount);
    } else {
      addExpenseEntry(typeName, parsedAmount);
    }

    setExpenseModalVisible(false);
    resetExpenseForm();
  };

  const handleDeleteExpense = (id: string) => {
    deleteExpenseEntry(id);
    setDeleteExpenseConfirmId(null);
  };

  const resetExpenseForm = () => {
    setSelectedExpenseType(null);
    setCustomExpenseType("");
    setExpenseAmount("");
    setEditingExpenseId(null);
  };

  const getIconForExpenseType = (typeName: string): string => {
    const matchingType = EXPENSE_TYPES.find((t) => t.name === typeName);
    return matchingType?.icon || "plus-circle";
  };

  const renderContent = () => {
    switch (activeFilter) {
      case "income":
        return (
          <IncomeExpensesView income={totalIncome} expenses={totalExpenses} />
        );
      case "trend":
        return (
          <TrendView
            monthlyData={monthlyTrendData}
            selectedMonth={selectedTrendMonth}
            onSelectMonth={setSelectedTrendMonth}
          />
        );
      case "kategorien":
      default:
        return (
          <View style={styles.chartCard}>
            <DonutChart
              categories={filteredCategories}
              total={gesamtAusgaben}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            <View style={styles.kategorienGrid}>
              {filteredCategories.map((kategorie, index) => {
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
                      style={[
                        styles.kategorieDot,
                        { backgroundColor: kategorie.color },
                      ]}
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
              <View style={[styles.pageDot, styles.pageDotActive]} />
              <View style={styles.pageDot} />
              <View style={styles.pageDot} />
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

      {activeTab === "ausgaben" ? (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.filterRow}>
            <Pressable
              style={styles.filterButton}
              onPress={() => setFilterModalVisible(true)}
            >
              <Feather
                name="sliders"
                size={16}
                color={activeFilterCount > 0 ? "#7340fd" : "#6B7280"}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilterCount > 0 && styles.filterButtonTextActive,
                ]}
              >
                Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </Text>
              <Feather
                name="chevron-down"
                size={16}
                color={activeFilterCount > 0 ? "#7340fd" : "#6B7280"}
              />
            </Pressable>
          </View>

          <View style={styles.tabsRow}>
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
                Vergleich
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
          </View>

          <View style={styles.pagerView}>
            {activeFilter === "kategorien" && (
              <View style={styles.pagerPage}>
                <View style={styles.chartCard}>
                  <DonutChart
                    categories={filteredCategories}
                    total={gesamtAusgaben}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                  />

                  <View style={styles.kategorienGrid}>
                    {filteredCategories.map((kategorie, index) => {
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
                            style={[
                              styles.kategorieDot,
                              { backgroundColor: kategorie.color },
                            ]}
                          />
                          <View>
                            <Text style={styles.kategorieName}>
                              {kategorie.name}
                            </Text>
                            <Text style={styles.kategorieBetrag}>
                              € {formatCurrency(kategorie.amount)}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.pageIndicator}>
                    <View style={[styles.pageDot, styles.pageDotActive]} />
                    <View style={styles.pageDot} />
                    <View style={styles.pageDot} />
                  </View>
                </View>
              </View>
            )}

            {activeFilter === "income" && (
              <View style={styles.pagerPage}>
                <IncomeExpensesView
                  income={totalIncome}
                  expenses={totalExpenses}
                />
                <View style={styles.pageIndicatorStandalone}>
                  <View style={styles.pageDot} />
                  <View style={[styles.pageDot, styles.pageDotActive]} />
                  <View style={styles.pageDot} />
                </View>
              </View>
            )}

            {activeFilter === "trend" && (
              <View style={styles.pagerPage}>
                <TrendView
                  monthlyData={monthlyTrendData}
                  selectedMonth={selectedTrendMonth}
                  onSelectMonth={setSelectedTrendMonth}
                />
                <View style={styles.pageIndicatorStandalone}>
                  <View style={styles.pageDot} />
                  <View style={styles.pageDot} />
                  <View style={[styles.pageDot, styles.pageDotActive]} />
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.incomeSummaryCard}>
            <View style={styles.incomeSummaryIcon}>
              <Feather name="trending-up" size={28} color="#10B981" />
            </View>
            <View style={styles.incomeSummaryContent}>
              <Text style={styles.incomeSummaryLabel}>
                Monatliche Einnahmen
              </Text>
              <Text style={styles.incomeSummaryAmount}>
                € {formatCurrency(totalIncome)}
              </Text>
            </View>
            <Pressable
              style={styles.addIncomeButton}
              onPress={openAddIncomeModal}
            >
              <Feather name="plus" size={20} color="#7340fd" />
            </Pressable>
          </View>

          <Text style={styles.incomeSectionTitle}>Einnahmequellen</Text>

          {incomeEntries.length === 0 ? (
            <View style={styles.incomeEmptyState}>
              <Feather name="inbox" size={48} color="#D1D5DB" />
              <Text style={styles.incomeEmptyText}>
                Noch keine Einnahmen hinzugefügt
              </Text>
              <Pressable
                style={styles.incomeEmptyButton}
                onPress={openAddIncomeModal}
              >
                <Text style={styles.incomeEmptyButtonText}>
                  Einnahme hinzufügen
                </Text>
              </Pressable>
            </View>
          ) : (
            incomeEntries.map((entry, index) => (
              <Animated.View
                key={entry.id}
                entering={FadeInDown.delay(index * 50).duration(300)}
              >
                <Pressable
                  style={styles.incomeItem}
                  onPress={() => openEditIncomeModal(entry)}
                >
                  <View style={styles.incomeLeft}>
                    <View style={styles.incomeIconContainer}>
                      <Feather
                        name={getIconForIncomeType(entry.type) as any}
                        size={20}
                        color="#10B981"
                      />
                    </View>
                    <View>
                      <Text style={styles.incomeType}>{entry.type}</Text>
                      <Text style={styles.incomeFrequency}>Monatlich</Text>
                    </View>
                  </View>
                  <View style={styles.incomeRight}>
                    <Text style={styles.incomeAmount}>
                      € {formatCurrency(entry.amount)}
                    </Text>
                    <Pressable
                      onPress={() => setDeleteConfirmId(entry.id)}
                      hitSlop={8}
                    >
                      <Feather name="trash-2" size={18} color="#9CA3AF" />
                    </Pressable>
                  </View>
                </Pressable>

                {deleteConfirmId === entry.id && (
                  <View style={styles.deleteConfirm}>
                    <Text style={styles.deleteConfirmText}>
                      Wirklich löschen?
                    </Text>
                    <View style={styles.deleteActions}>
                      <Pressable
                        style={styles.cancelDeleteBtn}
                        onPress={() => setDeleteConfirmId(null)}
                      >
                        <Text style={styles.cancelDeleteText}>Abbrechen</Text>
                      </Pressable>
                      <Pressable
                        style={styles.confirmDeleteBtn}
                        onPress={() => handleDeleteIncome(entry.id)}
                      >
                        <Text style={styles.confirmDeleteText}>Löschen</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </Animated.View>
            ))
          )}

          <View style={styles.incomeTipCard}>
            <View style={styles.incomeTipHeader}>
              <Feather name="info" size={18} color="#7340fd" />
              <Text style={styles.incomeTipTitle}>Tipp</Text>
            </View>
            <Text style={styles.incomeTipText}>
              Füge alle regelmäßigen Einnahmen hinzu, um dein verfügbares Budget
              genauer zu berechnen.
            </Text>
          </View>
        </ScrollView>
      )}

      <Modal
        visible={filterModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.modalBackdrop}
            onPress={() => setFilterModalVisible(false)}
          />
          <ScrollView
            style={[
              styles.modalContent,
              { paddingBottom: insets.bottom + 24, maxHeight: "80%" },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Filter</Text>

            <Text style={styles.modalSectionTitle}>Zeitspanne</Text>
            <View style={styles.filterOptionsGrid}>
              {[
                { id: "thisMonth", label: "Dieser Monat" },
                { id: "lastMonth", label: "Letzter Monat" },
                { id: "last3Months", label: "3 Monate" },
                { id: "last6Months", label: "6 Monate" },
                { id: "thisYear", label: "Dieses Jahr" },
              ].map((option) => (
                <Pressable
                  key={option.id}
                  style={[
                    styles.filterOption,
                    selectedTimeFilter === option.id &&
                      styles.filterOptionSelected,
                  ]}
                  onPress={() => setSelectedTimeFilter(option.id as any)}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedTimeFilter === option.id &&
                        styles.filterOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.modalSectionTitle}>Kategorien</Text>
            <View style={styles.filterOptionsGrid}>
              {budgets.map((budget) => {
                const isSelected = selectedCostFilters.includes(budget.name);
                return (
                  <Pressable
                    key={budget.id}
                    style={[
                      styles.filterOption,
                      isSelected && styles.filterOptionSelected,
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedCostFilters((prev) =>
                          prev.filter((c) => c !== budget.name),
                        );
                      } else {
                        setSelectedCostFilters((prev) => [
                          ...prev,
                          budget.name,
                        ]);
                      }
                    }}
                  >
                    <View
                      style={[
                        styles.filterOptionDot,
                        { backgroundColor: budget.iconColor },
                      ]}
                    />
                    <Text
                      style={[
                        styles.filterOptionText,
                        isSelected && styles.filterOptionTextSelected,
                      ]}
                    >
                      {budget.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {selectedCostFilters.length > 0 ? (
              <Pressable
                style={styles.clearFiltersButton}
                onPress={() => setSelectedCostFilters([])}
              >
                <Feather name="x" size={14} color="#6B7280" />
                <Text style={styles.clearFiltersText}>Filter zurücksetzen</Text>
              </Pressable>
            ) : null}

            <Pressable
              style={styles.modalDoneButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.modalDoneButtonText}>Fertig</Text>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={incomeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIncomeModalVisible(false)}
      >
        <View style={styles.incomeModalOverlay}>
          <View
            style={[
              styles.incomeModalContent,
              { paddingBottom: insets.bottom + Spacing.lg },
            ]}
          >
            <View style={styles.incomeModalHeader}>
              <Text style={styles.incomeModalTitle}>
                {editingIncomeId ? "Einnahme bearbeiten" : "Neue Einnahme"}
              </Text>
              <Pressable onPress={() => setIncomeModalVisible(false)}>
                <Feather name="x" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <Text style={styles.incomeModalLabel}>Art der Einnahme</Text>
            <View style={styles.incomeTypeGrid}>
              {INCOME_TYPES.map((type) => (
                <Pressable
                  key={type.id}
                  style={[
                    styles.incomeTypeButton,
                    selectedIncomeType === type.id &&
                      styles.incomeTypeButtonSelected,
                  ]}
                  onPress={() => setSelectedIncomeType(type.id)}
                >
                  <Feather
                    name={type.icon as any}
                    size={20}
                    color={
                      selectedIncomeType === type.id ? "#7340fd" : "#6B7280"
                    }
                  />
                  <Text
                    style={[
                      styles.incomeTypeButtonText,
                      selectedIncomeType === type.id &&
                        styles.incomeTypeButtonTextSelected,
                    ]}
                  >
                    {type.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            {selectedIncomeType === "sonstiges" && (
              <View style={styles.customTypeContainer}>
                <Text style={styles.incomeModalLabel}>Bezeichnung</Text>
                <TextInput
                  style={styles.incomeTextInput}
                  value={customIncomeType}
                  onChangeText={setCustomIncomeType}
                  placeholder="z.B. Unterhalt"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            )}

            <Text style={styles.incomeModalLabel}>Betrag (monatlich)</Text>
            <View style={styles.incomeAmountInputContainer}>
              <Text style={styles.incomeCurrencySymbol}>€</Text>
              <TextInput
                style={styles.incomeAmountInput}
                value={incomeAmount}
                onChangeText={setIncomeAmount}
                placeholder="0,00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
              />
            </View>

            <Pressable
              style={[
                styles.incomeSaveButton,
                (!selectedIncomeType || !incomeAmount) &&
                  styles.incomeSaveButtonDisabled,
              ]}
              onPress={handleSaveIncome}
              disabled={!selectedIncomeType || !incomeAmount}
            >
              <Text style={styles.incomeSaveButtonText}>
                {editingIncomeId ? "Speichern" : "Hinzufügen"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={expenseModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setExpenseModalVisible(false)}
      >
        <View style={styles.incomeModalOverlay}>
          <View
            style={[
              styles.incomeModalContent,
              { paddingBottom: insets.bottom + Spacing.lg },
            ]}
          >
            <View style={styles.incomeModalHeader}>
              <Text style={styles.incomeModalTitle}>
                {editingExpenseId ? "Ausgabe bearbeiten" : "Neue Ausgabe"}
              </Text>
              <Pressable onPress={() => setExpenseModalVisible(false)}>
                <Feather name="x" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <Text style={styles.incomeModalLabel}>Art der Ausgabe</Text>
            <View style={styles.incomeTypeGrid}>
              {EXPENSE_TYPES.map((type) => (
                <Pressable
                  key={type.id}
                  style={[
                    styles.incomeTypeButton,
                    selectedExpenseType === type.id &&
                      styles.expenseTypeButtonSelected,
                  ]}
                  onPress={() => setSelectedExpenseType(type.id)}
                >
                  <Feather
                    name={type.icon as any}
                    size={20}
                    color={
                      selectedExpenseType === type.id ? "#EF4444" : "#6B7280"
                    }
                  />
                  <Text
                    style={[
                      styles.incomeTypeButtonText,
                      selectedExpenseType === type.id &&
                        styles.expenseTypeButtonTextSelected,
                    ]}
                  >
                    {type.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            {selectedExpenseType === "sonstiges" && (
              <View style={styles.customTypeContainer}>
                <Text style={styles.incomeModalLabel}>Bezeichnung</Text>
                <TextInput
                  style={styles.incomeTextInput}
                  value={customExpenseType}
                  onChangeText={setCustomExpenseType}
                  placeholder="z.B. Strom"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            )}

            <Text style={styles.incomeModalLabel}>Betrag (monatlich)</Text>
            <View style={styles.incomeAmountInputContainer}>
              <Text style={styles.incomeCurrencySymbol}>€</Text>
              <TextInput
                style={styles.incomeAmountInput}
                value={expenseAmount}
                onChangeText={setExpenseAmount}
                placeholder="0,00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
              />
            </View>

            <Pressable
              style={[
                styles.expenseSaveButton,
                (!selectedExpenseType || !expenseAmount) &&
                  styles.incomeSaveButtonDisabled,
              ]}
              onPress={handleSaveExpense}
              disabled={!selectedExpenseType || !expenseAmount}
            >
              <Text style={styles.incomeSaveButtonText}>
                {editingExpenseId ? "Speichern" : "Hinzufügen"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
