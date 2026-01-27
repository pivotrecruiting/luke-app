import { Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { styles } from "@/screens/styles/budget-detail-screen.styles";
import type { BudgetExpense } from "@/context/app/types";
import type { GroupedExpensesT } from "../types/budget-detail-types";
import { SwipeableExpense } from "./swipeable-expense";

type TransactionsSectionPropsT = {
  groupedExpenses: GroupedExpensesT;
  budgetIcon: string;
  activeSwipeId: string;
  onSwipeOpen: (id: string) => void;
  onEditExpense: (expense: BudgetExpense) => void;
  onDeleteExpense: (expenseId: string) => void;
};

/**
 * Renders the transactions section with grouped expense lists.
 */
export const TransactionsSection = ({
  groupedExpenses,
  budgetIcon,
  activeSwipeId,
  onSwipeOpen,
  onEditExpense,
  onDeleteExpense,
}: TransactionsSectionPropsT) => {
  const hasExpenses = Object.keys(groupedExpenses).length > 0;

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Transaktionen</Text>
        <Text style={styles.swipeHint}>
          Lang drücken zum Löschen, tippen zum Bearbeiten
        </Text>
      </View>

      {!hasExpenses ? (
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
                  budgetIcon={budgetIcon}
                  onDelete={() => onDeleteExpense(expense.id)}
                  onEdit={() => onEditExpense(expense)}
                  isActive={activeSwipeId === expense.id}
                  onSwipeOpen={onSwipeOpen}
                />
              ))}
            </View>
          </View>
        ))
      )}
    </>
  );
};
