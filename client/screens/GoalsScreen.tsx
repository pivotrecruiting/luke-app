import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Spacing } from "@/constants/theme";
import { useApp, Goal, Budget } from "@/context/AppContext";
import { BUDGET_CATEGORIES } from "@/constants/budgetCategories";

const MOCK_DATA = {
  level: {
    current: 1,
    name: "Sparfuchs",
    xp: 2450,
    xpToNextLevel: 550,
    nextLevel: 2,
  },
};

const formatCurrency = (value: number) => {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

function LevelCard() {
  const { level } = MOCK_DATA;
  const totalXpForLevel = level.xp + level.xpToNextLevel;
  const progress = level.xp / totalXpForLevel;

  return (
    <View style={styles.levelCard}>
      <View style={styles.levelHeader}>
        <View style={styles.levelLeft}>
          <Text style={styles.foxEmoji}>🦊</Text>
          <View>
            <Text style={styles.levelTitle}>Level {level.current}</Text>
            <Text style={styles.levelName}>{level.name}</Text>
          </View>
        </View>
        <Text style={styles.xpText}>{level.xp} XP</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      </View>
      <View style={styles.xpLabels}>
        <Text style={styles.xpLabel}>{level.xp} XP</Text>
        <Text style={styles.xpLabel}>{level.xpToNextLevel} XP bis Level {level.nextLevel}</Text>
      </View>
    </View>
  );
}

function GoalItem({ goal, onPress }: { goal: Goal; onPress: () => void }) {
  const percentage = (goal.current / goal.target) * 100;

  return (
    <Pressable style={styles.goalItem} onPress={onPress}>
      <View style={styles.goalHeader}>
        <View style={styles.goalLeft}>
          <Text style={styles.goalIcon}>{goal.icon}</Text>
          <View>
            <Text style={styles.goalName}>{goal.name}</Text>
            <Text style={styles.goalProgress}>
              € {formatCurrency(goal.current)} / € {formatCurrency(goal.target)}
            </Text>
          </View>
        </View>
        <Text style={styles.goalPercentage}>{percentage.toFixed(2).replace(".", ",")}%</Text>
      </View>
      <View style={styles.goalProgressBarContainer}>
        <View style={[styles.goalProgressBar, { width: `${percentage}%` }]} />
      </View>
      <View style={styles.goalFooter}>
        <View>
          <Text style={styles.goalRemainingLabel}>Übrig</Text>
          <Text style={styles.goalRemainingValue}>€ {formatCurrency(goal.remaining)}</Text>
        </View>
        <Pressable>
          <Feather name="more-vertical" size={20} color="#9CA3AF" />
        </Pressable>
      </View>
    </Pressable>
  );
}

function BudgetItem({ budget, onPress }: { budget: Budget; onPress: () => void }) {
  const percentage = (budget.current / budget.limit) * 100;
  const isOverBudget = budget.current > budget.limit;
  const displayPercentage = Math.min(percentage, 100);

  return (
    <Pressable style={styles.budgetItem} onPress={onPress}>
      <View style={styles.budgetHeader}>
        <View style={styles.budgetLeft}>
          <View style={[styles.budgetIconContainer, { backgroundColor: `${budget.iconColor}20` }]}>
            <Feather name={budget.icon as any} size={20} color={budget.iconColor} />
          </View>
          <View>
            <Text style={styles.budgetName}>{budget.name}</Text>
            <Text style={[styles.budgetProgress, isOverBudget && styles.budgetProgressOver]}>
              € {formatCurrency(budget.current)} / € {budget.limit}
            </Text>
          </View>
        </View>
        <View style={styles.budgetRight}>
          <Text style={[styles.budgetLimit, isOverBudget && styles.budgetLimitOver]}>€ {budget.limit}</Text>
          <Feather name="chevron-right" size={16} color="#9CA3AF" />
        </View>
      </View>
      <View style={styles.budgetProgressBarContainer}>
        <View style={[
          styles.budgetProgressBar, 
          { width: `${displayPercentage}%` },
          isOverBudget && styles.budgetProgressBarOver
        ]} />
      </View>
    </Pressable>
  );
}

const EMOJI_LIST = ["😀", "🛵", "💳", "🏠", "🚗", "✈️", "💻", "📱", "🎮", "👗", "💍", "🎓"];


export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { goals, budgets, addGoal, addBudget } = useApp();
  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
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

  const [successToast, setSuccessToast] = useState<"goal" | "budget" | null>(null);

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => {
        setSuccessToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  const handleGoalPress = (goalId: string) => {
    navigation.navigate("GoalDetail", { goalId });
  };

  const calculateMonths = () => {
    const amount = parseFloat(goalAmount.replace(",", ".")) || 0;
    const monthly = parseFloat(monthlyContribution.replace(",", ".")) || 0;
    if (monthly <= 0 || amount <= 0) return 0;
    return Math.ceil(amount / monthly);
  };

  const handleCreateGoal = () => {
    const amount = parseFloat(goalAmount.replace(",", ".")) || 0;
    if (!goalName || amount <= 0) return;

    addGoal(goalName, selectedEmoji, amount);
    setCreateModalVisible(false);
    setGoalName("");
    setGoalAmount("");
    setMonthlyContribution("");
    setSelectedEmoji("😀");
    setSuccessToast("goal");
  };

  const resetAndCloseModal = () => {
    setCreateModalVisible(false);
    setGoalName("");
    setGoalAmount("");
    setMonthlyContribution("");
    setSelectedEmoji("😀");
    setShowEmojiPicker(false);
  };

  const handleCreateBudget = () => {
    const limit = parseFloat(budgetLimit.replace(",", ".")) || 0;
    if (!selectedCategory || limit <= 0) return;

    const category = BUDGET_CATEGORIES.find((c) => c.id === selectedCategory);
    if (!category) return;

    addBudget(category.name, category.icon, category.color, limit);
    resetAndCloseBudgetModal();
    setSuccessToast("budget");
  };

  const resetAndCloseBudgetModal = () => {
    setBudgetModalVisible(false);
    setSelectedCategory(null);
    setBudgetLimit("");
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(42, 58, 230, 0.69)", "rgba(23, 32, 128, 0.69)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}
      >
        <Text style={styles.headerTitle}>Goals</Text>
        <Text style={styles.headerSubtitle}>bleib dran!</Text>
        {successToast ? (
          <View style={styles.toastContainer}>
            <View style={styles.successToast}>
              <View style={styles.checkCircle}>
                <Feather name="check" size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.successToastText}>
                {successToast === "goal" ? "Goal created!" : "Budget set!"}
              </Text>
            </View>
          </View>
        ) : null}
      </LinearGradient>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LevelCard />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Goals</Text>
          <Pressable style={styles.addButton} onPress={() => setCreateModalVisible(true)}>
            <Feather name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {goals.map((goal) => (
          <GoalItem key={goal.id} goal={goal} onPress={() => handleGoalPress(goal.id)} />
        ))}

        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Budgets</Text>
          <Pressable style={styles.addButton} onPress={() => setBudgetModalVisible(true)}>
            <Feather name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {budgets.map((budget) => (
          <BudgetItem 
            key={budget.id} 
            budget={budget} 
            onPress={() => navigation.navigate("BudgetDetail", { budgetId: budget.id })}
          />
        ))}
      </ScrollView>

      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={resetAndCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={resetAndCloseModal} />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Ziel erstellen</Text>

            <Text style={styles.modalLabel}>Name</Text>
            <View style={styles.nameInputRow}>
              <Pressable
                style={styles.emojiButton}
                onPress={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Text style={styles.emojiButtonText}>{selectedEmoji}</Text>
              </Pressable>
              <TextInput
                style={styles.nameInput}
                value={goalName}
                onChangeText={setGoalName}
                placeholder="z.B. neues IPhone"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {showEmojiPicker ? (
              <View style={styles.emojiPicker}>
                {EMOJI_LIST.map((emoji) => (
                  <Pressable
                    key={emoji}
                    style={styles.emojiOption}
                    onPress={() => {
                      setSelectedEmoji(emoji);
                      setShowEmojiPicker(false);
                    }}
                  >
                    <Text style={styles.emojiOptionText}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <Text style={styles.modalLabel}>Summe</Text>
            <TextInput
              style={styles.modalInput}
              value={goalAmount}
              onChangeText={setGoalAmount}
              placeholder="€ 1000,00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
            />

            <Text style={styles.modalLabel}>Monatlicher Beitrag</Text>
            <TextInput
              style={styles.modalInput}
              value={monthlyContribution}
              onChangeText={setMonthlyContribution}
              placeholder="€ 200,00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
            />

            <Text style={styles.calculationText}>
              Erreichbar in: <Text style={styles.calculationBold}>{calculateMonths()} Monaten</Text>
            </Text>

            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={resetAndCloseModal}>
                <Text style={styles.cancelButtonText}>abbrechen</Text>
              </Pressable>
              <Pressable style={styles.createButton} onPress={handleCreateGoal}>
                <Text style={styles.createButtonText}>Hinzufügen</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={budgetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={resetAndCloseBudgetModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={resetAndCloseBudgetModal} />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Budget erstellen</Text>

            <Text style={styles.categoryLabel}>Kategorie auswählen</Text>
            <View style={styles.categoryGrid}>
              {BUDGET_CATEGORIES.map((category) => {
                const isSelected = selectedCategory === category.id;
                return (
                  <Pressable
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      isSelected && styles.categoryItemSelected,
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <View
                      style={[
                        styles.categoryIconContainer,
                        { backgroundColor: "#FFFFFF" },
                      ]}
                    >
                      <Feather name={category.icon as any} size={24} color={category.color} />
                    </View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.modalLabel}>Limit</Text>
            <TextInput
              style={styles.modalInput}
              value={budgetLimit}
              onChangeText={setBudgetLimit}
              placeholder="€ 200,00"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
            />

            <View style={styles.modalButtons}>
              <Pressable style={styles.cancelButton} onPress={resetAndCloseBudgetModal}>
                <Text style={styles.cancelButtonText}>abbrechen</Text>
              </Pressable>
              <Pressable style={styles.createButton} onPress={handleCreateBudget}>
                <Text style={styles.createButtonText}>Hinzufügen</Text>
              </Pressable>
            </View>
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
  toastContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  successToast: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D9D9D9",
    borderRadius: 4,
    paddingHorizontal: 8,
    height: 36,
    gap: 6,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#962DFF",
    justifyContent: "center",
    alignItems: "center",
  },
  successToastText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#000000",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
  },
  levelCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  levelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  levelLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  foxEmoji: {
    fontSize: 36,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
  },
  levelName: {
    fontSize: 14,
    color: "#6B7280",
  },
  xpText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3B5BDB",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#3B5BDB",
    borderRadius: 4,
  },
  xpLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  xpLabel: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#3B5BDB",
    justifyContent: "center",
    alignItems: "center",
  },
  goalItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    fontSize: 28,
  },
  goalName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  goalProgress: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  goalPercentage: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E47F9",
  },
  goalProgressBarContainer: {
    height: 6,
    backgroundColor: "#AFAFAF",
    borderRadius: 3,
    overflow: "hidden",
  },
  goalProgressBar: {
    height: "100%",
    backgroundColor: "rgba(42, 58, 230, 0.69)",
    borderRadius: 3,
  },
  goalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 12,
  },
  goalRemainingLabel: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  goalRemainingValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#3B5BDB",
  },
  budgetItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  budgetLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  budgetIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  budgetName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  budgetProgress: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  budgetLimit: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3B5BDB",
  },
  budgetProgressBarContainer: {
    height: 6,
    backgroundColor: "#AFAFAF",
    borderRadius: 3,
    overflow: "hidden",
  },
  budgetProgressBar: {
    height: "100%",
    backgroundColor: "rgba(42, 58, 230, 0.69)",
    borderRadius: 3,
  },
  budgetProgressBarOver: {
    backgroundColor: "#EF4444",
  },
  budgetProgressOver: {
    color: "#EF4444",
  },
  budgetLimitOver: {
    color: "#EF4444",
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
  nameInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginBottom: 16,
  },
  emojiButton: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
  },
  emojiButtonText: {
    fontSize: 24,
  },
  nameInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#000000",
    outlineStyle: "none",
  } as any,
  emojiPicker: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    gap: 8,
  },
  emojiOption: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  emojiOptionText: {
    fontSize: 24,
  },
  modalInput: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#000000",
    marginBottom: 16,
    outlineStyle: "none",
  } as any,
  calculationText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
  },
  calculationBold: {
    fontWeight: "700",
    color: "#000000",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  cancelButton: {
    backgroundColor: "#9CA3AF",
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  createButton: {
    backgroundColor: "#7340FE",
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    gap: 8,
  },
  categoryItem: {
    width: "22%",
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 12,
  },
  categoryItemSelected: {
    backgroundColor: "#E0C6FD",
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryName: {
    fontSize: 10,
    color: "#374151",
    textAlign: "center",
  },
  budgetRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  budgetDetailModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  budgetDetailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  budgetDetailTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
  },
  budgetDetailSubtitle: {
    fontSize: 14,
    color: "#6B7280",
  },
  transactionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  transactionsList: {
    maxHeight: 300,
  },
  emptyTransactions: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyTransactionsText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 12,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  transactionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  transactionName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  transactionDate: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
  },
  transactionAmountNegative: {
    color: "#EF4444",
  },
  closeDetailButton: {
    backgroundColor: "#7340FE",
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  closeDetailButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
