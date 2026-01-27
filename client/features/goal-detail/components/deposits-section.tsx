import { Text, View } from "react-native";
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
 */
export const DepositsSection = ({
  groupedDeposits,
  goalIcon,
  depositTitle,
  activeSwipeId,
  onSwipeOpen,
  onEditDeposit,
  onDeleteDeposit,
}: DepositsSectionPropsT) => {
  const hasDeposits = Object.keys(groupedDeposits).length > 0;

  return (
    <>
      <Text style={styles.swipeHint}>
        Lang drücken zum Löschen, tippen zum Bearbeiten
      </Text>
      {Object.entries(groupedDeposits).map(([month, transactions]) => (
        <View key={month} style={styles.monthSection}>
          <Text style={styles.monthTitle}>{month}</Text>
          <View style={styles.transactionsList}>
            {transactions.map((transaction) => (
              <SwipeableDeposit
                key={transaction.id}
                deposit={transaction}
                goalIcon={goalIcon}
                onDelete={() => onDeleteDeposit(transaction.id)}
                onEdit={() => onEditDeposit(transaction)}
                isActive={activeSwipeId === transaction.id}
                onSwipeOpen={onSwipeOpen}
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
