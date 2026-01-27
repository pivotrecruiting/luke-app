import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import PagerView from "react-native-pager-view";
import { styles } from "@/screens/styles/insights-screen.styles";
import { CategoriesPanel } from "./categories-panel";
import { IncomeExpensesView } from "./income-expenses-view";
import { TrendView } from "./trend-view";
import type {
  CategoryT,
  InsightsFilterT,
  MonthlyTrendT,
  TimeFilterT,
} from "../types/insights-types";

type ExpensesTabPropsT = {
  scrollViewRef: RefObject<ScrollView | null>;
  bottomInset: number;
  activeFilter: InsightsFilterT;
  activeFilterCount: number;
  onChangeFilter: (value: InsightsFilterT) => void;
  onOpenFilterModal: () => void;
  categories: CategoryT[];
  totalCategoryExpenses: number;
  selectedCategory: string | null;
  onSelectCategory: (name: string | null) => void;
  onToggleCategory: (name: string) => void;
  monthlyTrendData: MonthlyTrendT[];
  selectedTimeFilter: TimeFilterT;
  selectedTrendMonth: number | null;
  onSelectTrendMonth: (index: number | null) => void;
  totalIncome: number;
  totalExpenses: number;
};

/**
 * Renders the expenses tab with filters, categories, comparison and trend.
 */
export const ExpensesTab = ({
  scrollViewRef,
  bottomInset,
  activeFilter,
  activeFilterCount,
  onChangeFilter,
  onOpenFilterModal,
  categories,
  totalCategoryExpenses,
  selectedCategory,
  onSelectCategory,
  onToggleCategory,
  monthlyTrendData,
  selectedTimeFilter,
  selectedTrendMonth,
  onSelectTrendMonth,
  totalIncome,
  totalExpenses,
}: ExpensesTabPropsT) => {
  const pagerRef = useRef<PagerView>(null);

  const filterOrder = useMemo<InsightsFilterT[]>(
    () => ["kategorien", "income", "trend"],
    [],
  );

  const filterToIndex = (filter: InsightsFilterT) => {
    return filterOrder.indexOf(filter);
  };

  const indexToFilter = (index: number) => {
    return filterOrder[index] ?? "kategorien";
  };

  useEffect(() => {
    const targetIndex = filterToIndex(activeFilter);
    if (targetIndex >= 0) {
      pagerRef.current?.setPage(targetIndex);
    }
  }, [activeFilter]);

  const handleTabPress = (filter: InsightsFilterT) => {
    onChangeFilter(filter);
    const targetIndex = filterToIndex(filter);
    if (targetIndex >= 0) {
      pagerRef.current?.setPage(targetIndex);
    }
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: bottomInset + 100 },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.filterRow}>
        <Pressable style={styles.filterButton} onPress={onOpenFilterModal}>
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
          onPress={() => handleTabPress("kategorien")}
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
          onPress={() => handleTabPress("income")}
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
          onPress={() => handleTabPress("trend")}
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
        initialPage={filterToIndex(activeFilter)}
        onPageSelected={(event) => {
          const nextFilter = indexToFilter(event.nativeEvent.position);
          if (nextFilter !== activeFilter) {
            onChangeFilter(nextFilter);
          }
        }}
      >
        <View key="kategorien" style={styles.pagerPage}>
          <CategoriesPanel
            categories={categories}
            total={totalCategoryExpenses}
            selectedCategory={selectedCategory}
            onSelectCategory={onSelectCategory}
            onToggleCategory={onToggleCategory}
          />
        </View>

        <View key="income" style={styles.pagerPage}>
          <IncomeExpensesView income={totalIncome} expenses={totalExpenses} />
        </View>

        <View key="trend" style={styles.pagerPage}>
          <TrendView
            monthlyData={monthlyTrendData}
            timeFilter={selectedTimeFilter}
            selectedMonth={selectedTrendMonth}
            onSelectMonth={onSelectTrendMonth}
          />
        </View>
      </PagerView>
    </ScrollView>
  );
};
