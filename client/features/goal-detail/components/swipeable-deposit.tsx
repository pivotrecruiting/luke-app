import React, { useRef, useCallback } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { getCurrencySymbol } from "@/utils/currency-format";
import { styles } from "@/screens/styles/goal-detail-screen.styles";
import type { GoalDeposit } from "@/context/app/types";
import { formatCurrency } from "../utils/format";

type SwipeableDepositPropsT = {
  deposit: GoalDeposit;
  goalIcon: string;
  onDelete: () => void;
  onEdit: () => void;
  onSwipeOpen: (id: string) => void;
};

/**
 * Renders a swipeable deposit row with swipe-left-to-delete.
 * Uses Swipeable from react-native-gesture-handler for native swipe gesture.
 */
export const SwipeableDeposit = React.forwardRef<
  Swipeable,
  SwipeableDepositPropsT
>(function SwipeableDeposit(
  { deposit, goalIcon, onDelete, onEdit, onSwipeOpen },
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
      "Eintrag löschen",
      `Möchtest du diesen Eintrag über ${currencySymbol} ${formatCurrency(deposit.amount, currency)} wirklich löschen?`,
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
  }, [currency, currencySymbol, deposit.amount, onDelete]);

  const handleSwipeWillOpen = useCallback((direction: "left" | "right") => {
    if (direction === "right") {
      justSwipedRef.current = true;
    }
  }, []);

  const handleSwipeOpen = useCallback(
    (direction: "left" | "right") => {
      if (direction === "right") {
        onSwipeOpen(deposit.id);
        setTimeout(() => {
          justSwipedRef.current = false;
        }, 400);
      }
    },
    [deposit.id, onSwipeOpen],
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
    <View style={styles.depositItemWrapper}>
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
          <Text style={styles.transactionIcon}>{goalIcon}</Text>
          <View>
            <Text style={styles.transactionType}>{deposit.type}</Text>
            <Text style={styles.transactionDate}>{deposit.date}</Text>
          </View>
        </View>
        <Text style={styles.transactionAmount}>
          {currencySymbol} {formatCurrency(deposit.amount, currency)}
        </Text>
      </Pressable>
    </Swipeable>
    </View>
  );
});
