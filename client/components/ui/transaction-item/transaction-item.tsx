import React from "react";
import { Pressable, Text, View } from "react-native";
import { styles } from "./transaction-item.styles";

export type TransactionItemPropsT = {
  icon: React.ReactNode;
  iconContainerStyle?: object;
  title: string;
  subtitle?: string;
  date: string;
  amountFormatted: string;
  isIncome?: boolean;
  showDivider?: boolean;
  /** Card variant: elevated shadow/bg for standalone items; flat for items inside a parent card. */
  variant?: "card" | "flat";
  onPress?: () => void;
  onLongPress?: () => void;
};

/**
 * Reusable transaction row displaying icon, title, date and amount.
 * Used in HomeScreen (with Swipeable wrapper) and VaultScreen.
 */
export const TransactionItem = ({
  icon,
  iconContainerStyle,
  title,
  subtitle,
  date,
  amountFormatted,
  isIncome = false,
  showDivider = false,
  variant = "flat",
  onPress,
  onLongPress,
}: TransactionItemPropsT) => {
  const rowStyles = [
    styles.row,
    showDivider && styles.rowWithDivider,
    variant === "card" && styles.rowCard,
    variant === "flat" && styles.rowFlat,
  ];
  const content = (
    <>
      <View style={[styles.iconContainer, iconContainerStyle]}>{icon}</View>
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
        <Text style={styles.date}>{date}</Text>
      </View>
      <Text
        style={[styles.amount, isIncome && styles.amountIncome]}
        numberOfLines={1}
      >
        {amountFormatted}
      </Text>
    </>
  );

  if (onPress || onLongPress) {
    return (
      <Pressable style={rowStyles} onPress={onPress} onLongPress={onLongPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={rowStyles}>{content}</View>;
};
