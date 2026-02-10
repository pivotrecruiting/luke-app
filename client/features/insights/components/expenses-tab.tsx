import { Pressable, ScrollView, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useApp } from "@/context/AppContext";
import { getCurrencySymbol } from "@/utils/currency-format";
import { styles } from "@/screens/styles/insights-screen.styles";
import { formatCurrency } from "../utils/format";
import type { ExpenseEntry } from "@/context/AppContext";

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
  deleteConfirmId,
  onAddExpense,
  onEditExpense,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  getIconForExpenseType,
}: ExpensesTabPropsT) => {
  const { currency } = useApp();
  const currencySymbol = getCurrencySymbol(currency);

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
            <Pressable
              style={styles.expenseItem}
              onPress={() => onEditExpense(entry)}
            >
              <View style={styles.expenseLeft}>
                <View style={styles.expenseIconContainer}>
                  <Feather
                    name={getIconForExpenseType(entry.type) as any}
                    size={20}
                    color="#EF4444"
                  />
                </View>
                <View>
                  <Text style={styles.expenseType}>{entry.type}</Text>
                  <Text style={styles.expenseFrequency}>Monatlich</Text>
                </View>
              </View>
              <View style={styles.expenseRight}>
                <Text style={styles.expenseAmount}>
                  {currencySymbol} {formatCurrency(entry.amount, currency)}
                </Text>
                <Pressable
                  onPress={() => onRequestDelete(entry.id)}
                  hitSlop={8}
                >
                  <Feather name="trash-2" size={18} color="#9CA3AF" />
                </Pressable>
              </View>
            </Pressable>

            {deleteConfirmId === entry.id && (
              <View style={styles.deleteConfirm}>
                <Text style={styles.deleteConfirmText}>Wirklich löschen?</Text>
                <View style={styles.deleteActions}>
                  <Pressable
                    style={styles.cancelDeleteBtn}
                    onPress={onCancelDelete}
                  >
                    <Text style={styles.cancelDeleteText}>Abbrechen</Text>
                  </Pressable>
                  <Pressable
                    style={styles.confirmDeleteBtn}
                    onPress={() => onConfirmDelete(entry.id)}
                  >
                    <Text style={styles.confirmDeleteText}>Löschen</Text>
                  </Pressable>
                </View>
              </View>
            )}
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
