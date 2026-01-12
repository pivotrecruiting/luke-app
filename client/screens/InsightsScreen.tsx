import React, { useState, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Svg, { Circle, G, Rect, Line } from "react-native-svg";
import Animated, { FadeInDown } from "react-native-reanimated";
import PagerView from "react-native-pager-view";
import { Spacing, BorderRadius } from "@/constants/theme";
import { useApp, IncomeEntry, ExpenseEntry } from "@/context/AppContext";

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

function TrendView({ monthlyData, selectedMonth, onSelectMonth }: TrendViewProps) {
  const maxAmount = Math.max(...monthlyData.map(d => d.amount), 1);
  const chartHeight = 180;
  const chartWidth = screenWidth - 80;
  const barWidth = (chartWidth / monthlyData.length) - 12;
  
  const average = monthlyData.reduce((sum, d) => sum + d.amount, 0) / monthlyData.length;
  const currentMonthData = monthlyData[monthlyData.length - 1];
  const previousMonthData = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null;
  
  const displayedData = selectedMonth !== null ? monthlyData[selectedMonth] : currentMonthData;
  const displayLabel = selectedMonth !== null ? monthlyData[selectedMonth].month : "Diesen Monat";
  
  const changePercent = previousMonthData && previousMonthData.amount > 0
    ? ((currentMonthData.amount - previousMonthData.amount) / previousMonthData.amount) * 100
    : 0;
  const isImproving = changePercent <= 0;

  const bestMonthIndex = monthlyData.reduce((min, d, i, arr) => d.amount < arr[min].amount ? i : min, 0);
  const worstMonthIndex = monthlyData.reduce((max, d, i, arr) => d.amount > arr[max].amount ? i : max, 0);

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
            <Text style={styles.trendStatLabel}>{displayLabel}</Text>
            <Text style={[styles.trendStatValue, displayedData.amount <= average ? styles.trendPositive : styles.trendNegative]}>
              € {formatCurrency(displayedData.amount)}
            </Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <View style={{ position: "relative", width: chartWidth, height: chartHeight + 30 }}>
            <Svg width={chartWidth} height={chartHeight + 30} style={{ position: "absolute", top: 0, left: 0 }}>
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
                      fill={isSelected ? "#3B5BDB" : isCurrentMonth && !hasSelection ? "#3B5BDB" : "#E5E7EB"}
                      opacity={hasSelection && !isSelected ? 0.5 : 1}
                    />
                  </G>
                );
              })}
            </Svg>
            <View style={{ position: "absolute", top: 0, left: 0, flexDirection: "row", width: chartWidth, height: chartHeight }}>
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
                      (isSelected || (isCurrentMonth && !hasSelection)) && styles.chartMonthLabelActive
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
        <Pressable 
          style={[styles.insightCard, selectedMonth === bestMonthIndex && styles.insightCardSelected]}
          onPress={() => onSelectMonth(selectedMonth === bestMonthIndex ? null : bestMonthIndex)}
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
          style={[styles.insightCard, selectedMonth === worstMonthIndex && styles.insightCardSelected]}
          onPress={() => onSelectMonth(selectedMonth === worstMonthIndex ? null : worstMonthIndex)}
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

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { 
    insightCategories, 
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
  const [activeTab, setActiveTab] = useState<"ausgaben" | "einnahmen">("ausgaben");
  const [activeFilter, setActiveFilter] = useState<"kategorien" | "income" | "trend">("kategorien");
  const pagerRef = useRef<PagerView>(null);
  const filterPages = ["kategorien", "income", "trend"] as const;
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTrendMonth, setSelectedTrendMonth] = useState<number | null>(null);
  
  const [incomeModalVisible, setIncomeModalVisible] = useState(false);
  const [editingIncomeId, setEditingIncomeId] = useState<string | null>(null);
  const [selectedIncomeType, setSelectedIncomeType] = useState<string | null>(null);
  const [customIncomeType, setCustomIncomeType] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [expenseModalVisible, setExpenseModalVisible] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [selectedExpenseType, setSelectedExpenseType] = useState<string | null>(null);
  const [customExpenseType, setCustomExpenseType] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [deleteExpenseConfirmId, setDeleteExpenseConfirmId] = useState<string | null>(null);

  const gesamtAusgaben = useMemo(() => {
    return insightCategories.reduce((sum, cat) => sum + cat.amount, 0);
  }, [insightCategories]);

  const handleCategoryPress = (categoryName: string) => {
    setSelectedCategory((prev) => (prev === categoryName ? null : categoryName));
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
    const matchingType = INCOME_TYPES.find(t => t.name === entry.type);
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
      const typeObj = INCOME_TYPES.find(t => t.id === selectedIncomeType);
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
    const matchingType = INCOME_TYPES.find(t => t.name === typeName);
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
    const matchingType = EXPENSE_TYPES.find(t => t.name === entry.type);
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
      const typeObj = EXPENSE_TYPES.find(t => t.id === selectedExpenseType);
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
    const matchingType = EXPENSE_TYPES.find(t => t.name === typeName);
    return matchingType?.icon || "plus-circle";
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
            selectedMonth={selectedTrendMonth}
            onSelectMonth={setSelectedTrendMonth}
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

          <View style={styles.tabsRow}>
            <Pressable
              style={[
                styles.tabButton,
                activeFilter === "kategorien" && styles.tabButtonActive,
              ]}
              onPress={() => {
                setActiveFilter("kategorien");
                pagerRef.current?.setPage(0);
              }}
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
              onPress={() => {
                setActiveFilter("income");
                pagerRef.current?.setPage(1);
              }}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeFilter === "income" && styles.tabButtonTextActive,
                ]}
              >
                vs Ausgaben
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.tabButton,
                activeFilter === "trend" && styles.tabButtonActive,
              ]}
              onPress={() => {
                setActiveFilter("trend");
                pagerRef.current?.setPage(2);
              }}
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

          <PagerView
            ref={pagerRef}
            style={styles.pagerView}
            initialPage={0}
            onPageSelected={(e: { nativeEvent: { position: number } }) => {
              const pageIndex = e.nativeEvent.position;
              setActiveFilter(filterPages[pageIndex]);
            }}
          >
            <View key="kategorien" style={styles.pagerPage}>
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
            </View>

            <View key="income" style={styles.pagerPage}>
              <IncomeExpensesView
                income={totalIncome}
                expenses={totalExpenses}
              />
              <View style={styles.pageIndicatorStandalone}>
                <View style={[styles.pageDot, activeFilter === "kategorien" && styles.pageDotActive]} />
                <View style={[styles.pageDot, activeFilter === "income" && styles.pageDotActive]} />
                <View style={[styles.pageDot, activeFilter === "trend" && styles.pageDotActive]} />
              </View>
            </View>

            <View key="trend" style={styles.pagerPage}>
              <TrendView
                monthlyData={monthlyTrendData}
                selectedMonth={selectedTrendMonth}
                onSelectMonth={setSelectedTrendMonth}
              />
              <View style={styles.pageIndicatorStandalone}>
                <View style={[styles.pageDot, activeFilter === "kategorien" && styles.pageDotActive]} />
                <View style={[styles.pageDot, activeFilter === "income" && styles.pageDotActive]} />
                <View style={[styles.pageDot, activeFilter === "trend" && styles.pageDotActive]} />
              </View>
            </View>
          </PagerView>
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
              <Text style={styles.incomeSummaryLabel}>Monatliche Einnahmen</Text>
              <Text style={styles.incomeSummaryAmount}>€ {formatCurrency(totalIncome)}</Text>
            </View>
            <Pressable style={styles.addIncomeButton} onPress={openAddIncomeModal}>
              <Feather name="plus" size={20} color="#7340fd" />
            </Pressable>
          </View>

          <Text style={styles.incomeSectionTitle}>Einnahmequellen</Text>
          
          {incomeEntries.length === 0 ? (
            <View style={styles.incomeEmptyState}>
              <Feather name="inbox" size={48} color="#D1D5DB" />
              <Text style={styles.incomeEmptyText}>Noch keine Einnahmen hinzugefügt</Text>
              <Pressable style={styles.incomeEmptyButton} onPress={openAddIncomeModal}>
                <Text style={styles.incomeEmptyButtonText}>Einnahme hinzufügen</Text>
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
                      <Feather name={getIconForIncomeType(entry.type) as any} size={20} color="#10B981" />
                    </View>
                    <View>
                      <Text style={styles.incomeType}>{entry.type}</Text>
                      <Text style={styles.incomeFrequency}>Monatlich</Text>
                    </View>
                  </View>
                  <View style={styles.incomeRight}>
                    <Text style={styles.incomeAmount}>€ {formatCurrency(entry.amount)}</Text>
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
                    <Text style={styles.deleteConfirmText}>Wirklich löschen?</Text>
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
              Füge alle regelmäßigen Einnahmen hinzu, um dein verfügbares Budget genauer zu berechnen.
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

      <Modal
        visible={incomeModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIncomeModalVisible(false)}
      >
        <View style={styles.incomeModalOverlay}>
          <View style={[styles.incomeModalContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
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
                    selectedIncomeType === type.id && styles.incomeTypeButtonSelected,
                  ]}
                  onPress={() => setSelectedIncomeType(type.id)}
                >
                  <Feather 
                    name={type.icon as any} 
                    size={20} 
                    color={selectedIncomeType === type.id ? "#7340fd" : "#6B7280"} 
                  />
                  <Text style={[
                    styles.incomeTypeButtonText,
                    selectedIncomeType === type.id && styles.incomeTypeButtonTextSelected,
                  ]}>
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
                (!selectedIncomeType || !incomeAmount) && styles.incomeSaveButtonDisabled,
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
          <View style={[styles.incomeModalContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
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
                    selectedExpenseType === type.id && styles.expenseTypeButtonSelected,
                  ]}
                  onPress={() => setSelectedExpenseType(type.id)}
                >
                  <Feather 
                    name={type.icon as any} 
                    size={20} 
                    color={selectedExpenseType === type.id ? "#EF4444" : "#6B7280"} 
                  />
                  <Text style={[
                    styles.incomeTypeButtonText,
                    selectedExpenseType === type.id && styles.expenseTypeButtonTextSelected,
                  ]}>
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
                (!selectedExpenseType || !expenseAmount) && styles.incomeSaveButtonDisabled,
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
  tabsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: "#3B5BDB",
    borderColor: "#3B5BDB",
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
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
  pagerView: {
    flex: 1,
    minHeight: 450,
  },
  pagerPage: {
    flex: 1,
  },
  pageIndicator: {
    flexDirection: "row",
    gap: 6,
    marginTop: 20,
    justifyContent: "center",
  },
  pageIndicatorStandalone: {
    flexDirection: "row",
    gap: 6,
    marginTop: 20,
    justifyContent: "center",
    alignSelf: "center",
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
  chartLabelPressable: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  trendHint: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 12,
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
    borderWidth: 2,
    borderColor: "transparent",
  },
  insightCardSelected: {
    borderColor: "#3B5BDB",
    backgroundColor: "#F0F4FF",
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
  incomeSummaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  incomeSummaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  incomeSummaryContent: {
    flex: 1,
  },
  incomeSummaryLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  incomeSummaryAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: "#10B981",
  },
  addIncomeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  incomeSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: Spacing.md,
  },
  incomeEmptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"],
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
  },
  incomeEmptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  incomeEmptyButton: {
    backgroundColor: "#7340fd",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  incomeEmptyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  incomeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  incomeLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  incomeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  incomeType: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  incomeFrequency: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  incomeRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  incomeAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
  },
  deleteConfirm: {
    backgroundColor: "#FEF2F2",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: -Spacing.sm + 4,
    marginBottom: Spacing.sm,
  },
  deleteConfirmText: {
    fontSize: 14,
    color: "#991B1B",
    marginBottom: Spacing.sm,
  },
  deleteActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  cancelDeleteBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  cancelDeleteText: {
    fontSize: 14,
    color: "#6B7280",
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: "#EF4444",
    alignItems: "center",
  },
  confirmDeleteText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  incomeTipCard: {
    backgroundColor: "#F3F0FF",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
  },
  incomeTipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  incomeTipTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7340fd",
  },
  incomeTipText: {
    fontSize: 13,
    color: "#4C1D95",
    lineHeight: 18,
  },
  incomeModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  incomeModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: "90%",
  },
  incomeModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  incomeModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  incomeModalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  incomeTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  incomeTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "transparent",
  },
  incomeTypeButtonSelected: {
    backgroundColor: "#F3F0FF",
    borderColor: "#7340fd",
  },
  incomeTypeButtonText: {
    fontSize: 13,
    color: "#6B7280",
  },
  incomeTypeButtonTextSelected: {
    color: "#7340fd",
    fontWeight: "500",
  },
  customTypeContainer: {
    marginTop: Spacing.sm,
  },
  incomeTextInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  incomeAmountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: Spacing.md,
  },
  incomeCurrencySymbol: {
    fontSize: 18,
    color: "#6B7280",
    marginRight: Spacing.xs,
  },
  incomeAmountInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: 18,
    color: "#111827",
  },
  incomeSaveButton: {
    backgroundColor: "#7340fd",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  incomeSaveButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  incomeSaveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  fixkostenContainer: {
    flex: 1,
  },
  expenseSummaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  expenseSummaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  expenseSummaryContent: {
    flex: 1,
  },
  expenseSummaryLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  expenseSummaryAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: "#EF4444",
  },
  addExpenseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F0FF",
    alignItems: "center",
    justifyContent: "center",
  },
  expenseSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: Spacing.md,
  },
  expenseEmptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"],
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
  },
  expenseEmptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  expenseEmptyButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  expenseEmptyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  expenseItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  expenseLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  expenseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  expenseType: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  expenseFrequency: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  expenseRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
  expenseTipCard: {
    backgroundColor: "#FEF2F2",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
  },
  expenseTipHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  expenseTipTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
  },
  expenseTipText: {
    fontSize: 13,
    color: "#991B1B",
    lineHeight: 18,
  },
  expenseTypeButtonSelected: {
    backgroundColor: "#FEF2F2",
    borderColor: "#EF4444",
  },
  expenseTypeButtonTextSelected: {
    color: "#EF4444",
    fontWeight: "500",
  },
  expenseSaveButton: {
    backgroundColor: "#EF4444",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    marginTop: Spacing.xl,
  },
});
