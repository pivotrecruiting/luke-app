import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Spacing } from "@/constants/theme";
import CurrencyInput from "@/components/CurrencyInput";
import { AppModal } from "@/components/ui/app-modal";
import { LockIcon } from "@/components/ui/lock-icon";
import { useApp } from "@/context/AppContext";
import {
  formatCurrencyAmount,
  getCurrencySymbol,
} from "@/utils/currency-format";
import { styles } from "./styles/vault-screen.styles";

const getEntryTitle = (entry: {
  entryType: "monthly_rollover" | "manual_deposit" | "goal_deposit";
  rolloverMonth: string | null;
  note: string | null;
  amount: number;
}): string => {
  if (entry.entryType === "monthly_rollover") {
    return entry.rolloverMonth
      ? `Monatsabschluss ${entry.rolloverMonth}`
      : "Monatsabschluss";
  }

  if (entry.entryType === "manual_deposit") {
    return entry.note?.trim() || "Einzahlung";
  }

  if (entry.note?.trim()) {
    return entry.note;
  }

  return entry.amount < 0 ? "Goal Einzahlung" : "Goal Rückbuchung";
};

const isDepositEntry = (entry: {
  entryType: "monthly_rollover" | "manual_deposit" | "goal_deposit";
  amount: number;
}): boolean => {
  if (entry.entryType === "manual_deposit") return true;
  if (entry.entryType === "monthly_rollover" && entry.amount > 0) return true;
  return false;
};

/**
 * Displays vault balance and transaction history with manual deposits from monthly balance.
 */
export default function VaultScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {
    currency,
    vaultBalance,
    monthlyBalance,
    goals,
    vaultTransactions,
    addVaultDeposit,
  } = useApp();
  const currencySymbol = getCurrencySymbol(currency);

  const [isDepositModalVisible, setIsDepositModalVisible] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositNote, setDepositNote] = useState("");

  const sortedEntries = useMemo(
    () =>
      [...vaultTransactions].sort(
        (left, right) =>
          new Date(right.transactionAt).getTime() -
          new Date(left.transactionAt).getTime(),
      ),
    [vaultTransactions],
  );

  const availableFromBalance = Math.max(monthlyBalance, 0);

  const parsedDepositAmount = useMemo(() => {
    const value = parseFloat(depositAmount);
    return Number.isFinite(value) ? value : 0;
  }, [depositAmount]);

  const isDepositDisabled =
    parsedDepositAmount <= 0 || parsedDepositAmount > availableFromBalance;

  const formatDate = useCallback((value: string) => {
    const date = new Date(value);
    return new Intl.DateTimeFormat("de-DE", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }, []);

  const handleSaveDeposit = useCallback(() => {
    if (parsedDepositAmount <= 0) {
      Alert.alert("Ungültiger Betrag", "Bitte gib einen gültigen Betrag ein.");
      return;
    }

    if (parsedDepositAmount > availableFromBalance) {
      Alert.alert(
        "Nicht genug Balance",
        "Du kannst nur aus der aktuellen Monatsbalance in den Tresor einzahlen.",
      );
      return;
    }

    addVaultDeposit(parsedDepositAmount, depositNote);
    setDepositAmount("");
    setDepositNote("");
    setIsDepositModalVisible(false);
  }, [addVaultDeposit, availableFromBalance, depositNote, parsedDepositAmount]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(42, 58, 230, 0.69)", "rgba(23, 32, 128, 0.69)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}
      >
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Tresor</Text>
            <Text style={styles.headerSubtitle}>deine Rücklagen</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.balanceCard}>
          <View style={styles.balanceLockIcon}>
            <LockIcon size={38} />
          </View>
          <View style={styles.balanceHeaderRow}>
            <Text style={styles.balanceLabel}>Dein Tresor</Text>
          </View>

          <Text style={styles.balanceAmount}>
            {currencySymbol} {formatCurrencyAmount(vaultBalance, currency)}
          </Text>
          <Text style={styles.availableLabel}>verfügbar für Deine Ziele</Text>
        </View>

        <Text style={styles.sectionTitle}>Transaktionen</Text>

        {sortedEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="inbox" size={36} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              Noch keine Tresor-Transaktionen
            </Text>
          </View>
        ) : (
          sortedEntries.map((entry) => (
            <View key={entry.id} style={styles.transactionCard}>
              <View style={styles.transactionRow}>
                <View
                  style={[
                    styles.transactionIconContainer,
                    isDepositEntry(entry) &&
                      styles.transactionIconContainerDeposit,
                  ]}
                >
                  {isDepositEntry(entry) ? (
                    <Feather name="arrow-up-right" size={22} color="#16A34A" />
                  ) : (
                    <Text style={styles.transactionGoalIcon}>
                      {goals.find((goal) => goal.id === entry.goalId)?.icon ??
                        "🎯"}
                    </Text>
                  )}
                </View>

                <View style={styles.transactionContent}>
                  <View style={styles.transactionHeader}>
                    <Text style={styles.transactionTitle}>
                      {getEntryTitle(entry)}
                    </Text>
                    <Text
                      style={[
                        styles.transactionAmount,
                        entry.amount < 0 && styles.transactionAmountNegative,
                      ]}
                    >
                      {entry.amount > 0 ? "+" : "-"}
                      {currencySymbol}{" "}
                      {formatCurrencyAmount(Math.abs(entry.amount), currency)}
                    </Text>
                  </View>
                  <Text style={styles.transactionDate}>
                    {formatDate(entry.transactionAt)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Pressable
        style={[
          styles.fab,
          { bottom: insets.bottom + 96 },
          availableFromBalance <= 0 && { opacity: 0.45 },
        ]}
        onPress={() => setIsDepositModalVisible(true)}
        disabled={availableFromBalance <= 0}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>

      <AppModal
        visible={isDepositModalVisible}
        onClose={() => {
          setIsDepositModalVisible(false);
          setDepositAmount("");
          setDepositNote("");
        }}
        maxHeightPercent={70}
        contentStyle={styles.modalContent}
        keyboardAvoidingEnabled
      >
        <ScrollView
          style={styles.modalScrollView}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>In Tresor einzahlen</Text>
          <Text style={styles.modalLabel}>Betrag</Text>

          <CurrencyInput
            value={depositAmount}
            onChangeText={setDepositAmount}
            placeholder="0,00"
            variant="modal"
            autoFocus
          />

          <Text style={styles.modalLabel}>Text (optional)</Text>
          <TextInput
            style={styles.modalTextInput}
            value={depositNote}
            onChangeText={setDepositNote}
            placeholder="z. B. Side Hustle"
            placeholderTextColor="#9CA3AF"
          />

          <Text style={styles.modalHint}>
            Verfügbar: {currencySymbol}{" "}
            {formatCurrencyAmount(availableFromBalance, currency)}
          </Text>

          <View style={styles.modalButtonRow}>
            <Pressable
              style={styles.cancelButton}
              onPress={() => {
                setIsDepositModalVisible(false);
                setDepositAmount("");
                setDepositNote("");
              }}
            >
              <Text style={styles.cancelButtonText}>Abbrechen</Text>
            </Pressable>
            <Pressable
              style={[
                styles.confirmButton,
                isDepositDisabled && styles.confirmButtonDisabled,
              ]}
              onPress={handleSaveDeposit}
              disabled={isDepositDisabled}
            >
              <Text style={styles.confirmButtonText}>Einzahlen</Text>
            </Pressable>
          </View>
        </ScrollView>
      </AppModal>
    </View>
  );
}
