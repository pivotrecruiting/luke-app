import React, { useRef, useCallback } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Feather } from "@expo/vector-icons";
import type { Transaction } from "@/context/app/types";
import { styles } from "@/screens/styles/home-screen.styles";

type SwipeableTransactionItemPropsT = {
  transaction: Transaction;
  formatCurrency: (amount: number) => string;
  onEdit: () => void;
  onDelete: () => void;
  onSwipeOpen: (id: string) => void;
};

/**
 * Renders a swipeable transaction row with swipe-left-to-delete.
 */
export const SwipeableTransactionItem = React.forwardRef<
  Swipeable,
  SwipeableTransactionItemPropsT
>(function SwipeableTransactionItem(
  { transaction, formatCurrency, onEdit, onDelete, onSwipeOpen },
  ref,
) {
  const internalRef = useRef<Swipeable | null>(null);
  const justSwipedRef = useRef(false);

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
      "Transaktion löschen",
      `Möchtest du diese Transaktion "${transaction.name}" über ${formatCurrency(transaction.amount)} wirklich löschen?`,
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
  }, [formatCurrency, onDelete, transaction.amount, transaction.name]);

  const handleSwipeWillOpen = useCallback((direction: "left" | "right") => {
    if (direction === "right") {
      justSwipedRef.current = true;
    }
  }, []);

  const handleSwipeOpen = useCallback(
    (direction: "left" | "right") => {
      if (direction === "right") {
        onSwipeOpen(transaction.id);
        setTimeout(() => {
          justSwipedRef.current = false;
        }, 400);
      }
    },
    [onSwipeOpen, transaction.id],
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
      >
        <Pressable
          style={styles.transactionItem}
          onPress={handleRowPress}
          onLongPress={() => internalRef.current?.openRight()}
        >
          <View style={styles.transactionIconContainer}>
            <Feather
              name={transaction.icon as any}
              size={20}
              color="#7B8CDE"
            />
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionName}>{transaction.name}</Text>
            <Text style={styles.transactionCategory}>
              {transaction.category}
            </Text>
            <Text style={styles.transactionDate}>{transaction.date}</Text>
          </View>
          <Text
            style={[
              styles.transactionAmount,
              transaction.amount >= 0 && styles.transactionAmountIncome,
            ]}
          >
            {formatCurrency(transaction.amount)}
          </Text>
        </Pressable>
      </Swipeable>
    </View>
  );
});
