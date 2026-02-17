import { useRef, useCallback } from "react";
import { Text, View } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";
import { styles } from "@/screens/styles/goal-detail-screen.styles";
import type { GoalDeposit } from "@/context/app/types";
import type { GroupedDepositsT } from "../types/goal-detail-types";
import { SwipeableDeposit } from "./swipeable-deposit";

type DepositsSectionPropsT = {
  groupedDeposits: GroupedDepositsT;
  goalIcon: string;
  depositTitle: string;
  activeSwipeId: string;
  onSwipeOpen: (id: string) => void;
  onEditDeposit: (deposit: GoalDeposit) => void;
  onDeleteDeposit: (depositId: string) => void;
};

/**
 * Renders the deposit list grouped by month.
 * Manages swipeable refs so only one row is open at a time.
 */
export const DepositsSection = ({
  groupedDeposits,
  goalIcon,
  depositTitle,
  onSwipeOpen,
  onEditDeposit,
  onDeleteDeposit,
}: DepositsSectionPropsT) => {
  const swipeableRefs = useRef<Record<string, Swipeable | null>>({});
  const hasDeposits = Object.keys(groupedDeposits).length > 0;

  const handleSwipeOpen = useCallback(
    (id: string) => {
      Object.entries(swipeableRefs.current).forEach(([depositId, ref]) => {
        if (depositId !== id && ref?.close) {
          ref.close();
        }
      });
      onSwipeOpen(id);
    },
    [onSwipeOpen],
  );

  return (
    <>
      <Text style={styles.swipeHint}>
        Wischen zum Löschen, tippen zum Bearbeiten
      </Text>
      {Object.entries(groupedDeposits).map(([month, transactions]) => (
        <View key={month} style={styles.monthSection}>
          <Text style={styles.monthTitle}>{month}</Text>
          <View style={styles.transactionsList}>
            {transactions.map((transaction) => (
              <SwipeableDeposit
                key={transaction.id}
                ref={(r) => {
                  if (r) {
                    swipeableRefs.current[transaction.id] = r;
                  } else {
                    delete swipeableRefs.current[transaction.id];
                  }
                }}
                deposit={transaction}
                goalIcon={goalIcon}
                onDelete={() => onDeleteDeposit(transaction.id)}
                onEdit={() => onEditDeposit(transaction)}
                onSwipeOpen={handleSwipeOpen}
              />
            ))}
          </View>
        </View>
      ))}
      {!hasDeposits ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Noch keine {depositTitle}en</Text>
        </View>
      ) : null}
    </>
  );
};
