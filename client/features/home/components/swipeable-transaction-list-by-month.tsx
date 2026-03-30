import React, { useMemo } from "react";
import { Text, View } from "react-native";
import type Swipeable from "react-native-gesture-handler/Swipeable";
import type { Transaction } from "@/context/app/types";
import { formatMonthYear } from "@/utils/dates";
import { SwipeableTransactionItem } from "./swipeable-transaction-item";
import { styles } from "@/screens/styles/home-screen.styles";

type SwipeableTransactionListByMonthPropsT = {
  transactions: Transaction[];
  parseDate: (dateStr: string) => Date;
  formatCurrency: (amount: number) => string;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
  onSwipeOpen: (id: string) => void;
  swipeableRefs: React.MutableRefObject<Record<string, Swipeable | null>>;
  refKeyPrefix: string;
};

/**
 * Renders swipeable transactions grouped by month. Same card layout as
 * TransactionListByMonth: month header + card with muted border + borders between items.
 */
export const SwipeableTransactionListByMonth = ({
  transactions,
  parseDate,
  formatCurrency,
  onEdit,
  onDelete,
  onSwipeOpen,
  swipeableRefs,
  refKeyPrefix,
}: SwipeableTransactionListByMonthPropsT) => {
  const groupedByMonth = useMemo(() => {
    const groups = new Map<
      string,
      { key: string; monthLabel: string; items: Transaction[] }
    >();

    const sorted = [...transactions].sort((a, b) => {
      const dateA = parseDate(a.date);
      const dateB = parseDate(b.date);
      return dateB.getTime() - dateA.getTime();
    });

    for (const transaction of sorted) {
      const date = parseDate(transaction.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const monthLabel = formatMonthYear(date);

      if (!groups.has(key)) {
        groups.set(key, { key, monthLabel, items: [] });
      }
      groups.get(key)!.items.push(transaction);
    }

    return Array.from(groups.values());
  }, [transactions, parseDate]);

  return (
    <>
      {groupedByMonth.map(({ key, monthLabel, items: monthItems }) => (
        <View key={key} style={styles.transactionListMonthSection}>
          <Text style={styles.transactionListMonthHeader}>{monthLabel}</Text>
          <View style={styles.transactionListCard}>
            {monthItems.map((transaction, index) => (
              <SwipeableTransactionItem
                key={`${refKeyPrefix}-${transaction.id}`}
                ref={(r) => {
                  const refKey = `${refKeyPrefix}-${transaction.id}`;
                  if (r) {
                    swipeableRefs.current[refKey] = r;
                  } else {
                    delete swipeableRefs.current[refKey];
                  }
                }}
                transaction={transaction}
                formatCurrency={formatCurrency}
                onEdit={() => onEdit(transaction)}
                onDelete={() => onDelete(transaction.id)}
                onSwipeOpen={(id) => onSwipeOpen(`${refKeyPrefix}-${id}`)}
                variant="flat"
                showDivider={index < monthItems.length - 1}
              />
            ))}
          </View>
        </View>
      ))}
    </>
  );
};
