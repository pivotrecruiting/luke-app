import { useCallback, useMemo, useState } from "react";
import { Alert, Platform } from "react-native";
import { useApp } from "@/context/AppContext";
import type { BudgetExpense } from "@/context/app/types";
import { groupExpensesByMonth } from "../utils/group-expenses";
import { parseExpenseDate } from "../utils/date";

type UseBudgetDetailScreenParamsT = {
  budgetId: string;
  onNavigateBack: () => void;
};

type UseBudgetDetailScreenReturnT = {
  budget: ReturnType<typeof useApp>["budgets"][number] | null;
  groupedExpenses: ReturnType<typeof groupExpensesByMonth>;
  derived: {
    displayPercentage: number;
    isOverBudget: boolean;
    remainingAmount: number;
  };
  state: {
    editModalVisible: boolean;
    editingExpense: BudgetExpense | null;
    editExpenseAmount: string;
    editExpenseName: string;
    editExpenseDate: Date;
    showEditDatePicker: boolean;
    activeSwipeId: string;
    editBudgetModalVisible: boolean;
    editBudgetLimit: string;
  };
  actions: {
    setEditExpenseAmount: (value: string) => void;
    setEditExpenseName: (value: string) => void;
    setEditBudgetLimit: (value: string) => void;
    setEditExpenseDate: (value: Date) => void;
    setShowEditDatePicker: (value: boolean) => void;
    setActiveSwipeId: (value: string) => void;
    openEditBudgetModal: () => void;
    handleEditBudgetSave: () => void;
    handleEditBudgetCancel: () => void;
    handleEditExpense: (expense: BudgetExpense) => void;
    handleEditExpenseSave: () => void;
    handleEditExpenseCancel: () => void;
    handleDeleteExpense: (expenseId: string) => void;
    handleDeleteBudget: () => void;
    onEditDateChange: (event: any, date?: Date) => void;
  };
};

export const useBudgetDetailScreen = ({
  budgetId,
  onNavigateBack,
}: UseBudgetDetailScreenParamsT): UseBudgetDetailScreenReturnT => {
  const {
    budgets,
    updateBudgetExpense,
    deleteBudgetExpense,
    deleteBudget,
    updateBudget,
  } = useApp();

  const budget = useMemo(
    () => budgets.find((item) => item.id === budgetId) ?? null,
    [budgets, budgetId],
  );

  const groupedExpenses = useMemo(
    () => groupExpensesByMonth(budget?.expenses ?? []),
    [budget?.expenses],
  );

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<BudgetExpense | null>(
    null,
  );
  const [editExpenseAmount, setEditExpenseAmount] = useState("");
  const [editExpenseName, setEditExpenseName] = useState("");
  const [editExpenseDate, setEditExpenseDate] = useState(new Date());
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [activeSwipeId, setActiveSwipeId] = useState<string>("");
  const [editBudgetModalVisible, setEditBudgetModalVisible] = useState(false);
  const [editBudgetLimit, setEditBudgetLimit] = useState("");

  const displayPercentage = useMemo(() => {
    if (!budget || budget.limit <= 0) return 0;
    const percentage = (budget.current / budget.limit) * 100;
    return Math.min(percentage, 100);
  }, [budget]);

  const isOverBudget = useMemo(() => {
    return budget ? budget.current > budget.limit : false;
  }, [budget]);

  const remainingAmount = useMemo(() => {
    if (!budget) return 0;
    return Math.max(0, budget.limit - budget.current);
  }, [budget]);

  const handleEditExpense = useCallback((expense: BudgetExpense) => {
    setEditingExpense(expense);
    setEditExpenseAmount(expense.amount.toString().replace(".", ","));
    setEditExpenseName(expense.name);
    const parsed = parseExpenseDate(expense.date);
    setEditExpenseDate(parsed?.date || new Date());
    setEditModalVisible(true);
  }, []);

  const handleEditExpenseSave = useCallback(() => {
    if (!budget || !editingExpense) return;
    const amount = parseFloat(editExpenseAmount.replace(",", "."));
    if (!isNaN(amount) && amount > 0) {
      updateBudgetExpense(
        budget.id,
        editingExpense.id,
        amount,
        editExpenseName,
        editExpenseDate,
      );
      setEditModalVisible(false);
      setEditingExpense(null);
      setEditExpenseAmount("");
      setEditExpenseName("");
    }
  }, [
    budget,
    editExpenseAmount,
    editExpenseDate,
    editExpenseName,
    editingExpense,
    updateBudgetExpense,
  ]);

  const handleEditExpenseCancel = useCallback(() => {
    setEditModalVisible(false);
    setEditingExpense(null);
    setEditExpenseAmount("");
    setEditExpenseName("");
  }, []);

  const handleDeleteExpense = useCallback(
    (expenseId: string) => {
      if (!budget) return;
      deleteBudgetExpense(budget.id, expenseId);
    },
    [budget, deleteBudgetExpense],
  );

  const handleDeleteBudget = useCallback(() => {
    if (!budget) return;
    Alert.alert(
      "Budget löschen",
      `Möchtest du das Budget \"${budget.name}\" wirklich löschen? Alle zugehörigen Ausgaben werden ebenfalls entfernt.`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: () => {
            deleteBudget(budget.id);
            onNavigateBack();
          },
        },
      ],
    );
  }, [budget, deleteBudget, onNavigateBack]);

  const openEditBudgetModal = useCallback(() => {
    if (!budget) return;
    setEditBudgetLimit(budget.limit.toString().replace(".", ","));
    setEditBudgetModalVisible(true);
  }, [budget]);

  const handleEditBudgetSave = useCallback(() => {
    if (!budget) return;
    const limit = parseFloat(editBudgetLimit.replace(",", "."));
    if (!isNaN(limit) && limit >= 0) {
      updateBudget(budget.id, { limit });
      setEditBudgetModalVisible(false);
      setEditBudgetLimit("");
    }
  }, [budget, editBudgetLimit, updateBudget]);

  const handleEditBudgetCancel = useCallback(() => {
    setEditBudgetModalVisible(false);
    setEditBudgetLimit("");
  }, []);

  const onEditDateChange = useCallback((event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowEditDatePicker(false);
    }
    if (date) {
      setEditExpenseDate(date);
    }
  }, []);

  return {
    budget,
    groupedExpenses,
    derived: {
      displayPercentage,
      isOverBudget,
      remainingAmount,
    },
    state: {
      editModalVisible,
      editingExpense,
      editExpenseAmount,
      editExpenseName,
      editExpenseDate,
      showEditDatePicker,
      activeSwipeId,
      editBudgetModalVisible,
      editBudgetLimit,
    },
    actions: {
      setEditExpenseAmount,
      setEditExpenseName,
      setEditBudgetLimit,
      setEditExpenseDate,
      setShowEditDatePicker,
      setActiveSwipeId,
      openEditBudgetModal,
      handleEditBudgetSave,
      handleEditBudgetCancel,
      handleEditExpense,
      handleEditExpenseSave,
      handleEditExpenseCancel,
      handleDeleteExpense,
      handleDeleteBudget,
      onEditDateChange,
    },
  };
};
