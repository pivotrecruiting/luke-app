import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";
import { Alert, ScrollView } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useApp } from "@/context/AppContext";
import { calculateMonths } from "../utils/calc";
import type { SuccessToastT } from "../types/goals-types";

type UseGoalsScreenReturnT = {
  data: {
    goals: ReturnType<typeof useApp>["goals"];
    budgets: ReturnType<typeof useApp>["budgets"];
    vaultBalance: ReturnType<typeof useApp>["vaultBalance"];
    monthlyBalance: ReturnType<typeof useApp>["monthlyBalance"];
  };
  state: {
    createModalVisible: boolean;
    goalName: string;
    goalAmount: string;
    monthlyContribution: string;
    selectedEmoji: string;
    showEmojiPicker: boolean;
    budgetModalVisible: boolean;
    selectedCategory: string | null;
    budgetLimit: string;
    successToast: SuccessToastT;
    depositModalVisible: boolean;
    selectedGoalForDeposit: ReturnType<typeof useApp>["goals"][number] | null;
    depositAmount: string;
  };
  derived: {
    monthsToGoal: number;
  };
  actions: {
    openCreateGoalModal: () => void;
    openBudgetModal: () => void;
    setGoalName: (value: string) => void;
    setGoalAmount: (value: string) => void;
    setMonthlyContribution: (value: string) => void;
    setSelectedEmoji: (value: string) => void;
    selectEmoji: (value: string) => void;
    toggleEmojiPicker: () => void;
    setSelectedCategory: (value: string | null) => void;
    setBudgetLimit: (value: string) => void;
    handleCreateGoal: () => void;
    handleCreateBudget: () => void;
    resetAndCloseGoalModal: () => void;
    resetAndCloseBudgetModal: () => void;
    openDepositModal: (goal: ReturnType<typeof useApp>["goals"][number]) => void;
    setDepositAmount: (value: string) => void;
    handleDepositSave: () => void;
    handleDepositCancel: () => void;
  };
  refs: {
    scrollViewRef: RefObject<ScrollView | null>;
  };
};

export const useGoalsScreen = (): UseGoalsScreenReturnT => {
  const {
    goals,
    budgets,
    vaultBalance,
    monthlyBalance,
    budgetCategories,
    addGoal,
    addBudget,
    addGoalDeposit,
  } = useApp();
  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("😀");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [budgetLimit, setBudgetLimit] = useState("");

  const [successToast, setSuccessToast] = useState<SuccessToastT>(null);

  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState<
    ReturnType<typeof useApp>["goals"][number] | null
  >(null);
  const [depositAmount, setDepositAmount] = useState("");

  useEffect(() => {
    if (!successToast) return;
    const timer = setTimeout(() => {
      setSuccessToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [successToast]);

  const monthsToGoal = useMemo(() => {
    return calculateMonths(goalAmount, monthlyContribution);
  }, [goalAmount, monthlyContribution]);

  const openCreateGoalModal = useCallback(() => {
    setCreateModalVisible(true);
  }, []);

  const openBudgetModal = useCallback(() => {
    setBudgetModalVisible(true);
  }, []);

  const toggleEmojiPicker = useCallback(() => {
    setShowEmojiPicker((prev) => !prev);
  }, []);

  const selectEmoji = useCallback((value: string) => {
    setSelectedEmoji(value);
    setShowEmojiPicker(false);
  }, []);

  const resetAndCloseGoalModal = useCallback(() => {
    setCreateModalVisible(false);
    setGoalName("");
    setGoalAmount("");
    setMonthlyContribution("");
    setSelectedEmoji("😀");
    setShowEmojiPicker(false);
  }, []);

  const resetAndCloseBudgetModal = useCallback(() => {
    setBudgetModalVisible(false);
    setSelectedCategory(null);
    setBudgetLimit("");
  }, []);

  const handleCreateGoal = useCallback(() => {
    const amount = parseFloat(goalAmount.replace(",", ".")) || 0;
    if (!goalName || amount <= 0) return;

    const parsedMonthly = parseFloat(monthlyContribution.replace(",", "."));
    const normalizedMonthly =
      !isNaN(parsedMonthly) && parsedMonthly > 0 ? parsedMonthly : null;
    addGoal(goalName, selectedEmoji, amount, normalizedMonthly);
    resetAndCloseGoalModal();
    setSuccessToast("goal");
  }, [
    addGoal,
    goalAmount,
    goalName,
    monthlyContribution,
    resetAndCloseGoalModal,
    selectedEmoji,
  ]);

  const openDepositModal = useCallback(
    (goal: ReturnType<typeof useApp>["goals"][number]) => {
      setSelectedGoalForDeposit(goal);
      setDepositAmount("");
      setDepositModalVisible(true);
    },
    [],
  );

  const handleDepositSave = useCallback(() => {
    const amount = parseFloat(depositAmount.replace(",", "."));
    if (!selectedGoalForDeposit || isNaN(amount) || amount <= 0) return;
    if (amount > vaultBalance) {
      Alert.alert(
        "Nicht genug im Tresor",
        "Die Einzahlung ist höher als dein verfügbarer Tresorbetrag.",
      );
      return;
    }
    addGoalDeposit(selectedGoalForDeposit.id, amount, new Date());
    setDepositModalVisible(false);
    setSelectedGoalForDeposit(null);
    setDepositAmount("");
  }, [
    addGoalDeposit,
    depositAmount,
    selectedGoalForDeposit,
    vaultBalance,
  ]);

  const handleDepositCancel = useCallback(() => {
    setDepositModalVisible(false);
    setSelectedGoalForDeposit(null);
    setDepositAmount("");
  }, []);

  const handleCreateBudget = useCallback(() => {
    const limit = parseFloat(budgetLimit.replace(",", ".")) || 0;
    if (!selectedCategory || limit <= 0) return;

    const category = budgetCategories.find(
      (c) => c.key === selectedCategory || c.id === selectedCategory,
    );
    if (!category) return;

    addBudget(
      category.name,
      category.icon ?? "circle",
      category.color ?? "#6B7280",
      limit,
    );
    resetAndCloseBudgetModal();
    setSuccessToast("budget");
  }, [
    addBudget,
    budgetCategories,
    budgetLimit,
    resetAndCloseBudgetModal,
    selectedCategory,
  ]);

  return {
    data: { goals, budgets, vaultBalance, monthlyBalance },
    state: {
      createModalVisible,
      goalName,
      goalAmount,
      monthlyContribution,
      selectedEmoji,
      showEmojiPicker,
      budgetModalVisible,
      selectedCategory,
      budgetLimit,
      successToast,
      depositModalVisible,
      selectedGoalForDeposit,
      depositAmount,
    },
    derived: {
      monthsToGoal,
    },
    actions: {
      openCreateGoalModal,
      openBudgetModal,
      setGoalName,
      setGoalAmount,
      setMonthlyContribution,
      setSelectedEmoji,
      selectEmoji,
      toggleEmojiPicker,
      setSelectedCategory,
      setBudgetLimit,
      handleCreateGoal,
      handleCreateBudget,
      resetAndCloseGoalModal,
      resetAndCloseBudgetModal,
      openDepositModal,
      setDepositAmount,
      handleDepositSave,
      handleDepositCancel,
    },
    refs: {
      scrollViewRef,
    },
  };
};
