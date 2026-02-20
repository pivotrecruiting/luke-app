import React, { useRef, useCallback } from "react";
import { Alert, View } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Feather } from "@expo/vector-icons";
import type { Transaction } from "@/context/app/types";
import { TransactionItem } from "@/components/ui/transaction-item";
import { styles } from "@/screens/styles/home-screen.styles";

type SwipeableTransactionItemPropsT = {
  transaction: Transaction;
  formatCurrency: (amount: number) => string;
  onEdit: () => void;
  onDelete: () => void;
  onSwipeOpen: (id: string) => void;
  /** Card: standalone with shadow; flat: inside a parent card with divider. */
  variant?: "card" | "flat";
  showDivider?: boolean;
};

/**
 * Renders a swipeable transaction row with swipe-left-to-delete.
 */
export const SwipeableTransactionItem = React.forwardRef<
  Swipeable,
  SwipeableTransactionItemPropsT
>(function SwipeableTransactionItem(
  {
    transaction,
    formatCurrency,
    onEdit,
    onDelete,
    onSwipeOpen,
    variant = "card",
    showDivider = false,
  },
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
    <View
      style={[
        styles.transactionItemWrapper,
        variant === "flat" && styles.transactionItemWrapperFlat,
      ]}
    >
      <Swipeable
        ref={setRef}
        renderRightActions={renderRightActions}
        onSwipeableWillOpen={handleSwipeWillOpen}
        onSwipeableOpen={(direction) => handleSwipeOpen(direction)}
        rightThreshold={40}
        friction={2}
        containerStyle={variant === "flat" ? { overflow: "hidden" } : undefined}
      >
        <TransactionItem
          icon={
            <Feather
              name={transaction.icon as React.ComponentProps<
                typeof Feather
              >["name"]}
              size={20}
              color="#7B8CDE"
            />
          }
          title={transaction.name}
          subtitle={transaction.category}
          date={transaction.date}
          amountFormatted={formatCurrency(transaction.amount)}
          isIncome={transaction.amount >= 0}
          variant={variant}
          showDivider={showDivider}
          onPress={handleRowPress}
          onLongPress={() => internalRef.current?.openRight()}
        />
      </Swipeable>
    </View>
  );
});
