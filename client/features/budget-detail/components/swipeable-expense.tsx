import React, { useRef, useCallback } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";
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
  onSwipeOpen: (id: string) => void;
};

/**
 * Renders a swipeable expense row with swipe-left-to-delete.
 * Uses Swipeable from react-native-gesture-handler for native swipe gesture.
 */
export const SwipeableExpense = React.forwardRef<
  Swipeable,
  SwipeableExpensePropsT
>(function SwipeableExpense(
  { expense, budgetIcon, onDelete, onEdit, onSwipeOpen },
  ref,
) {
  const internalRef = useRef<Swipeable | null>(null);
  const justSwipedRef = useRef(false);
  const { currency } = useApp();

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
  const currencySymbol = getCurrencySymbol(currency);

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
    <Swipeable
      ref={setRef}
      renderRightActions={renderRightActions}
      onSwipeableWillOpen={handleSwipeWillOpen}
      onSwipeableOpen={(direction) => handleSwipeOpen(direction)}
      rightThreshold={40}
      friction={2}
    >
      <Pressable
        style={styles.transactionItem}
        onPress={handleRowPress}
        onLongPress={() => internalRef.current?.openRight()}
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
    </Swipeable>
  );
});
