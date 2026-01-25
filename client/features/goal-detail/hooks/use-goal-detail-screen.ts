import { useCallback, useMemo, useState } from "react";
import { Alert, Platform } from "react-native";
import { useApp } from "@/context/AppContext";
import type { GoalDeposit } from "@/context/app/types";
import { groupDepositsByMonth } from "../utils/group-deposits";
import { parseDepositDate } from "../utils/date";

type UseGoalDetailScreenParamsT = {
  goalId?: string | null;
  goalName?: string | null;
  onNavigateBack: () => void;
};

type UseGoalDetailScreenReturnT = {
  goal: ReturnType<typeof useApp>["goals"][number] | null;
  groupedDeposits: ReturnType<typeof groupDepositsByMonth>;
  derived: {
    percentage: number;
    remaining: number;
    isCompleted: boolean;
    depositTitle: string;
  };
  state: {
    editModalVisible: boolean;
    tempName: string;
    depositModalVisible: boolean;
    depositAmount: string;
    selectedDate: Date;
    showDatePicker: boolean;
    editingDeposit: GoalDeposit | null;
    editDepositModalVisible: boolean;
    editDepositAmount: string;
    editDepositDate: Date;
    showEditDatePicker: boolean;
    activeSwipeId: string;
  };
  actions: {
    setTempName: (value: string) => void;
    setDepositAmount: (value: string) => void;
    setSelectedDate: (value: Date) => void;
    setEditDepositAmount: (value: string) => void;
    setEditDepositDate: (value: Date) => void;
    setShowDatePicker: (value: boolean) => void;
    setShowEditDatePicker: (value: boolean) => void;
    setActiveSwipeId: (value: string) => void;
    openEditNameModal: () => void;
    handleEditCancel: () => void;
    handleDeleteGoal: () => void;
    handleEditSave: () => void;
    openDepositModal: () => void;
    handleDepositSave: () => void;
    handleDepositCancel: () => void;
    handleEditDeposit: (deposit: GoalDeposit) => void;
    handleEditDepositSave: () => void;
    handleEditDepositCancel: () => void;
    handleDeleteDeposit: (depositId: string) => void;
    onDateChange: (event: any, date?: Date) => void;
    onEditDateChange: (event: any, date?: Date) => void;
  };
};

export const useGoalDetailScreen = ({
  goalId,
  goalName,
  onNavigateBack,
}: UseGoalDetailScreenParamsT): UseGoalDetailScreenReturnT => {
  const {
    goals,
    addGoalDeposit,
    updateGoalDeposit,
    deleteGoalDeposit,
    updateGoal,
    deleteGoal,
  } = useApp();

  const goal = useMemo(() => {
    if (!goals.length) return null;
    return (
      (goalId ? goals.find((g) => g.id === goalId) : null) ||
      (goalName ? goals.find((g) => g.name === goalName) : null) ||
      goals[0]
    );
  }, [goals, goalId, goalName]);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [tempName, setTempName] = useState(goal?.name || "");
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [editingDeposit, setEditingDeposit] = useState<GoalDeposit | null>(null);
  const [editDepositModalVisible, setEditDepositModalVisible] = useState(false);
  const [editDepositAmount, setEditDepositAmount] = useState("");
  const [editDepositDate, setEditDepositDate] = useState(new Date());
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);
  const [activeSwipeId, setActiveSwipeId] = useState<string>("");

  const groupedDeposits = useMemo(() => {
    if (!goal?.deposits) return {};
    return groupDepositsByMonth(goal.deposits);
  }, [goal?.deposits]);

  const percentage = useMemo(() => {
    if (!goal || goal.target <= 0) return 0;
    return (goal.current / goal.target) * 100;
  }, [goal]);

  const remaining = useMemo(() => {
    if (!goal) return 0;
    return goal.target - goal.current;
  }, [goal]);

  const isCompleted = percentage >= 100;
  const isKlarna = goal?.name.toLowerCase().includes("klarna") ?? false;
  const depositTitle = isKlarna ? "Rückzahlung" : "Einzahlung";

  const openEditNameModal = useCallback(() => {
    if (!goal) return;
    setTempName(goal.name);
    setEditModalVisible(true);
  }, [goal]);

  const handleDeleteGoal = useCallback(() => {
    if (!goal) return;
    Alert.alert(
      "Ziel löschen",
      `Möchtest du das Ziel \"${goal.name}\" wirklich löschen?`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: () => {
            deleteGoal(goal.id);
            onNavigateBack();
          },
        },
      ],
    );
  }, [deleteGoal, goal, onNavigateBack]);

  const handleEditSave = useCallback(() => {
    if (goal) {
      updateGoal(goal.id, { name: tempName });
    }
    setEditModalVisible(false);
  }, [goal, tempName, updateGoal]);

  const handleEditCancel = useCallback(() => {
    setEditModalVisible(false);
  }, []);

  const openDepositModal = useCallback(() => {
    setDepositModalVisible(true);
  }, []);

  const handleDepositSave = useCallback(() => {
    const amount = parseFloat(depositAmount.replace(",", "."));
    if (!isNaN(amount) && amount > 0 && goal) {
      addGoalDeposit(goal.id, amount, selectedDate);
      setDepositModalVisible(false);
      setDepositAmount("");
      setSelectedDate(new Date());
    }
  }, [addGoalDeposit, depositAmount, goal, selectedDate]);

  const handleDepositCancel = useCallback(() => {
    setDepositModalVisible(false);
    setDepositAmount("");
    setSelectedDate(new Date());
  }, []);

  const handleEditDeposit = useCallback((deposit: GoalDeposit) => {
    setEditingDeposit(deposit);
    setEditDepositAmount(deposit.amount.toString().replace(".", ","));
    const parsed = parseDepositDate(deposit.date);
    setEditDepositDate(parsed?.date || new Date());
    setEditDepositModalVisible(true);
  }, []);

  const handleEditDepositSave = useCallback(() => {
    const amount = parseFloat(editDepositAmount.replace(",", "."));
    if (!isNaN(amount) && amount > 0 && goal && editingDeposit) {
      updateGoalDeposit(goal.id, editingDeposit.id, amount, editDepositDate);
      setEditDepositModalVisible(false);
      setEditingDeposit(null);
      setEditDepositAmount("");
    }
  }, [
    editDepositAmount,
    editDepositDate,
    editingDeposit,
    goal,
    updateGoalDeposit,
  ]);

  const handleEditDepositCancel = useCallback(() => {
    setEditDepositModalVisible(false);
    setEditingDeposit(null);
    setEditDepositAmount("");
  }, []);

  const handleDeleteDeposit = useCallback(
    (depositId: string) => {
      if (goal) {
        deleteGoalDeposit(goal.id, depositId);
      }
    },
    [deleteGoalDeposit, goal],
  );

  const onDateChange = useCallback((event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  }, []);

  const onEditDateChange = useCallback((event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowEditDatePicker(false);
    }
    if (date) {
      setEditDepositDate(date);
    }
  }, []);

  return {
    goal,
    groupedDeposits,
    derived: {
      percentage,
      remaining,
      isCompleted,
      depositTitle,
    },
    state: {
      editModalVisible,
      tempName,
      depositModalVisible,
      depositAmount,
      selectedDate,
      showDatePicker,
      editingDeposit,
      editDepositModalVisible,
      editDepositAmount,
      editDepositDate,
      showEditDatePicker,
      activeSwipeId,
    },
    actions: {
      setTempName,
      setDepositAmount,
      setSelectedDate,
      setEditDepositAmount,
      setEditDepositDate,
      setShowDatePicker,
      setShowEditDatePicker,
      setActiveSwipeId,
      openEditNameModal,
      handleEditCancel,
      handleDeleteGoal,
      handleEditSave,
      openDepositModal,
      handleDepositSave,
      handleDepositCancel,
      handleEditDeposit,
      handleEditDepositSave,
      handleEditDepositCancel,
      handleDeleteDeposit,
      onDateChange,
      onEditDateChange,
    },
  };
};
