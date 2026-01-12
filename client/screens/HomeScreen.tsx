import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
const businessmanFigure = require("../../assets/images/businessman-figure.png");

const screenWidth = Dimensions.get("window").width;

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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { userName, balance, totalIncome, totalExpenses, weeklySpending, transactions } = useApp();
  
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [allTransactionsVisible, setAllTransactionsVisible] = useState(false);

  const handleBarPress = (day: string) => {
    setSelectedDay(selectedDay === day ? null : day);
  };

  return (
    <View style={styles.container}>
      <View style={styles.heroSection}>
        <LinearGradient
          colors={["rgba(42, 58, 230, 0.69)", "rgba(23, 32, 128, 0.69)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}
        >
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeText}>Willkommen, {userName}!</Text>
            <Text style={styles.subtitleText}>hier der aktuelle Monat</Text>
          </View>
        </LinearGradient>

        <View style={[styles.balanceCard, { top: insets.top + 95 }]}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text style={styles.balanceAmount}>
            € {balance.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
          </Text>
        </View>

        <Image
          source={businessmanFigure}
          style={[styles.businessmanFigure, { top: insets.top + 45 }]}
          contentFit="contain"
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.incomeExpenseRow}>
          <Pressable 
            style={styles.incomeCard}
            onPress={() => navigation.navigate("Income")}
          >
            <View style={styles.incomeIconContainer}>
              <Feather name="arrow-up" size={20} color="#22C55E" />
            </View>
            <Text style={styles.cardLabel}>Einnahmen</Text>
            <Text style={styles.incomeAmount}>
              € {totalIncome.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
            </Text>
          </Pressable>

          <Pressable 
            style={styles.expenseCard}
            onPress={() => navigation.navigate("Expenses")}
          >
            <View style={styles.expenseIconContainer}>
              <Feather name="arrow-down" size={20} color="#EF4444" />
            </View>
            <Text style={styles.cardLabel}>Ausgaben</Text>
            <Text style={styles.expenseAmount}>
              € {totalExpenses.toLocaleString("de-DE", { minimumFractionDigits: 2 })}
            </Text>
          </Pressable>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Wochenausgaben</Text>
            {selectedDay && (
              <View style={styles.selectedAmount}>
                <Text style={styles.selectedAmountText}>
                  € {weeklySpending.find(d => d.day === selectedDay)?.amount || 0}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.chartContainer}>
            {weeklySpending.map((item) => {
              const barHeight = Math.max((item.amount / item.maxAmount) * 100, 8);
              const isSelected = selectedDay === item.day;
              return (
                <Pressable 
                  key={item.day} 
                  style={styles.barContainer}
                  onPress={() => handleBarPress(item.day)}
                >
                  <View style={styles.barWrapper}>
                    <LinearGradient
                      colors={isSelected ? ["#5B6BBE", "#3B4B9E"] : ["#A5B4FC", "#7B8CDE"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={[
                        styles.bar,
                        { height: barHeight },
                        isSelected && styles.barSelected,
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, isSelected && styles.barLabelSelected]}>
                    {item.day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.transactionsSection}>
          <View style={styles.transactionsHeader}>
            <Text style={styles.transactionsTitle}>Letzte Transaktionen</Text>
            <Pressable onPress={() => setAllTransactionsVisible(true)}>
              <Text style={styles.transactionsAll}>All</Text>
            </Pressable>
          </View>

          {transactions.slice(0, 2).map((transaction) => (
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
                  {transaction.category}
                </Text>
                <Text style={styles.transactionDate}>{transaction.date}</Text>
              </View>
              <Text style={styles.transactionAmount}>
                {formatCurrency(transaction.amount)}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={allTransactionsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAllTransactionsVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setAllTransactionsVisible(false)}
        >
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.5)"]}
            locations={[0, 0.5, 1]}
            style={styles.modalGradient}
          />
        </Pressable>
        <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Alle Transaktionen</Text>
              <Pressable 
                onPress={() => setAllTransactionsVisible(false)}
                style={styles.closeButton}
              >
                <Feather name="x" size={24} color="#000000" />
              </Pressable>
            </View>
            <ScrollView 
              style={styles.modalScrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {transactions.map((transaction) => (
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
                      {transaction.category}
                    </Text>
                    <Text style={styles.transactionDate}>{transaction.date}</Text>
                  </View>
                  <Text style={styles.transactionAmount}>
                    {formatCurrency(transaction.amount)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  heroSection: {
    zIndex: 10,
    overflow: "visible",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 70,
  },
  headerTextContainer: {
    zIndex: 1,
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
  balanceCard: {
    position: "absolute",
    left: 20,
    width: screenWidth - 40,
    height: 96,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 5,
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
  businessmanFigure: {
    width: 71,
    height: 112,
    position: "absolute",
    right: 30,
    zIndex: 20,
  },
  scrollView: {
    flex: 1,
    marginTop: 60,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Spacing.md,
  },
  incomeExpenseRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  incomeCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
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
    borderRadius: 16,
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
    borderRadius: 16,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  selectedAmount: {
    backgroundColor: "#5B6BBE",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectedAmountText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 130,
  },
  barContainer: {
    alignItems: "center",
    flex: 1,
  },
  barWrapper: {
    height: 100,
    justifyContent: "flex-end",
  },
  bar: {
    width: 28,
    borderRadius: 8,
  },
  barSelected: {
    width: 32,
  },
  barLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: Spacing.sm,
  },
  barLabelSelected: {
    color: "#5B6BBE",
    fontWeight: "600",
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
    borderRadius: 12,
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
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalGradient: {
    flex: 1,
  },
  modalContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: "80%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    flexGrow: 0,
  },
});
