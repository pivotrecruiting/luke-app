import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Spacing } from "@/constants/theme";

const MOCK_DATA = {
  level: {
    current: 1,
    name: "Sparfuchs",
    xp: 2450,
    xpToNextLevel: 550,
    nextLevel: 2,
  },
  goals: [
    {
      id: "1",
      name: "Vespa 2026",
      icon: "🛵",
      current: 924.73,
      target: 5200,
      remaining: 4275.27,
    },
    {
      id: "2",
      name: "Klarna abbezahlen",
      icon: "💳",
      current: 260.67,
      target: 443.12,
      remaining: 182.45,
    },
  ],
  budgets: [
    {
      id: "1",
      name: "Lebensmittel",
      icon: "shopping-cart",
      iconColor: "#F59E0B",
      current: 92.40,
      limit: 400,
    },
    {
      id: "2",
      name: "Shopping",
      icon: "shopping-bag",
      iconColor: "#8B5CF6",
      current: 40.37,
      limit: 200,
    },
  ],
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

function GoalItem({ goal, onPress }: { goal: typeof MOCK_DATA.goals[0]; onPress: () => void }) {
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

function BudgetItem({ budget }: { budget: typeof MOCK_DATA.budgets[0] }) {
  const percentage = (budget.current / budget.limit) * 100;

  return (
    <View style={styles.budgetItem}>
      <View style={styles.budgetHeader}>
        <View style={styles.budgetLeft}>
          <View style={[styles.budgetIconContainer, { backgroundColor: `${budget.iconColor}20` }]}>
            <Feather name={budget.icon as any} size={20} color={budget.iconColor} />
          </View>
          <View>
            <Text style={styles.budgetName}>{budget.name}</Text>
            <Text style={styles.budgetProgress}>
              € {formatCurrency(budget.current)} / € {budget.limit}
            </Text>
          </View>
        </View>
        <Text style={styles.budgetLimit}>€ {budget.limit}</Text>
      </View>
      <View style={styles.budgetProgressBarContainer}>
        <View style={[styles.budgetProgressBar, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
}

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleGoalPress = (goal: typeof MOCK_DATA.goals[0]) => {
    navigation.navigate("GoalDetail", { goal });
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
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LevelCard />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Goals</Text>
          <Pressable style={styles.addButton}>
            <Feather name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {MOCK_DATA.goals.map((goal) => (
          <GoalItem key={goal.id} goal={goal} onPress={() => handleGoalPress(goal)} />
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Budgets</Text>
          <Pressable style={styles.addButton}>
            <Feather name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {MOCK_DATA.budgets.map((budget) => (
          <BudgetItem key={budget.id} budget={budget} />
        ))}
      </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    marginTop: -10,
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
});
