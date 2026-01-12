import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";

const formatCurrency = (value: number) => {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function BudgetDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { budgetId } = route.params as { budgetId: string };
  const { budgets, transactions } = useApp();

  const budget = budgets.find((b) => b.id === budgetId);

  if (!budget) {
    return (
      <View style={styles.container}>
        <Text>Budget nicht gefunden</Text>
      </View>
    );
  }

  const budgetTransactions = transactions.filter(
    (tx) => tx.category === budget.name
  );
  const percentage = (budget.current / budget.limit) * 100;
  const isOverBudget = budget.current > budget.limit;
  const displayPercentage = Math.min(percentage, 100);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#7340fd", "#3B5BDB"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>{budget.name}</Text>
        <Text style={styles.headerSubtitle}>Budget Details</Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={[styles.iconContainer, { backgroundColor: `${budget.iconColor}20` }]}>
              <Feather name={budget.icon as any} size={28} color={budget.iconColor} />
            </View>
            <View style={styles.summaryInfo}>
              <Text style={styles.summaryTitle}>{budget.name}</Text>
              <Text style={[styles.summaryAmount, isOverBudget && styles.overBudgetText]}>
                € {formatCurrency(budget.current)} / € {budget.limit}
              </Text>
            </View>
          </View>

          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${displayPercentage}%` },
                isOverBudget && styles.progressBarOver,
              ]}
            />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Ausgegeben</Text>
              <Text style={[styles.statValue, isOverBudget && styles.overBudgetText]}>
                € {formatCurrency(budget.current)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Übrig</Text>
              <Text style={styles.statValue}>
                € {formatCurrency(Math.max(0, budget.limit - budget.current))}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Limit</Text>
              <Text style={styles.statValue}>€ {budget.limit}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transaktionen</Text>
        </View>

        {budgetTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Feather name="inbox" size={48} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>Keine Transaktionen</Text>
            <Text style={styles.emptySubtitle}>
              Ausgaben in dieser Kategorie erscheinen hier
            </Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {budgetTransactions.map((tx) => (
              <View key={tx.id} style={styles.transactionItem}>
                <View style={styles.transactionLeft}>
                  <View style={styles.transactionIconContainer}>
                    <Feather name={tx.icon as any} size={18} color="#6B7280" />
                  </View>
                  <View>
                    <Text style={styles.transactionName}>{tx.name}</Text>
                    <Text style={styles.transactionDate}>{tx.date}</Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    tx.amount < 0 && styles.transactionAmountNegative,
                  ]}
                >
                  {tx.amount >= 0 ? "+" : ""}€ {formatCurrency(Math.abs(tx.amount))}
                </Text>
              </View>
            ))}
          </View>
        )}
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
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
  },
  summaryAmount: {
    fontSize: 16,
    color: "#6B7280",
    marginTop: 4,
  },
  overBudgetText: {
    color: "#EF4444",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 20,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#7340FE",
    borderRadius: 4,
  },
  progressBarOver: {
    backgroundColor: "#EF4444",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
  transactionsList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  transactionName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
  },
  transactionDate: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
  },
  transactionAmountNegative: {
    color: "#EF4444",
  },
});
