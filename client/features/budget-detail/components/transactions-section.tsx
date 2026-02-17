import { useRef, useCallback } from "react";
import { Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Swipeable from "react-native-gesture-handler/Swipeable";
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
 * Manages swipeable refs so only one row is open at a time.
 */
export const TransactionsSection = ({
  groupedExpenses,
  budgetIcon,
  onSwipeOpen,
  onEditExpense,
  onDeleteExpense,
}: TransactionsSectionPropsT) => {
  const swipeableRefs = useRef<Record<string, Swipeable | null>>({});
  const hasExpenses = Object.keys(groupedExpenses).length > 0;

  const handleSwipeOpen = useCallback(
    (id: string) => {
      Object.entries(swipeableRefs.current).forEach(([expenseId, ref]) => {
        if (expenseId !== id && ref?.close) {
          ref.close();
        }
      });
      onSwipeOpen(id);
    },
    [onSwipeOpen],
  );

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Transaktionen</Text>
        <Text style={styles.swipeHint}>
          Wischen zum Löschen, tippen zum Bearbeiten
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
                  ref={(r) => {
                    if (r) {
                      swipeableRefs.current[expense.id] = r;
                    } else {
                      delete swipeableRefs.current[expense.id];
                    }
                  }}
                  expense={expense}
                  budgetIcon={budgetIcon}
                  onDelete={() => onDeleteExpense(expense.id)}
                  onEdit={() => onEditExpense(expense)}
                  onSwipeOpen={handleSwipeOpen}
                />
              ))}
            </View>
          </View>
        ))
      )}
    </>
  );
};
