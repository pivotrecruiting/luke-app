import React, { useRef, useCallback } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { Feather } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { getCurrencySymbol } from "@/utils/currency-format";
import { styles } from "@/screens/styles/insights-screen.styles";
import { formatCurrency } from "../utils/format";
import type { IncomeEntry } from "@/context/AppContext";

type SwipeableIncomeItemPropsT = {
  entry: IncomeEntry;
  getIconForIncomeType: (typeName: string) => string;
  onEdit: () => void;
  onDelete: () => void;
  onSwipeOpen: (id: string) => void;
};

/**
 * Renders a swipeable income row with swipe-left-to-delete.
 */
export const SwipeableIncomeItem = React.forwardRef<
  Swipeable,
  SwipeableIncomeItemPropsT
>(function SwipeableIncomeItem(
  { entry, getIconForIncomeType, onEdit, onDelete, onSwipeOpen },
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
      "Einnahme löschen",
      `Möchtest du diese Einnahme über ${currencySymbol} ${formatCurrency(entry.amount, currency)} wirklich löschen?`,
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
  }, [currency, currencySymbol, entry.amount, onDelete]);

  const handleSwipeWillOpen = useCallback((direction: "left" | "right") => {
    if (direction === "right") {
      justSwipedRef.current = true;
    }
  }, []);

  const handleSwipeOpen = useCallback(
    (direction: "left" | "right") => {
      if (direction === "right") {
        onSwipeOpen(entry.id);
        setTimeout(() => {
          justSwipedRef.current = false;
        }, 400);
      }
    },
    [entry.id, onSwipeOpen],
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
    <View style={styles.incomeItemWrapper}>
      <Swipeable
        ref={setRef}
        renderRightActions={renderRightActions}
        onSwipeableWillOpen={handleSwipeWillOpen}
        onSwipeableOpen={(direction) => handleSwipeOpen(direction)}
        rightThreshold={40}
        friction={2}
      >
        <Pressable
          style={styles.incomeItem}
        onPress={handleRowPress}
        onLongPress={() => internalRef.current?.openRight()}
      >
        <View style={styles.incomeLeft}>
          <View style={styles.incomeIconContainer}>
            <Feather
              name={getIconForIncomeType(entry.type) as any}
              size={20}
              color="#10B981"
            />
          </View>
          <View>
            <Text style={styles.incomeType}>{entry.type}</Text>
            <Text style={styles.incomeFrequency}>Monatlich</Text>
          </View>
        </View>
        <Text style={styles.incomeAmount}>
          {currencySymbol} {formatCurrency(entry.amount, currency)}
        </Text>
      </Pressable>
    </Swipeable>
    </View>
  );
});
