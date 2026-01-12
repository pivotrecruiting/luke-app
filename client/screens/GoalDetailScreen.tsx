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
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Spacing } from "@/constants/theme";
import { useApp, GoalDeposit } from "@/context/AppContext";

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

const parseDepositDate = (dateStr: string): { month: number; year: number; date: Date } | null => {
  const now = new Date();
  if (dateStr.startsWith("Heute")) {
    return { month: now.getMonth(), year: now.getFullYear(), date: now };
  }
  if (dateStr === "Gestern") {
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

const groupDepositsByMonth = (deposits: GoalDeposit[]): Record<string, GoalDeposit[]> => {
  const grouped: Record<string, GoalDeposit[]> = {};
  
  const sortedDeposits = [...deposits].sort((a, b) => {
    const dateA = parseDepositDate(a.date)?.date || new Date();
    const dateB = parseDepositDate(b.date)?.date || new Date();
    return dateB.getTime() - dateA.getTime();
  });
  
  sortedDeposits.forEach((deposit) => {
    const parsed = parseDepositDate(deposit.date);
    if (parsed) {
      const key = `${GERMAN_MONTHS[parsed.month]} ${parsed.year}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(deposit);
    }
  });
  
  return grouped;
};

interface SwipeableDepositProps {
  deposit: GoalDeposit;
  goalIcon: string;
  onDelete: () => void;
  onEdit: () => void;
}

function SwipeableDeposit({ deposit, goalIcon, onDelete, onEdit }: SwipeableDepositProps) {
  const [isSwipedOpen, setIsSwipedOpen] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      "Eintrag löschen",
      `Möchtest du diesen Eintrag über € ${formatCurrency(deposit.amount)} wirklich löschen?`,
      [
        { 
          text: "Abbrechen", 
          style: "cancel",
          onPress: () => setIsSwipedOpen(false)
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
      {isSwipedOpen ? (
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Feather name="trash-2" size={20} color="#FFFFFF" />
        </Pressable>
      ) : null}
      <Pressable
        style={[styles.transactionItem, isSwipedOpen && { marginRight: 80 }]}
        onPress={() => {
          if (isSwipedOpen) {
            setIsSwipedOpen(false);
          } else {
            onEdit();
          }
        }}
        onLongPress={() => setIsSwipedOpen(true)}
      >
        <View style={styles.transactionLeft}>
          <Text style={styles.transactionIcon}>{goalIcon}</Text>
          <View>
            <Text style={styles.transactionType}>{deposit.type}</Text>
            <Text style={styles.transactionDate}>{deposit.date}</Text>
          </View>
        </View>
        <Text style={styles.transactionAmount}>€ {formatCurrency(deposit.amount)}</Text>
      </Pressable>
    </View>
  );
}

export default function GoalDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { goals, addGoalDeposit, updateGoalDeposit, deleteGoalDeposit, updateGoal } = useApp();

  const goalId = route.params?.goalId || route.params?.goal?.id;
  const goal = useMemo(() => {
    return goals.find((g) => g.id === goalId) || goals.find((g) => g.name === route.params?.goal?.name) || goals[0];
  }, [goals, goalId, route.params?.goal?.name]);

  const [goalName, setGoalName] = useState(goal?.name || "");
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

  const percentage = goal ? (goal.current / goal.target) * 100 : 0;
  const remaining = goal ? goal.target - goal.current : 0;
  
  const isKlarna = goal?.name.toLowerCase().includes("klarna");
  const depositTitle = isKlarna ? "Rückzahlung" : "Einzahlung";

  const groupedTransactions = useMemo(() => {
    if (!goal?.deposits) return {};
    return groupDepositsByMonth(goal.deposits);
  }, [goal?.deposits]);

  const handleEditSave = () => {
    if (goal) {
      updateGoal(goal.id, { name: tempName });
      setGoalName(tempName);
    }
    setEditModalVisible(false);
  };

  const handleDepositSave = () => {
    const amount = parseFloat(depositAmount.replace(",", "."));
    if (!isNaN(amount) && amount > 0 && goal) {
      addGoalDeposit(goal.id, amount, selectedDate);
      setDepositModalVisible(false);
      setDepositAmount("");
      setSelectedDate(new Date());
    }
  };

  const handleDepositCancel = () => {
    setDepositModalVisible(false);
    setDepositAmount("");
    setSelectedDate(new Date());
  };

  const handleEditDeposit = (deposit: GoalDeposit) => {
    setEditingDeposit(deposit);
    setEditDepositAmount(deposit.amount.toString().replace(".", ","));
    const parsed = parseDepositDate(deposit.date);
    setEditDepositDate(parsed?.date || new Date());
    setEditDepositModalVisible(true);
  };

  const handleEditDepositSave = () => {
    const amount = parseFloat(editDepositAmount.replace(",", "."));
    if (!isNaN(amount) && amount > 0 && goal && editingDeposit) {
      updateGoalDeposit(goal.id, editingDeposit.id, amount, editDepositDate);
      setEditDepositModalVisible(false);
      setEditingDeposit(null);
      setEditDepositAmount("");
    }
  };

  const handleEditDepositCancel = () => {
    setEditDepositModalVisible(false);
    setEditingDeposit(null);
    setEditDepositAmount("");
  };

  const handleDeleteDeposit = (depositId: string) => {
    if (goal) {
      deleteGoalDeposit(goal.id, depositId);
    }
  };

  const onDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
    }
  };

  const onEditDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowEditDatePicker(false);
    }
    if (date) {
      setEditDepositDate(date);
    }
  };

  const formatDisplayDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  if (!goal) {
    return (
      <View style={styles.container}>
        <Text>Goal not found</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.5)"]}
        locations={[0, 0.3, 1]}
        style={styles.fadeOverlay}
        pointerEvents="none"
      />
      <View style={styles.modalContentWrapper}>
        <LinearGradient
          colors={["#2A3AE6", "#171F80"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}
        >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Goals</Text>
            <Text style={styles.headerSubtitle}>bleib dran!</Text>
          </View>
          <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Feather name="x" size={24} color="#000000" />
          </Pressable>
        </View>

        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <View style={styles.goalLeft}>
              <Text style={styles.goalIcon}>{goal.icon}</Text>
              <View>
                <View style={styles.goalNameRow}>
                  <Text style={styles.goalName}>{goal.name}</Text>
                  <Pressable onPress={() => { setTempName(goal.name); setEditModalVisible(true); }}>
                    <Feather name="edit-2" size={14} color="#7340FE" style={styles.editIcon} />
                  </Pressable>
                </View>
                <Text style={styles.goalProgress}>
                  € {formatCurrency(goal.current)} / € {formatCurrency(goal.target)}
                </Text>
              </View>
            </View>
            <Text style={styles.goalPercentage}>{percentage.toFixed(2).replace(".", ",")}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${Math.min(percentage, 100)}%` }]} />
          </View>
          <View style={styles.goalFooter}>
            <Text style={styles.remainingLabel}>Übrig</Text>
            <Text style={styles.remainingValue}>€ {formatCurrency(Math.max(0, remaining))}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 180 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.swipeHint}>Lang drücken zum Löschen, tippen zum Bearbeiten</Text>
        {Object.entries(groupedTransactions).map(([month, transactions]) => (
          <View key={month} style={styles.monthSection}>
            <Text style={styles.monthTitle}>{month}</Text>
            <View style={styles.transactionsList}>
              {transactions.map((transaction) => (
                <SwipeableDeposit
                  key={transaction.id}
                  deposit={transaction}
                  goalIcon={goal.icon}
                  onDelete={() => handleDeleteDeposit(transaction.id)}
                  onEdit={() => handleEditDeposit(transaction)}
                />
              ))}
            </View>
          </View>
        ))}
        {Object.keys(groupedTransactions).length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Noch keine {depositTitle}en</Text>
          </View>
        ) : null}
      </ScrollView>

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + 100 }]}
        onPress={() => setDepositModalVisible(true)}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="none"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setEditModalVisible(false)} />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Goal bearbeiten</Text>

            <Text style={styles.modalLabel}>Name</Text>
            <TextInput
              style={styles.modalInput}
              value={tempName}
              onChangeText={setTempName}
              placeholder="Goal Name"
              placeholderTextColor="#9CA3AF"
            />

            <Pressable style={styles.modalSaveButton} onPress={handleEditSave}>
              <Text style={styles.modalSaveButtonText}>Speichern</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={depositModalVisible}
        transparent
        animationType="none"
        onRequestClose={handleDepositCancel}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={handleDepositCancel} />
          <ScrollView 
            style={[styles.modalContent, { maxHeight: '80%' }]}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{depositTitle}</Text>

            <Text style={styles.modalLabel}>Betrag</Text>
            <View style={styles.currencyInputContainer}>
              <Text style={styles.currencyPrefix}>€</Text>
              <TextInput
                style={styles.currencyInput}
                value={depositAmount}
                onChangeText={setDepositAmount}
                placeholder="0,00"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
              />
            </View>

            <Text style={styles.modalLabel}>Datum</Text>
            <Pressable
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Feather name="calendar" size={20} color="#7340FE" />
              <Text style={styles.datePickerText}>{formatDisplayDate(selectedDate)}</Text>
            </Pressable>

            {showDatePicker ? (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display="spinner"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                  locale="de-DE"
                  textColor="#000000"
                  themeVariant="light"
                />
                <Pressable
                  style={styles.datePickerDoneButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.datePickerDoneText}>Fertig</Text>
                </Pressable>
              </View>
            ) : null}

            <Pressable style={styles.modalSaveButton} onPress={handleDepositSave}>
              <Text style={styles.modalSaveButtonText}>Hinzufügen</Text>
            </Pressable>
            
            <Pressable style={styles.modalCancelButton} onPress={handleDepositCancel}>
              <Text style={styles.modalCancelButtonText}>Abbrechen</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={editDepositModalVisible}
        transparent
        animationType="none"
        onRequestClose={handleEditDepositCancel}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={handleEditDepositCancel} />
          <ScrollView 
            style={[styles.modalContent, { maxHeight: '80%' }]}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{depositTitle} bearbeiten</Text>

            <Text style={styles.modalLabel}>Betrag</Text>
            <View style={styles.currencyInputContainer}>
              <Text style={styles.currencyPrefix}>€</Text>
              <TextInput
                style={styles.currencyInput}
                value={editDepositAmount}
                onChangeText={setEditDepositAmount}
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
              <Text style={styles.datePickerText}>{formatDisplayDate(editDepositDate)}</Text>
            </Pressable>

            {showEditDatePicker ? (
              <View style={styles.datePickerContainer}>
                <DateTimePicker
                  value={editDepositDate}
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

            <Pressable style={styles.modalSaveButton} onPress={handleEditDepositSave}>
              <Text style={styles.modalSaveButtonText}>Speichern</Text>
            </Pressable>
            
            <Pressable style={styles.modalCancelButton} onPress={handleEditDepositCancel}>
              <Text style={styles.modalCancelButtonText}>Abbrechen</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  fadeOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  modalContentWrapper: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  goalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  goalLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  goalIcon: {
    fontSize: 32,
  },
  goalNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  goalName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  editIcon: {
    marginLeft: 2,
  },
  goalProgress: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  goalPercentage: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2E47F9",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#AFAFAF",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "rgba(42, 58, 230, 0.69)",
    borderRadius: 4,
  },
  goalFooter: {
    marginTop: 12,
  },
  remainingLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  remainingValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2E47F9",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  swipeHint: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 16,
  },
  monthSection: {
    marginBottom: 24,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  transactionsList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
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
  deleteButtonInner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  transactionIcon: {
    fontSize: 28,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  transactionDate: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#30B71E",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#7340FE",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#000000",
    marginBottom: 24,
    outlineStyle: "none",
  } as any,
  currencyInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginRight: 8,
  },
  currencyInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 18,
    color: "#000000",
    outlineStyle: "none",
  } as any,
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    gap: 12,
  },
  datePickerText: {
    fontSize: 16,
    color: "#000000",
  },
  datePickerContainer: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  datePickerDoneButton: {
    alignItems: "center",
    paddingVertical: 12,
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
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  modalSaveButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalCancelButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
  },
  modalCancelButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
  },
});
