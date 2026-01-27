import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Spacing } from "@/constants/theme";
import { useGoalsScreen } from "@/features/goals/hooks/use-goals-screen";
import { GoalsHeader } from "@/features/goals/components/goals-header";
import { LevelCard } from "@/features/goals/components/level-card";
import { GoalItem } from "@/features/goals/components/goal-item";
import { BudgetItem } from "@/features/goals/components/budget-item";
import { CreateGoalModal } from "@/features/goals/components/create-goal-modal";
import { CreateBudgetModal } from "@/features/goals/components/create-budget-modal";
import { styles } from "./styles/goals-screen.styles";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

export default function GoalsScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data, state, derived, actions, refs } = useGoalsScreen();

  return (
    <View style={styles.container}>
      <GoalsHeader
        topInset={insets.top + Spacing.lg}
        successToast={state.successToast}
      />

      <ScrollView
        ref={refs.scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LevelCard
          onPress={(level) => {
            if (level?.id) {
              navigation.navigate("LevelUp", { levelId: level.id });
              return;
            }
            navigation.navigate("LevelUp", {});
          }}
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Goals</Text>
          <Pressable
            style={styles.addButton}
            onPress={actions.openCreateGoalModal}
          >
            <Feather name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {data.goals.map((goal) => (
          <GoalItem
            key={goal.id}
            goal={goal}
            onPress={() =>
              navigation.navigate("GoalDetail", { goalId: goal.id })
            }
          />
        ))}

        <View style={[styles.sectionHeader, { marginTop: 24 }]}>
          <Text style={styles.sectionTitle}>Budgets</Text>
          <Pressable style={styles.addButton} onPress={actions.openBudgetModal}>
            <Feather name="plus" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {data.budgets.map((budget) => (
          <BudgetItem
            key={budget.id}
            budget={budget}
            onPress={() =>
              navigation.navigate("BudgetDetail", { budgetId: budget.id })
            }
          />
        ))}
      </ScrollView>

      <CreateGoalModal
        visible={state.createModalVisible}
        bottomInset={insets.bottom}
        goalName={state.goalName}
        goalAmount={state.goalAmount}
        monthlyContribution={state.monthlyContribution}
        selectedEmoji={state.selectedEmoji}
        showEmojiPicker={state.showEmojiPicker}
        monthsToGoal={derived.monthsToGoal}
        onChangeName={actions.setGoalName}
        onChangeAmount={actions.setGoalAmount}
        onChangeMonthlyContribution={actions.setMonthlyContribution}
        onToggleEmojiPicker={actions.toggleEmojiPicker}
        onSelectEmoji={actions.selectEmoji}
        onCancel={actions.resetAndCloseGoalModal}
        onCreate={actions.handleCreateGoal}
      />

      <CreateBudgetModal
        visible={state.budgetModalVisible}
        bottomInset={insets.bottom}
        selectedCategory={state.selectedCategory}
        budgetLimit={state.budgetLimit}
        onSelectCategory={(value) => actions.setSelectedCategory(value)}
        onChangeBudgetLimit={actions.setBudgetLimit}
        onCancel={actions.resetAndCloseBudgetModal}
        onCreate={actions.handleCreateBudget}
      />
    </View>
  );
}
