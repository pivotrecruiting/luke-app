import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { Spacing, BorderRadius } from "@/constants/theme";

const MOCK_DATA = {
  userName: "Deni",
  balance: 2504.16,
  einnahmen: 3812.57,
  ausgaben: 1308.41,
  wochenausgaben: [
    { day: "Mon", amount: 45, maxAmount: 120 },
    { day: "Tue", amount: 85, maxAmount: 120 },
    { day: "Wed", amount: 65, maxAmount: 120 },
    { day: "Thu", amount: 50, maxAmount: 120 },
    { day: "Fri", amount: 95, maxAmount: 120 },
    { day: "Sat", amount: 120, maxAmount: 120 },
    { day: "Sun", amount: 75, maxAmount: 120 },
  ],
  transaktionen: [
    {
      id: "1",
      name: "Starbucks",
      kategorie: "Lebensmittel",
      datum: "Heute, 11:32",
      betrag: -4.5,
      icon: "coffee",
    },
    {
      id: "2",
      name: "Amazon",
      kategorie: "Shopping",
      datum: "28.11. 20:14",
      betrag: -29.9,
      icon: "shopping-cart",
    },
  ],
};

const formatCurrency = (value: number) => {
  const formatted = Math.abs(value).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (value < 0) {
    return `- € ${formatted}`;
  }
  return `€ ${formatted}`;
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#4B6CB7", "#182848"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}
      >
        <Text style={styles.welcomeText}>Willkommen, {MOCK_DATA.userName}!</Text>
        <Text style={styles.subtitleText}>hier der aktuelle Monat</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balanceAmount}>
            € {MOCK_DATA.balance.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
          </Text>
        </View>

        <View style={styles.incomeExpenseRow}>
          <View style={styles.incomeCard}>
            <View style={styles.incomeIconContainer}>
              <Feather name="arrow-up" size={20} color="#22C55E" />
            </View>
            <Text style={styles.cardLabel}>Einnahmen</Text>
            <Text style={styles.incomeAmount}>
              € {MOCK_DATA.einnahmen.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
            </Text>
          </View>

          <View style={styles.expenseCard}>
            <View style={styles.expenseIconContainer}>
              <Feather name="arrow-down" size={20} color="#EF4444" />
            </View>
            <Text style={styles.cardLabel}>Ausgaben</Text>
            <Text style={styles.expenseAmount}>
              € {MOCK_DATA.ausgaben.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Wochenausgaben</Text>
          <View style={styles.chartContainer}>
            {MOCK_DATA.wochenausgaben.map((item, index) => (
              <View key={item.day} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <LinearGradient
                    colors={["#7B8CDE", "#5B6BBE"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[
                      styles.bar,
                      {
                        height: (item.amount / item.maxAmount) * 120,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.day}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.transactionsTitle}>Letzte Transaktionen</Text>
            <Text style={styles.transactionsAll}>All</Text>
          </View>

          {MOCK_DATA.transaktionen.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
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
                  {transaction.kategorie}
                </Text>
                <Text style={styles.transactionDate}>{transaction.datum}</Text>
              </View>
              <Text style={styles.transactionAmount}>
                {formatCurrency(transaction.betrag)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: 60,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  subtitleText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    marginTop: -40,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  balanceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "700",
    color: "#22C55E",
  },
  incomeExpenseRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  incomeCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  expenseCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  incomeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  expenseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  cardLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  incomeAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
  },
  expenseAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
  },
  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: Spacing.lg,
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 160,
    paddingTop: Spacing.lg,
  },
  barContainer: {
    alignItems: "center",
    flex: 1,
  },
  barWrapper: {
    height: 120,
    justifyContent: "flex-end",
  },
  bar: {
    width: 24,
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: Spacing.sm,
  },
  transactionsSection: {
    marginTop: Spacing.lg,
  },
  transactionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  transactionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  transactionsAll: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(123, 140, 222, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  transactionDetails: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  transactionCategory: {
    fontSize: 13,
    color: "#6B7280",
    marginTop: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
});
