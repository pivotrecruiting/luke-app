import React, { useRef, useCallback } from "react";
import { Alert, View } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { getCurrencySymbol } from "@/utils/currency-format";
import { TransactionItem } from "@/components/ui/transaction-item";
import { styles } from "@/screens/styles/budget-detail-screen.styles";
import type { BudgetExpense } from "@/context/app/types";
import { formatCurrency } from "../utils/format";

type SwipeableExpensePropsT = {
  expense: BudgetExpense;
  budgetIcon: string;
  onDelete: () => void;
  onEdit: () => void;
  onSwipeOpen: (id: string) => void;
  showDivider?: boolean;
};

/**
 * Renders a swipeable expense row with swipe-left-to-delete.
 * Uses reusable TransactionItem for consistent styling.
 */
export const SwipeableExpense = React.forwardRef<
  Swipeable,
  SwipeableExpensePropsT
>(function SwipeableExpense(
  { expense, budgetIcon, onDelete, onEdit, onSwipeOpen, showDivider = true },
  ref,
) {
  const internalRef = useRef<Swipeable | null>(null);
  const justSwipedRef = useRef(false);
  const { currency } = useApp();
  const currencySymbol = getCurrencySymbol(currency);

  const setRef = useCallback(
    (instance: Swipeable | null) => {
      internalRef.current = instance;
      if (typeof ref === "function") {
        ref(instance);
      } else if (ref) {
        (ref as React.MutableRefObject<Swipeable | null>).current = instance;
      }
    },
    [ref],
  );

  const handleDelete = useCallback(() => {
    Alert.alert(
      "Ausgabe löschen",
      `Möchtest du diese Ausgabe über ${currencySymbol} ${formatCurrency(expense.amount, currency)} wirklich löschen?`,
      [
        {
          text: "Abbrechen",
          style: "cancel",
          onPress: () => internalRef.current?.close(),
        },
        {
          text: "Löschen",
          style: "destructive",
          onPress: () => {
            internalRef.current?.close();
            onDelete();
          },
        },
      ],
    );
  }, [currency, currencySymbol, expense.amount, onDelete]);

  const handleSwipeWillOpen = useCallback((direction: "left" | "right") => {
    if (direction === "right") {
      justSwipedRef.current = true;
    }
  }, []);

  const handleSwipeOpen = useCallback(
    (direction: "left" | "right") => {
      if (direction === "right") {
        onSwipeOpen(expense.id);
        setTimeout(() => {
          justSwipedRef.current = false;
        }, 400);
      }
    },
    [expense.id, onSwipeOpen],
  );

  const handleRowPress = useCallback(() => {
    if (justSwipedRef.current) return;
    onEdit();
  }, [onEdit]);

  const renderRightActions = useCallback(
    () => (
      <RectButton
        style={styles.swipeableDeleteAction}
        onPress={handleDelete}
      >
        <Feather name="trash-2" size={20} color="#FFFFFF" />
      </RectButton>
    ),
    [handleDelete],
  );

  return (
    <View style={styles.transactionItemWrapper}>
      <Swipeable
        ref={setRef}
        renderRightActions={renderRightActions}
        onSwipeableWillOpen={handleSwipeWillOpen}
        onSwipeableOpen={(direction) => handleSwipeOpen(direction)}
        rightThreshold={40}
        friction={2}
        containerStyle={{ overflow: "hidden" }}
      >
        <TransactionItem
          icon={
            <Feather
              name={budgetIcon as React.ComponentProps<typeof Feather>["name"]}
              size={20}
              color="#6B7280"
            />
          }
          iconContainerStyle={styles.transactionIconContainerBudget}
          title={expense.name}
          date={expense.date}
          amountFormatted={`-${currencySymbol} ${formatCurrency(expense.amount, currency)}`}
          isIncome={false}
          showDivider={showDivider}
          variant="flat"
          onPress={handleRowPress}
          onLongPress={() => internalRef.current?.openRight()}
        />
      </Swipeable>
    </View>
  );
});
