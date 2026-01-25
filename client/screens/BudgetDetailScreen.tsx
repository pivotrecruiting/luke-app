import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Spacing } from "@/constants/theme";
import { useBudgetDetailScreen } from "@/features/budget-detail/hooks/use-budget-detail-screen";
import { BudgetDetailHeader } from "@/features/budget-detail/components/budget-detail-header";
import { BudgetSummaryCard } from "@/features/budget-detail/components/budget-summary-card";
import { TransactionsSection } from "@/features/budget-detail/components/transactions-section";
import { EditExpenseModal } from "@/features/budget-detail/components/edit-expense-modal";
import { EditBudgetModal } from "@/features/budget-detail/components/edit-budget-modal";
import { styles } from "./styles/budget-detail-screen.styles";

export default function BudgetDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { budgetId } = route.params as { budgetId: string };

  const { budget, groupedExpenses, derived, state, actions } =
    useBudgetDetailScreen({
      budgetId,
      onNavigateBack: () => navigation.goBack(),
    });

  if (!budget) {
    return (
      <View style={styles.container}>
        <Text>Budget nicht gefunden</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BudgetDetailHeader
        topInset={insets.top + Spacing.md}
        title={budget.name}
        onBack={() => navigation.goBack()}
        onEditBudget={actions.openEditBudgetModal}
        onDeleteBudget={actions.handleDeleteBudget}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <BudgetSummaryCard
          name={budget.name}
          icon={budget.icon}
          iconColor={budget.iconColor}
          current={budget.current}
          limit={budget.limit}
          remaining={derived.remainingAmount}
          isOverBudget={derived.isOverBudget}
          displayPercentage={derived.displayPercentage}
        />

        <TransactionsSection
          groupedExpenses={groupedExpenses}
          budgetIcon={budget.icon}
          activeSwipeId={state.activeSwipeId}
          onSwipeOpen={actions.setActiveSwipeId}
          onEditExpense={actions.handleEditExpense}
          onDeleteExpense={actions.handleDeleteExpense}
        />
      </ScrollView>

      <EditExpenseModal
        visible={state.editModalVisible}
        bottomInset={insets.bottom}
        editExpenseName={state.editExpenseName}
        editExpenseAmount={state.editExpenseAmount}
        editExpenseDate={state.editExpenseDate}
        showDatePicker={state.showEditDatePicker}
        onChangeName={actions.setEditExpenseName}
        onChangeAmount={actions.setEditExpenseAmount}
        onOpenDatePicker={() => actions.setShowEditDatePicker(true)}
        onCloseDatePicker={() => actions.setShowEditDatePicker(false)}
        onDateChange={actions.onEditDateChange}
        onSave={actions.handleEditExpenseSave}
        onCancel={actions.handleEditExpenseCancel}
      />

      <EditBudgetModal
        visible={state.editBudgetModalVisible}
        bottomInset={insets.bottom}
        budgetLimit={state.editBudgetLimit}
        onChangeLimit={actions.setEditBudgetLimit}
        onSave={actions.handleEditBudgetSave}
        onCancel={actions.handleEditBudgetCancel}
      />
    </View>
  );
}
