import type { RefObject } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { styles } from "@/screens/styles/insights-screen.styles";
import { CategoriesPanel } from "./categories-panel";
import { IncomeExpensesView } from "./income-expenses-view";
import { TrendView } from "./trend-view";
import type {
  CategoryT,
  InsightsFilterT,
  MonthlyTrendT,
} from "../types/insights-types";

type ExpensesTabPropsT = {
  scrollViewRef: RefObject<ScrollView>;
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
  selectedTrendMonth,
  onSelectTrendMonth,
  totalIncome,
  totalExpenses,
}: ExpensesTabPropsT) => {
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
          onPress={() => onChangeFilter("kategorien")}
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
          onPress={() => onChangeFilter("income")}
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
          onPress={() => onChangeFilter("trend")}
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
            <CategoriesPanel
              categories={categories}
              total={totalCategoryExpenses}
              selectedCategory={selectedCategory}
              onSelectCategory={onSelectCategory}
              onToggleCategory={onToggleCategory}
            />
          </View>
        )}

        {activeFilter === "income" && (
          <View style={styles.pagerPage}>
            <IncomeExpensesView income={totalIncome} expenses={totalExpenses} />
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
              onSelectMonth={onSelectTrendMonth}
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
  );
};
