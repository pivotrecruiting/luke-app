import { Alert, Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { styles } from "@/screens/styles/goal-detail-screen.styles";
import type { GoalDeposit } from "@/context/app/types";
import { formatCurrency } from "../utils/format";

type SwipeableDepositPropsT = {
  deposit: GoalDeposit;
  goalIcon: string;
  onDelete: () => void;
  onEdit: () => void;
  isActive: boolean;
  onSwipeOpen: (id: string) => void;
};

/**
 * Renders a swipeable deposit row with delete confirmation.
 */
export const SwipeableDeposit = ({
  deposit,
  goalIcon,
  onDelete,
  onEdit,
  isActive,
  onSwipeOpen,
}: SwipeableDepositPropsT) => {
  const handleSwipeOpen = () => {
    onSwipeOpen(deposit.id);
  };

  const handleCloseSwipe = () => {
    onSwipeOpen("");
  };

  const handleDelete = () => {
    Alert.alert(
      "Eintrag löschen",
      `Möchtest du diesen Eintrag über € ${formatCurrency(deposit.amount)} wirklich löschen?`,
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
          <Text style={styles.transactionIcon}>{goalIcon}</Text>
          <View>
            <Text style={styles.transactionType}>{deposit.type}</Text>
            <Text style={styles.transactionDate}>{deposit.date}</Text>
          </View>
        </View>
        <Text style={styles.transactionAmount}>
          € {formatCurrency(deposit.amount)}
        </Text>
      </Pressable>
    </View>
  );
};
