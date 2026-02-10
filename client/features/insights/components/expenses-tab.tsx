import { useRef, useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Swipeable from "react-native-gesture-handler/Swipeable";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useApp } from "@/context/AppContext";
import { getCurrencySymbol } from "@/utils/currency-format";
import { styles } from "@/screens/styles/insights-screen.styles";
import { formatCurrency } from "../utils/format";
import type { ExpenseEntry } from "@/context/AppContext";
import { SwipeableExpenseItem } from "./swipeable-expense-item";

type ExpensesTabPropsT = {
  bottomInset: number;
  totalFixedExpenses: number;
  expenseEntries: ExpenseEntry[];
  deleteConfirmId: string | null;
  onAddExpense: () => void;
  onEditExpense: (entry: ExpenseEntry) => void;
  onRequestDelete: (id: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (id: string) => void;
  getIconForExpenseType: (typeName: string) => string;
};

/**
 * Displays the expenses tab with summary, list of fix costs, and tips.
 */
export const ExpensesTab = ({
  bottomInset,
  totalFixedExpenses,
  expenseEntries,
  onAddExpense,
  onEditExpense,
  onConfirmDelete,
  getIconForExpenseType,
}: ExpensesTabPropsT) => {
  const { currency } = useApp();
  const currencySymbol = getCurrencySymbol(currency);
  const swipeableRefs = useRef<Record<string, Swipeable | null>>({});

  const handleSwipeOpen = useCallback((id: string) => {
    Object.entries(swipeableRefs.current).forEach(([entryId, ref]) => {
      if (entryId !== id && ref?.close) {
        ref.close();
      }
    });
  }, []);

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: bottomInset + 100 },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.expenseSummaryCard}>
        <View style={styles.expenseSummaryIcon}>
          <Feather name="trending-down" size={28} color="#EF4444" />
        </View>
        <View style={styles.expenseSummaryContent}>
          <Text style={styles.expenseSummaryLabel}>Monatliche Fixkosten</Text>
          <Text style={styles.expenseSummaryAmount}>
            {currencySymbol} {formatCurrency(totalFixedExpenses, currency)}
          </Text>
        </View>
        <Pressable style={styles.addExpenseButton} onPress={onAddExpense}>
          <Feather name="plus" size={20} color="#7340fd" />
        </Pressable>
      </View>

      <Text style={styles.expenseSectionTitle}>Fixkosten</Text>
      <Text style={styles.expenseSwipeHint}>
        Wischen zum Löschen, tippen zum Bearbeiten
      </Text>

      {expenseEntries.length === 0 ? (
        <View style={styles.expenseEmptyState}>
          <Feather name="inbox" size={48} color="#D1D5DB" />
          <Text style={styles.expenseEmptyText}>
            Noch keine Ausgaben hinzugefügt
          </Text>
          <Pressable style={styles.expenseEmptyButton} onPress={onAddExpense}>
            <Text style={styles.expenseEmptyButtonText}>
              Ausgabe hinzufügen
            </Text>
          </Pressable>
        </View>
      ) : (
        expenseEntries.map((entry, index) => (
          <Animated.View
            key={entry.id}
            entering={FadeInDown.delay(index * 50).duration(300)}
          >
            <SwipeableExpenseItem
              ref={(r) => {
                if (r) {
                  swipeableRefs.current[entry.id] = r;
                } else {
                  delete swipeableRefs.current[entry.id];
                }
              }}
              entry={entry}
              getIconForExpenseType={getIconForExpenseType}
              onEdit={() => onEditExpense(entry)}
              onDelete={() => onConfirmDelete(entry.id)}
              onSwipeOpen={handleSwipeOpen}
            />
          </Animated.View>
        ))
      )}

      <View style={styles.expenseTipCard}>
        <View style={styles.expenseTipHeader}>
          <Feather name="info" size={18} color="#EF4444" />
          <Text style={styles.expenseTipTitle}>Tipp</Text>
        </View>
        <Text style={styles.expenseTipText}>
          Füge alle regelmäßigen Fixkosten hinzu, um dein verfügbares Budget
          genauer zu berechnen.
        </Text>
      </View>
    </ScrollView>
  );
};
