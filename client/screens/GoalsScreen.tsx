import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
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
import { styles } from "./styles/goals-screen.styles";

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
