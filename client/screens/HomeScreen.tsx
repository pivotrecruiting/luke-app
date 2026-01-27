import React, { useState, useMemo, useRef, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";
import { Spacing } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { getUserFirstName } from "@/utils/user";
import { styles } from "./styles/home-screen.styles";
const businessmanFigure = require("../../assets/images/businessman-figure.png");

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
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    userName,
    balance,
    totalIncome,
    totalExpenses,
    weeklySpending,
    transactions,
    selectedWeekOffset,
    currentWeekLabel,
    goToPreviousWeek,
    goToNextWeek,
  } = useApp();
  const firstName = useMemo(() => getUserFirstName(userName), [userName]);

  // Parse various date formats to Date object for sorting
  const parseTransactionDate = (dateStr: string): Date => {
    const now = new Date();

    // Handle "Heute, HH:MM"
    if (dateStr.startsWith("Heute")) {
      const timeMatch = dateStr.match(/(\d{2}):(\d{2})/);
      if (timeMatch) {
        return new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          parseInt(timeMatch[1]),
          parseInt(timeMatch[2]),
        );
      }
      return now;
    }

    // Handle "Gestern"
    if (dateStr === "Gestern" || dateStr.startsWith("Gestern")) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday;
    }

    // Handle "DD/MM/YYYY" format
    const slashMatch = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (slashMatch) {
      return new Date(
        parseInt(slashMatch[3]),
        parseInt(slashMatch[2]) - 1,
        parseInt(slashMatch[1]),
      );
    }

    // Handle "DD.MM. HH:MM" format (e.g., "28.11. 20:14")
    const dotMatch = dateStr.match(/(\d{2})\.(\d{2})\.\s*(\d{2}):(\d{2})/);
    if (dotMatch) {
      return new Date(
        now.getFullYear(),
        parseInt(dotMatch[2]) - 1,
        parseInt(dotMatch[1]),
        parseInt(dotMatch[3]),
        parseInt(dotMatch[4]),
      );
    }

    // Handle "DD.MM.YYYY" format
    const fullDotMatch = dateStr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
    if (fullDotMatch) {
      return new Date(
        parseInt(fullDotMatch[3]),
        parseInt(fullDotMatch[2]) - 1,
        parseInt(fullDotMatch[1]),
      );
    }

    return now;
  };

  // Sort transactions by date (newest first)
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = parseTransactionDate(a.date);
      const dateB = parseTransactionDate(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  }, [transactions]);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [allTransactionsVisible, setAllTransactionsVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, []),
  );

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
            <Text style={styles.welcomeText}>
              {firstName ? `Willkommen, ${firstName}!` : "Wilkommen bei Luke!"}
            </Text>
            <Text style={styles.subtitleText}>so stehst du aktuell</Text>
          </View>
        </LinearGradient>

        <View style={[styles.balanceCard, { top: insets.top + 95 }]}>
          <Text style={styles.balanceLabel}>Balance</Text>
          <Text
            style={[
              styles.balanceAmount,
              balance < 0 && styles.balanceAmountNegative,
            ]}
          >
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
        ref={scrollViewRef}
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
              €{" "}
              {totalIncome.toLocaleString("de-DE", {
                minimumFractionDigits: 2,
              })}
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
              €{" "}
              {totalExpenses.toLocaleString("de-DE", {
                minimumFractionDigits: 2,
              })}
            </Text>
          </Pressable>
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Wochenausgaben</Text>
            <View style={styles.weekNavigation}>
              <Pressable onPress={goToPreviousWeek} style={styles.weekArrow}>
                <Feather name="chevron-left" size={20} color="#6B7280" />
              </Pressable>
              <Text style={styles.weekLabel}>{currentWeekLabel}</Text>
              <Pressable
                onPress={goToNextWeek}
                style={[
                  styles.weekArrow,
                  selectedWeekOffset >= 0 && styles.weekArrowDisabled,
                ]}
              >
                <Feather
                  name="chevron-right"
                  size={20}
                  color={selectedWeekOffset >= 0 ? "#D1D5DB" : "#6B7280"}
                />
              </Pressable>
            </View>
          </View>
          {selectedDay && (
            <View style={styles.selectedAmount}>
              <Text style={styles.selectedAmountText}>
                €{" "}
                {weeklySpending
                  .find((d) => d.day === selectedDay)
                  ?.amount.toFixed(2) || "0.00"}
              </Text>
            </View>
          )}
          <View style={styles.chartContainer}>
            {weeklySpending.map((item) => {
              const barHeight = Math.max(
                (item.amount / item.maxAmount) * 100,
                8,
              );
              const isSelected = selectedDay === item.day;
              return (
                <Pressable
                  key={item.day}
                  style={styles.barContainer}
                  onPress={() => handleBarPress(item.day)}
                >
                  <View style={styles.barWrapper}>
                    <LinearGradient
                      colors={
                        isSelected
                          ? ["#5B6BBE", "#3B4B9E"]
                          : ["#A5B4FC", "#7B8CDE"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={[
                        styles.bar,
                        { height: barHeight },
                        isSelected && styles.barSelected,
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.barLabel,
                      isSelected && styles.barLabelSelected,
                    ]}
                  >
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

          {sortedTransactions.slice(0, 2).map((transaction) => (
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
        <View
          style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}
        >
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
            {sortedTransactions.map((transaction) => (
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
