import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Spacing } from "@/constants/theme";

const MOCK_TRANSACTIONS = {
  "November 2025": [
    { id: "1", type: "Einzahlung", date: "Heute, 11:32", amount: 4.50 },
    { id: "2", type: "Einzahlung", date: "Gestern", amount: 4.50 },
    { id: "3", type: "Einzahlung", date: "12/11/2025", amount: 4.50 },
  ],
  "Oktober 2025": [
    { id: "4", type: "Einzahlung", date: "Heute, 11:32", amount: 4.50 },
    { id: "5", type: "Einzahlung", date: "Gestern", amount: 4.50 },
    { id: "6", type: "Einzahlung", date: "12/10/2025", amount: 4.50 },
  ],
};

const formatCurrency = (value: number) => {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function GoalDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<any>();

  const goal = route.params?.goal || {
    name: "Vespa 2026",
    icon: "🛵",
    current: 924.73,
    target: 5200,
    remaining: 4275.27,
  };

  const [goalName, setGoalName] = useState(goal.name);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [tempName, setTempName] = useState(goal.name);

  const percentage = (goal.current / goal.target) * 100;

  const handleEditSave = () => {
    setGoalName(tempName);
    setEditModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(42, 58, 230, 0.69)", "rgba(23, 32, 128, 0.69)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Goals</Text>
            <Text style={styles.headerSubtitle}>bleib dran!</Text>
          </View>
          <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Feather name="x" size={24} color="#000000" />
          </Pressable>
        </View>

        <View style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <View style={styles.goalLeft}>
              <Text style={styles.goalIcon}>{goal.icon}</Text>
              <View>
                <View style={styles.goalNameRow}>
                  <Text style={styles.goalName}>{goalName}</Text>
                  <Pressable onPress={() => { setTempName(goalName); setEditModalVisible(true); }}>
                    <Feather name="edit-2" size={14} color="#7340FE" style={styles.editIcon} />
                  </Pressable>
                </View>
                <Text style={styles.goalProgress}>
                  € {formatCurrency(goal.current)} / € {formatCurrency(goal.target)}
                </Text>
              </View>
            </View>
            <Text style={styles.goalPercentage}>{percentage.toFixed(2).replace(".", ",")}%</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${percentage}%` }]} />
          </View>
          <View style={styles.goalFooter}>
            <Text style={styles.remainingLabel}>Übrig</Text>
            <Text style={styles.remainingValue}>€ {formatCurrency(goal.remaining)}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(MOCK_TRANSACTIONS).map(([month, transactions]) => (
          <View key={month} style={styles.monthSection}>
            <Text style={styles.monthTitle}>{month}</Text>
            <View style={styles.transactionsList}>
              {transactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <Text style={styles.transactionIcon}>🛵</Text>
                    <View>
                      <Text style={styles.transactionType}>{transaction.type}</Text>
                      <Text style={styles.transactionDate}>{transaction.date}</Text>
                    </View>
                  </View>
                  <Text style={styles.transactionAmount}>€ {formatCurrency(transaction.amount)}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setEditModalVisible(false)} />
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Goal bearbeiten</Text>

            <Text style={styles.modalLabel}>Name</Text>
            <TextInput
              style={styles.modalInput}
              value={tempName}
              onChangeText={setTempName}
              placeholder="Goal Name"
              placeholderTextColor="#9CA3AF"
            />

            <Pressable style={styles.modalSaveButton} onPress={handleEditSave}>
              <Text style={styles.modalSaveButtonText}>Speichern</Text>
            </Pressable>
          </View>
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  goalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  goalLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  goalIcon: {
    fontSize: 32,
  },
  goalNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  goalName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
  },
  editIcon: {
    marginLeft: 2,
  },
  goalProgress: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  goalPercentage: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2E47F9",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#AFAFAF",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "rgba(42, 58, 230, 0.69)",
    borderRadius: 4,
  },
  goalFooter: {
    marginTop: 12,
  },
  remainingLabel: {
    fontSize: 14,
    color: "#6B7280",
  },
  remainingValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2E47F9",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  monthSection: {
    marginBottom: 24,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  transactionIcon: {
    fontSize: 28,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
  },
  transactionDate: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: "600",
    color: "#30B71E",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#000000",
    marginBottom: 24,
  },
  modalSaveButton: {
    backgroundColor: "#7340FE",
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: "center",
  },
  modalSaveButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
