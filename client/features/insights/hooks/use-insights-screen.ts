import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  useApp,
  type ExpenseEntry,
  type IncomeEntry,
} from "@/context/AppContext";
import {
  CATEGORY_COLORS,
  EXPENSE_TYPES,
  INCOME_TYPES,
} from "../constants/insights-constants";
import { getDateRangeForFilter, parseGermanDate } from "../utils/date";
import type {
  CategoryT,
  InsightsFilterT,
  InsightsTabT,
  TimeFilterT,
} from "../types/insights-types";

type UseInsightsScreenReturnT = {
  appData: {
    budgets: ReturnType<typeof useApp>["budgets"];
    totalIncome: number;
    totalExpenses: number;
    monthlyTrendData: ReturnType<typeof useApp>["monthlyTrendData"];
    incomeEntries: IncomeEntry[];
    expenseEntries: ExpenseEntry[];
  };
  state: {
    activeTab: InsightsTabT;
    activeFilter: InsightsFilterT;
    selectedCategory: string | null;
    selectedTrendMonth: number | null;
    selectedTimeFilter: TimeFilterT;
    incomeModalVisible: boolean;
    expenseModalVisible: boolean;
    editingIncomeId: string | null;
    editingExpenseId: string | null;
    selectedIncomeType: string | null;
    selectedExpenseType: string | null;
    customIncomeType: string;
    customExpenseType: string;
    incomeAmount: string;
    expenseAmount: string;
    deleteConfirmId: string | null;
    deleteExpenseConfirmId: string | null;
  };
  derived: {
    filteredCategories: CategoryT[];
    totalCategoryExpenses: number;
    filteredMonthlyTrendData: ReturnType<typeof useApp>["monthlyTrendData"];
  };
  actions: {
    setActiveTab: (value: InsightsTabT) => void;
    setActiveFilter: (value: InsightsFilterT) => void;
    setSelectedCategory: (value: string | null) => void;
    setSelectedTrendMonth: (value: number | null) => void;
    setSelectedTimeFilter: (value: TimeFilterT) => void;
    setIncomeModalVisible: (value: boolean) => void;
    setExpenseModalVisible: (value: boolean) => void;
    setSelectedIncomeType: (value: string | null) => void;
    setSelectedExpenseType: (value: string | null) => void;
    setCustomIncomeType: (value: string) => void;
    setCustomExpenseType: (value: string) => void;
    setIncomeAmount: (value: string) => void;
    setExpenseAmount: (value: string) => void;
    setDeleteConfirmId: (value: string | null) => void;
    setDeleteExpenseConfirmId: (value: string | null) => void;
    handleCategoryPress: (categoryName: string) => void;
    openAddIncomeModal: () => void;
    openEditIncomeModal: (entry: IncomeEntry) => void;
    handleSaveIncome: () => void;
    handleDeleteIncome: (id: string) => void;
    openAddExpenseModal: () => void;
    openEditExpenseModal: (entry: ExpenseEntry) => void;
    handleSaveExpense: () => void;
    handleDeleteExpense: (id: string) => void;
    getIconForIncomeType: (typeName: string) => string;
    getIconForExpenseType: (typeName: string) => string;
  };
  refs: {
    scrollViewRef: RefObject<ScrollView | null>;
  };
};

export const useInsightsScreen = (): UseInsightsScreenReturnT => {
  const {
    budgets,
    totalIncome,
    totalExpenses,
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

  const [activeTab, setActiveTab] = useState<InsightsTabT>("ausgaben");
  const [activeFilter, setActiveFilter] =
    useState<InsightsFilterT>("kategorien");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTrendMonth, setSelectedTrendMonth] = useState<number | null>(
    null,
  );
  const [selectedTimeFilter, setSelectedTimeFilter] =
    useState<TimeFilterT>("thisMonth");
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

  const filteredCategories = useMemo<CategoryT[]>(() => {
    const { start, end } = getDateRangeForFilter(selectedTimeFilter);
    const categoryTotals: Record<string, number> = {};

    budgets.forEach((budget) => {
      const filteredExpenses = budget.expenses.filter((expense) => {
        const expenseDate = expense.timestamp
          ? new Date(expense.timestamp)
          : parseGermanDate(expense.date);
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

    const categories = Object.entries(categoryTotals).map(([name, amount]) => ({
      name,
      amount,
      color: CATEGORY_COLORS[name] || "#7B8CDE",
    }));
    return categories;
  }, [budgets, selectedTimeFilter]);

  useEffect(() => {
    if (
      selectedCategory &&
      !filteredCategories.find((c) => c.name === selectedCategory)
    ) {
      setSelectedCategory(null);
    }
  }, [filteredCategories, selectedCategory]);

  const totalCategoryExpenses = useMemo(() => {
    return filteredCategories.reduce((sum, cat) => sum + cat.amount, 0);
  }, [filteredCategories]);

  const handleCategoryPress = useCallback((categoryName: string) => {
    setSelectedCategory((prev) =>
      prev === categoryName ? null : categoryName,
    );
  }, []);

  const filteredMonthlyTrendData = useMemo(() => {
    if (monthlyTrendData.length === 0) return [];
    const { start, end } = getDateRangeForFilter(selectedTimeFilter);
    return monthlyTrendData.filter((item) => {
      const monthStart = new Date(`${item.monthStart}T00:00:00Z`);
      return monthStart >= start && monthStart <= end;
    });
  }, [monthlyTrendData, selectedTimeFilter]);

  useEffect(() => {
    if (
      selectedTrendMonth !== null &&
      selectedTrendMonth >= filteredMonthlyTrendData.length
    ) {
      setSelectedTrendMonth(null);
    }
  }, [filteredMonthlyTrendData.length, selectedTrendMonth]);

  const openAddIncomeModal = useCallback(() => {
    setEditingIncomeId(null);
    setSelectedIncomeType(null);
    setCustomIncomeType("");
    setIncomeAmount("");
    setIncomeModalVisible(true);
  }, []);

  const openEditIncomeModal = useCallback((entry: IncomeEntry) => {
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
  }, []);

  const resetIncomeForm = useCallback(() => {
    setSelectedIncomeType(null);
    setCustomIncomeType("");
    setIncomeAmount("");
    setEditingIncomeId(null);
  }, []);

  const handleSaveIncome = useCallback(() => {
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
  }, [
    addIncomeEntry,
    customIncomeType,
    editingIncomeId,
    incomeAmount,
    resetIncomeForm,
    selectedIncomeType,
    updateIncomeEntry,
  ]);

  const handleDeleteIncome = useCallback(
    (id: string) => {
      deleteIncomeEntry(id);
      setDeleteConfirmId(null);
    },
    [deleteIncomeEntry],
  );

  const getIconForIncomeType = useCallback((typeName: string): string => {
    const matchingType = INCOME_TYPES.find((t) => t.name === typeName);
    return matchingType?.icon || "plus-circle";
  }, []);

  const openAddExpenseModal = useCallback(() => {
    setEditingExpenseId(null);
    setSelectedExpenseType(null);
    setCustomExpenseType("");
    setExpenseAmount("");
    setExpenseModalVisible(true);
  }, []);

  const openEditExpenseModal = useCallback((entry: ExpenseEntry) => {
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
  }, []);

  const resetExpenseForm = useCallback(() => {
    setSelectedExpenseType(null);
    setCustomExpenseType("");
    setExpenseAmount("");
    setEditingExpenseId(null);
  }, []);

  const handleSaveExpense = useCallback(() => {
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
  }, [
    addExpenseEntry,
    customExpenseType,
    editingExpenseId,
    expenseAmount,
    resetExpenseForm,
    selectedExpenseType,
    updateExpenseEntry,
  ]);

  const handleDeleteExpense = useCallback(
    (id: string) => {
      deleteExpenseEntry(id);
      setDeleteExpenseConfirmId(null);
    },
    [deleteExpenseEntry],
  );

  const getIconForExpenseType = useCallback((typeName: string): string => {
    const matchingType = EXPENSE_TYPES.find((t) => t.name === typeName);
    return matchingType?.icon || "plus-circle";
  }, []);

  return {
    appData: {
      budgets,
      totalIncome,
      totalExpenses,
      monthlyTrendData,
      incomeEntries,
      expenseEntries,
    },
    state: {
      activeTab,
      activeFilter,
      selectedCategory,
      selectedTrendMonth,
      selectedTimeFilter,
      incomeModalVisible,
      expenseModalVisible,
      editingIncomeId,
      editingExpenseId,
      selectedIncomeType,
      selectedExpenseType,
      customIncomeType,
      customExpenseType,
      incomeAmount,
      expenseAmount,
      deleteConfirmId,
      deleteExpenseConfirmId,
    },
    derived: {
      filteredCategories,
      totalCategoryExpenses,
      filteredMonthlyTrendData,
    },
    actions: {
      setActiveTab,
      setActiveFilter,
      setSelectedCategory,
      setSelectedTrendMonth,
      setSelectedTimeFilter,
      setIncomeModalVisible,
      setExpenseModalVisible,
      setSelectedIncomeType,
      setSelectedExpenseType,
      setCustomIncomeType,
      setCustomExpenseType,
      setIncomeAmount,
      setExpenseAmount,
      setDeleteConfirmId,
      setDeleteExpenseConfirmId,
      handleCategoryPress,
      openAddIncomeModal,
      openEditIncomeModal,
      handleSaveIncome,
      handleDeleteIncome,
      openAddExpenseModal,
      openEditExpenseModal,
      handleSaveExpense,
      handleDeleteExpense,
      getIconForIncomeType,
      getIconForExpenseType,
    },
    refs: {
      scrollViewRef,
    },
  };
};
