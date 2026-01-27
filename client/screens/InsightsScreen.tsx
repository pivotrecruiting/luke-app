import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Spacing } from "@/constants/theme";
import { useInsightsScreen } from "@/features/insights/hooks/use-insights-screen";
import { InsightsHeader } from "@/features/insights/components/insights-header";
import { ExpensesTab } from "@/features/insights/components/expenses-tab";
import { IncomeTab } from "@/features/insights/components/income-tab";
import { IncomeModal } from "@/features/insights/components/income-modal";
import { ExpenseModal } from "@/features/insights/components/expense-modal";
import { styles } from "./styles/insights-screen.styles";

export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { appData, state, derived, actions, refs } = useInsightsScreen();

  const topInset = insets.top + Spacing.lg;
  const bottomInset = insets.bottom + Spacing.lg;

  return (
    <View style={styles.container}>
      <InsightsHeader
        topInset={topInset}
        activeTab={state.activeTab}
        onChangeTab={actions.setActiveTab}
      />

      {state.activeTab === "ausgaben" ? (
        <ExpensesTab
          scrollViewRef={refs.scrollViewRef}
          bottomInset={insets.bottom}
          activeFilter={state.activeFilter}
          onChangeFilter={actions.setActiveFilter}
          selectedTimeFilter={state.selectedTimeFilter}
          onSelectTimeFilter={actions.setSelectedTimeFilter}
          categories={derived.filteredCategories}
          totalCategoryExpenses={derived.totalCategoryExpenses}
          selectedCategory={state.selectedCategory}
          onSelectCategory={actions.setSelectedCategory}
          onToggleCategory={actions.handleCategoryPress}
          monthlyTrendData={derived.filteredMonthlyTrendData}
          selectedTrendMonth={state.selectedTrendMonth}
          onSelectTrendMonth={actions.setSelectedTrendMonth}
          totalIncome={derived.filteredComparisonTotals.income}
          totalExpenses={derived.filteredComparisonTotals.expenses}
        />
      ) : (
        <IncomeTab
          bottomInset={insets.bottom}
          totalIncome={appData.totalIncome}
          incomeEntries={appData.incomeEntries}
          deleteConfirmId={state.deleteConfirmId}
          onAddIncome={actions.openAddIncomeModal}
          onEditIncome={actions.openEditIncomeModal}
          onRequestDelete={actions.setDeleteConfirmId}
          onCancelDelete={() => actions.setDeleteConfirmId(null)}
          onConfirmDelete={actions.handleDeleteIncome}
          getIconForIncomeType={actions.getIconForIncomeType}
        />
      )}

      <IncomeModal
        visible={state.incomeModalVisible}
        bottomInset={bottomInset}
        editingIncomeId={state.editingIncomeId}
        selectedIncomeType={state.selectedIncomeType}
        customIncomeType={state.customIncomeType}
        incomeAmount={state.incomeAmount}
        onClose={() => actions.setIncomeModalVisible(false)}
        onSelectIncomeType={actions.setSelectedIncomeType}
        onChangeCustomIncomeType={actions.setCustomIncomeType}
        onChangeIncomeAmount={actions.setIncomeAmount}
        onSave={actions.handleSaveIncome}
      />

      <ExpenseModal
        visible={state.expenseModalVisible}
        bottomInset={bottomInset}
        editingExpenseId={state.editingExpenseId}
        selectedExpenseType={state.selectedExpenseType}
        customExpenseType={state.customExpenseType}
        expenseAmount={state.expenseAmount}
        onClose={() => actions.setExpenseModalVisible(false)}
        onSelectExpenseType={actions.setSelectedExpenseType}
        onChangeCustomExpenseType={actions.setCustomExpenseType}
        onChangeExpenseAmount={actions.setExpenseAmount}
        onSave={actions.handleSaveExpense}
      />
    </View>
  );
}
