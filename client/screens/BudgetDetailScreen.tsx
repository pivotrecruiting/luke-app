import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Spacing } from "@/constants/theme";
import { useApp, BudgetExpense } from "@/context/AppContext";
import { styles } from "./styles/budget-detail-screen.styles";

const GERMAN_MONTHS = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

const formatCurrency = (value: number) => {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const parseExpenseDate = (
  dateStr: string,
): { month: number; year: number; date: Date } | null => {
  const now = new Date();
  if (dateStr.startsWith("Heute")) {
    return { month: now.getMonth(), year: now.getFullYear(), date: now };
  }
  if (dateStr === "Gestern" || dateStr.startsWith("Gestern")) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return {
      month: yesterday.getMonth(),
      year: yesterday.getFullYear(),
      date: yesterday,
    };
  }
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const date = new Date(
      parseInt(match[3], 10),
      parseInt(match[2], 10) - 1,
      parseInt(match[1], 10),
    );
    return { month: date.getMonth(), year: date.getFullYear(), date };
  }
  return null;
};

const groupExpensesByMonth = (
  expenses: BudgetExpense[],
): Record<string, BudgetExpense[]> => {
  const grouped: Record<string, BudgetExpense[]> = {};

  const sortedExpenses = [...expenses].sort((a, b) => {
    const dateA = parseExpenseDate(a.date)?.date || new Date();
    const dateB = parseExpenseDate(b.date)?.date || new Date();
    return dateB.getTime() - dateA.getTime();
  });

  sortedExpenses.forEach((expense) => {
    const parsed = parseExpenseDate(expense.date);
    if (parsed) {
      const key = `${GERMAN_MONTHS[parsed.month]} ${parsed.year}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(expense);
    }
  });

  return grouped;
};

interface SwipeableExpenseProps {
  expense: BudgetExpense;
  budgetIcon: string;
  onDelete: () => void;
  onEdit: () => void;
  isActive: boolean;
  onSwipeOpen: (id: string) => void;
}

function SwipeableExpense({
  expense,
  budgetIcon,
  onDelete,
  onEdit,
  isActive,
  onSwipeOpen,
}: SwipeableExpenseProps) {
  const handleSwipeOpen = () => {
    onSwipeOpen(expense.id);
  };

  const handleCloseSwipe = () => {
    onSwipeOpen("");
  };

  const handleDelete = () => {
    Alert.alert(
      "Ausgabe löschen",
      `Möchtest du diese Ausgabe über € ${formatCurrency(expense.amount)} wirklich löschen?`,
      [
        {
          text: "Abbrechen",
          style: "cancel",
          onPress: handleCloseSwipe,
        },
        {
          text: "Löschen",
          style: "destructive",
          onPress: () => onDelete(),
        },
      ],
    );
  };

  return (
    <View style={styles.swipeableContainer}>
      {isActive ? (
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Feather name="trash-2" size={20} color="#FFFFFF" />
        </Pressable>
      ) : null}
      <Pressable
        style={[styles.transactionItem, isActive && { marginRight: 80 }]}
        onPress={() => {
          if (isActive) {
            handleCloseSwipe();
          } else {
            onEdit();
          }
        }}
        onLongPress={handleSwipeOpen}
      >
        <View style={styles.transactionLeft}>
          <View style={styles.transactionIconContainer}>
            <Feather name={budgetIcon as any} size={18} color="#6B7280" />
          </View>
          <View>
            <Text style={styles.transactionName}>{expense.name}</Text>
            <Text style={styles.transactionDate}>{expense.date}</Text>
          </View>
        </View>
        <Text style={styles.transactionAmountNegative}>
          -€ {formatCurrency(expense.amount)}
        </Text>
      </Pressable>
    </View>
  );
}

export default function BudgetDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { budgetId } = route.params as { budgetId: string };
  const {
    budgets,
    updateBudgetExpense,
    deleteBudgetExpense,
    deleteBudget,
    updateBudget,
  } = useApp();

  const budget = budgets.find((b) => b.id === budgetId);
  const groupedExpenses = useMemo(() => {
    return groupExpensesByMonth(budget?.expenses ?? []);
  }, [budget?.expenses]);

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

  if (!budget) {
    return (
      <View style={styles.container}>
        <Text>Budget nicht gefunden</Text>
      </View>
    );
  }

  const percentage = (budget.current / budget.limit) * 100;
  const isOverBudget = budget.current > budget.limit;
  const displayPercentage = Math.min(percentage, 100);

  const handleEditExpense = (expense: BudgetExpense) => {
    setEditingExpense(expense);
    setEditExpenseAmount(expense.amount.toString().replace(".", ","));
    setEditExpenseName(expense.name);
    const parsed = parseExpenseDate(expense.date);
    setEditExpenseDate(parsed?.date || new Date());
    setEditModalVisible(true);
  };

  const handleEditExpenseSave = () => {
    const amount = parseFloat(editExpenseAmount.replace(",", "."));
    if (!isNaN(amount) && amount > 0 && editingExpense) {
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
  };

  const handleEditExpenseCancel = () => {
    setEditModalVisible(false);
    setEditingExpense(null);
    setEditExpenseAmount("");
    setEditExpenseName("");
  };

  const handleDeleteExpense = (expenseId: string) => {
    deleteBudgetExpense(budget.id, expenseId);
  };

  const handleDeleteBudget = () => {
    Alert.alert(
      "Budget löschen",
      `Möchtest du das Budget "${budget.name}" wirklich löschen? Alle zugehörigen Ausgaben werden ebenfalls entfernt.`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          style: "destructive",
          onPress: () => {
            deleteBudget(budget.id);
            navigation.goBack();
          },
        },
      ],
    );
  };

  const openEditBudgetModal = () => {
    setEditBudgetLimit(budget.limit.toString().replace(".", ","));
    setEditBudgetModalVisible(true);
  };

  const handleEditBudgetSave = () => {
    const limit = parseFloat(editBudgetLimit.replace(",", "."));
    if (!isNaN(limit) && limit >= 0) {
      updateBudget(budget.id, { limit });
      setEditBudgetModalVisible(false);
      setEditBudgetLimit("");
    }
  };

  const handleEditBudgetCancel = () => {
    setEditBudgetModalVisible(false);
    setEditBudgetLimit("");
  };

  const onEditDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowEditDatePicker(false);
    }
    if (date) {
      setEditExpenseDate(date);
    }
  };

  const formatDisplayDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#7340fd", "#3B5BDB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.editHeaderButton}
              onPress={openEditBudgetModal}
            >
              <Feather name="edit-2" size={20} color="#FFFFFF" />
            </Pressable>
            <Pressable
              style={styles.deleteHeaderButton}
              onPress={handleDeleteBudget}
            >
              <Feather name="trash-2" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
        <Text style={styles.headerTitle}>{budget.name}</Text>
        <Text style={styles.headerSubtitle}>Budget Details</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${budget.iconColor}20` },
              ]}
            >
              <Feather
                name={budget.icon as any}
                size={28}
                color={budget.iconColor}
              />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryTitle}>{budget.name}</Text>
              <Text
                style={[
                  styles.summaryAmount,
                  isOverBudget && styles.overBudgetText,
                ]}
              >
                € {formatCurrency(budget.current)} / € {budget.limit}
              </Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${displayPercentage}%` },
                isOverBudget && styles.progressBarOver,
              ]}
            />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Ausgegeben</Text>
              <Text
                style={[
                  styles.statValue,
                  isOverBudget && styles.overBudgetText,
                ]}
              >
                € {formatCurrency(budget.current)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Übrig</Text>
              <Text style={styles.statValue}>
                € {formatCurrency(Math.max(0, budget.limit - budget.current))}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Limit</Text>
              <Text style={styles.statValue}>€ {budget.limit}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transaktionen</Text>
          <Text style={styles.swipeHint}>
            Lang drücken zum Löschen, tippen zum Bearbeiten
          </Text>
        </View>

        {Object.keys(groupedExpenses).length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Feather name="inbox" size={48} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>Keine Transaktionen</Text>
            <Text style={styles.emptySubtitle}>
              Ausgaben in dieser Kategorie erscheinen hier
            </Text>
          </View>
        ) : (
          Object.entries(groupedExpenses).map(([month, expenses]) => (
            <View key={month} style={styles.monthSection}>
              <Text style={styles.monthTitle}>{month}</Text>
              <View style={styles.transactionsList}>
                {expenses.map((expense) => (
                  <SwipeableExpense
                    key={expense.id}
                    expense={expense}
                    budgetIcon={budget.icon}
                    onDelete={() => handleDeleteExpense(expense.id)}
                    onEdit={() => handleEditExpense(expense)}
                    isActive={activeSwipeId === expense.id}
                    onSwipeOpen={setActiveSwipeId}
                  />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="none"
        onRequestClose={handleEditExpenseCancel}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={handleEditExpenseCancel}
          />
          <ScrollView
            style={[styles.modalContent, { maxHeight: "80%" }]}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Ausgabe bearbeiten</Text>

            <Text style={styles.modalLabel}>Name</Text>
            <TextInput
              style={styles.modalInput}
              value={editExpenseName}
              onChangeText={setEditExpenseName}
              placeholder="Beschreibung"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.modalLabel}>Betrag</Text>
            <View style={styles.currencyInputContainer}>
              <Text style={styles.currencyPrefix}>€</Text>
              <TextInput
                style={styles.currencyInput}
                value={editExpenseAmount}
                onChangeText={setEditExpenseAmount}
                placeholder="0,00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
              />
            </View>

            <Text style={styles.modalLabel}>Datum</Text>
            <Pressable
              style={styles.datePickerButton}
              onPress={() => setShowEditDatePicker(true)}
            >
              <Feather name="calendar" size={20} color="#7340FE" />
              <Text style={styles.datePickerText}>
                {formatDisplayDate(editExpenseDate)}
              </Text>
            </Pressable>

            {showEditDatePicker ? (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={editExpenseDate}
                  mode="date"
                  display="spinner"
                  onChange={onEditDateChange}
                  maximumDate={new Date()}
                  locale="de-DE"
                  textColor="#000000"
                  themeVariant="light"
                />
                <Pressable
                  style={styles.datePickerDoneButton}
                  onPress={() => setShowEditDatePicker(false)}
                >
                  <Text style={styles.datePickerDoneText}>Fertig</Text>
                </Pressable>
              </View>
            ) : null}

            <Pressable
              style={styles.modalSaveButton}
              onPress={handleEditExpenseSave}
            >
              <Text style={styles.modalSaveButtonText}>Speichern</Text>
            </Pressable>

            <Pressable
              style={styles.modalCancelButton}
              onPress={handleEditExpenseCancel}
            >
              <Text style={styles.modalCancelButtonText}>Abbrechen</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={editBudgetModalVisible}
        transparent
        animationType="none"
        onRequestClose={handleEditBudgetCancel}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable
            style={styles.modalBackdrop}
            onPress={handleEditBudgetCancel}
          />
          <View
            style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Budget bearbeiten</Text>

            <Text style={styles.modalLabel}>Monatliches Limit</Text>
            <View style={styles.currencyInputContainer}>
              <Text style={styles.currencyPrefix}>€</Text>
              <TextInput
                style={styles.currencyInput}
                value={editBudgetLimit}
                onChangeText={setEditBudgetLimit}
                placeholder="0,00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>

            <Pressable
              style={styles.modalSaveButton}
              onPress={handleEditBudgetSave}
            >
              <Text style={styles.modalSaveButtonText}>Speichern</Text>
            </Pressable>

            <Pressable
              style={styles.modalCancelButton}
              onPress={handleEditBudgetCancel}
            >
              <Text style={styles.modalCancelButtonText}>Abbrechen</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
