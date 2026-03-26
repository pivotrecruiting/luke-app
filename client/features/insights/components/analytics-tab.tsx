import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import PagerView from "react-native-pager-view";
import { styles } from "@/screens/styles/insights-screen.styles";
import { CategoriesPanel } from "./categories-panel";
import { IncomeExpensesView } from "./income-expenses-view";
import { TrendView } from "./trend-view";
import type {
  CategoryT,
  InsightsFilterT,
  MonthlyTrendT,
  PeriodIncomeExpensesT,
  TimeFilterT,
} from "../types/insights-types";

const MIN_PAGER_HEIGHT = 280;

type AnalyticsTabPropsT = {
  scrollViewRef: RefObject<ScrollView | null>;
  bottomInset: number;
  activeFilter: InsightsFilterT;
  onChangeFilter: (value: InsightsFilterT) => void;
  selectedTimeFilter: TimeFilterT;
  onSelectTimeFilter: (value: TimeFilterT) => void;
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
  periodIncomeExpenses: PeriodIncomeExpensesT[];
};

/**
 * Renders the analytics tab with time filters, categories, comparison and trend.
 */
export const AnalyticsTab = ({
  scrollViewRef,
  bottomInset,
  activeFilter,
  onChangeFilter,
  selectedTimeFilter,
  onSelectTimeFilter,
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
  periodIncomeExpenses,
}: AnalyticsTabPropsT) => {
  const pagerRef = useRef<PagerView>(null);
  const { height: windowHeight } = useWindowDimensions();
  const [tabHeights, setTabHeights] = useState<Record<InsightsFilterT, number>>({
    kategorien: MIN_PAGER_HEIGHT,
    income: MIN_PAGER_HEIGHT,
    trend: MIN_PAGER_HEIGHT,
  });

  const timeFilterOptions = useMemo<{ id: TimeFilterT; label: string }[]>(
    () => [
      { id: "thisMonth", label: "Dieser Mon." },
      { id: "lastMonth", label: "Letzter Mon." },
      { id: "last3Months", label: "3M" },
      { id: "last6Months", label: "6M" },
      { id: "thisYear", label: "Y" },
    ],
    [],
  );

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

  const updateTabHeight = useCallback(
    (tab: InsightsFilterT, measuredHeight: number) => {
      const nextHeight = Math.max(MIN_PAGER_HEIGHT, Math.ceil(measuredHeight));
      setTabHeights((prev) => {
        if (Math.abs(prev[tab] - nextHeight) < 2) {
          return prev;
        }
        return {
          ...prev,
          [tab]: nextHeight,
        };
      });
    },
    [],
  );

  const fallbackPagerHeight = useMemo(() => {
    return Math.max(MIN_PAGER_HEIGHT, Math.round(windowHeight * 0.45));
  }, [windowHeight]);

  const pagerHeight = useMemo(() => {
    const measuredHeight = tabHeights[activeFilter];
    return Math.max(fallbackPagerHeight, measuredHeight);
  }, [activeFilter, fallbackPagerHeight, tabHeights]);

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
        { paddingBottom: bottomInset + 20 },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.filterRow}>
        {timeFilterOptions.map((option) => {
          const isSelected = selectedTimeFilter === option.id;
          return (
            <Pressable
              key={option.id}
              style={[
                styles.filterBadge,
                isSelected && styles.filterBadgeActive,
              ]}
              onPress={() => onSelectTimeFilter(option.id)}
            >
              <Text
                style={[
                  styles.filterBadgeText,
                  isSelected && styles.filterBadgeTextActive,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
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
        style={[styles.pagerView, { height: pagerHeight }]}
        initialPage={filterToIndex(activeFilter)}
        onPageSelected={(event) => {
          const nextFilter = indexToFilter(event.nativeEvent.position);
          if (nextFilter !== activeFilter) {
            onChangeFilter(nextFilter);
          }
        }}
      >
        <View key="kategorien" style={styles.pagerPage}>
          <View
            style={styles.pagerPageContent}
            onLayout={(event) => {
              updateTabHeight("kategorien", event.nativeEvent.layout.height);
            }}
          >
            <CategoriesPanel
              categories={categories}
              total={totalCategoryExpenses}
              selectedCategory={selectedCategory}
              onSelectCategory={onSelectCategory}
              onToggleCategory={onToggleCategory}
            />
          </View>
        </View>

        <View key="income" style={styles.pagerPage}>
          <View
            style={styles.pagerPageContent}
            onLayout={(event) => {
              updateTabHeight("income", event.nativeEvent.layout.height);
            }}
          >
            <IncomeExpensesView
              income={totalIncome}
              expenses={totalExpenses}
              periodIncomeExpenses={periodIncomeExpenses}
              timeFilter={selectedTimeFilter}
            />
          </View>
        </View>

        <View key="trend" style={styles.pagerPage}>
          <View
            style={styles.pagerPageContent}
            onLayout={(event) => {
              updateTabHeight("trend", event.nativeEvent.layout.height);
            }}
          >
            <TrendView
              monthlyData={monthlyTrendData}
              timeFilter={selectedTimeFilter}
              currentSavings={totalIncome - totalExpenses}
              selectedMonth={selectedTrendMonth}
              onSelectMonth={onSelectTrendMonth}
            />
          </View>
        </View>
      </PagerView>
    </ScrollView>
  );
};
