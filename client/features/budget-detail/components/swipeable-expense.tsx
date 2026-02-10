import { Alert, Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { getCurrencySymbol } from "@/utils/currency-format";
import { styles } from "@/screens/styles/budget-detail-screen.styles";
import type { BudgetExpense } from "@/context/app/types";
import { formatCurrency } from "../utils/format";

type SwipeableExpensePropsT = {
  expense: BudgetExpense;
  budgetIcon: string;
  onDelete: () => void;
  onEdit: () => void;
  isActive: boolean;
  onSwipeOpen: (id: string) => void;
};

/**
 * Renders a swipeable expense row with delete confirmation.
 */
export const SwipeableExpense = ({
  expense,
  budgetIcon,
  onDelete,
  onEdit,
  isActive,
  onSwipeOpen,
}: SwipeableExpensePropsT) => {
  const { currency } = useApp();
  const currencySymbol = getCurrencySymbol(currency);
  const handleSwipeOpen = () => {
    onSwipeOpen(expense.id);
  };

  const handleCloseSwipe = () => {
    onSwipeOpen("");
  };

  const handleDelete = () => {
    Alert.alert(
      "Ausgabe löschen",
      `Möchtest du diese Ausgabe über ${currencySymbol} ${formatCurrency(expense.amount, currency)} wirklich löschen?`,
      [
        {
          text: "Abbrechen",
          style: "cancel",
          onPress: handleCloseSwipe,
        },
        {
          text: "Löschen",
          style: "destructive",
          onPress: () => onDelete(),
        },
      ],
    );
  };

  return (
    <View style={styles.swipeableContainer}>
      {isActive ? (
        <Pressable style={styles.deleteButton} onPress={handleDelete}>
          <Feather name="trash-2" size={20} color="#FFFFFF" />
        </Pressable>
      ) : null}
      <Pressable
        style={[styles.transactionItem, isActive && { marginRight: 80 }]}
        onPress={() => {
          if (isActive) {
            handleCloseSwipe();
          } else {
            onEdit();
          }
        }}
        onLongPress={handleSwipeOpen}
      >
        <View style={styles.transactionLeft}>
          <View style={styles.transactionIconContainer}>
            <Feather name={budgetIcon as any} size={18} color="#6B7280" />
          </View>
          <View>
            <Text style={styles.transactionName}>{expense.name}</Text>
            <Text style={styles.transactionDate}>{expense.date}</Text>
          </View>
        </View>
        <Text style={styles.transactionAmountNegative}>
          -{currencySymbol} {formatCurrency(expense.amount, currency)}
        </Text>
      </Pressable>
    </View>
  );
};
