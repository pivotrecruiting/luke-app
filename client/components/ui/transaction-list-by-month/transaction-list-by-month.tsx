import React, { useMemo } from "react";
import { Text, View } from "react-native";
import { TransactionItem } from "@/components/ui/transaction-item";
import { formatMonthYear } from "@/utils/dates";
import { styles } from "./transaction-list-by-month.styles";

export type TransactionListByMonthItemT = {
  id: string;
  dateStr: string;
  dateFormatted: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconContainerStyle?: object;
  amountFormatted: string;
  isIncome: boolean;
};

type TransactionListByMonthPropsT = {
  items: TransactionListByMonthItemT[];
};

/**
 * Renders transactions grouped by month. Each month shows a header (e.g. "November 2025")
 * and a card with muted border containing items, with borders between items.
 */
export const TransactionListByMonth = ({
  items,
}: TransactionListByMonthPropsT) => {
  const groupedByMonth = useMemo(() => {
    const groups = new Map<
      string,
      { key: string; monthLabel: string; items: TransactionListByMonthItemT[] }
    >();

    const sorted = [...items].sort(
      (a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime(),
    );

    for (const item of sorted) {
      const date = new Date(item.dateStr);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const monthLabel = formatMonthYear(date);

      if (!groups.has(key)) {
        groups.set(key, { key, monthLabel, items: [] });
      }
      groups.get(key)!.items.push(item);
    }

    return Array.from(groups.values());
  }, [items]);

  return (
    <>
      {groupedByMonth.map(({ key, monthLabel, items: monthItems }) => (
        <View key={key} style={styles.monthSection}>
          <Text style={styles.monthHeader}>{monthLabel}</Text>
          <View style={styles.card}>
            {monthItems.map((item, index) => (
              <TransactionItem
                key={item.id}
                icon={item.icon}
                iconContainerStyle={item.iconContainerStyle}
                title={item.title}
                subtitle={item.subtitle}
                date={item.dateFormatted}
                amountFormatted={item.amountFormatted}
                isIncome={item.isIncome}
                showDivider={index < monthItems.length - 1}
                variant="flat"
              />
            ))}
          </View>
        </View>
      ))}
    </>
  );
};
