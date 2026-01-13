import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
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

const GERMAN_MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"
];

const formatCurrency = (value: number) => {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const parseExpenseDate = (dateStr: string): { month: number; year: number; date: Date } | null => {
  const now = new Date();
  if (dateStr.startsWith("Heute")) {
    return { month: now.getMonth(), year: now.getFullYear(), date: now };
  }
  if (dateStr === "Gestern" || dateStr.startsWith("Gestern")) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return { month: yesterday.getMonth(), year: yesterday.getFullYear(), date: yesterday };
  }
  const match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) {
    const date = new Date(parseInt(match[3], 10), parseInt(match[2], 10) - 1, parseInt(match[1], 10));
    return { month: date.getMonth(), year: date.getFullYear(), date };
  }
  return null;
};

const groupExpensesByMonth = (expenses: BudgetExpense[]): Record<string, BudgetExpense[]> => {
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

function SwipeableExpense({ expense, budgetIcon, onDelete, onEdit, isActive, onSwipeOpen }: SwipeableExpenseProps) {
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
          onPress: handleCloseSwipe
        },
        {
          text: "Löschen",
          style: "destructive",
          onPress: () => onDelete(),
        },
      ]
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
  const { budgets, updateBudgetExpense, deleteBudgetExpense, deleteBudget, updateBudget } = useApp();

  const budget = budgets.find((b) => b.id === budgetId);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<BudgetExpense | null>(null);
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
  const isCompleted = budget.current >= budget.limit;

  const groupedExpenses = useMemo(() => {
    return groupExpensesByMonth(budget.expenses);
  }, [budget.expenses]);

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
      updateBudgetExpense(budget.id, editingExpense.id, amount, editExpenseName, editExpenseDate);
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
      ]
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
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerActions}>
            <Pressable style={styles.editHeaderButton} onPress={openEditBudgetModal}>
              <Feather name="edit-2" size={20} color="#FFFFFF" />
            </Pressable>
            <Pressable style={styles.deleteHeaderButton} onPress={handleDeleteBudget}>
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
            <View style={[styles.iconContainer, { backgroundColor: `${budget.iconColor}20` }]}>
              <Feather name={budget.icon as any} size={28} color={budget.iconColor} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryTitle}>{budget.name}</Text>
              <Text style={[styles.summaryAmount, isOverBudget && styles.overBudgetText]}>
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
              <Text style={[styles.statValue, isOverBudget && styles.overBudgetText]}>
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
          <Text style={styles.swipeHint}>Lang drücken zum Löschen, tippen zum Bearbeiten</Text>
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
          <Pressable style={styles.modalBackdrop} onPress={handleEditExpenseCancel} />
          <ScrollView 
            style={[styles.modalContent, { maxHeight: '80%' }]}
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
              <Text style={styles.datePickerText}>{formatDisplayDate(editExpenseDate)}</Text>
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

            <Pressable style={styles.modalSaveButton} onPress={handleEditExpenseSave}>
              <Text style={styles.modalSaveButtonText}>Speichern</Text>
            </Pressable>
            
            <Pressable style={styles.modalCancelButton} onPress={handleEditExpenseCancel}>
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
          <Pressable style={styles.modalBackdrop} onPress={handleEditBudgetCancel} />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
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

            <Pressable style={styles.modalSaveButton} onPress={handleEditBudgetSave}>
              <Text style={styles.modalSaveButtonText}>Speichern</Text>
            </Pressable>
            
            <Pressable style={styles.modalCancelButton} onPress={handleEditBudgetCancel}>
              <Text style={styles.modalCancelButtonText}>Abbrechen</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(239,68,68,0.3)",
    justifyContent: "center",
    alignItems: "center",
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
  },
  summaryAmount: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 4,
  },
  overBudgetText: {
    color: "#EF4444",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 20,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#7340FE",
    borderRadius: 4,
  },
  progressBarOver: {
    backgroundColor: "#EF4444",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
  },
  swipeHint: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
  },
  monthSection: {
    marginBottom: 24,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  swipeableContainer: {
    position: "relative",
    overflow: "hidden",
  },
  deleteButton: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  transactionsList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  transactionName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
  },
  transactionDate: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  transactionAmountNegative: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
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
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#000000",
    marginBottom: 16,
  },
  currencyInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    marginBottom: 16,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: "600",
    color: "#7340FE",
    paddingLeft: 16,
  },
  currencyInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: "#000000",
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  datePickerText: {
    fontSize: 16,
    color: "#000000",
  },
  datePickerContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  datePickerDoneButton: {
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  datePickerDoneText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7340FE",
  },
  modalSaveButton: {
    backgroundColor: "#7340FE",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  modalSaveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  modalCancelButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  modalCancelButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "500",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  editHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});
